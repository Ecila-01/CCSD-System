import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdClose, MdCloudUpload } from "react-icons/md";
import '../styles/ServiceModal.css';

const AddCareerModal = ({ isOpen, onClose, onSuccess, editingCareer }) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('INFO');
  const [eventDate, setEventDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (editingCareer) {
      setTitle(editingCareer.title || '');
      setShortDescription(editingCareer.shortDescription || '');
      setContent(editingCareer.content || '');
      setCategory(editingCareer.category || 'INFO');
      setEventDate(editingCareer.eventDate || '');
      setPreviewUrl(editingCareer.image || null);
    } else {
      setTitle('');
      setShortDescription('');
      setContent('');
      setCategory('INFO');
      setEventDate('');
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [editingCareer, isOpen]);

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
    formData.append('shortDescription', shortDescription);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('eventDate', eventDate);
    if (selectedFile) formData.append('image', selectedFile);

    try {
      if (editingCareer) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/careers/${editingCareer._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/careers`, formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error saving career post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!editingCareer;

  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card add-service-card">
        <div className="modal-header bg-red" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'relative', padding: '15px 20px'
        }}>
          <h2>{isEditing ? "EDIT CAREER POST" : "CREATE CAREER POST"}</h2>
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
                    <button type="button" className="change-img-btn" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}>Change Image</button>
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
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Job Fair 2026" />
              </div>

              <div className="editor-row">
                <div className="input-group flex-1">
                  <label>CATEGORY</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="HIRING">Hiring</option>
                    <option value="JOB FAIR">Job Fair</option>
                    <option value="CONSULTATION">Consultation</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
                <div className="input-group flex-1">
                  <label>DATE/DURATION</label>
                  <input type="text" value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="e.g. Feb 24, 2026" />
                </div>
              </div>

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

              <div className="input-group">
                <label>FULL CONTENT *</label>
                <textarea
                  rows="6"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the full, detailed post here. This is what students see when they click 'Read More'."
                ></textarea>
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (isEditing ? "Update Post" : "Publish Post")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCareerModal;
