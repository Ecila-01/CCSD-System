import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import AnnouncementModal from '../components/AnnouncementModal';
import AddAnnouncementModal from '../components/AddAnnouncementModal';
import StatusModal from '../components/StatusModal';
import { MdOutlineAnnouncement, MdOutlinePublishedWithChanges, MdOutlineArchive, MdDeleteOutline } from "react-icons/md";
import '../styles/ManageAnnouncements.css';

function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState('All'); 
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const visibleAnnouncements = announcements.filter(ann => filter === 'All' || ann.status === filter);
  const isAllSelected = visibleAnnouncements.length > 0 && selectedIds.length === visibleAnnouncements.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]); // Deselect all if they are already selected
    } else {
      setSelectedIds(visibleAnnouncements.map(a => a._id)); // Select all visible
    }
  };
  // Figure out what buttons to show in the Bulk Bar based on the selection
  const selectedItems = announcements.filter(a => selectedIds.includes(a._id));
  const hasActiveSelected = selectedItems.some(a => a.status === 'Active');
  const hasArchivedSelected = selectedItems.some(a => a.status === 'Archived');

  // Reusing the same statusModal structure from ManageServices
  const [statusModal, setStatusModal] = useState({ 
    isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null 
  });

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/announcements`);
      setAnnouncements(res.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  // --- DELETE LOGIC (MATCHES SERVICES) ---
  const triggerDelete = (id) => {
    setStatusModal({
      isOpen: true,
      type: 'delete_confirm',
      title: 'Delete Announcement?',
      message: 'This will permanently remove this post from the student feed.',
      onConfirm: () => finalDelete(id)
    });
  };

  const finalDelete = async (id) => {
    setStatusModal({ isOpen: true, type: 'loading', title: 'Deleting...', message: 'Please wait...' });
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/announcements/${id}`);
      setViewingAnnouncement(null);
      fetchAnnouncements();

      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Deleted!',
        message: 'The announcement has been removed',
        onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
      });
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Could not delete announcement.',
        onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
      });
    }
  };

  // --- ARCHIVE/RESTORE LOGIC ---
  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Archived' : 'Active';
    
    setStatusModal({ 
        isOpen: true, type: 'loading', 
        title: 'Updating Status', message: 'Applying changes...' 
    });

    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/announcements/${id}`, { status: newStatus });
      
      // Local state update for snappy UI
      setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
      
      // ✅ FIX: Show the success message instead of just closing it
      setTimeout(() => {
        setStatusModal({ 
          isOpen: true, 
          type: 'success', 
          title: newStatus === 'Archived' ? 'Archived!' : 'Restored!', 
          message: `The announcement is now ${newStatus.toLowerCase()}.`,
          onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
        });
      }, 500);
      
    } catch (err) {
      setStatusModal({ 
        isOpen: true, type: 'error', 
        title: 'Update Failed', message: 'Could not change status.',
        onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };
  // --- BULK ACTION LOGIC ---
const toggleSelect = (e, id) => {
  e.stopPropagation();
  setSelectedIds(prev => 
    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
  );
};

const handleBulkArchive = async () => {
  setStatusModal({ isOpen: true, type: 'loading', title: 'Archiving...', message: 'Updating multiple posts...' });
  
  // Save the length before we clear the array so we can show it in the success message!
  const count = selectedIds.length; 

  try {
    await Promise.all(selectedIds.map(id => 
      axios.patch(`${import.meta.env.VITE_API_URL}/api/announcements/${id}`, { status: 'Archived' })
    ));
    
    setIsSelectMode(false);
    setSelectedIds([]);
    fetchAnnouncements();
    
    // Show Success Modal instead of just closing it
    setStatusModal({ 
      isOpen: true, 
      type: 'success', 
      title: 'Archived!', 
      message: `${count} items have been moved to the archive.`,
      onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false })) 
    });

  } catch (err) {
    setStatusModal({ 
      isOpen: true, 
      type: 'error', 
      title: 'Error', 
      message: 'Bulk action failed. Please try again.',
      onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false })) 
    });
  }
};

const handleBulkDelete = () => {
  setStatusModal({
    isOpen: true,
    type: 'delete_confirm',
    title: `Delete ${selectedIds.length} items?`,
    message: 'This will permanently remove all selected announcements.',
    onConfirm: async () => {
      // 1. Show a loading state while it deletes (optional but good for UX)
      setStatusModal({ isOpen: true, type: 'loading', title: 'Deleting...', message: 'Please wait...' });
      
      try {
        await Promise.all(selectedIds.map(id => axios.delete(`${import.meta.env.VITE_API_URL}/api/announcements/${id}`)));
        setIsSelectMode(false);
        setSelectedIds([]);
        fetchAnnouncements();
        
        // 2. Show Success AND attach the close function!
        setStatusModal({ 
          isOpen: true, 
          type: 'success', 
          title: 'Deleted!', 
          message: 'Items removed successfully.',
          // ---> THIS IS THE MISSING LINE <---
          onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false })) 
        });
      } catch (err) {
        setStatusModal({ 
          isOpen: true, 
          type: 'error', 
          title: 'Error', 
          message: 'Could not delete some items.',
          onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
        });
      }
    }
  });
};
const handleBulkRestore = async () => {
  setStatusModal({ isOpen: true, type: 'loading', title: 'Restoring...', message: 'Restoring multiple posts...' });
  
  const count = selectedIds.length;

  try {
    await Promise.all(selectedIds.map(id => 
      axios.patch(`${import.meta.env.VITE_API_URL}/api/announcements/${id}`, { status: 'Active' })
    ));
    
    setIsSelectMode(false);
    setSelectedIds([]);
    fetchAnnouncements();
    
    // Show Success Modal instead of just closing it
    setStatusModal({ 
      isOpen: true, 
      type: 'success', 
      title: 'Restored!', 
      message: `${count} items are now active on the student feed.`,
      onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false })) 
    });

  } catch (err) {
    setStatusModal({ 
      isOpen: true, 
      type: 'error', 
      title: 'Error', 
      message: 'Bulk action failed. Please try again.',
      onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false })) 
    });
  }
};

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="content-header">
           <div className="search-box">
              <input type="text" placeholder="Search announcements..." />
           </div>
        </header>

        <section className="announcements-view">
          <div className="page-header-row">
            <div>
              <h2>CCSD Announcements</h2>
              <p>Manage and publish all CCSD Announcements and events</p>
            </div>
            <button className="add-btn-primary" onClick={() => setIsAddModalOpen(true)}>
              + Add Announcement
            </button>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <MdOutlineAnnouncement className="icon" />
              <div><span>TOTAL ANNOUNCEMENTS</span><strong>{announcements.length}</strong></div>
            </div>
            <div className="stat-card">
              <MdOutlinePublishedWithChanges className="icon green" />
              <div><span>TOTAL PUBLISHED</span><strong>{announcements.filter(a => a.status === 'Active').length}</strong></div>
            </div>
            <div className="stat-card">
              <MdOutlineArchive className="icon orange" />
              <div><span>TOTAL ARCHIVED</span><strong>{announcements.filter(a => a.status === 'Archived').length}</strong></div>
            </div>
          </div>
          <div className="filter-row" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className={`filter-pill ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>All</button>
              <button className={`filter-pill ${filter === 'Active' ? 'active' : ''}`} onClick={() => setFilter('Active')}>Active</button>
              <button className={`filter-pill ${filter === 'Archived' ? 'active' : ''}`} onClick={() => setFilter('Archived')}>Archived</button>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {/* NEW: Select All Checkbox */}
              {isSelectMode && (
                <label className="select-all-label">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={toggleSelectAll} 
                  />
                  Select All
                </label>
              )}

              <button 
                className={`select-toggle-btn ${isSelectMode ? 'active' : ''}`}
                onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds([]); }}
              >
                {isSelectMode ? 'Cancel Selection' : 'Select Multiple'}
              </button>
            </div>
          </div>
          <div className="announcement-grid">
            {isLoading ? <p>Loading...</p> : announcements
              .filter(ann => filter === 'All' || ann.status === filter)
              .map(ann => (
              <div key={ann._id} className={`ann-card ${selectedIds.includes(ann._id) ? 'selected' : ''}`}>
                
                {/* CHECKBOX OVERLAY */}
                {isSelectMode && (
                  <div className="checkbox-overlay" onClick={(e) => toggleSelect(e, ann._id)}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(ann._id)} 
                      onChange={() => {}} 
                    />
                  </div>
                )}

                <div className="ann-card-image">
                  <img 
                    src={
                      !ann.image 
                        ? "https://placehold.co/600x400/8b0000/ffffff?text=University+News"
                        : ann.image.startsWith('http') 
                          ? ann.image 
                          : `${import.meta.env.VITE_API_URL}${ann.image}`
                    } 
                    alt={ann.title} 
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src = "https://placehold.co/600x400/8b0000/ffffff?text=University+News"; 
                    }}
                  />
                  <span className={`status-badge ${ann.status.toLowerCase()}`}>
                    {ann.status}
                  </span>
                  
                  {/* ONLY SHOW DELETE BUTTON IF NOT IN SELECT MODE */}
                  {!isSelectMode && (
                    <button className="delete-icon-btn" onClick={() => triggerDelete(ann._id)}>
                      <MdDeleteOutline size={18} />
                    </button>
                  )}
                </div>

                <div className="ann-card-content">
                  <h3>{ann.title}</h3>
                  
                  {/* ✅ UPDATED: Use shortDescription for the admin preview as well */}
                  <p>
                    {ann.shortDescription 
                      ? (ann.shortDescription.length > 80 ? `${ann.shortDescription.substring(0, 80)}...` : ann.shortDescription)
                      : (ann.content.length > 80 ? `${ann.content.substring(0, 80)}...` : ann.content)}
                  </p>
                  
                  {/* ONLY SHOW FOOTER BUTTONS IF NOT IN SELECT MODE */}
                  {!isSelectMode ? (
                    <div className="ann-card-footer">
                      <button className="view-btn" onClick={() => setViewingAnnouncement(ann)}>View</button>
                      <button className="archive-btn" onClick={() => handleStatusToggle(ann._id, ann.status)}>
                          {ann.status === 'Active' ? 'Archive' : 'Restore'}
                      </button>
                    </div>
                  ) : (
                    /* Empty spacer so the card doesn't shrink when buttons disappear */
                    <div style={{ height: '45px', marginTop: 'auto' }}></div> 
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* --- 1. ADD THE BULK ACTION BAR HERE --- */}
          {selectedIds.length > 0 && (
            <div className="bulk-action-bar">
              <span className="items-count">{selectedIds.length} items selected</span>
              <div className="bulk-btns">
                
                {/* Show Archive button if any ACTIVE items are selected */}
                {hasActiveSelected && (
                  <button onClick={handleBulkArchive}>Archive Selected</button>
                )}

                {/* Show Restore button if any ARCHIVED items are selected */}
                {hasArchivedSelected && (
                  <button className="restore" onClick={handleBulkRestore}>Restore Selected</button>
                )}

                <div className="bulk-divider"></div>

                <button className="del" onClick={handleBulkDelete}>Delete Selected</button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* VIEW MODAL */}
      <AnnouncementModal 
        announcement={viewingAnnouncement} 
        onClose={() => setViewingAnnouncement(null)}
        onEdit={(ann) => {
            setViewingAnnouncement(null);
            setEditingAnnouncement(ann);
        }}
      />

      {/* ADD/EDIT MODAL (Uses onSuccess to trigger StatusModal) */}
      <AddAnnouncementModal 
        isOpen={isAddModalOpen || !!editingAnnouncement}
        editingAnnouncement={editingAnnouncement}
        onClose={() => { setIsAddModalOpen(false); setEditingAnnouncement(null); }}
        onSuccess={() => {
            fetchAnnouncements();
            setStatusModal({
              isOpen: true,
              type: 'success',
              title: editingAnnouncement ? 'Updated!' : 'Published!',
              message: 'Changes are now live.',
              onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
            });
            setEditingAnnouncement(null);
        }}
      />
      
      {/* THE GLOBAL STATUS MODAL */}
      <StatusModal 
        isOpen={statusModal.isOpen} 
        {...statusModal} 
        onCancel={() => setStatusModal({ ...statusModal, isOpen: false })} 
      />
    </div>
  );
}

export default ManageAnnouncements;