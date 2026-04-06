import { useState, useEffect } from "react";

const words = ["Updates", "News"];

export default function FlipTitle() {
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState("idle"); // "idle" | "out" | "in"

  useEffect(() => {
    const interval = setInterval(() => {
      // Phase 1: flip out
      setPhase("out");

      // Phase 2: swap word + flip in
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % words.length);
        setPhase("in");
      }, 275);

      // Phase 3: settle
      setTimeout(() => {
        setPhase("idle");
      }, 550);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        {/* Title */}
        <div style={styles.titleRow}>
          <span style={styles.staticWord}>Latest</span>
          <span style={styles.perspective}>
            <span style={{ ...styles.flipWord, ...getFlipStyle(phase) }}>
              {words[current]}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function getFlipStyle(phase) {
  if (phase === "out") {
    return {
      animation: "flipOut 0.275s ease forwards",
    };
  }
  if (phase === "in") {
    return {
      animation: "flipIn 0.275s ease forwards",
    };
  }
  return {};
}


const styles = {
  page: {
    minHeight: "20vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Raleway', sans-serif",
  },
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5t6rem",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.35em",
    fontSize: "clamp(2rem, 3vw, 5rem)",
    fontWeight: "800",
    color: "#3C3736",
    letterSpacing: "-0.02em",
    lineHeight: 1,
  },
  staticWord: {
    display: "inline-block",
  },
  perspective: {
    display: "inline-block",
    perspective: "600px",
  },
  flipWord: {
    display: "inline-block",
    transformOrigin: "center center",
    transformStyle: "preserve-3d",
    color: "#E00000",
  },
};

// Inject keyframes into the document head
const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes flipOut {
    0%   { transform: rotateX(0deg);   opacity: 1; }
    100% { transform: rotateX(-90deg); opacity: 0; }
  }
  @keyframes flipIn {
    0%   { transform: rotateX(90deg);  opacity: 0; }
    100% { transform: rotateX(0deg);   opacity: 1; }
  }
`;
document.head.appendChild(styleTag);
