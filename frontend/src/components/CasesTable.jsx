import React, { useState, useEffect } from 'react';
import Select from 'react-select'; 
import '../styles/CasesTable.css';

const CasesTable = ({ requests, onView, title = "Updated Cases", itemsPerPage = 6 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // --- FILTER STATES ---
  const [filterCase, setFilterCase] = useState('');
  const [filterDepartment, setFilterDepartment] = useState(''); // ✅ Changed from Course
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCounselor, setFilterCounselor] = useState('');
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCase, filterDepartment, filterStatus, filterCounselor, searchName]);

  // --- HELPERS ---
  const getStudentName = (data) => {
    if (!data) return "N/A";
    return data.studentName || data.fullName || data.referrerName || "N/A";
  };

  // ✅ NEW: Simple Department Extractor
  const getDepartment = (data) => {
    if (!data) return "N/A";
    return data.department || "N/A";
  };

  const getDisplayDate = (req) => {
    const dateString = (req.requiresSchedule && req.appointmentDate) ? req.appointmentDate : req.createdAt;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
  };

  const getDisplayTime = (req) => {
    if (req.requiresSchedule && req.timeSlot) {
      return new Date(`1970-01-01T${req.timeSlot}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return new Date(req.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getServiceColor = (serviceName) => {
    if (!serviceName) return { bg: '#f1f3f4', text: '#5f6368' };
    const nameUpper = serviceName.toUpperCase();
    const coreColors = {
      'COUNSELING': { bg: '#fce4e4', text: '#c00000' },
      'REFERRAL': { bg: '#e8f0fe', text: '#1a73e8' },
      'GOOD MORAL CERTIFICATE': { bg: '#e6f4ea', text: '#137333' },
      'CAREER PLACEMENT': { bg: '#e0f2f1', text: '#00796b' }
    };
    if (coreColors[nameUpper]) return coreColors[nameUpper];

    const fallbackPalette = [
      { bg: '#f3e8fd', text: '#6a1b9a' }, { bg: '#fff3e0', text: '#e65100' },
      { bg: '#e8eaf6', text: '#283593' }, { bg: '#fce4ec', text: '#ad1457' },
      { bg: '#e0f7fa', text: '#006064' }
    ];
    let hash = 0;
    for (let i = 0; i < serviceName.length; i++) hash = serviceName.charCodeAt(i) + ((hash << 5) - hash);
    return fallbackPalette[Math.abs(hash) % fallbackPalette.length];
  };

  // --- REACT-SELECT OPTION BUILDERS ---
  const buildOptions = (items, placeholder) => [
    { value: '', label: `${placeholder} (ALL)` },
    ...items.map(item => ({ value: item, label: item }))
  ];

  const caseOptions = buildOptions([...new Set(requests.map(r => r.serviceName))].filter(Boolean), "CASES");
  // ✅ NEW: Build options for Departments
  const departmentOptions = buildOptions([...new Set(requests.map(r => getDepartment(r.requestData)))].filter(c => c !== "N/A"), "DEPARTMENT");
  const statusOptions = buildOptions([...new Set(requests.map(r => r.status))].filter(Boolean), "STATUS");
  const counselorOptions = buildOptions([...new Set(requests.map(r => r.assignedCounselor || 'Unassigned'))], "COUNSELOR");

  // --- THE MASTER FILTER ---
  const filteredRequests = requests.filter(req => {
    const actualName = req.serviceName === "REFERRAL" ? req.studentName : getStudentName(req.requestData);
    
    const matchName = searchName === '' || actualName.toLowerCase().includes(searchName.toLowerCase());
    const matchCase = filterCase === '' || req.serviceName === filterCase;
    const matchDepartment = filterDepartment === '' || getDepartment(req.requestData) === filterDepartment; // ✅ Filter by Dept
    const matchStatus = filterStatus === '' || req.status === filterStatus;
    const matchCounselor = filterCounselor === '' || (req.assignedCounselor || 'Unassigned') === filterCounselor;
    
    return matchName && matchCase && matchDepartment && matchStatus && matchCounselor;
  });

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const indexOfLastRequest = currentPage * itemsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  // --- CUSTOM REACT-SELECT STYLING ---
  const headerSelectStyles = {
    control: (base) => ({
      ...base, backgroundColor: 'transparent', border: 'none', boxShadow: 'none', cursor: 'pointer', minHeight: 'auto', padding: '0'
    }),
    valueContainer: (base) => ({ ...base, padding: '0' }),
    input: (base) => ({ ...base, color: '#6b7280', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', margin: 0, padding: 0 }),
    singleValue: (base) => ({ ...base, color: '#6b7280', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({ ...base, padding: '0 0 0 4px', color: '#6b7280', '&:hover': { color: '#3b82f6' } }),
    menu: (base) => ({ ...base, width: 'max-content', minWidth: '100%', zIndex: 50 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({ ...base, fontSize: '13px', color: '#1e293b', backgroundColor: state.isFocused ? '#f1f5f9' : 'white', cursor: 'pointer' })
  };

  const plainHeaderStyle = { color: '#6b7280', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div className="cases-table-container">
      <div className="table-header">
        <h3 style={{ fontSize: '18px', color: '#1e293b' }}>{title}</h3>
      </div>
      
      <div className="cases-table-outer">
        <div className="cases-table-inner">
      <table className="cases-table">
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '16px 10px 16px 20px', minWidth: '160px' }}>
              <Select options={caseOptions} styles={headerSelectStyles} menuPortalTarget={document.body} menuPosition="fixed" isSearchable={true} value={caseOptions.find(o => o.value === filterCase)} onChange={(option) => setFilterCase(option ? option.value : '')} />
            </th>
            
            <th style={{ padding: '16px 20px' }}>
              <input type="text" placeholder="🔍 STUDENT NAME..." value={searchName} onChange={(e) => setSearchName(e.target.value)} style={{ ...plainHeaderStyle, background: 'transparent', border: 'none', borderBottom: searchName ? '1px solid #3b82f6' : 'none', outline: 'none', width: '100%' }} />
            </th>
            
            <th style={{ padding: '16px 10px', minWidth: '160px' }}>
              {/* ✅ NEW: Department Select */}
              <Select 
                options={departmentOptions} 
                styles={headerSelectStyles} menuPortalTarget={document.body} menuPosition="fixed" 
                isSearchable={true} 
                value={departmentOptions.find(o => o.value === filterDepartment)} 
                onChange={(option) => setFilterDepartment(option ? option.value : '')} 
              />
            </th>
            
            <th style={{ ...plainHeaderStyle, padding: '16px 20px' }}>DATE</th>
            <th style={{ ...plainHeaderStyle, padding: '16px 20px' }}>TIME</th>
            
            <th style={{ padding: '16px 10px', minWidth: '150px' }}>
              <Select options={statusOptions} styles={headerSelectStyles} menuPortalTarget={document.body} menuPosition="fixed" isSearchable={true} value={statusOptions.find(o => o.value === filterStatus)} onChange={(option) => setFilterStatus(option ? option.value : '')} />
            </th>
            
            <th style={{ padding: '16px 10px', minWidth: '180px' }}>
              <Select options={counselorOptions} styles={headerSelectStyles} menuPortalTarget={document.body} menuPosition="fixed" isSearchable={true} value={counselorOptions.find(o => o.value === filterCounselor)} onChange={(option) => setFilterCounselor(option ? option.value : '')} />
            </th>
            
            <th style={{ ...plainHeaderStyle, padding: '16px 20px' }}>ACTIONS</th>
          </tr>
        </thead>
        
        <tbody>
          {currentRequests.map((req) => (
            <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '16px 20px' }}>
                <span className="service-badge" style={{ backgroundColor: getServiceColor(req.serviceName).bg, color: getServiceColor(req.serviceName).text, padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                  {req.serviceName}
                </span>
              </td>
              <td style={{ padding: '16px 20px' }}>
                {req.serviceName === "REFERRAL" ? (
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{req.studentName}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Ref by: {req.referrerName}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>{getStudentName(req.requestData)}</span>
                )}
              </td>
              
              {/* ✅ NEW: Displays Department */}
              <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                {getDepartment(req.requestData)}
              </td>
              
              <td style={{ padding: '16px 20px' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>{getDisplayDate(req)}</span>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                  {req.requiresSchedule ? 'Appointment' : 'Submitted'}
                </div>
              </td>
              <td style={{ padding: '16px 20px' }}><span style={{ fontSize: '13px', color: '#475569' }}>{getDisplayTime(req)}</span></td>
              <td style={{ padding: '16px 20px' }}>
                <span className={`case-status-badge ${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {req.status}
                </span>
              </td>
              <td style={{ padding: '16px 20px', fontSize: '13px' }}>
                {req.assignedCounselor !== 'Unassigned' 
                  ? <span style={{ fontWeight: '700', color: '#2563eb' }}>{req.assignedCounselor}</span>
                  : <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Unassigned</span>
                }
              </td>
              <td style={{ padding: '16px 20px' }}>
                <button onClick={() => onView(req)} style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>{/* cases-table-inner */}
      </div>{/* cases-table-outer */}
      
      {filteredRequests.length === 0 && (
        <div className="no-data" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          No cases match your current filters or search.
        </div>
      )}
      
      <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          {filteredRequests.length > 0 
            ? `Showing ${indexOfFirstRequest + 1} to ${Math.min(indexOfLastRequest, filteredRequests.length)} of ${filteredRequests.length} cases`
            : `Showing 0 of 0 cases`
          }
        </span>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handlePrevPage} disabled={currentPage === 1} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', backgroundColor: currentPage === 1 ? '#f8fafc' : '#ffffff', color: currentPage === 1 ? '#cbd5e1' : '#475569', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}>Prev</button>
            <span style={{ padding: '6px 14px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '6px', fontWeight: '700', fontSize: '13px' }}>{currentPage}</span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', backgroundColor: currentPage === totalPages ? '#f8fafc' : '#ffffff', color: currentPage === totalPages ? '#cbd5e1' : '#475569', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasesTable;