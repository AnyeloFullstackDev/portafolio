"use client";
import { useState, useEffect } from "react";
import type { NavItemContent } from "@portfolio/db";

interface NavbarProps {
  siteName?: string;
  navItems?: NavItemContent[];
  availabilityLabel?: string;
}

const defaultNavLinks = [
  { id: "nav-1", label: "Inicio",     href: "#hero" },
  { id: "nav-2", label: "Sobre mí",  href: "#about" },
  { id: "nav-3", label: "Proyectos", href: "#projects" },
  { id: "nav-4", label: "Skills",    href: "#skills" },
  { id: "nav-5", label: "Contacto",  href: "#contact" },
];

export default function Navbar({
  siteName = "AnyeloFullStackDev",
  navItems,
  availabilityLabel = "Disponible",
}: NavbarProps) {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Filtramos solo los enlaces de navegación normales (excluyendo el botón CTA)
  const regularLinks = navItems && navItems.length > 0
    ? navItems
        .filter((item) => !item.isCta)
        .map((item) => ({
          id: item.id,
          label: item.label,
          mobileLabel: item.mobileLabel || item.label,
          href: item.href,
        }))
    : defaultNavLinks.map((item) => ({ ...item, mobileLabel: item.label }));

  // Buscamos el elemento CTA en caso de estar configurado en la base de datos
  const ctaItem = navItems?.find((item) => item.isCta);
  const desktopCtaText = ctaItem?.label || availabilityLabel;
  const mobileCtaText = ctaItem?.mobileLabel || "Contáctame";
  const ctaHref = ctaItem?.href || "#contact";

  // Handle scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Body scroll lock when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0D0F1A]/80 backdrop-blur-lg border-b border-white/5 py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[1600px] mx-auto flex justify-between items-center px-6 sm:px-10">
        <span className="font-bold tracking-tight text-[#F5F3EF] hidden sm:block">
          {siteName}
        </span>
        
        {/* Mobile Logo for small screens */}
        <span className="font-bold tracking-tight text-[#F5F3EF] sm:hidden">
          {siteName.replace("FullStackDev", "") || "Anyelo"}
        </span>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {regularLinks.map((link) => (
            <li key={link.id}>
              <a 
                href={link.href} 
                className="text-sm font-medium text-[#9CA3AF] hover:text-sky transition-colors duration-300"
              > 
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={ctaHref}
          className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full border border-sky/30 text-sky font-mono text-[10px] tracking-widest uppercase hover:bg-sky/10 transition-all duration-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
          {desktopCtaText}
        </a>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden relative z-[60] flex flex-col gap-1.5 p-2"
          aria-label="Menú"
        >
          <span
            className={`block w-6 h-0.5 bg-[#F5F3EF] transition-all duration-300 ${
              open ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-4 h-0.5 bg-sky transition-all duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#F5F3EF] transition-all duration-300 ${
              open ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu - Simplified for better mobile compatibility */}
      <div
        className={`fixed inset-0 z-50 bg-[#0D0F1A]/98 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div 
          className={`flex flex-col items-center gap-8 transition-all duration-500 ${
            open ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
          }`}
        >
          {regularLinks.map((link, i) => (
            <a
              key={link.id}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-4xl font-bold tracking-tighter text-[#F5F3EF] hover:text-sky transition-colors duration-300"
              style={{ 
                transitionDelay: `${i * 50}ms`,
                transition: `all 0.5s ease ${i * 50}ms`
              }}
            >
              {link.mobileLabel}
            </a>
          ))}
          
          <a
            href={ctaHref}
            onClick={() => setOpen(false)}
            className="mt-4 px-8 py-3 rounded-full bg-sky text-[#0D0F1A] font-bold tracking-wide transition-all duration-300"
            style={{ 
              transitionDelay: `${regularLinks.length * 50}ms`,
              transition: `all 0.5s ease ${regularLinks.length * 50}ms`
            }}
          >
            {mobileCtaText}
          </a>
        </div>
      </div>
    </nav>
  );
}
