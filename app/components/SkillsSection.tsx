"use client";
import { useEffect, useRef, useState } from "react";

const skillGroups = [
  {
    label: "Frontend",
    color: "#0EA5E9",
    skills: [
      { name: "React / Next.js", pct: 95 },
      { name: "TypeScript",      pct: 90 },
      { name: "CSS / Tailwind",  pct: 92 },
    ],
  },
  {
    label: "Backend",
    color: "#A3E635",
    skills: [
      { name: "Node.js / Express", pct: 88 },
      { name: "PostgreSQL",        pct: 82 },
      { name: "API REST / Auth",   pct: 90 },
    ],
  },
  {
    label: "DevOps & Tools",
    color: "#6366F1",
    skills: [
      { name: "Git / GitHub",   pct: 92 },
      { name: "Docker",         pct: 72 },
    ],
  },
];

const tools = [
  "VS Code","Postman","GitHub",
  "Zod","Zustand","axios","qrcode","use-mask-input","winston"
];

export default function SkillsSection() {
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
    <section ref={ref} className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="absolute -left-40 bottom-0 w-[500px] xl:w-[700px] h-[500px] xl:h-[700px] rounded-full bg-[#6366F1]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Header */}
        <div id="skills" className="mb-12 sm:mb-16">
          <p className={`section-label mb-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            Stack
          </p>
          <h2
            className={`font-black tracking-tighter leading-[0.95] transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)" }}
          >
            Mis <span className="text-sky">herramientas</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16">
          {/* Bars */}
          <div className="flex flex-col gap-8 sm:gap-10">
            {skillGroups.map((group, gi) => (
              <div
                key={group.label}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-40px)",
                  transition: `opacity 0.7s ease ${gi * 150}ms, transform 0.7s ease ${gi * 150}ms`,
                }}
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-5">
                  <span className="w-2 h-2 rounded-full" style={{ background: group.color, boxShadow: `0 0 8px ${group.color}` }} />
                  <span className="font-mono text-xs tracking-widest uppercase" style={{ color: group.color }}>{group.label}</span>
                </div>
                <div className="flex flex-col gap-3 sm:gap-4">
                  {group.skills.map((skill, si) => (
                    <div key={skill.name}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm xl:text-base text-[#F5F3EF] font-medium">{skill.name}</span>
                        <span className="font-mono text-xs text-[#9CA3AF]">{skill.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: visible ? `${skill.pct}%` : "0%",
                            background: `linear-gradient(90deg, ${group.color}, ${group.color}80)`,
                            boxShadow: `0 0 8px ${group.color}60`,
                            transition: `width 1s ease ${gi * 150 + si * 100 + 200}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tools grid + quote */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(40px)", transition: "opacity 0.7s ease 500ms, transform 0.7s ease 500ms" }}>
            <p className="font-mono text-xs tracking-widest uppercase text-[#9CA3AF] mb-5 sm:mb-6">Otras tecnologías & herramientas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {tools.map((tool, i) => (
                <div
                  key={tool}
                  className="glass-card rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:border-sky/30 hover:bg-sky/5 transition-all duration-300 group"
                  style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.9)", transition: `opacity 0.5s ease ${600 + i * 50}ms, transform 0.5s ease ${600 + i * 50}ms` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky/40 group-hover:bg-sky transition-colors duration-300 shrink-0" />
                  <span className="text-[#9CA3AF] text-xs xl:text-sm font-medium group-hover:text-[#F5F3EF] transition-colors duration-300 leading-tight">{tool}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 sm:mt-12" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.7s ease 700ms, transform 0.7s ease 700ms" }}>
              <div className="glass-card rounded-2xl p-6 sm:p-8 xl:p-10 relative overflow-hidden">
                <span aria-hidden="true" className="absolute -right-4 -bottom-4 text-[100px] xl:text-[140px] font-black text-white/[0.03] leading-none select-none pointer-events-none">&lt;/&gt;</span>
                <p className="section-label mb-3">filosofía</p>
                <blockquote className="text-lg sm:text-xl xl:text-2xl font-bold leading-snug tracking-tight">
                  "El código es poesía<br /><span className="text-sky">cuando está bien escrito.</span>"
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
