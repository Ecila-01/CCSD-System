import { useState, useEffect } from "react"; // 1. Import hooks
import campusImg from "../assets/hero-bg.png";
import Hero from "../components/Hero";
import "./Services.css";

function Services() {
  // 2. Initialize state as an empty array
  const [services, setServices] = useState([]);

  // 3. Fetch data when the component mounts
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/services");
        const data = await response.json();
        setServices(data);
        console.log(data)
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    
    fetchServices();
  }, []);

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
          <div className="servicesGrid">
            {services.map((service) => (
              /* 4. Use service._id from MongoDB as the key */
              <div className="serviceCard" key={service._id}>
                <div className="serviceText">
                  <h3>{service.title}</h3>
                  <p>{service.desc}</p>
                </div>

                <div className="serviceImageWrapper">
                  <img
                    /* 5. Path now comes directly from the database string */
                    src={service.image}
                    alt={service.title}
                    className="serviceImage"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Services;