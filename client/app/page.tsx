import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { HowItWorks } from "@/components/landing/how-it-works";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
