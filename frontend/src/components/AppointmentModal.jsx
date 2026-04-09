import React, { useState, useEffect } from "react";
import "../styles/AppointmentModal.css";

const AppointmentModal = ({ isOpen, onClose, service }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // NEW: State to track if the form was successfully submitted
  const [isSuccess, setIsSuccess] = useState(false); 

  const totalSteps = service?.fields 
    ? Math.max(...service.fields.map(f => f.section || 1)) 
    : 1;

  // PREVENT BACKGROUND SCROLL & RESET FORM ON CLOSE
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // Reset the form in the background when closed so it's fresh next time
      setTimeout(() => {
        setStep(1);
        setFormData({});
        setIsSuccess(false);
      }, 300);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
      const response = await fetch("http://localhost:5000/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: service.name,
          requestData: formData, 
        }),
      });

      if (response.ok) {
        // CHANGED: Instead of alerting and closing, we trigger the Success UI!
        setIsSuccess(true);
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
        
        {/* CONDITIONAL RENDER: Success View vs Form View */}
        {isSuccess ? (
  
        /* --- UPDATED SUCCESS UI --- */
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", // Horizontal Centering
            justifyContent: "center", // Vertical Centering
            height: "100%", // Tells Flex to use the full modal height
            textAlign: "center", 
            padding: "60px 40px" 
        }}>
          <div style={{ 
            width: "80px", height: "80px", borderRadius: "50%", 
            backgroundColor: "#e8f5e9", color: "#2e7d32", 
            fontSize: "40px", display: "flex", alignItems: "center", 
            justifyContent: "center", margin: "0 auto 20px auto" 
          }}>
            ✓
          </div>
                      <h2 style={{ color: "#333", marginBottom: "15px", fontSize: "28px" }}>Request Submitted!</h2>
            <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "30px", fontSize: "16px" }}>
              Your request for <strong>{service.name}</strong> has been successfully sent to the CCSD team. 
              We will review your details and reach out to your UB student email shortly.
            </p>
            <button 
              onClick={onClose} 
              style={{ 
                backgroundColor: "#cc0000", color: "white", border: "none", 
                padding: "12px 32px", fontSize: "16px", borderRadius: "6px", 
                cursor: "pointer", fontWeight: "bold" 
              }}
            >
              Done
            </button>
        </div>

      ) : (
          /* --- ORIGINAL FORM UI --- */
          <>
            <div className="modal-header">
              <div className="header-text-group">
                <h2>{service.name} REQUEST</h2>
                <p>Step {step} of {totalSteps}</p>
              </div>
              <button className="close-btn" onClick={onClose}>
                &times;
              </button>
            </div>

            <form className="dynamic-form" onSubmit={handleSubmit}>
              <div className="form-scroll-area">
                {getFieldsForStep().map((field, index) => (
                  <div key={index} className="form-group">
                    {field.type === "info" ? (
                      <div className="info-display-box">{field.content}</div>
                    ) : (
                      <>
                        <label className="field-label">
                          {field.label}{" "}
                          {field.required && <span className="required">*</span>}
                        </label>

                        {field.type === "select" ? (
                          <div className="radio-group">
                            {field.options.map((opt) => {
                              const isOther = opt === "Other" || opt === "Other:";
                              const isSelected = formData[field.name] === opt || (isOther && formData[field.name]?.startsWith("Other:"));

                              return (
                                <label key={opt} className="radio-item">
                                  <input
                                    type="radio"
                                    name={field.name}
                                    value={isOther ? "Other:" : opt}
                                    required={field.required && !formData[field.name]} 
                                    onChange={(e) => {
                                      setFormData({
                                        ...formData,
                                        [field.name]: isOther ? "Other: " : e.target.value,
                                      });
                                    }}
                                    checked={isSelected}
                                  />
                                  
                                  {!isOther ? (
                                    <span className="radio-text">{opt}</span>
                                  ) : (
                                    <div className="other-input-wrapper">
                                      <span className="radio-text">Other:</span>
                                      <input
                                        type="text"
                                        className="google-other-text-line"
                                        value={formData[field.name]?.startsWith("Other:") ? formData[field.name].replace("Other: ", "").replace("Other:", "") : ""}
                                        onChange={(e) => {
                                          setFormData({
                                            ...formData,
                                            [field.name]: "Other: " + e.target.value,
                                          });
                                        }}
                                        onFocus={() => {
                                          if (!formData[field.name]?.startsWith("Other:")) {
                                            setFormData({
                                              ...formData,
                                              [field.name]: "Other: ",
                                            });
                                          }
                                        }}
                                        required={isSelected}
                                      />
                                    </div>
                                  )}
                                </label>
                              );
                            })}
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
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Request"}
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