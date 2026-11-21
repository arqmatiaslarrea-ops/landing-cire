import HeroSection from "@/components/HeroSection";
import ProblemsSection from "@/components/ProblemsSection";
import DifferentialsSection from "@/components/DifferentialsSection";
import ProcessSection from "@/components/ProcessSection";
import NotForYouSection from "@/components/NotForYouSection";
import FAQSection from "@/components/FAQSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      {/* SEO: H1 está en HeroSection */}
      <HeroSection />
      <ProblemsSection />
      <DifferentialsSection />
      <ProcessSection />
      <NotForYouSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
};

export default Index;
