import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import StatusModal from '../components/StatusModal';
import { MdBackup, MdRestore, MdWarning, MdDownload, MdUpload, MdDeleteForever, MdClose } from "react-icons/md";
import '../styles/Dashboard.css';

// The exact model names for the backend
const ALL_MODELS = ['AboutContent', 'Department', 'Announcement', 'Service', 'ServiceRequest'];

function Settings() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [isLoading, setIsLoading] = useState(false);
  
  // Checklist States
  const [backupChecklist, setBackupChecklist] = useState(ALL_MODELS);
  const [wipeChecklist, setWipeChecklist] = useState(['ServiceRequest', 'Announcement']); 
  
  // Restore States
  const [restoreFile, setRestoreFile] = useState(null);
  const [modelsInRestoreFile, setModelsInRestoreFile] = useState([]);

  // Modal States
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, actionType: '', title: '', message: '', onProceed: null, customUI: null });

  // --- CHECKBOX HANDLERS ---
  const toggleBackupModel = (model) => {
    setBackupChecklist(prev => prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]);
  };

  const toggleWipeModel = (model) => {
    if (model === 'User') return;
    setWipeChecklist(prev => prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]);
  };

  // --- ACTION 1: BACKUP ---
  const handleGenerateBackup = async () => {
    if (backupChecklist.length === 0) return alert("Please select at least one collection to backup.");
    
    setStatusModal({ isOpen: true, type: 'loading', title: 'Generating Backup...', message: 'Gathering selected records...' });
    setIsLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/system/backup`, { modelsToBackup: backupChecklist });
      
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // --- NEW READABLE DATE FORMATTING ---
      const now = new Date();
      
      // Get exact date (Outputs: "April 30, 2026")
      const dateStr = now.toLocaleDateString('en-US', { 
        month: 'long', 
        day: '2-digit', 
        year: 'numeric' 
      });
      
      // Get exact time (Outputs: "10:30 am" -> converted to "10-30 am" for Windows safety)
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }).toLowerCase().replace(':', '-');
        
      // Set the new highly readable filename
      link.download = `CCSD_Backup_${dateStr} - ${timeStr}.json`;
      
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStatusModal({ isOpen: true, type: 'success', title: 'Backup Complete', message: 'Data downloaded securely.', onConfirm: () => setStatusModal({ isOpen: false }) });
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Backup Failed', message: 'Check server connection.', onConfirm: () => setStatusModal({ isOpen: false }) });
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTION 2: FILE UPLOAD PREVIEW (For Restore) ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRestoreFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedJson = JSON.parse(event.target.result);
        if (parsedJson.data) {
          setModelsInRestoreFile(Object.keys(parsedJson.data));
        } else {
          alert("Invalid backup file structure.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const triggerRestore = () => {
    if (!restoreFile || modelsInRestoreFile.length === 0) return alert("Please upload a valid .json backup file.");

    const includesUsers = modelsInRestoreFile.includes('User');
    const restorableModels = modelsInRestoreFile.filter(model => model !== 'User');

    setConfirmModal({
      isOpen: true,
      title: 'Confirm System Restore',
      message: `You are about to restore data from "${restoreFile.name}". This will overwrite current database records for the collections listed below.`,
      customUI: (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <strong style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Collections to be overwritten:</strong>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#334155' }}>
            {restorableModels.length > 0 
              ? restorableModels.map(model => <li key={model}><b>{model === 'ServiceRequest' ? 'Cases' : model}</b></li>)
              : <li><i>No restorable collections found.</i></li>
            }
          </ul>
          
          {includesUsers && (
            <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#dcfce3', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '12px' }}>
              <strong>🛡️ Security Lock:</strong> User data was found in this backup but will be safely ignored to prevent you from being locked out of your admin account.
            </div>
          )}
        </div>
      ),
      onProceed: executeRestore
    });
  };

  const executeRestore = async () => {
    setConfirmModal({ isOpen: false });
    setStatusModal({ isOpen: true, type: 'loading', title: 'Restoring...', message: 'Overwriting database...' });
    
    const formData = new FormData(); formData.append('backupFile', restoreFile);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/system/restore`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStatusModal({ isOpen: true, type: 'success', title: 'Restore Complete', message: 'Database restored successfully. Page will reload.', onConfirm: () => window.location.reload() });
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Restore Failed', message: err.response?.data?.message || 'Error occurred.', onConfirm: () => setStatusModal({ isOpen: false }) });
    }
  };

  // --- ACTION 3: WIPE ---
  const triggerWipe = () => {
    if (wipeChecklist.length === 0) return alert("Select at least one collection to wipe.");
    
    // Map display names for the warning modal
    const displayWipeList = wipeChecklist.map(model => model === 'ServiceRequest' ? 'Cases' : model).join(', ');

    setConfirmModal({
      isOpen: true,
      title: 'CRITICAL: Wipe Selected Data',
      message: `You are about to PERMANENTLY DELETE all records for: ${displayWipeList}.`,
      customUI: null,
      onProceed: executeWipe
    });
  };

  const executeWipe = async () => {
    setConfirmModal({ isOpen: false });
    setStatusModal({ isOpen: true, type: 'loading', title: 'Wiping...', message: 'Deleting records...' });
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/system/wipe`, { modelsToWipe: wipeChecklist });
      setStatusModal({ isOpen: true, type: 'success', title: 'Wipe Complete', message: 'Selected collections have been emptied.', onConfirm: () => setStatusModal({ isOpen: false }) });
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Wipe Failed', message: 'Server error.', onConfirm: () => setStatusModal({ isOpen: false }) });
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Sidebar />
      <main className="main-content" >
                
        {/* --- TOP BAR (Date & Admin) --- */}
        <header className="content-header">
          <div className="header-right">
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <div className="user-pill">
              <span className="role-tag">Admin</span>
            </div>
          </div>
        </header>
        <div style={{ padding: '0 30px' }}>
        {/* --- PAGE TITLE ROW (Matches Manage Departments) --- */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', marginTop: '10px' }}>
          <h2 style={{ fontSize: '24px', color: '#0f172a', margin: 0 }}>System Vault</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
          
          {/* BACKUP CARD */}
          <div style={cardStyle}>
            {/* flex: 1 pushes the button to the bottom */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={iconWrapper('#eff6ff', '#2563eb')}><MdBackup size={24} /></div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Selective Backup</h3>
              </div>
              <div style={checklistContainer}>
                {ALL_MODELS.map(model => (
                  <label key={model} style={checkboxLabel}>
                    <input type="checkbox" checked={backupChecklist.includes(model)} onChange={() => toggleBackupModel(model)} /> 
                    {/* Visual check for ServiceRequest */}
                    {model === 'ServiceRequest' ? 'Cases' : model}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleGenerateBackup} disabled={isLoading} style={{ ...primaryBtnStyle, backgroundColor: '#2563eb' }}>
              <MdDownload size={18} /> Download Selected
            </button>
          </div>

          {/* RESTORE CARD */}
          <div style={cardStyle}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={iconWrapper('#fefce8', '#ca8a04')}><MdRestore size={24} /></div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>System Restore</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '15px' }}>Upload a .json backup to overwrite existing records.</p>
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ width: '100%', padding: '8px', marginBottom: '15px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <button onClick={triggerRestore} disabled={isLoading || !restoreFile} style={{ ...primaryBtnStyle, backgroundColor: '#ca8a04' }}>
              <MdUpload size={18} /> Review & Restore
            </button>
          </div>

          {/* WIPE CARD */}
          <div style={{ ...cardStyle, border: '1px solid #fecaca' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={iconWrapper('#fee2e2', '#dc2626')}><MdDeleteForever size={24} /></div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#dc2626' }}>Selective Wipe</h3>
              </div>
              <div style={checklistContainer}>
                {ALL_MODELS.map(model => (
                  <label key={`wipe-${model}`} style={{ ...checkboxLabel, opacity: model === 'User' ? 0.5 : 1 }}>
                    <input type="checkbox" checked={wipeChecklist.includes(model)} disabled={model === 'User'} onChange={() => toggleWipeModel(model)} /> 
                    {/* Visual check for ServiceRequest */}
                    {model === 'ServiceRequest' ? 'Cases' : model} {model === 'User' && '(Locked)'}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={triggerWipe} disabled={isLoading} style={{ ...primaryBtnStyle, backgroundColor: '#dc2626' }}>
              <MdDeleteForever size={18} /> Wipe Selected
            </button>
          </div>

        </div>
        </div>
      </main>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, maxWidth: '500px'}}>
            <button onClick={() => setConfirmModal({ isOpen: false })} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><MdClose size={24} /></button>
            <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: '18px' }}><MdWarning color="#dc2626"/> {confirmModal.title}</h2>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>{confirmModal.message}</p>
            {confirmModal.customUI}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setConfirmModal({ isOpen: false })} style={{ padding: '10px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmModal.onProceed} style={{ padding: '10px 15px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Yes, Proceed</button>
            </div>
          </div>
        </div>
      )}

      <StatusModal isOpen={statusModal.isOpen} type={statusModal.type} title={statusModal.title} message={statusModal.message} onConfirm={statusModal.onConfirm} />
    </div>
  );
}

// --- STYLES ---
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%' };
const checklistContainer = { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1 };
const checkboxLabel = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', color: '#334155' };
const iconWrapper = (bg, color) => ({ backgroundColor: bg, color: color, width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' });
const primaryBtnStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modalContentStyle = { backgroundColor: 'white', padding: '25px', width: '100%', position: 'relative', borderRadius: '12px' };

export default Settings;