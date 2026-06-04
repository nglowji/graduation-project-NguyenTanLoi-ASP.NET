import React from 'react';
import HeroSection from '../components/HeroSection';
import PaymentPartnersSection from '../components/PaymentPartnersSection';
import AboutSection from '../components/AboutSection';
import LatestPitchesSection from '../components/LatestPitchesSection';
import WorkflowSection from '../components/WorkflowSection';
import CommunityStoriesSection from '../components/CommunityStoriesSection';
import Footer from '../../../components/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <PaymentPartnersSection />
      <LatestPitchesSection />
      <AboutSection />
      <WorkflowSection />
      <CommunityStoriesSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
