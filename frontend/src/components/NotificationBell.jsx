import React, { useState, useEffect, useRef } from 'react';
import { MdNotificationsNone } from 'react-icons/md';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

// Bell + dropdown for staff. Polls the unread count every 45s and lists the
// most recent notifications. Notifications are the always-on channel that backs
// the "opt out of email" preference — a counsellor who turns off submission
// emails still sees new requests here.
const NotificationBell = () => {
  const savedUser = JSON.parse(localStorage.getItem('user')) || {};
  const userId = savedUser.id || savedUser._id;

  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchCount = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API}/api/notifications/${userId}/unread-count`);
      setCount(res.data.count || 0);
    } catch (e) { /* silent — bell just won't update */ }
  };

  const fetchList = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API}/api/notifications/${userId}`);
      setItems(res.data || []);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    if (!userId) return;
    fetchCount();
    const timer = setInterval(fetchCount, 45000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchList();
  };

  const markRead = async (n) => {
    if (n.read) return;
    try { await axios.patch(`${API}/api/notifications/${n._id}/read`); } catch (e) { /* silent */ }
    setItems(prev => prev.map(x => (x._id === n._id ? { ...x, read: true } : x)));
    setCount(c => Math.max(0, c - 1));
  };

  const markAll = async () => {
    try { await axios.patch(`${API}/api/notifications/${userId}/read-all`); } catch (e) { /* silent */ }
    setItems(prev => prev.map(x => ({ ...x, read: true })));
    setCount(0);
  };

  if (!userId) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: 4 }}
      >
        <MdNotificationsNone size={24} />
        {count > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 16, height: 16, padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 36, right: 0, width: 320, maxHeight: 420, overflowY: 'auto', background: 'white', color: '#0f172a', borderRadius: 8, boxShadow: '0 12px 28px rgba(0,0,0,0.28)', zIndex: 4000, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white' }}>
            <strong style={{ fontSize: 14 }}>Notifications</strong>
            {items.some(i => !i.read) && (
              <button onClick={markAll} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '28px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              No notifications yet.
            </div>
          ) : (
            items.map(n => (
              <div
                key={n._id}
                onClick={() => markRead(n)}
                style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: n.read ? 'white' : '#eff6ff' }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{n.title}</div>
                {n.message && <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{n.message}</div>}
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
