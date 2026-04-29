"use client";
import { useState } from "react";

const navLinks = [
  { label: "Inicio",     href: "#hero" },
  { label: "Sobre mí",  href: "#about" },
  { label: "Proyectos", href: "#projects" },
  { label: "Skills",    href: "#skills" },
  { label: "Contacto",  href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen]         = useState(false);

  return (
    <>
     
        <div className="flex justify-between items-center px-10 py-5">
            <span className="font-bold tracking-tight text-[#F5F3EF] hidden sm:block">
                AnyeloFullStackDev
            </span>
          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-base"> {link.label}</a>
              </li>
            ))}
          </ul>
          {/* CTA */}
          <a
            href="#contact"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border-sky/40 text-sky font-mono text-xs tracking-widest uppercase hover:bg-sky/10 transition-all duration-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
            Disponible
          </a>
          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col gap-1.5 p-2"
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
        className={`fixed inset-0 z-40 bg-[#0D0F1A]/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-10 transition-all duration-500 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {navLinks.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="text-4xl font-bold tracking-tight hover:text-sky transition-colors duration-300"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}
