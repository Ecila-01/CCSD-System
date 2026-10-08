import React, { useState, useEffect, useRef } from 'react';

// One "Export" button with a menu: PDF / Word / Excel.
// `pdfItem` is your existing <PDFExportButton /> element, rendered as the PDF row.
function ExportDropdown({ pdfItem, onWord, onExcel, exporting }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close when tapping outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const pick = (fn) => async () => {
    setOpen(false);
    await fn();
  };

  return (
    <div ref={wrapRef} style={wrap}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!!exporting}
        style={trigger}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {exporting ? 'Exporting…' : 'Export ▾'}
      </button>

      {open && (
        <div role="menu" style={menu}>
          <div style={item} onClick={() => setOpen(false)}>
            {pdfItem}
          </div>
          <button type="button" role="menuitem" style={itemBtn} onClick={pick(onWord)}>
            Word (.docx)
          </button>
          <button type="button" role="menuitem" style={itemBtn} onClick={pick(onExcel)}>
            Excel (.xlsx)
          </button>
        </div>
      )}
    </div>
  );
}

const wrap = { position: 'relative', display: 'inline-block' };
const trigger = {
  padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#c00000',
  color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '13px',
};
const menu = {
  position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50, minWidth: '170px',
  background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
  boxShadow: '0 8px 20px rgba(0,0,0,.12)', padding: '6px', display: 'flex',
  flexDirection: 'column', gap: '4px',
};
const item = { display: 'flex' };
const itemBtn = {
  padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left',
  fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer', borderRadius: '6px',
};

export default ExportDropdown;