import React from 'react';
import Hero from "../components/Hero";
import heroBg from "../assets/facade.jpg"; 
import AnnouncementCards from "../components/AnnouncementCards"; 
import FlipTitle from "../components/FlipTitle";

function Home() {
  return (
    <>
      <Hero
        background={heroBg}
        title="Center for Counseling and Student Development"
      />
      <FlipTitle />
      <AnnouncementCards /> 
    </>
  );
}

export default Home;