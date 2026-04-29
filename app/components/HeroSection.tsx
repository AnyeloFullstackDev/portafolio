"use client";

const TAGS = ["Next.js", "ExpressJs", "React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind", "Docker", "Git"];

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden noise">
      <canvas className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] xl:w-[800px] xl:h-[800px] rounded-full bg-sky/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] xl:w-[500px] xl:h-[500px] rounded-full bg-sky/5 blur-[100px] pointer-events-none" />

      <div className="hidden lg:flex absolute right-[20%] top-[15%] w-64 h-64 sm:w-80 sm:h-80 xl:w-96 xl:h-96 items-center justify-center border border-white/20 rounded-full overflow-hidden glass-card z-20">
        <img 
          src="/fotoPerfil.png" 
          alt="Anyelo" 
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
        />
      </div>


      {/* Decorative background text */}
      <span
        aria-hidden="true"
        className="absolute -left-8 top-1/2 -translate-y-1/2 text-[22vw] font-black text-white/[0.02] leading-none select-none pointer-events-none tracking-tighter uppercase"
      >
        DEV
      </span>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 pt-28 pb-20">
        <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl">
          {/* Mobile Profile Image (only visible on mobile) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center border border-white/20 rounded-full overflow-hidden glass-card">
              <img 
                src="/fotoPerfil.png"
                alt="Anyelo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Label */}
          <p className="section-label mb-6 sm:mb-8 animate-fade-up">
            Fullstack Developer
          </p>


          {/* Headline — scales with viewport */}
          <h1 className="font-black leading-[0.9] tracking-tighter mb-6 sm:mb-8 animate-fade-up delay-100"
            style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}>
            Hola,{" "}
            <span className="block">
              soy{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-sky">Anyelo</span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-sky/15 -skew-x-6 blur-sm" />
              </span>
            </span>
          </h1>

          {/* Sub */}
          <p className="text-[#9CA3AF] text-base sm:text-lg xl:text-xl leading-relaxed max-w-lg xl:max-w-xl mb-8 sm:mb-10 animate-fade-up delay-200">
            Desarrollo productos digitales de extremo a extremo, combinando la precisión del backend con una ejecución frontal impecable. {" "}
          </p>

          {/* CTAs */}
          <div className="flex flex-col xs:flex-row flex-wrap gap-3 sm:gap-4 mb-10 sm:mb-14 animate-fade-up delay-300">
            <a
              href="#projects"
              className="group flex items-center justify-center gap-3 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-sky text-[#0D0F1A] font-bold text-sm tracking-wide hover:bg-sky-bright transition-all duration-300 hover:shadow-[0_0_30px_rgba(14,165,233,0.4)]"
            >
              Ver proyectos
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#contact"
              className="flex items-center justify-center gap-3 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border border-white/10 text-[#F5F3EF] font-medium text-sm tracking-wide hover:border-sky/40 hover:bg-white/5 transition-all duration-300"
            >
              Contactar
            </a>
          </div>

          {/* Tech tags */}
          <div className="flex flex-wrap gap-2 animate-fade-up delay-400">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-md bg-white/5 border border-white/8 text-[#9CA3AF] font-mono text-xs hover:border-sky/30 hover:text-sky transition-all duration-300 cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-up delay-700">
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#9CA3AF] uppercase">Scroll</span>
        <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-[#9CA3AF] to-transparent" />
      </div>
    </section>
  );
}
