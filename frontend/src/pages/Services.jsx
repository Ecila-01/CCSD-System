import { useState, useEffect } from "react";
import campusImg from "../assets/facade.jpg";
import Hero from "../components/Hero";
import AppointmentModal from "../components/AppointmentModal";
import "../styles/Services.css";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true); // Added loading state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/services");
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleOpenModal = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  return (
    <div className="servicesPage">
      <Hero
        background={campusImg}
        title="OUR SERVICES"
        subtitle="Guidance, Support, and Development for Every UB Student"
      />

      <section className="servicesSection">
        <div className="servicesContainer">
          <div className="servicesHeader">
            <h2>CCSD SERVICES OFFERS:</h2>
          </div>

          {loading ? (
            <div className="loading-spinner">Loading Services...</div>
          ) : (
            <div className="servicesGrid">
              {services
              /* Only show services where status is 'active' */
                .filter((service) => service.status?.toLowerCase() === "active")
                .map((service) => (
                <div className="serviceCard" key={service._id}>
                  <div className="serviceText">
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    
                    <button 
                      className="scheduleBtn"
                      onClick={() => handleOpenModal(service)}
                    >
                      {service.name === "COUNSELING" ? "Schedule Appointment" : "Submit Request"}
                    </button>
                  </div>

                  <div className="serviceImageWrapper">
                    <img
                      /* This now pulls http://localhost:5000/uploads/counseling.png */
                      src={service.image} 
                      alt={service.name}
                      className="serviceImage"
                      /* Fallback in case the local image file is missing */
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* The Dynamic Modal */}
      {isModalOpen && (
        <AppointmentModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          service={selectedService} 
        />
      )}
    </div>
  );
}

export default Services;