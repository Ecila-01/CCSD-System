import campusImg from "../assets/hero-bg.png";
import Hero from "../components/Hero";
import "./Services.css";

import service1 from "../assets/services/1.png";
import service2 from "../assets/services/2.png";
import service3 from "../assets/services/3.png";
import service4 from "../assets/services/4.png";
import service5 from "../assets/services/5.png";
import service6 from "../assets/services/6.png";

function Services() {
    const services = [
    {
        id: 1,
        image: service1,
        title: "Service 1",
        desc: "Description placeholder"
    },
    {
        id: 2,
        image: service2,
        title: "Service 2",
        desc: "Description placeholder"
    },
    {
        id: 3,
        image: service3,
        title: "Service 3",
        desc: "Description placeholder"
    },
    {
        id: 4,
        image: service4,
        title: "Service 4",
        desc: "Description placeholder"
    },
    {
        id: 5,
        image: service5,
        title: "Service 5",
        desc: "Description placeholder"
    },
    {
        id: 6,
        image: service6,
        title: "Service 6",
        desc: "Description placeholder"
    }
    ];
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
                <div className="serviceCard" key={service.id}>

                <div className="serviceText">
                    <h3>{service.title}</h3>
                    <p>{service.desc}</p>
                </div>

                <div className="serviceImageWrapper">
                    <img
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