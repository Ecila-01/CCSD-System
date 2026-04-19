import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdClose, MdCloudUpload } from "react-icons/md";
import '../styles/ServiceModal.css'; // Reusing your modal styles for consistency

const AddAnnouncementModal = ({ isOpen, onClose, onSuccess, editingAnnouncement }) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
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
      setContent(editingAnnouncement.content || '');
      setCategory(editingAnnouncement.category || 'UPDATE');
      setEventDate(editingAnnouncement.eventDate || '');
      setPreviewUrl(editingAnnouncement.image || null);
    } else {
      setTitle('');
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
      setPreviewUrl(URL.createObjectURL(file)); // Create temporary preview link
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('eventDate', eventDate);
    if (selectedFile) formData.append('image', selectedFile);

    try {
      if (editingAnnouncement) {
        await axios.patch(`http://localhost:5000/api/announcements/${editingAnnouncement._id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/announcements', formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error saving announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!editingAnnouncement;

  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card add-service-card">
        <div className="modal-header bg-red" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          position: 'relative', // Ensures button positioning context
          padding: '15px 20px' 
        }}>
          <h2>{isEditing ? "EDIT ANNOUNCEMENT" : "CREATE ANNOUNCEMENT"}</h2>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onClose}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px'
            }}
          >
            <MdClose size={28} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form-wrapper">
          <div className="modal-body">
            
            {/* IMAGE UPLOAD & PREVIEW */}
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

              <div className="input-group">
                <label>CONTENT / DESCRIPTION *</label>
                <textarea rows="5" required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the announcement details here..."></textarea>
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