import Navbar from "./components/Navbar1";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import ProjectsSection from "./components/ProjectsSection";
import SkillsSection from "./components/SkillsSection";
import ContactSection from "./components/ContactSection";
import { getHomeContent } from "@/lib/content";

export const revalidate = 60;

export default async function Home() {
  const content = await getHomeContent();

  return (
    <>
      {/* Sticky navigation */}
      <Navbar
        siteName={content.siteSettings?.siteName}
        navItems={content.navItems}
        availabilityLabel={content.siteSettings?.availabilityLabel}
      />

      {/* Main content */}
      <main>
        <HeroSection
          profile={content.profile}
          section={content.sectionsByKey.hero}
          ctas={content.sectionCtas.filter((c) => c.sectionKey === "hero")}
          tags={content.heroTechnologies}
        />
        <AboutSection
          section={content.sectionsByKey.about}
          stats={content.profileStats}
          experiences={content.experiences}
        />
        <ProjectsSection
          section={content.sectionsByKey.projects}
          projects={content.projects}
        />
        <SkillsSection
          section={content.sectionsByKey.skills}
          categories={content.skillCategories}
          tools={content.toolsTechnologies}
          quote={content.quotes.find((q) => q.sectionKey === "skills")}
        />
        <ContactSection
          section={content.sectionsByKey.contact}
          ctas={content.sectionCtas.filter((c) => c.sectionKey === "contact")}
          socials={content.contactLinks}
          siteSettings={content.siteSettings}
        />
      </main>
    </>
  );
}
