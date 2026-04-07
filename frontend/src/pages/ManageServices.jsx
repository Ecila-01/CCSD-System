import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar'; 
import ServiceModal from '../components/ServiceModal'; // <-- IMPORT THE NEW MODAL
import '../styles/ManageServices.css'; 
import { MdOutlineShield, MdOutlineCheckCircle, MdOutlineWarning, MdOutlinePeopleAlt } from "react-icons/md";
import AddServiceModal from '../components/AddServiceModal';

function ManageServices() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingService, setViewingService] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await axios.delete(`http://localhost:5000/api/services/${id}`);
        setViewingService(null);
        fetchServices(); 
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  const handleEdit = (service) => {
    alert(`Editing ${service.name} - Form builder coming soon!`);
  };

  if (!user) return null;

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
              <div className="stat-info"><span className="stat-label">TOTAL SERVICES</span><span className="stat-number">{services.length}</span></div>
            </div>
            <div className="service-stat-card">
              <div className="icon-box green"><MdOutlineCheckCircle size={24}/></div>
              <div className="stat-info"><span className="stat-label">ACTIVE</span><span className="stat-number">{services.length}</span></div>
            </div>
            <div className="service-stat-card">
              <div className="icon-box yellow"><MdOutlineWarning size={24}/></div>
              <div className="stat-info"><span className="stat-label">INACTIVE</span><span className="stat-number">0</span></div>
            </div>
            <div className="service-stat-card">
              <div className="icon-box blue"><MdOutlinePeopleAlt size={24}/></div>
              <div className="stat-info"><span className="stat-label">CATEGORIES</span><span className="stat-number">{services.length}</span></div>
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
                        <td><span className="status-badge">Active</span></td>
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

      {/* --- RENDER THE NEW COMPONENT HERE --- */}
      <ServiceModal 
        service={viewingService} 
        onClose={() => setViewingService(null)} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <AddServiceModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchServices} 
      />

    </div>
  );
}

export default ManageServices;