import React, { useState, useEffect } from "react";
import "../styles/AppointmentModal.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AppointmentModal = ({ isOpen, onClose, service }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [submittedToken, setSubmittedToken] = useState("");
  const [liveDepts, setLiveDepts] = useState([]);
  
  const totalSteps = service?.fields 
    ? Math.max(...service.fields.map(f => f.section || 1)) 
    : 1;

  // --- Date Restriction Helpers ---
  const getMinDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const max = new Date();
    max.setMonth(max.getMonth() + 2); 
    const offset = max.getTimezoneOffset() * 60000;
    return new Date(max.getTime() - offset).toISOString().split('T')[0];
  };

  // --- NEW: Strict Time Slot Generator (8 AM to 4 PM, 30 min increments) ---
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 16; hour++) {
      for (let mins of ['00', '30']) {
        if (hour === 16 && mins === '30') continue; // Stop exactly at 4:00 PM
        
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        const timeLabel = `${displayHour}:${mins} ${ampm}`;
        
        // Value sent to database will be 24hr format (e.g., "14:30")
        const timeValue = `${hour.toString().padStart(2, '0')}:${mins}`; 
        
        slots.push({ label: timeLabel, value: timeValue });
      }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  useEffect(() => {
  if (isOpen) {
    fetch(`${import.meta.env.VITE_API_URL}/api/departments`)
      .then(res => res.json())
      .then(data => setLiveDepts(data))
      .catch(err => console.error("Error fetching live departments:", err));
  }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
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
      const getVal = (labelKeywords) => {
        const field = service.fields.find(f => 
          labelKeywords.some(keyword => f.label.toLowerCase().includes(keyword.toLowerCase()))
        );
        return field ? formData[field.name] : "";
      };

      let extractedData = {};

      if (service.name.toUpperCase() === "REFERRAL") {
        extractedData = {
          studentName: getVal(["Student to be referred", "Name of the Student"]),
          studentEmail: getVal(["Mobile Number", "Contact"]), 
          studentIdNumber: getVal(["ID Number (of Student)", "Student ID"]),
          referrerName: getVal(["Referring Faculty", "Full Name (Referring"]),
          referrerEmail: getVal(["Email Address (Referrer)"]),
        };
      } else {
        extractedData = {
          studentName: getVal(["Full Name", "Student Name"]) || "Unknown Student",
          studentEmail: getVal(["Email Address", "Email"]),
          studentIdNumber: getVal(["ID Number", "Student ID"]),
          referrerName: "",
          referrerEmail: "",
        };
      }

      const payload = {
        serviceId: service._id,
        serviceName: service.name,
        status: "Pending Review", 
        ...extractedData,
        requiresSchedule: Boolean(service.requiresScheduling),
        appointmentDate: formData.preferredDate || formData.prefDate || "",
        timeSlot: formData.preferredTime || formData.prefTime || "",
        requestData: formData,
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmittedToken(result.guestToken);
        setIsSuccess(true);
      } else {
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

  // ✅ NEW: Unified style for styled inputs (Date & Time)
  const styledInput = {
    width: '100%', 
    padding: '12px 15px', 
    borderRadius: '8px', 
    border: '1px solid #cbd5e1', 
    backgroundColor: '#fff',
    fontSize: '15px',
    color: '#1e293b',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {isSuccess ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "5% 15px", boxSizing: "border-box" }}>
            <div style={{ width: "70px", height: "70px", borderRadius: "50%", backgroundColor: "#e8f5e9", color: "#2e7d32", fontSize: "35px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>✓</div>
            <h2 style={{ color: "#333", margin: "0 0 10px 0", fontSize: "24px" }}>Request Submitted!</h2>
            <p style={{ color: "#666", lineHeight: "1.5", margin: "0 0 20px 0", fontSize: "15px" }}>Your request for <strong>{service.name}</strong> has been sent.</p>
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', width: '100%', boxSizing: "border-box" }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Your Secure Tracking Link</p>
              <code style={{ fontSize: '12px', color: '#0f172a', wordBreak: 'break-all', display: 'block' }}>{`${window.location.origin}/view-request/${submittedToken}`}</code>
            </div>
            <button onClick={onClose} style={{ width: "100%", backgroundColor: "#cc0000", color: "white", border: "none", padding: "14px", fontSize: "16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Done</button>
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
                          // ... [Existing regular select logic for Departments/Courses] ...
                          <div className="select-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(() => {
                              let displayOptions = field.options || [];
                              let isWaitingForParent = false;

                              if (field.dependsOnLabel) {
                                const parentField = service.fields.find(f => f.label === field.dependsOnLabel);
                                const parentValue = formData[parentField?.name];

                                if (!parentValue) {
                                  isWaitingForParent = true;
                                  displayOptions = [];
                                } else {
                                  if (field.isSystemLinked === 'courses') {
                                    const selectedDept = liveDepts.find(d => d.name === parentValue);
                                    displayOptions = selectedDept && selectedDept.courses.length > 0 
                                      ? [...selectedDept.courses.sort(), "Other"] : ["Other"];
                                  } else if (field.optionsMap && field.optionsMap[parentValue]) {
                                    displayOptions = field.optionsMap[parentValue];
                                  }
                                }
                              } else if (field.isSystemLinked === 'departments') {
                                displayOptions = liveDepts.length > 0 ? [...liveDepts.map(d => d.name).sort(), "Other"] : ["Other"];
                              }

                              const selectValue = formData[field.name]?.startsWith("Other:") ? "Other:" : (formData[field.name] || "");

                              return (
                                <>
                                  <select
                                    name={field.name}
                                    required={field.required}
                                    disabled={isWaitingForParent || (field.isSystemLinked && liveDepts.length === 0)}
                                    value={selectValue}
                                    style={{ ...styledInput, backgroundColor: isWaitingForParent ? '#f1f5f9' : '#fff', cursor: isWaitingForParent ? 'not-allowed' : 'pointer' }}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const isOther = val === "Other" || val === "Other:";
                                      setFormData((prev) => {
                                        const updatedData = { ...prev, [field.name]: isOther ? "Other: " : val };
                                        const childField = service.fields.find(f => f.dependsOnLabel === field.label);
                                        if (childField) {
                                          updatedData[childField.name] = ""; 
                                          const grandChildField = service.fields.find(f => f.dependsOnLabel === childField.label);
                                          if (grandChildField) updatedData[grandChildField.name] = ""; 
                                        }
                                        return updatedData;
                                      });
                                    }}
                                  >
                                    <option value="" disabled>
                                      {liveDepts.length === 0 && field.isSystemLinked ? "Loading live data..." : "Select an option"}
                                    </option>
                                    {isWaitingForParent && <option value="disabled" disabled>Please select {field.dependsOnLabel} first</option>}
                                    {!isWaitingForParent && displayOptions.map((opt) => {
                                      const isOther = opt === "Other" || opt === "Other:";
                                      return <option key={opt} value={isOther ? "Other:" : opt}>{opt}</option>;
                                    })}
                                  </select>

                                  {formData[field.name]?.startsWith("Other:") && (
                                    <input
                                      type="text" placeholder="Please specify..."
                                      value={formData[field.name].replace("Other: ", "").replace("Other:", "")}
                                      onChange={(e) => setFormData({ ...formData, [field.name]: "Other: " + e.target.value })}
                                      required
                                      style={{ width: '100%', padding: '10px 12px', border: 'none', borderBottom: '2px solid #8b0000', backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', marginTop: '5px', boxSizing: 'border-box' }}
                                    />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : field.type === "textarea" ? (
                          <textarea
                            name={field.name} required={field.required} onChange={handleChange} rows="4"
                            value={formData[field.name] || ""} placeholder="Your answer"
                            style={{ ...styledInput, resize: 'vertical' }}
                          />
                        ) : field.type === "date" ? (
                          /* ✅ UPGRADED: Smart DatePicker (Detects DOB vs Appointment) */
                          <div className="custom-datepicker-wrapper">
                            {(() => {
                              // Detect if this is a Birthday field by checking keywords in the label
                              const lowerLabel = field.label ? field.label.toLowerCase() : "";
                              const isDOB = lowerLabel.includes("birth") || lowerLabel.includes("dob");

                              return (
                                <DatePicker
                                  selected={formData[field.name] ? new Date(formData[field.name]) : null}
                                  onChange={(date) => {
                                    // Format back to YYYY-MM-DD for your database
                                    const formattedDate = date ? date.toISOString().split('T')[0] : "";
                                    setFormData({ ...formData, [field.name]: formattedDate });
                                  }}
                                  // --- CONDITIONAL RESTRICTIONS ---
                                  // DOB: No minimum date. Appointments: Minimum is today.
                                  minDate={isDOB ? null : new Date()} 
                                  // DOB: Max is today (can't be born in future). Appointments: Max is 2 months from today.
                                  maxDate={isDOB ? new Date() : new Date(new Date().setMonth(new Date().getMonth() + 2))} 
                                  // DOB: Allow all days. Appointments: Block Sundays (0).
                                  filterDate={isDOB ? undefined : (date) => date.getDay() !== 0} 
                                  
                                  placeholderText={isDOB ? "Select your birth date" : "Select an appointment date"}
                                  dateFormat="MMMM d, yyyy"
                                  className="react-datepicker-custom-input"
                                  calendarClassName="ub-custom-calendar"

                                  showYearDropdown={isDOB}
                                  showMonthDropdown={isDOB}
                                  dropdownMode="select"
                                />
                              );
                            })()}
                          </div>
                        ) : field.type === "time" ? (
                          /* ✅ UPGRADED: Calendly-Style Time Pill Grid */
                          <div className="time-pill-grid">
                            {timeSlots.map((slot) => {
                              const isSelected = formData[field.name] === slot.value;
                              return (
                                <label 
                                  key={slot.value} 
                                  className={`time-pill ${isSelected ? 'selected' : ''}`}
                                >
                                  <input
                                    type="radio"
                                    name={field.name}
                                    value={slot.value}
                                    required={field.required}
                                    onChange={handleChange}
                                    className="hidden-radio"
                                  />
                                  {slot.label}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          /* Standard Fallback for Text/Email/Number */
                          <input
                            type={field.type} name={field.name} required={field.required} onChange={handleChange}
                            value={formData[field.name] || ""} placeholder="Your answer"
                            style={styledInput}
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
                    <button type="button" className="back-btn" onClick={handleBack} disabled={isSubmitting}>Back</button>
                  )}
                </div>
                <div className="footer-right">
                  <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                  {step < totalSteps ? (
                    <button type="submit" className="next-btn">Next Page</button>
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