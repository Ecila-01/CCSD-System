import { useState, useEffect } from "react";
import campusImg from "../assets/hero-bg.png";
import Hero from "../components/Hero";
import AppointmentModal from "../components/AppointmentModal";
import "../styles/Services.css";
import ServiceCard from "../components/ServiceCard";

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
            <div className="servicesGrid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-card">
                  <div className="skeleton-text-block">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-button"></div>
                  </div>
                  <div className="skeleton-image"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="servicesGrid">
              {services
                .filter((service) => service.status?.toLowerCase() === "active")
                .map((service) => (
                  <ServiceCard 
                    key={service._id} 
                    service={service} 
                    onClick={() => handleOpenModal(service)} 
                  />
                ))
              }
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