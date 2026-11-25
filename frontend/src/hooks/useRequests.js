import { useState, useEffect, useCallback, useRef } from 'react';

export default function useRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pending = useRef(null);

  const refresh = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const timeout = setTimeout(() => controller.abort('timeout'), 15000);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/requests', { signal: controller.signal });
      if (!response.ok) throw Error('Request failed');
      const data = await response.json();
      if (!Array.isArray(data)) throw Error('Invalid response');
      if (!controller.signal.aborted) { setRequests(data); setError(''); }
    } catch {
      if (!controller.signal.aborted || controller.signal.reason === 'timeout') {
        setError('Cases could not be refreshed. Please retry.');
      }
    } finally {
      clearTimeout(timeout);
      if (!controller.signal.aborted || controller.signal.reason === 'timeout') setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      pending.current?.abort();
    };
  }, [refresh]);
  return { requests, loading, error, refresh };
}
