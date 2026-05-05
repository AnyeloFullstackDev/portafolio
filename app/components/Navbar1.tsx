"use client";
import { useState, useEffect } from "react";

const navLinks = [
  { label: "Inicio",     href: "#hero" },
  { label: "Sobre mí",  href: "#about" },
  { label: "Proyectos", href: "#projects" },
  { label: "Skills",    href: "#skills" },
  { label: "Contacto",  href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
          AnyeloFullStackDev
        </span>
        
        {/* Mobile Logo for small screens */}
        <span className="font-bold tracking-tight text-[#F5F3EF] sm:hidden">
          Anyelo
        </span>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
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
          href="#contact"
          className="hidden md:flex items-center gap-2 px-5 py-2 rounded-full border border-sky/30 text-sky font-mono text-[10px] tracking-widest uppercase hover:bg-sky/10 transition-all duration-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
          Disponible
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

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 bg-[#0D0F1A]/98 backdrop-blur-md flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden ${
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center gap-8">
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-4xl font-bold tracking-tighter text-[#F5F3EF] hover:text-sky transition-colors duration-300"
              style={{ 
                transitionDelay: `${i * 50}ms`,
                transform: open ? 'translateY(0)' : 'translateY(20px)',
                opacity: open ? 1 : 0,
                transition: `all 0.5s ease ${i * 50}ms`
              }}
            >
              {link.label}
            </a>
          ))}
          
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-4 px-8 py-3 rounded-full bg-sky text-[#0D0F1A] font-bold tracking-wide transition-all duration-300"
            style={{ 
              opacity: open ? 1 : 0,
              transition: `all 0.5s ease ${navLinks.length * 50}ms`
            }}
          >
            Contáctame
          </a>
        </div>
      </div>
    </nav>
  );
}

