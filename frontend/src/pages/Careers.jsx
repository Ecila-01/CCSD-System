import React from 'react';
import Hero from "../components/Hero";
import heroBg from "../assets/facade.jpg";
import CareerCards from "../components/CareerCards";

function Careers() {
  return (
    <>
      <Hero
        background={heroBg}
        title="Career Opportunities & Updates"
      />
      <CareerCards />
    </>
  );
}

export default Careers;