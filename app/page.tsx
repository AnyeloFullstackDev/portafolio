import Navbar          from "./components/Navbar1";
import HeroSection     from "./components/HeroSection";
import AboutSection    from "./components/AboutSection";
import ProjectsSection from "./components/ProjectsSection";
import SkillsSection   from "./components/SkillsSection";
import ContactSection  from "./components/ContactSection";

export default function Home() {
  return (
    <>
      {/* Sticky navigation */}
      <Navbar />

      {/* Main content */}
      <main>
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>
    </>
  );
}
