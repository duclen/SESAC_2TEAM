import React from 'react';
import LandingHeader from '../landing/components/LandingHeader';
import LandingFooter from '../landing/components/LandingFooter';
import HeroSection from '../landing/sections/HeroSection';
import FeaturesSection from '../landing/sections/FeaturesSection';
import HowItWorksSection from '../landing/sections/HowItWorksSection';
import TestimonialsSection from '../landing/sections/TestimonialsSection';
import CTASection from '../landing/sections/CTASection';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
