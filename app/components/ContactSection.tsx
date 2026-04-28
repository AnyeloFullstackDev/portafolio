"use client";
import { useEffect, useRef, useState } from "react";

const socials = [
  {
    label: "GitHub",
    href: "https://github.com/AnyeloFullstackDev",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/anyelofullstackdev2024/", // El usuario proporcionó este link para LinkedIn
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:anyelo@1112010@gmail.com",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function ContactSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="contact" ref={ref} className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/20 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] xl:w-[900px] h-[350px] xl:h-[500px] rounded-full bg-[#F59E0B]/5 blur-[140px]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 text-center">
        <p className={`section-label justify-center mb-6 sm:mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          Contacto
        </p>

        <h2
          className={`font-black tracking-tighter leading-[0.9] mb-6 sm:mb-8 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ fontSize: "clamp(2.8rem, 9vw, 7rem)" }}
        >
          ¿Tienes un{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-[#F59E0B]">proyecto</span>
            <span className="absolute inset-0 bg-[#F59E0B]/10 blur-xl -z-0 rounded-full" />
          </span>
          <br />en mente?
        </h2>

        <p className={`text-[#9CA3AF] text-base sm:text-lg xl:text-xl max-w-lg xl:max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          Estoy abierto a nuevas oportunidades, proyectos freelance y colaboraciones interesantes. ¡Hablemos!
        </p>

        {/* CTAs */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <a
            href="https://wa.me/584164214065" 
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full sm:w-auto flex items-center justify-center gap-3 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#F59E0B] text-[#0D0F1A] font-bold text-sm tracking-wide hover:bg-[#FCD34D] transition-all duration-300 hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] hover:scale-105"
          >
            Enviar mensaje
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>

          <a
            href="/CurrículumAnyeloFullStackDev.pdf"
            target="_blank"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full border border-white/10 text-[#F5F3EF] font-medium text-sm tracking-wide hover:border-white/30 hover:bg-white/5 transition-all duration-300"
          >
            Descargar CV
          </a>
        </div>

        {/* Socials */}
        <div className={`flex items-center justify-center gap-3 sm:gap-4 transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="w-11 h-11 sm:w-12 sm:h-12 xl:w-14 xl:h-14 rounded-full glass-card flex items-center justify-center text-[#9CA3AF] hover:text-[#F59E0B] hover:border-[#F59E0B]/30 transition-all duration-300 hover:scale-110"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 mt-20 sm:mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <span className="font-mono text-xs text-[#9CA3AF] tracking-wide text-center sm:text-left">
          © {new Date().getFullYear()} Anyelo — Hecho con Next.js & Tailwind
        </span>
        <span className="flex items-center gap-2 font-mono text-xs text-[#9CA3AF]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
          Disponible para proyectos
        </span>
      </div>
    </section>
  );
}
