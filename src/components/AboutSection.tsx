import { Terminal, Film, Code, Layers, Mail, MessageCircle, Instagram, ShieldCheck, Video } from "lucide-react";
import SkedzLogo from "./SkedzLogo";
import ScrollReveal from "./ScrollReveal";

export default function AboutSection() {
  const services = [
    {
      title: "Cinematic Video Editing",
      description: "High-impact reels, YouTube productions, commercial color grading, sound design & dynamic pacing.",
      icon: <Film className="w-5 h-5 text-purple-400" />,
    },
    {
      title: "Full-Stack Web Development",
      description: "Modern responsive web applications, interactive cosmic frontends, and resilient Node.js backends.",
      icon: <Code className="w-5 h-5 text-cyan-400" />,
    },
    {
      title: "Dynamic Sub-Site Hosting",
      description: "Direct-to-route edge deployment allowing instant page hosting under personalized URL slugs.",
      icon: <Layers className="w-5 h-5 text-emerald-400" />,
    },
  ];

  return (
    <section className="w-full space-y-12">
      {/* Intro Header */}
      <ScrollReveal direction="up" delay={0.05} className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Visual Storytelling & Next-Gen Code
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-light">
          A creative studio founded by <strong className="text-purple-300 font-medium">SKEDZ (Sarathi)</strong>, 
          bridging high-end cinematic video editing with modern full-stack web engineering.
        </p>
      </ScrollReveal>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creator Bio Card */}
        <ScrollReveal direction="up" delay={0.1} className="lg:col-span-2">
          <div className="h-full p-8 rounded-3xl bg-[#090d1a]/80 border border-purple-500/20 backdrop-blur-xl space-y-6">
            <div className="flex items-center gap-4">
              <SkedzLogo size="md" />
              <div>
                <h3 className="text-xl font-bold text-white">SKEDZ (Sarathi)</h3>
                <p className="text-xs text-purple-300 font-mono">Video Editor & Full-Stack Web Developer</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              SKEDZ is built on two core crafts: <strong>Cinematic Video Editing</strong> and <strong>Modern Web Development</strong>. 
              From producing fast-paced, high-retention video content and aesthetic visuals to architecting scalable web applications 
              with instant dynamic sub-routing and real-time state synchronization, every project is delivered with obsessive attention to craft.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
              {services.map((s, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <h4 className="text-xs font-semibold text-white">{s.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-light">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Quick Contacts Panel */}
        <ScrollReveal direction="up" delay={0.15}>
          <div className="h-full p-8 rounded-3xl bg-[#090d1a]/80 border border-purple-500/20 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Direct Lines
              </h4>
              <div className="space-y-3">
                <a
                  href="mailto:skedz.contact@gmail.com"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-xs text-slate-200 transition"
                >
                  <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate font-mono">skedz.contact@gmail.com</span>
                </a>
                <a
                  href="https://wa.me/919345306572?text=Hello%20SKEDZ%2C%20I%20would%20like%20to%20collaborate%20on%20a%20project"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-emerald-950/20 border border-white/5 hover:border-emerald-500/30 text-xs text-slate-200 transition group"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
                  <span className="font-mono">WhatsApp: +91 9345306572</span>
                </a>
                <a
                  href="https://instagram.com/skedz.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-xs text-slate-200 transition"
                >
                  <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="font-mono">instagram.com/skedz.dev</span>
                </a>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 text-xs text-slate-400 font-mono flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Creator
              </span>
              <span>Real-Time Sync</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
