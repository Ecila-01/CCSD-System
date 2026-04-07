import React, { useState, useEffect } from "react";
import "../styles/AppointmentModal.css";

const AppointmentModal = ({ isOpen, onClose, service }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = service?.fields 
    ? Math.max(...service.fields.map(f => f.section || 1)) 
    : 1;
  // PREVENT BACKGROUND SCROLL
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
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

  // ONE FUNCTION TO RULE THEM ALL
  const handleSubmit = async (e) => {
    e.preventDefault(); // Always stop default browser refresh

    if (step < totalSteps) {
      const scrollArea = document.querySelector(".form-scroll-area");
      if (scrollArea) scrollArea.scrollTop = 0;
      setStep((prev) => prev + 1);
      return; 
    }

    // 2. IF ON LAST PAGE: Actually submit to database
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
        alert("Request Submitted Successfully!");
        onClose();
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

                    {/* RENDER RADIOS OR TEXT INPUTS */}
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
            {/* ... */}
            <div className="footer-right">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              
              {/* --- CHANGED: Condition uses totalSteps instead of 3 --- */}
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
      </div>
    </div>
  );
};

export default AppointmentModal;