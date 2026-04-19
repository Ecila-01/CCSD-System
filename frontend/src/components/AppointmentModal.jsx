import React, { useState, useEffect } from "react";
import "../styles/AppointmentModal.css";

const AppointmentModal = ({ isOpen, onClose, service }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [submittedToken, setSubmittedToken] = useState("");
  
  const totalSteps = service?.fields 
    ? Math.max(...service.fields.map(f => f.section || 1)) 
    : 1;

  // INITIALIZE ALL FIELDS TO EMPTY STRINGS TO PREVENT REACT WARNINGS
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      
      // Pre-fill the state with empty strings based on the service fields
      if (service?.fields) {
        const initialData = {};
        service.fields.forEach(field => {
          initialData[field.name] = "";
        });
        setFormData(initialData);
      }
    } else {
      document.body.style.overflow = "unset";
      setTimeout(() => {
        setStep(1);
        setFormData({});
        setIsSuccess(false);
      }, 300);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const getFieldsForStep = () => {
    return service.fields.filter((f) => (f.section || 1) === step);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBack = () => {
    const scrollArea = document.querySelector(".form-scroll-area");
    if (scrollArea) scrollArea.scrollTop = 0;
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step < totalSteps) {
      const scrollArea = document.querySelector(".form-scroll-area");
      if (scrollArea) scrollArea.scrollTop = 0;
      setStep((prev) => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      let extractedData = {};

      if (service.name.toUpperCase() === "REFERRAL") {
        extractedData = {
          studentName: formData.studentName || "Unknown Student",
          studentEmail: formData.studentContact || "", 
          studentIdNumber: formData.studentContact || "", 
          referrerName: formData.referrerName || "",
          referrerEmail: formData.email || "", 
        };
      } else {
        extractedData = {
          studentName: formData.studentName || formData.fullName || "Unknown Student",
          studentEmail: formData.email || "",
          studentIdNumber: formData.idNumber || formData.studentId || "",
          referrerName: "",
          referrerEmail: "",
        };
      }

      // BULLETPROOF PAYLOAD (No nulls, strict formatting)
      const payload = {
        serviceId: service._id,
        serviceName: service.name,
        status: "Pending",
        ...extractedData,
        
        // Force Boolean and Strings so Mongoose doesn't crash
        requiresSchedule: Boolean(service.requiresScheduling),
        appointmentDate: formData.prefDate || formData.preferredDate || "",
        timeSlot: formData.prefTime || formData.preferredTime || "",
        requestData: formData,
      };

      console.log("Submitting Payload:", payload);

      const response = await fetch("http://localhost:5000/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Capture the backend response which contains the guestToken
        const result = await response.json();
        
        // Store the token in our new state so the UI can see it
        setSubmittedToken(result.guestToken);
        
        // Now show the success screen
        setIsSuccess(true);
      } else {
        // If it still 500s, this will log the server's error message
        const errorData = await response.json();
        console.error("Backend rejected the request:", errorData);
        alert("Server Error. Check the console.");
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {isSuccess ? (
          <div style={{ 
              display: "flex", flexDirection: "column", alignItems: "center", 
              justifyContent: "center", height: "100%", textAlign: "center", padding: "60px 40px" 
          }}>
            <div style={{ 
              width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#e8f5e9", 
              color: "#2e7d32", fontSize: "40px", display: "flex", alignItems: "center", 
              justifyContent: "center", margin: "0 auto 20px auto" 
            }}>
              ✓
            </div>
            <h2 style={{ color: "#333", margin: "0 0 15px 0", fontSize: "28px" }}>Request Submitted!</h2>
            
            <p style={{ color: "#666", lineHeight: "1.6", margin: "0 0 20px 0", fontSize: "16px" }}>
              Your request for <strong>{service.name}</strong> has been sent.
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px', width: '100%' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Your Secure Tracking Link</p>
              
              <code style={{ fontSize: '13px', color: '#0f172a', wordBreak: 'break-all', display: 'block' }}>
                {`http://localhost:5173/view-request/${submittedToken}`}
              </code>
              
              <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                {service.name.toUpperCase() === "REFERRAL" 
                  ? `We have sent this link to your email (${formData.email}) for tracking.`
                  : `We have sent this link to your UB student email (${formData.email}).`
                }
              </p>
            </div>
            <button onClick={onClose} style={{ backgroundColor: "#cc0000", color: "white", border: "none", padding: "12px 32px", fontSize: "16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div className="header-text-group">
                <h2>{service.name} REQUEST</h2>
                <p>Step {step} of {totalSteps}</p>
              </div>
              <button className="close-btn" onClick={onClose}>&times;</button>
            </div>

            <form className="dynamic-form" onSubmit={handleSubmit}>
              <div className="form-scroll-area">
                {getFieldsForStep().map((field, index) => (
                  <div key={index} className="form-group">
                    {field.type === "info" ? (
                      <div className="info-display-box">{field.content}</div>
                    ) : (
                      <>
                        {field.label && (
                           <label className="field-label">
                             {field.label} {field.required && <span className="required">*</span>}
                           </label>
                        )}

                        {field.type === "select" ? (
                          <div className="select-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(() => {
                              // ✅ CASCADING & DEPENDENCY LOGIC
                              let displayOptions = field.options || [];
                              let isWaitingForParent = false;

                              if (field.dependsOnLabel) { 
                                const parentField = service.fields.find(f => f.label === field.dependsOnLabel);
                                if (parentField) {
                                  const parentValue = formData[parentField.name];
                                  
                                  if (!parentValue) {
                                    // Parent is empty -> Lock this field
                                    isWaitingForParent = true;
                                    displayOptions = [];
                                  } else if (field.optionsMap && field.optionsMap[parentValue]) {
                                    // Parent has value AND there's a map -> Load courses
                                    displayOptions = field.optionsMap[parentValue];
                                  }
                                }
                              }

                              // Determine current select value
                              const selectValue = formData[field.name]?.startsWith("Other:") ? "Other:" : (formData[field.name] || "");

                              return (
                                <>
                                  <select
                                    name={field.name}
                                    required={field.required}
                                    disabled={isWaitingForParent}
                                    value={selectValue}
                                    style={{ 
                                      width: '100%', 
                                      padding: '12px', 
                                      borderRadius: '6px', 
                                      border: '1px solid #cbd5e1', 
                                      backgroundColor: isWaitingForParent ? '#f1f5f9' : '#fff',
                                      fontSize: '14px',
                                      color: '#1e293b',
                                      outline: 'none',
                                      cursor: isWaitingForParent ? 'not-allowed' : 'pointer'
                                    }}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const isOther = val === "Other" || val === "Other:";
                                      
                                      setFormData((prev) => {
                                        const updatedData = {
                                          ...prev,
                                          [field.name]: isOther ? "Other: " : val,
                                        };
                                        
                                        // ✅ SMART CLEAR: Wipe out child AND grandchild if parent changes
                                        const childField = service.fields.find(f => f.dependsOnLabel === field.label);
                                        if (childField) {
                                          updatedData[childField.name] = ""; 
                                          
                                          const grandChildField = service.fields.find(f => f.dependsOnLabel === childField.label);
                                          if (grandChildField) {
                                            updatedData[grandChildField.name] = ""; 
                                          }
                                        }
                                        
                                        return updatedData;
                                      });
                                    }}
                                  >
                                    <option value="" disabled>Select an option</option>
                                    {isWaitingForParent && (
                                      <option value="disabled" disabled>
                                        Please select {field.dependsOnLabel} first
                                      </option>
                                    )}
                                    
                                    {!isWaitingForParent && displayOptions.map((opt) => {
                                      const isOther = opt === "Other" || opt === "Other:";
                                      return (
                                        <option key={opt} value={isOther ? "Other:" : opt}>
                                          {opt}
                                        </option>
                                      );
                                    })}
                                  </select>

                                  {/* RENDER THE TEXT INPUT IF "OTHER" IS SELECTED */}
                                  {formData[field.name]?.startsWith("Other:") && (
                                    <input
                                      type="text"
                                      placeholder="Please specify..."
                                      value={formData[field.name].replace("Other: ", "").replace("Other:", "")}
                                      onChange={(e) => setFormData({ ...formData, [field.name]: "Other: " + e.target.value })}
                                      required
                                      style={{ 
                                        width: '100%', 
                                        padding: '10px 12px', 
                                        border: 'none',
                                        borderBottom: '2px solid #8b0000', 
                                        backgroundColor: '#f8fafc', 
                                        fontSize: '14px',
                                        outline: 'none',
                                        marginTop: '5px'
                                      }}
                                    />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : field.type === "textarea" ? (
                          <textarea
                            name={field.name}
                            required={field.required}
                            onChange={handleChange}
                            rows="4"
                            value={formData[field.name] || ""}
                            placeholder="Your answer"
                          />
                        ) : (
                          <input
                            type={field.type}
                            name={field.name}
                            required={field.required}
                            onChange={handleChange}
                            value={formData[field.name] || ""}
                            placeholder="Your answer"
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <div className="footer-left">
                  {step > 1 && (
                    <button type="button" className="back-btn" onClick={handleBack} disabled={isSubmitting}>
                      Back
                    </button>
                  )}
                </div>
                <div className="footer-right">
                  <button type="button" className="cancel-btn" onClick={onClose}>
                    Cancel
                  </button>
                  
                  {step < totalSteps ? (
                    <button type="submit" className="next-btn">
                      Next Page
                    </button>
                  ) : (
                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : (service.requiresScheduling ? "Schedule Appointment" : "Submit Request")}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;