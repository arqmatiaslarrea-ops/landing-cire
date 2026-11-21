import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HeroMetrics } from "@/components/HeroMetrics";
import { Method } from "@/components/Method";
import { WhyInvest } from "@/components/WhyInvest";
import { InvestmentChart } from "@/components/InvestmentChart";
import { ExitStrategy } from "@/components/ExitStrategy";
import { Testimonials } from "@/components/Testimonials";
import { TrustSection } from "@/components/TrustSection";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { ContactSection } from "@/components/ContactSection";
import { InvestmentForm } from "@/components/InvestmentForm";
import { ChatWidget } from "@/components/ChatWidget";
import { MobileCTABar } from "@/components/MobileCTABar";
import { WhatsAppQualifyForm } from "@/components/WhatsAppQualifyForm";
import { ExitIntentModal } from "@/components/ExitIntentModal";
import { useTrackVisit } from "@/hooks/useTrackVisit";
import { useExitIntent } from "@/hooks/useExitIntent";

const Index = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWhatsAppFormOpen, setIsWhatsAppFormOpen] = useState(false);
  const exitIntent = useExitIntent(true);
  useTrackVisit();

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleOpenWhatsAppForm = () => {
    setIsWhatsAppFormOpen(true);
  };

  // Scroll depth tracking
  useEffect(() => {
    let tracked50 = false;
    let tracked100 = false;
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      const dataLayer = (window as any).dataLayer;
      if (!dataLayer) return;
      if (!tracked50 && scrollPercent >= 50) {
        tracked50 = true;
        dataLayer.push({ event: "scroll_depth", event_category: "Engagement", event_label: "50%" });
      }
      if (!tracked100 && scrollPercent >= 90) {
        tracked100 = true;
        dataLayer.push({ event: "scroll_depth", event_category: "Engagement", event_label: "100%" });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header onCtaClick={handleOpenForm} />
      <Hero onCtaClick={handleOpenForm} onWhatsAppClick={handleOpenWhatsAppForm} />
      <HeroMetrics />
      <Method />
      <WhyInvest />
      <InvestmentChart />
      <ExitStrategy />
      <Testimonials />
      <TrustSection />
      <CtaSection onCtaClick={handleOpenForm} />
      <ContactSection />
      <Footer />
      <InvestmentForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      <WhatsAppQualifyForm isOpen={isWhatsAppFormOpen} onClose={() => setIsWhatsAppFormOpen(false)} />
      <ExitIntentModal open={exitIntent.show} onClose={exitIntent.close} />
      <ChatWidget onOpenForm={handleOpenForm} />
      <MobileCTABar
        onCtaClick={handleOpenForm}
        onWhatsAppClick={handleOpenWhatsAppForm}
        hidden={isFormOpen || isWhatsAppFormOpen || exitIntent.show}
      />
    </div>
  );
};

export default Index;
