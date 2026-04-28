"use client";
import { useEffect, useRef, useState } from "react";

const projects = [
  {
    id: "01",
    title: "Sistema de Certificación",
    category: "Fullstack App",
    tech: ["Next.js", "Node.js", "PostgreSQL", "AES256"],
    desc: "Plataforma gubernamental de autenticación y gestión de trámites con microservicios, sesiones cifradas y flujos complejos de negocio.",
    color: "#F59E0B",
    accent: "#92400E",
    size: "large",
  },
  {
    id: "02",
    title: "API Gateway",
    category: "Backend",
    tech: ["Node.js", "Express", "JWT", "Redis"],
    desc: "Gateway de microservicios con autenticación distribuida, rate limiting y logging centralizado.",
    color: "#A3E635",
    accent: "#365314",
    size: "small",
  },
  {
    id: "03",
    title: "Dashboard Analytics",
    category: "Frontend",
    tech: ["React", "TypeScript", "Tailwind", "Chart.js"],
    desc: "Dashboard de métricas en tiempo real con visualizaciones interactivas y filtros dinámicos.",
    color: "#6366F1",
    accent: "#312E81",
    size: "small",
  },
  {
    id: "04",
    title: "E-Commerce Platform",
    category: "Fullstack",
    tech: ["Next.js", "Stripe", "Prisma", "PostgreSQL"],
    desc: "Tienda online completa con pasarela de pago, gestión de inventario y panel de administración.",
    color: "#EC4899",
    accent: "#831843",
    size: "large",
  },
];

function ProjectCard({ p, i, visible }: { p: typeof projects[0]; i: number; visible: boolean }) {
  const isLarge = p.size === "large";
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden glass-card hover:border-white/20 transition-[border-color] duration-500 ${
        isLarge ? "lg:col-span-2" : ""
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ease ${i * 100}ms, transform 0.7s ease ${i * 100}ms, border-color 0.3s`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-[3px] w-full transition-all duration-500 group-hover:h-[5px]"
        style={{ background: `linear-gradient(90deg, ${p.color}, ${p.accent})` }}
      />

      <div className="p-6 sm:p-8 xl:p-10">
        <div className="flex items-start justify-between mb-5 sm:mb-6">
          <div>
            <span className="font-mono text-[10px] sm:text-xs tracking-widest uppercase mb-2 block" style={{ color: p.color }}>
              {p.category}
            </span>
            <h3
              className="font-black tracking-tight leading-tight group-hover:text-white transition-colors duration-300"
              style={{ fontSize: isLarge ? "clamp(1.25rem, 2.5vw, 2rem)" : "clamp(1rem, 2vw, 1.5rem)" }}
            >
              {p.title}
            </h3>
          </div>
          <span
            aria-hidden="true"
            className="font-mono text-4xl sm:text-5xl xl:text-6xl font-black opacity-10 group-hover:opacity-20 transition-opacity duration-300 leading-none shrink-0"
            style={{ color: p.color }}
          >
            {p.id}
          </span>
        </div>

        <p className="text-[#9CA3AF] text-sm xl:text-base leading-relaxed mb-5 sm:mb-6">{p.desc}</p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {p.tech.map((t) => (
              <span
                key={t}
                className="px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] font-mono tracking-wide border"
                style={{ color: p.color, borderColor: `${p.color}30`, background: `${p.color}08` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0"
            style={{ borderColor: `${p.color}40`, color: p.color }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="projects" ref={sectionRef} className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="absolute -right-60 top-1/3 w-[500px] h-[500px] xl:w-[700px] xl:h-[700px] rounded-full bg-[#F59E0B]/4 blur-[140px] pointer-events-none" />

      {/* Marquee */}
      <div className="overflow-hidden mb-16 sm:mb-20 border-y border-white/5 py-3 sm:py-4">
        <div className="marquee-track">
          {[...Array(3)].map((_, ri) =>
            ["PROYECTOS", "·", "PROJECTS", "·", "WORK", "·", "CASOS", "·"].map((w, wi) => (
              <span
                key={`${ri}-${wi}`}
                className={`mx-4 sm:mx-6 font-black text-lg sm:text-xl tracking-widest uppercase ${
                  w === "·" ? "text-[#F59E0B]" : "text-white/10"
                }`}
              >
                {w}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 sm:gap-6 mb-10 sm:mb-14">
          <div>
            <p className={`section-label mb-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              Proyectos
            </p>
            <h2
              className={`font-black tracking-tighter leading-[0.95] transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)" }}
            >
              Lo que he{" "}
              <span className="text-[#F59E0B]">construido</span>
            </h2>
          </div>
          <a
            href="#contact"
            className={`self-start sm:self-end flex items-center gap-2 text-[#9CA3AF] hover:text-[#F59E0B] font-mono text-xs tracking-widest uppercase transition-all duration-700 delay-200 group ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            Ver todos
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        {/* Grid: mobile 1 col, desktop 3 col */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <ProjectCard p={projects[0]} i={0} visible={visible} />
          <div className="flex flex-col gap-4 sm:gap-5">
            <ProjectCard p={projects[1]} i={1} visible={visible} />
            <ProjectCard p={projects[2]} i={2} visible={visible} />
          </div>
        </div>
        <div className="mt-4 sm:mt-5">
          <ProjectCard p={projects[3]} i={3} visible={visible} />
        </div>
      </div>
    </section>
  );
}
