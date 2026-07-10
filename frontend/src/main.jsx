import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";

// ===========================================================================
// AUTH WIRING
// The backend now verifies a JWT on all staff/admin routes. Attach the token
// to requests that target OUR API only (never leak it to third-party hosts),
// for both axios and fetch, and log the user out cleanly on a 401.
// ===========================================================================
const API_BASE = import.meta.env.VITE_API_URL || "";

const isApiUrl = (url = "") =>
  typeof url === "string" &&
  (url.startsWith(API_BASE + "/api") || url.startsWith("/api") ||
    (API_BASE && url.startsWith(API_BASE)));

const handleUnauthorized = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (window.location.pathname !== "/") {
    window.location.assign("/");
  }
};

// --- axios ---
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const url = (config.baseURL || "") + (config.url || "");
  if (token && isApiUrl(url)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error && error.response && error.response.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

// --- fetch (some dashboard pages fetch /api/requests directly) ---
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const url = typeof input === "string" ? input : (input && input.url) || "";
  let nextInit = init;
  if (isApiUrl(url)) {
    const token = localStorage.getItem("token");
    const headers = new Headers(
      init.headers || (typeof input !== "string" && input.headers) || {}
    );
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    nextInit = { ...init, headers };
  }
  return originalFetch(input, nextInit).then((res) => {
    if (res.status === 401 && isApiUrl(url)) handleUnauthorized();
    return res;
  });
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
