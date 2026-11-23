import HeroSection from "@/components/HeroSection";
import ProblemsSection from "@/components/ProblemsSection";
import QueCompramosSection from "@/components/QueCompramosSection";
import ComparativaSection from "@/components/ComparativaSection";
import DifferentialsSection from "@/components/DifferentialsSection";
import ProcessSection from "@/components/ProcessSection";
import NotForYouSection from "@/components/NotForYouSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";
import BarraMovil from "@/components/BarraMovil";

const Index = () => {
  return (
    <main className="min-h-screen">
      {/* SEO: H1 está en HeroSection */}
      <HeroSection />
      <ProblemsSection />
      <QueCompramosSection />
      <ComparativaSection />
      <DifferentialsSection />
      <ProcessSection />
      <NotForYouSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
      {/* Espacio para que el botón fijo del celular no tape el pie */}
      <div className="h-20 lg:hidden bg-background" aria-hidden="true" />
      <BarraMovil />
    </main>
  );
};

export default Index;
