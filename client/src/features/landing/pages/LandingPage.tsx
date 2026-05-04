import React from 'react';
import HeroSection from '../components/HeroSection';
import PaymentPartnersSection from '../components/PaymentPartnersSection';
import AboutSection from '../components/AboutSection';
import WorkflowSection from '../components/WorkflowSection';
import Footer from '../../../components/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <PaymentPartnersSection />
      <AboutSection />
      <WorkflowSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
