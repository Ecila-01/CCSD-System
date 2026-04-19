import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar'; 
import ServiceModal from '../components/ServiceModal'; // <-- IMPORT THE NEW MODAL
import '../styles/ManageServices.css'; 
import { MdOutlineShield, MdOutlineCheckCircle, MdOutlineWarning, MdOutlinePeopleAlt } from "react-icons/md";
import AddServiceModal from '../components/AddServiceModal';
import StatusModal from '../components/StatusModal';

function ManageServices() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingService, setViewingService] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [statusModal, setStatusModal] = useState({ 
    isOpen: false, type: 'confirm', title: '', message: '', action: null 
  });

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (!loggedInUser) navigate('/');
    else setUser(JSON.parse(loggedInUser));
  }, [navigate]);

  const fetchServices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/services');
      setServices(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching services:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const triggerDelete = (id) => {
    setStatusModal({
      isOpen: true,
      type: 'delete_confirm',
      title: 'Delete Service?',
      message: 'Are you sure you want to remove this service? This action cannot be undone.',
      onConfirm: () => finalDelete(id) 
    });
  };

  const finalDelete = async (id) => {
    setStatusModal({ isOpen: true, type: 'loading', title: 'Deleting...', message: 'Please wait while we remove the service.' });
    
    try {
      await axios.delete(`http://localhost:5000/api/services/${id}`);
      
      // Close the viewing modal if it was open
      setViewingService(null); 

      // Show Success
      setStatusModal({ 
        isOpen: true, 
        type: 'success', 
        title: 'Deleted!', 
        message: 'The service has been removed',
        onConfirm: () => {
          setStatusModal({ ...statusModal, isOpen: false });
          fetchServices(); // Refresh the list
        }
      });
    } catch (error) {
      setStatusModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Error', 
        message: 'Could not delete the service. Please try again later.',
        onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
      });
    }
  };

  const handleEdit = (service) => {
      setViewingService(null); // Close the View modal
      setEditingService(service); // Open the Edit modal (with the service data)
    };

  if (!user) return null;
  const handleStatusChange = async (id, newStatus) => {
    // Show a small loading state in the status modal
    setStatusModal({ 
      isOpen: true, 
      type: 'loading', 
      title: 'Updating Status', 
      message: 'Applying changes to the service...' 
    });

    try {
      // We hit a PATCH route (which we will create next)
      await axios.patch(`http://localhost:5000/api/services/${id}`, { status: newStatus });
      
      // Update local state immediately so the UI feels snappy
      setServices(prev => prev.map(s => s._id === id ? { ...s, status: newStatus } : s));

      // Close the loading modal after a short delay
      setTimeout(() => {
        setStatusModal({ isOpen: false });
      }, 500);

    } catch (error) {
      setStatusModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Update Failed', 
        message: 'Could not update status. Please try again.' 
      });
    }
  };
  
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="content-header">
          <div className="search-box">
             <input type="text" placeholder="Search clients, cases, counselor..." />
          </div>
          <div className="header-right">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="user-pill">
              <span className="role-tag">{user.role || 'Admin'}</span>
            </div>
          </div>
        </header>

        <section className="services-view">
          <div className="services-page-header">
            <div>
              <h2>Services</h2>
              <p>Manage all counseling center services offered to students</p>
            </div>
            <button className="new-service-btn" onClick={() => setIsAddModalOpen(true)}>
              + Add Services
            </button>
          </div>
          <div className="services-stats-row">
            <div className="service-stat-card">
              <div className="icon-box red"><MdOutlineShield size={24}/></div>
              <div className="stat-info">
                <span className="stat-label">TOTAL SERVICES</span>
                <span className="stat-number">{services.length}</span>
              </div>
            </div>
            
            <div className="service-stat-card">
              <div className="icon-box green"><MdOutlineCheckCircle size={24}/></div>
              <div className="stat-info">
                <span className="stat-label">ACTIVE</span>
                <span className="stat-number">
                  {services.filter(s => s.status?.toLowerCase() === 'active').length}
                </span>
              </div>
            </div>
            
            <div className="service-stat-card">
              <div className="icon-box yellow"><MdOutlineWarning size={24}/></div>
              <div className="stat-info">
                <span className="stat-label">INACTIVE</span>
                <span className="stat-number">
                  {services.filter(s => s.status?.toLowerCase() === 'inactive').length}
                </span>
              </div>
            </div>
          </div>
          <div className="services-table-wrapper">
            <div className="services-table-header">
              <h3>All Services <span>({services.length})</span></h3>
            </div>

            {isLoading ? (
               <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading services from database...</div>
            ) : (
              <table className="services-table">
                <thead>
                  <tr>
                    <th>#</th><th>SERVICE NAME</th><th>DESCRIPTION</th><th>STATUS</th><th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No services found.</td></tr>
                  ) : (
                    services.map((svc, index) => (
                      <tr key={svc._id}>
                        <td className="index-col">{(index + 1).toString().padStart(2, '0')}</td>
                        <td className="name-col"><span className={`dot ${index % 2 === 0 ? 'dot-red' : 'dot-blue'}`}></span>{svc.name}</td>
                        <td className="desc-col">{svc.description}</td>
                        {/* Inside your services.map */}
                        <td className="status-col"> {/* Added class here */}
                          <button 
                            className={`status-toggle-btn ${svc.status?.toLowerCase()}`}
                            onClick={() => handleStatusChange(svc._id, svc.status === 'Active' ? 'Inactive' : 'Active')}
                          >
                            {svc.status || 'Active'}
                          </button>
                        </td>

                        <td className="action-col">
                          <button className="btn-view" onClick={() => setViewingService(svc)}>View</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            
            <div className="table-footer">
              <span>Showing {services.length > 0 ? 1 : 0}-{Math.min(5, services.length)} of {services.length} Services</span>
              <div className="pagination">
                <button>&lt;</button><button className="active">1</button><button>2</button><button>&gt;</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 1. VIEW SERVICE MODAL */}
      <ServiceModal 
        service={viewingService} 
        onClose={() => setViewingService(null)} 
        onEdit={handleEdit}
        onDelete={triggerDelete} // Now triggers the professional confirmation
      />

      {/* 2. ADD SERVICE MODAL */}
      <AddServiceModal 
        isOpen={isAddModalOpen || editingService !== null} // Open if adding OR editing
        editingService={editingService} // Pass the service data!
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingService(null); // Clear edit state on close
        }} 
        onSuccess={() => {
            fetchServices();
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: editingService ? 'Service Updated!' : 'Service Created!',
                message: editingService ? 'The changes have been saved.' : 'Your new service is now live.',
                onConfirm: () => setStatusModal({ ...statusModal, isOpen: false })
            });
            setEditingService(null); // Clear edit state on success
        }} 
      />

      {/* 3. GLOBAL STATUS MODAL (Confirmations, Success, Errors) */}
      <StatusModal 
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onConfirm={statusModal.onConfirm}
        onCancel={() => setStatusModal({ ...statusModal, isOpen: false })}
      />
    </div>
  );
}

export default ManageServices;