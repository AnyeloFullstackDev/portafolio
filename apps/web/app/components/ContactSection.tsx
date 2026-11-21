"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import type {
  ContactLinkContent,
  SectionContent,
  SectionCtaContent,
  SiteSettingsContent,
} from "@portfolio/db";

interface ContactSectionProps {
  section?: SectionContent | null;
  ctas?: SectionCtaContent[];
  socials?: ContactLinkContent[];
  siteSettings?: SiteSettingsContent | null;
}

const DEFAULT_SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/AnyeloFullstackDev",
    iconKey: "github",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/anyelofullstackdev2024/",
    iconKey: "linkedin",
  },
  {
    label: "Email",
    href: "mailto:anyelo@1112010@gmail.com",
    iconKey: "email",
  },
];

function getSocialIcon(iconKey: string | null) {
  switch (iconKey?.toLowerCase()) {
    case "github":
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
  }
}

export default function ContactSection({
  section,
  ctas,
  socials,
  siteSettings,
}: ContactSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const sectionLabel = section?.label || "Contacto";
  const sectionHeading = section?.heading || "¿Tienes un proyecto en mente?";
  const sectionSub = section?.description || "Estoy abierto a nuevas oportunidades, proyectos freelance y colaboraciones interesantes. ¡Hablemos!";

  const primaryCta = ctas?.find((c) => c.variant === "primary") || {
    label: "Enviar mensaje",
    href: "https://wa.me/584164214065",
  };
  const secondaryCta = ctas?.find((c) => c.variant === "secondary") || {
    label: "Descargar CV",
    href: "/CurrículumAnyeloFullStackDev.pdf",
  };

  const socialLinks = socials && socials.length > 0
    ? socials.filter((s) => s.variant === "icon")
    : DEFAULT_SOCIALS;

  const footerName = siteSettings?.footerName || "Anyelo";
  const footerSuffix = siteSettings?.footerSuffix || "Hecho con Next.js & Tailwind";
  const footerAvailability = siteSettings?.footerAvailabilityLabel || "Disponible para proyectos";

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
      honeypot: formData.get("website"), // anti-spam
    };

    setFormStatus("submitting");
    setErrorMessage("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setFormStatus("error");
          setErrorMessage(data.error || "Error al enviar mensaje");
        } else {
          setFormStatus("success");
        }
      } catch {
        setFormStatus("error");
        setErrorMessage("Error de conexión al enviar el mensaje.");
      }
    });
  };

  return (
    <section ref={ref} className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky/20 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] xl:w-[900px] h-[350px] xl:h-[500px] rounded-full bg-sky/5 blur-[140px]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 text-center">
        <p id="contact" className={`section-label justify-center mb-6 sm:mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {sectionLabel}
        </p>

        <h2
          className={`font-black tracking-tighter leading-[0.9] mb-6 sm:mb-8 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ fontSize: "clamp(2.8rem, 9vw, 7rem)" }}
        >
          {sectionHeading.includes("proyecto") ? (
            <>
              ¿Tienes un{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-sky">proyecto</span>
                <span className="absolute inset-0 bg-sky/10 blur-xl -z-0 rounded-full" />
              </span>
              <br />en mente?
            </>
          ) : (
            sectionHeading
          )}
        </h2>

        <p className={`text-[#9CA3AF] text-base sm:text-lg xl:text-xl max-w-lg xl:max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {sectionSub}
        </p>

        {/* CTAs */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <a
            href={primaryCta.href} 
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full sm:w-auto flex items-center justify-center gap-3 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-sky text-[#0D0F1A] font-bold text-sm tracking-wide hover:bg-sky-bright transition-all duration-300 hover:shadow-[0_0_50px_rgba(14,165,233,0.5)] hover:scale-105"
          >
            {primaryCta.label}
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>

          <a
            href={secondaryCta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full border border-white/10 text-[#F5F3EF] font-medium text-sm tracking-wide hover:border-white/30 hover:bg-white/5 transition-all duration-300"
          >
            {secondaryCta.label}
          </a>

          <button
            type="button"
            onClick={() => setFormOpen(!formOpen)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-full border border-sky/30 text-sky font-medium text-sm tracking-wide hover:bg-sky/10 transition-all duration-300"
          >
            {formOpen ? "Cerrar formulario" : "Enviar mensaje directo"}
          </button>
        </div>

        {/* Modal / Inline form for contact */}
        {formOpen && (
          <div className="max-w-md mx-auto mb-16 p-6 rounded-2xl glass-card text-left transition-all duration-500">
            <h3 className="text-xl font-bold mb-4 text-[#F5F3EF]">Enviar mensaje</h3>
            {formStatus === "success" ? (
              <div className="p-4 rounded-xl bg-sky/10 border border-sky/30 text-sky text-sm">
                ¡Gracias por tu mensaje! Me pondré en contacto contigo pronto.
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
                <div>
                  <label className="block text-xs font-mono uppercase text-[#9CA3AF] mb-1">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F5F3EF] focus:outline-none focus:border-sky/50 text-sm"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#9CA3AF] mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F5F3EF] focus:outline-none focus:border-sky/50 text-sm"
                    placeholder="tu@correo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[#9CA3AF] mb-1">Mensaje</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F5F3EF] focus:outline-none focus:border-sky/50 text-sm"
                    placeholder="Cuéntame sobre tu proyecto..."
                  />
                </div>

                {formStatus === "error" && (
                  <p className="text-xs text-red-400">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={formStatus === "submitting"}
                  className="w-full py-3 rounded-xl bg-sky text-[#0D0F1A] font-bold text-sm tracking-wide hover:bg-sky-bright transition-all disabled:opacity-50"
                >
                  {formStatus === "submitting" ? "Enviando..." : "Enviar"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Socials */}
        <div className={`flex items-center justify-center gap-3 sm:gap-4 transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="w-11 h-11 sm:w-12 sm:h-12 xl:w-14 xl:h-14 rounded-full glass-card flex items-center justify-center text-[#9CA3AF] hover:text-sky hover:border-sky/30 transition-all duration-300 hover:scale-110"
            >
              {getSocialIcon(s.iconKey)}
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 mt-20 sm:mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <span className="font-mono text-xs text-[#9CA3AF] tracking-wide text-center sm:text-left">
          © {new Date().getFullYear()} {footerName} — {footerSuffix}
        </span>
        <span className="flex items-center gap-2 font-mono text-xs text-[#9CA3AF]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
          {footerAvailability}
        </span>
      </div>
    </section>
  );
}
