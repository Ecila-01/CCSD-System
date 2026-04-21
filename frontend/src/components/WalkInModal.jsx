import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdClose, MdArrowBack } from "react-icons/md";
import '../styles/ServiceModal.css';

const WalkInModal = ({ isOpen, onClose, onSuccess, counselorName }) => {
  const [step, setStep] = useState(1); // 1: Select Service, 2: Fill Form
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/services`).then(res => setServices(res.data));
      setStep(1);
      setFormData({});
    }
  }, [isOpen]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Construct the request object to match your database schema
    const payload = {
      serviceId: selectedService._id,
      serviceName: selectedService.name,
      studentName: formData.studentName || "Walk-in Student",
      status: "Active", // Walk-ins start as active
      assignedCounselor: counselorName,
      requestData: formData,
      requiresSchedule: true,
      appointmentDate: new Date(), // Set to today
      timeSlot: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) // Current time
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/requests/walk-in`, payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving walk-in:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="service-modal-overlay">
      <div className="service-modal-card" style={{ maxWidth: '600px' }}>
        <div className="modal-header bg-red">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {step === 2 && <MdArrowBack onClick={() => setStep(1)} style={{ cursor: 'pointer' }} />}
            <h2>{step === 1 ? "SELECT SERVICE" : selectedService.name}</h2>
          </div>
          <button className="close-btn" onClick={onClose}><MdClose size={24} /></button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          {step === 1 ? (
            <div className="service-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {services.map(s => (
                <div 
                  key={s._id} 
                  className="service-option-card"
                  onClick={() => handleServiceSelect(s)}
                  style={{ 
                    padding: '15px', border: '1px solid #ddd', borderRadius: '8px', 
                    cursor: 'pointer', textAlign: 'center', transition: '0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#C3151C'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#ddd'}
                >
                  <strong style={{ display: 'block', fontSize: '14px' }}>{s.name}</strong>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {selectedService.fields.map((field, idx) => (
                  <div key={idx} className="input-group">
                    <label>{field.label.toUpperCase()} {field.required && "*"}</label>
                    {field.type === 'select' ? (
                      <select 
                        required={field.required}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="modal-input"
                      >
                        <option value="">Select Option</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea 
                        required={field.required}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="modal-input"
                      />
                    ) : (
                      <input 
                        type={field.type} 
                        required={field.required}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="modal-input"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer" style={{ marginTop: '20px', padding: 0 }}>
                <button type="submit" className="btn-save" disabled={isSubmitting} style={{ width: '100%' }}>
                  {isSubmitting ? "Processing..." : "Create Walk-in Session"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalkInModal;