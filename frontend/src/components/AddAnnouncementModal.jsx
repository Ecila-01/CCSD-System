import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdClose, MdCloudUpload } from "react-icons/md";
import '../styles/ServiceModal.css';

const AddAnnouncementModal = ({ isOpen, onClose, onSuccess, editingAnnouncement }) => {
  // ⚠️ All hooks MUST come before any conditional return (Rules of Hooks)
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('UPDATE');
  const [eventDate, setEventDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title || '');
      setShortDescription(editingAnnouncement.shortDescription || ''); // ✅ PRE-FILL
      setContent(editingAnnouncement.content || '');
      setCategory(editingAnnouncement.category || 'UPDATE');
      setEventDate(editingAnnouncement.eventDate || '');
      setPreviewUrl(editingAnnouncement.image || null);
    } else {
      setTitle('');
      setShortDescription(''); // ✅ RESET
      setContent('');
      setCategory('UPDATE');
      setEventDate('');
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [editingAnnouncement, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('shortDescription', shortDescription); // ✅ ADD TO SUBMIT
    formData.append('content', content);
    formData.append('category', category);
    formData.append('eventDate', eventDate);
    if (selectedFile) formData.append('image', selectedFile);

    try {
      if (editingAnnouncement) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/announcements/${editingAnnouncement._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/announcements`, formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      const msg = error.response?.data?.message || error.message || "Unknown error";
      alert("Error saving announcement: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!editingAnnouncement;

  if (!isOpen) return null;

  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card add-service-card">
        <div className="modal-header bg-red" style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          position: 'relative', padding: '15px 20px' 
        }}>
          <h2>{isEditing ? "EDIT ANNOUNCEMENT" : "CREATE ANNOUNCEMENT"}</h2>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onClose}
            style={{ 
              background: 'transparent', border: 'none', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px'
            }}
          >
            <MdClose size={28} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form-wrapper">
          <div className="modal-body">
            
            <div className="form-section">
              <label className="section-title">COVER IMAGE</label>
              <div className="image-upload-container">
                {previewUrl ? (
                  <div className="preview-box">
                    <img src={previewUrl} alt="Preview" />
                    <button type="button" className="change-img-btn" onClick={() => {setSelectedFile(null); setPreviewUrl(null);}}>Change Image</button>
                  </div>
                ) : (
                  <label className="upload-placeholder">
                    <MdCloudUpload size={40} />
                    <span>Click to upload image</span>
                    <input type="file" accept="image/*" required={!isEditing} onChange={handleFileChange} hidden />
                  </label>
                )}
              </div>
            </div>

            <div className="form-section">
              <div className="input-group">
                <label>TITLE *</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wellness Fair 2026" />
              </div>

              <div className="editor-row">
                <div className="input-group flex-1">
                  <label>CATEGORY</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="EVENT">Event</option>
                    <option value="UPDATE">Update</option>
                    <option value="MEMO">Memo</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
                <div className="input-group flex-1">
                  <label>DATE/DURATION</label>
                  <input type="text" value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="e.g. Feb 24, 2026" />
                </div>
              </div>

              {/* ✅ NEW: Short Description Field */}
              <div className="input-group">
                <label>SHORT DESCRIPTION (EXCERPT) *</label>
                <textarea 
                  rows="2" 
                  maxLength="150" 
                  required 
                  value={shortDescription} 
                  onChange={(e) => setShortDescription(e.target.value)} 
                  placeholder="A brief 1-2 sentence summary for the preview card..."
                ></textarea>
                <small style={{ color: '#64748b', fontSize: '11px', textAlign: 'right', display: 'block', marginTop: '4px' }}>
                  {shortDescription.length}/150 characters
                </small>
              </div>

              {/* ✅ UPDATED: Full Content Field */}
              <div className="input-group">
                <label>FULL ARTICLE CONTENT *</label>
                <textarea 
                  rows="6" 
                  required 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Write the full, detailed announcement here. This is what students see when they click 'Read More'."
                ></textarea>
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (isEditing ? "Update Announcement" : "Publish Announcement")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAnnouncementModal;