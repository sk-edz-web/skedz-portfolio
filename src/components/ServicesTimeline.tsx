import React from "react";
import { Code2, Video, Layers, ArrowRight, CheckCircle2 } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

interface ServicesTimelineProps {
  onExploreProjects: () => void;
  onContact: () => void;
}

export default function ServicesTimeline({
  onExploreProjects,
  onContact,
}: ServicesTimelineProps) {
  const services = [
    {
      id: "web-dev",
      badge: "2+ Years Exp",
      badgeColor: "text-cyan-300 bg-cyan-950/60 border-cyan-500/30",
      title: "Web Development",
      subtitle: "Modern Web Apps & Architecture",
      icon: <Code2 className="w-5 h-5 text-cyan-400" />,
      description:
        "High-performance, production-ready web apps built with modern React, TypeScript, and Tailwind CSS. Responsive layouts, API integrations, and edge routing.",
      points: [
        "React 18+ & modern component engineering",
        "Responsive, mobile-first clean layouts",
        "Fast edge routing & dynamic sub-sites",
      ],
      tags: ["React", "TypeScript", "Tailwind", "REST APIs", "Edge"],
    },
    {
      id: "video-edit",
      badge: "3+ Years Exp",
      badgeColor: "text-purple-300 bg-purple-950/60 border-purple-500/30",
      title: "Video Editing",
      subtitle: "Cinematic Visual Storytelling",
      icon: <Video className="w-5 h-5 text-purple-400" />,
      description:
        "Specializing in high-retention video editing designed for YouTube, Reels, and commercials. Precision color grading, rhythmic pacing, and immersive sound design.",
      points: [
        "High-retention editing & dynamic pacing",
        "Cinematic LUTs & color grading",
        "Immersive sound design & audio mastering",
      ],
      tags: ["Cinematic", "Sound Design", "Color Grade", "Reels/Shorts"],
    },
    {
      id: "freelance-hybrid",
      badge: "Comprehensive Solutions",
      badgeColor: "text-amber-300 bg-amber-950/60 border-amber-500/30",
      title: "Freelance All-in-One",
      subtitle: "Web + Media for Creators & Brands",
      icon: <Layers className="w-5 h-5 text-amber-400" />,
      description:
        "Bridging cutting-edge web development with high-impact video editing under one roof. Full digital presence execution with direct collaboration and fast turnaround.",
      points: [
        "Unified digital presence: website + video assets",
        "Direct founder-level rapid communication",
        "Strict quality benchmarks & prompt delivery",
      ],
      tags: ["Full-Stack", "Direct Workflow", "Rapid Turnaround", "Global"],
    },
  ];

  return (
    <section className="relative py-6">
      {/* Section Title */}
      <ScrollReveal direction="up" delay={0.05} className="text-center max-w-xl mx-auto mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
          Core Expertise & Services
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm font-light">
          Specialized engineering and creative post-production capabilities crafted with precision.
        </p>
      </ScrollReveal>

      {/* Compact 3-Column Grid (No empty side space) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {services.map((item, idx) => (
          <ScrollReveal
            key={item.id}
            direction="up"
            delay={0.1 * (idx + 1)}
            distance={24}
            className="h-full"
          >
            <div className="h-full p-5 sm:p-6 rounded-2xl bg-[#090d1a]/85 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.4)] backdrop-blur-xl flex flex-col justify-between group">
              <div>
                {/* Card Header: Icon & Badge */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-xl text-[10px] font-mono font-semibold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 leading-snug">
                  {item.title}
                </h3>
                <p className="text-[11px] font-medium text-purple-300 mb-2.5">
                  {item.subtitle}
                </p>

                {/* Description */}
                <p className="text-xs text-slate-300 font-light leading-relaxed mb-3.5">
                  {item.description}
                </p>

                {/* Bullet Points */}
                <ul className="space-y-1.5 mb-4">
                  {item.points.map((pt, pIdx) => (
                    <li
                      key={pIdx}
                      className="flex items-start gap-2 text-[11px] text-slate-300 font-light"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-3 border-t border-white/5">
                {item.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] font-mono text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Bottom Actions */}
      <ScrollReveal
        direction="up"
        delay={0.3}
        className="mt-8 pt-6 border-t border-purple-500/15 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          onClick={onExploreProjects}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>View Completed Projects</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onContact}
          className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 text-xs font-medium transition cursor-pointer"
        >
          <span>Request Custom Consultation</span>
        </button>
      </ScrollReveal>
    </section>
  );
}
