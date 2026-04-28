"use client";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "2+",  label: "Años de experiencia" },
  { value: "5+", label: "Proyectos entregados" },
  { value: "9+", label: "Tecnologías dominadas" },
  { value: "∞",   label: "Líneas de código" },
];

const timeline = [
  {
    year: "2024",
    role: "Fullstack Developer",
    company: "Proyecto Personal",
    desc: "Desarrollo de sistemas web escalables con Next.js 16, arquitectura de microservicios y APIs RESTful.",
    color: "#F59E0B",
  },
  {
    year: "2023",
    role: "Frontend Developer",
    company: "Freelance",
    desc: "Interfaces de alto rendimiento, animaciones y experiencias de usuario para los mas exigentes.",
    color: "#A3E635",
  },
  {
    year: "2022",
    role: "Backend Developer",
    company: "Startup",
    desc: "APIs con Node.js + Express, bases de datos PostgreSQL/MongoDB, autenticación JWT y despliegue en cloud.",
    color: "#6366F1",
  },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/20 to-transparent" />
      <div className="absolute -left-60 top-1/2 -translate-y-1/2 w-[500px] h-[500px] xl:w-[700px] xl:h-[700px] rounded-full bg-[#6366F1]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Header */}
        <div className="mb-16 sm:mb-20">
          <p className={`section-label mb-5 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            Sobre mí
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-8">
            <h2
              className={`font-black tracking-tighter leading-[0.95] max-w-xl xl:max-w-2xl transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              Código{" "}
              <span className="text-[#F59E0B]">para resolver</span>{" "}
              <br />problemas reales
            </h2>
            <p className={`text-[#9CA3AF] max-w-sm xl:max-w-md leading-relaxed text-sm xl:text-base transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              Me apasiona convertir ideas complejas en soluciones elegantes. Desde la arquitectura del servidor hasta la animación del botón, cada detalle importa.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden mb-16 sm:mb-20 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="bg-[#0D0F1A] p-6 sm:p-8 xl:p-10 flex flex-col gap-1 hover:bg-[#111320] transition-colors duration-300 group"
              style={{ transitionDelay: `${300 + i * 80}ms` }}
            >
              <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#F59E0B] group-hover:scale-110 inline-block transition-transform duration-300 origin-left">
                {s.value}
              </span>
              <span className="text-[#9CA3AF] text-[10px] sm:text-xs font-mono tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Experience Cards — Rediseño Horizontal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {timeline.map((item, i) => (
            <div
              key={item.year}
              className="relative group"
              style={{
                transitionDelay: `${400 + i * 150}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transition: `opacity 0.7s ease ${400 + i * 150}ms, transform 0.7s ease ${400 + i * 150}ms`,
              }}
            >
              {/* Year Badge */}
              <div className="mb-4 inline-flex items-center gap-3">
                <span className="font-mono text-2xl font-bold" style={{ color: item.color }}>
                  {item.year}
                </span>
                <div className="h-px w-8 bg-white/10" />
              </div>

              <div className="glass-card rounded-2xl p-6 sm:p-8 hover:border-white/20 transition-all duration-500 h-full flex flex-col hover:bg-white/[0.02]">
                <span className="font-mono text-[10px] tracking-widest uppercase mb-2 block" style={{ color: item.color }}>
                  {item.company}
                </span>
                <h3 className="font-bold text-lg sm:text-xl xl:text-2xl mb-4 group-hover:text-[#F59E0B] transition-colors duration-300">
                  {item.role}
                </h3>
                <p className="text-[#9CA3AF] text-sm xl:text-base leading-relaxed">
                  {item.desc}
                </p>
                
                {/* Decorative element */}
                <div className="mt-auto pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#F59E0B] to-transparent" />
                </div>
              </div>
            </div>

            ))}
        </div>

      </div>
    </section>
  );
}
