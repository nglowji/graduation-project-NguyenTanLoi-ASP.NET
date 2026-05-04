import React from 'react';
import HeroSection from '../components/HeroSection';
import FieldTypesSection from '../components/FieldTypesSection';
import ProcessSection from '../components/ProcessSection';
import PaymentSection from '../components/PaymentSection';
import OwnerBenefitsSection from '../components/OwnerBenefitsSection';
import PricingSection from '../components/PricingSection';
import TestimonialsSection from '../components/TestimonialsSection';
import FAQSection from '../components/FAQSection';
import PaymentPartnersSection from '../components/PaymentPartnersSection';
import Footer from '../../../components/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <PaymentPartnersSection />
      <FieldTypesSection />
      <ProcessSection />
      <PaymentSection />
      <OwnerBenefitsSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
