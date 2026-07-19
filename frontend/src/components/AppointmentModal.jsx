import React, { useState, useEffect } from "react";
import "../styles/AppointmentModal.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Matches email addresses so we can render them without dumping the literal
// address into the page source (reduces naive bot scraping).
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Renders an email as a "click to reveal" control. The address is held
// base64-encoded until the user clicks, so the raw `name@domain` string is not
// present in the initial DOM/HTML that scrapers read.
const ObfuscatedEmail = ({ email }) => {
  const [revealed, setRevealed] = useState(false);
  const encoded = btoa(email);
  if (revealed) {
    const addr = atob(encoded);
    return <a href={`mailto:${addr}`} style={{ color: "#c00000", fontWeight: 600 }}>{addr}</a>;
  }
  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      style={{ background: "none", border: "none", color: "#c00000", textDecoration: "underline", cursor: "pointer", padding: 0, font: "inherit" }}
    >
      [click to reveal email]
    </button>
  );
};

// Splits free-text instruction content into plain text + obfuscated emails.
const renderInfoContent = (text) => {
  if (!text) return null;
  const parts = [];
  const re = new RegExp(EMAIL_RE.source, "g");
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<ObfuscatedEmail key={`em-${key++}`} email={match[0]} />);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
};

const AppointmentModal = ({ isOpen, onClose, service }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedToken, setSubmittedToken] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [liveDepts, setLiveDepts] = useState([]);
  const [closures, setClosures] = useState([]);
  const [bizHours, setBizHours] = useState({ businessHoursStart: 8, businessHoursEnd: 16, slotIntervalMinutes: 30, workingDays: [1,2,3,4,5] });

  // ✅ UPGRADED: Find the max form sections, then add 1 for the Summary Page
  // Sections are computed at render time from field order + weights (nothing stored on the field).
  const MAX_WEIGHT_PER_PAGE = 10; // page "height budget"; raise for fewer/taller pages, lower for more/shorter
  // Approximate a field's rendered height (not just its type): tall controls and
  // paragraph-length question labels count for more, so pages balance by real height.
  const fieldWeight = (f) => {
    const t = f.type;
    let w = t === 'info' ? 3 : t === 'textarea' ? 2 : t === 'time' ? 2 : t === 'select' ? 2 : 1;
    const labelLen = (f.label || '').length;
    if (labelLen > 120) w += 2;        // paragraph-length prompt (e.g. consent statements)
    else if (labelLen > 60) w += 1;    // wraps to ~2 lines
    if (t === 'info' && (f.content || '').length > 250) w += 1; // long disclaimer block
    return w;
  };
  const computeFormSections = (fields = []) => {
    // Keep a time-slot field on the same page as the date it immediately follows,
    // so the two halves of "when" never split across a page break.
    const atoms = [];
    for (const f of fields) {
      const prev = atoms.length ? atoms[atoms.length - 1] : null;
      if (f.type === 'time' && prev && prev.length === 1 && prev[0].type === 'date') {
        prev.push(f);
      } else {
        atoms.push([f]);
      }
    }
    const pages = [];
    let current = [];
    let weight = 0;
    for (const atom of atoms) {
      const w = atom.reduce((sum, f) => sum + fieldWeight(f), 0);
      if (current.length && weight + w > MAX_WEIGHT_PER_PAGE) {
        pages.push(current); current = []; weight = 0;
      }
      current.push(...atom); weight += w;
    }
    if (current.length) pages.push(current);
    return pages;
  };
  const formSections = computeFormSections(service?.fields || []);
  const maxFormSection = formSections.length; // number of form pages (0 = no custom fields)
  const totalSteps = maxFormSection + 1;       // +1 for the summary / review page

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

  // Local (timezone-safe) YYYY-MM-DD for a Date object
  const fmtLocalDate = (d) => {
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().split('T')[0];
  };

  // A day is bookable-blocked when a whole-day closure exists for it
  const isDayFullyClosed = (date) => {
    const ds = fmtLocalDate(date);
    return closures.some(c => c.date === ds && c.allDay !== false);
  };

  // A specific slot is blocked when a partial closure on that date covers it
  const isSlotClosed = (dateStr, slotValue) => {
    if (!dateStr) return false;
    return closures.some(c =>
      c.date === dateStr && c.allDay === false && c.startTime && c.endTime &&
      slotValue >= c.startTime && slotValue < c.endTime
    );
  };

  const generateTimeSlots = () => {
    const { businessHoursStart: startH, businessHoursEnd: endH, slotIntervalMinutes: interval } = bizHours;
    const slots = [];
    let totalMins = startH * 60;
    const endMins = endH * 60;
    while (totalMins < endMins) {
      const hour = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const timeLabel = `${displayHour}:${String(mins).padStart(2, '0')} ${ampm}`;
      const timeValue = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      slots.push({ label: timeLabel, value: timeValue });
      totalMins += interval;
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

      fetch(`${import.meta.env.VITE_API_URL}/api/system/settings`)
        .then(res => res.json())
        .then(data => setBizHours(data))
        .catch(err => console.error("Error fetching business hours:", err));

      fetch(`${import.meta.env.VITE_API_URL}/api/closures`)
        .then(res => res.json())
        .then(data => setClosures(Array.isArray(data) ? data : []))
        .catch(err => console.error("Error fetching closures:", err));
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
        setSubmitError("");
      }, 300);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const getFieldsForStep = () => {
    return formSections[step - 1] || [];
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBack = () => {
    const scrollArea = document.querySelector(".form-scroll-area");
    if (scrollArea) scrollArea.scrollTop = 0;
    setSubmitError("");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    // If we aren't on the final summary page, just move to the next step
    if (step < totalSteps) {
      const scrollArea = document.querySelector(".form-scroll-area");
      if (scrollArea) scrollArea.scrollTop = 0;
      setStep((prev) => prev + 1);
      return;
    }

    // If we ARE on the summary page, execute the API submission
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
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend rejected the request:", errorData);
        // 409 = duplicate active request (per-service limit). Show the friendly message.
        setSubmitError(errorData.message || "Something went wrong submitting your request. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const styledInput = {
    width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1',
    backgroundColor: '#fff', fontSize: '15px', color: '#1e293b', outline: 'none',
    cursor: 'pointer', boxSizing: 'border-box', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  };

  // ✅ NEW: Helper to format raw data nicely for the Summary Page
  const renderSummaryValue = (field) => {
    const val = formData[field.name];
    if (!val) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>;

    // Format 24h time to 12h time (e.g., "14:30" -> "2:30 PM")
    if (field.type === 'time' && val.includes(':')) {
      const [h, m] = val.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    }

    // Format Dates nicely (e.g., "2026-04-23" -> "April 23, 2026")
    if (field.type === 'date') {
      const parts = val.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }
    return val;
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
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Your Secure Tracking Link (This will be sent to your provided email)</p>
              <code style={{ fontSize: '12px', color: '#0f172a', wordBreak: 'break-all', display: 'block' }}>{`${window.location.origin}/view-request/${submittedToken}`}</code>
            </div>
            <button onClick={onClose} style={{ width: "100%", backgroundColor: "#cc0000", color: "white", border: "none", padding: "14px", fontSize: "16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Done</button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div className="header-text-group">
                <h2>{service.name} REQUEST</h2>
                {/* Dynamically adjust the header text on the last step */}
                <p>{step < totalSteps ? `Step ${step} of ${maxFormSection}` : "Final Review"}</p>
              </div>
              <button className="close-btn" onClick={onClose}>&times;</button>
            </div>

            <form className="dynamic-form" onSubmit={handleSubmit}>
              <div className="form-scroll-area">

                {/* ✅ UPGRADED: Logic Split between Form and Summary */}
                {step < totalSteps ? (
                  getFieldsForStep().map((field, index) => (
                    <div key={index} className="form-group">
                      {field.type === "info" ? (
                        <div className="info-display-box">{renderInfoContent(field.content)}</div>
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
                            <div className="custom-datepicker-wrapper">
                              {(() => {
                                const lowerLabel = field.label ? field.label.toLowerCase() : "";
                                const isDOB = lowerLabel.includes("birth") || lowerLabel.includes("dob");

                                return (
                                  <DatePicker
                                    selected={formData[field.name] ? new Date(formData[field.name]) : null}
                                    onChange={(date) => {
                                      const formattedDate = date ? fmtLocalDate(date) : "";
                                      setFormData({ ...formData, [field.name]: formattedDate });
                                    }}
                                    minDate={isDOB ? null : new Date()}
                                    maxDate={isDOB ? new Date() : new Date(new Date().setMonth(new Date().getMonth() + 2))}
                                    filterDate={isDOB ? undefined : (date) => (bizHours.workingDays || [1,2,3,4,5]).includes(date.getDay()) && !isDayFullyClosed(date)}
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
                            <div className="time-pill-grid">
                              {(() => {
                                const apptDateField = service.fields.find(f => f.type === 'date' && !/(birth|dob)/i.test(f.label || ''));
                                const selDate = apptDateField ? formData[apptDateField.name] : "";
                                const openSlots = timeSlots.filter(slot => !isSlotClosed(selDate, slot.value));
                                if (openSlots.length === 0) {
                                  return <p style={{ color: '#b91c1c', fontSize: '13px', margin: 0 }}>No available times for the selected date. Please choose another day.</p>;
                                }
                                return openSlots.map((slot) => {
                                  const isSelected = formData[field.name] === slot.value;
                                  return (
                                    <label
                                      key={slot.value}
                                      className={`time-pill ${isSelected ? 'selected' : ''}`}
                                    >
                                      <input
                                        type="radio" name={field.name} value={slot.value} required={field.required}
                                        onChange={handleChange} className="hidden-radio"
                                      />
                                      {slot.label}
                                    </label>
                                  );
                                });
                              })()}
                            </div>
                          ) : (
                            <input
                              type={field.type} name={field.name} required={field.required} onChange={handleChange}
                              value={formData[field.name] || ""} placeholder="Your answer" style={styledInput}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  /* ✅ NEW: The Summary View */
                  <div className="summary-container">
                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a', fontSize: '20px' }}>
                      Review Your Details
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                      Please verify that the information below is correct before submitting your request.
                    </p>

                    {submitError && (
                      <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                        {submitError}
                      </div>
                    )}

                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                      {service.fields.filter(f => f.type !== 'info').map((field) => (
                        <div key={field.name} style={{ marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.5px' }}>
                            {field.label}
                          </div>
                          <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500', wordBreak: 'break-word' }}>
                            {renderSummaryValue(field)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    /* ✅ UPGRADED: Button clearly says "Confirm" on the summary step */
                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : (service.requiresScheduling ? "Confirm & Schedule" : "Confirm & Submit")}
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
