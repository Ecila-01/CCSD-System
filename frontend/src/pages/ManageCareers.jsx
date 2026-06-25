import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CareerModal from '../components/CareerModal';
import AddCareerModal from '../components/AddCareerModal';
import StatusModal from '../components/StatusModal';
import { MdOutlineWorkOutline, MdOutlinePublishedWithChanges, MdOutlineArchive, MdDeleteOutline } from "react-icons/md";
import '../styles/ManageAnnouncements.css';
import '../styles/ManagePages.css';

function ManageCareers() {
  const [careers, setCareers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingCareer, setViewingCareer] = useState(null);
  const [editingCareer, setEditingCareer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const visibleCareers = careers.filter(c => filter === 'All' || c.status === filter);
  const isAllSelected = visibleCareers.length > 0 && selectedIds.length === visibleCareers.length;
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [user, setUser] = useState(storedUser);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleCareers.map(c => c._id));
    }
  };

  const selectedItems = careers.filter(c => selectedIds.includes(c._id));
  const hasActiveSelected = selectedItems.some(c => c.status === 'Active');
  const hasArchivedSelected = selectedItems.some(c => c.status === 'Archived');

  const [statusModal, setStatusModal] = useState({
    isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null
  });

  const fetchCareers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/careers`);
      setCareers(res.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCareers(); }, []);

  // --- DELETE LOGIC ---
  const triggerDelete = (id) => {
    setStatusModal({
      isOpen: true,
      type: 'delete_confirm',
      title: 'Delete Career Announcement?',
      message: 'This will permanently remove this post from the career feed.',
      onConfirm: () => finalDelete(id)
    });
  };

  const finalDelete = async (id) => {
    setStatusModal({ isOpen: true, type: 'loading', title: 'Deleting...', message: 'Please wait...' });

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/careers/${id}`);
      setViewingCareer(null);
      fetchCareers();

      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Deleted!',
        message: 'The career announcement has been removed',
        onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
      });
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Could not delete career announcement.',
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
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/careers/${id}`, { status: newStatus });

      setCareers(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));

      setTimeout(() => {
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: newStatus === 'Archived' ? 'Archived!' : 'Restored!',
          message: `The career announcement is now ${newStatus.toLowerCase()}.`,
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
    const count = selectedIds.length;

    try {
      await Promise.all(selectedIds.map(id =>
        axios.patch(`${import.meta.env.VITE_API_URL}/api/careers/${id}`, { status: 'Archived' })
      ));

      setIsSelectMode(false);
      setSelectedIds([]);
      fetchCareers();

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
      message: 'This will permanently remove all selected career announcements.',
      onConfirm: async () => {
        setStatusModal({ isOpen: true, type: 'loading', title: 'Deleting...', message: 'Please wait...' });

        try {
          await Promise.all(selectedIds.map(id => axios.delete(`${import.meta.env.VITE_API_URL}/api/careers/${id}`)));
          setIsSelectMode(false);
          setSelectedIds([]);
          fetchCareers();

          setStatusModal({
            isOpen: true,
            type: 'success',
            title: 'Deleted!',
            message: 'Items removed successfully.',
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
        axios.patch(`${import.meta.env.VITE_API_URL}/api/careers/${id}`, { status: 'Active' })
      ));

      setIsSelectMode(false);
      setSelectedIds([]);
      fetchCareers();

      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Restored!',
        message: `${count} items are now active on the career feed.`,
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
              <span className="role-tag">{user.role}</span>
            </div>
          </div>
        </header>

        <section className="announcements-view">
          <div className="page-header-row">
            <div>
              <h2>Career Announcements</h2>
              <p>Manage and publish career-related posts: job fairs, hiring notices, consultations, and more</p>
            </div>
            <button className="add-btn-primary" onClick={() => setIsAddModalOpen(true)}>
              + Add Career Post
            </button>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <MdOutlineWorkOutline className="icon" />
              <div><span>TOTAL POSTS</span><strong>{careers.length}</strong></div>
            </div>
            <div className="stat-card">
              <MdOutlinePublishedWithChanges className="icon green" />
              <div><span>TOTAL PUBLISHED</span><strong>{careers.filter(c => c.status === 'Active').length}</strong></div>
            </div>
            <div className="stat-card">
              <MdOutlineArchive className="icon orange" />
              <div><span>TOTAL ARCHIVED</span><strong>{careers.filter(c => c.status === 'Archived').length}</strong></div>
            </div>
          </div>

          <div className="filter-row" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className={`filter-pill ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>All</button>
              <button className={`filter-pill ${filter === 'Active' ? 'active' : ''}`} onClick={() => setFilter('Active')}>Active</button>
              <button className={`filter-pill ${filter === 'Archived' ? 'active' : ''}`} onClick={() => setFilter('Archived')}>Archived</button>
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
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
            {isLoading ? <p style={{ padding: '20px', color: '#888' }}>Loading...</p> : careers
              .filter(c => filter === 'All' || c.status === filter)
              .map(career => (
              <div key={career._id} className={`ann-card ${selectedIds.includes(career._id) ? 'selected' : ''}`}>

                {isSelectMode && (
                  <div className="checkbox-overlay" onClick={(e) => toggleSelect(e, career._id)}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(career._id)}
                      onChange={() => {}}
                    />
                  </div>
                )}

                <div className="ann-card-image">
                  <img
                    src={
                      !career.image
                        ? "https://placehold.co/600x400/8b0000/ffffff?text=Career+News"
                        : career.image.startsWith('http')
                          ? career.image
                          : `${import.meta.env.VITE_API_URL}${career.image}`
                    }
                    alt={career.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/600x400/8b0000/ffffff?text=Career+News";
                    }}
                  />
                  <span className={`status-badge ${career.status.toLowerCase()}`}>
                    {career.status}
                  </span>

                  {!isSelectMode && (
                    <button className="delete-icon-btn" onClick={() => triggerDelete(career._id)}>
                      <MdDeleteOutline size={18} />
                    </button>
                  )}
                </div>

                <div className="ann-card-content">
                  <h3>{career.title}</h3>

                  <p>
                    {career.shortDescription
                      ? (career.shortDescription.length > 80 ? `${career.shortDescription.substring(0, 80)}...` : career.shortDescription)
                      : (career.content.length > 80 ? `${career.content.substring(0, 80)}...` : career.content)}
                  </p>

                  {!isSelectMode ? (
                    <div className="ann-card-footer">
                      <button className="view-btn" onClick={() => setViewingCareer(career)}>View</button>
                      <button className="archive-btn" onClick={() => handleStatusToggle(career._id, career.status)}>
                        {career.status === 'Active' ? 'Archive' : 'Restore'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ height: '45px', marginTop: 'auto' }}></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedIds.length > 0 && (
            <div className="bulk-action-bar">
              <span className="items-count">{selectedIds.length} items selected</span>
              <div className="bulk-btns">

                {hasActiveSelected && (
                  <button onClick={handleBulkArchive}>Archive Selected</button>
                )}

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

      {/* VIEW / PREVIEW MODAL */}
      <CareerModal
        career={viewingCareer}
        onClose={() => setViewingCareer(null)}
        onEdit={(c) => {
          setViewingCareer(null);
          setEditingCareer(c);
        }}
      />

      {/* ADD/EDIT MODAL */}
      <AddCareerModal
        isOpen={isAddModalOpen || !!editingCareer}
        editingCareer={editingCareer}
        onClose={() => { setIsAddModalOpen(false); setEditingCareer(null); }}
        onSuccess={() => {
          fetchCareers();
          setStatusModal({
            isOpen: true,
            type: 'success',
            title: editingCareer ? 'Updated!' : 'Published!',
            message: 'Changes are now live.',
            onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
          });
          setEditingCareer(null);
        }}
      />

      {/* GLOBAL STATUS MODAL */}
      <StatusModal
        isOpen={statusModal.isOpen}
        {...statusModal}
        onCancel={() => setStatusModal({ ...statusModal, isOpen: false })}
      />
    </div>
  );
}

export default ManageCareers;
