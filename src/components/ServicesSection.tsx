import React, { useState, useMemo } from "react";
import { Film, Globe, Search, X } from "lucide-react";
import CardGrid from "./CardGrid";
import ScrollReveal from "./ScrollReveal";
import { ProjectCard, DynamicSite } from "../types";

interface ServicesSectionProps {
  cards: ProjectCard[];
  sites: DynamicSite[];
  onNavigateToSite: (path: string) => void;
  onContact: () => void;
  onOpenReviews: () => void;
}

export default function ServicesSection({
  cards,
  sites,
  onNavigateToSite,
  onContact,
  onOpenReviews,
}: ServicesSectionProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Base categories matching Admin options, plus any dynamic categories found in cards
  const filterOptions = useMemo(() => {
    const base = [
      { id: "all", label: "All Works" },
      { id: "editing", label: "Video Editing" },
      { id: "web", label: "Web Development" },
      { id: "series", label: "Series" },
    ];

    // Check for custom categories from Admin cards
    const customCats = new Set<string>();
    cards.forEach((c) => {
      const cat = c.category?.toLowerCase();
      if (cat && !["editing", "web", "series", "all"].includes(cat)) {
        customCats.add(cat);
      }
    });

    customCats.forEach((cat) => {
      base.push({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
      });
    });

    return base;
  }, [cards]);

  return (
    <section className="w-full space-y-10">
      {/* Header */}
      <ScrollReveal direction="up" delay={0.05} className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Services & Project Showcase
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-light">
          Browse verified client works, web applications, cinematic video edits, and standalone sub-sites deployed through SKEDZ.
        </p>
      </ScrollReveal>

      {/* SINGLE UNIFIED FILTER & SEARCH BAR (Eliminates the duplicate bar from image.png) */}
      <ScrollReveal
        direction="up"
        delay={0.1}
        className="p-4 rounded-3xl bg-[#090d1a]/90 border border-purple-500/20 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
      >
        {/* Category Pills (Single clean row) */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActiveFilter(opt.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeFilter === opt.id
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/40"
                  : "bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Live Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search works, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-8 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-purple-500 focus:bg-white/[0.07] focus:outline-none transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-400 shrink-0">
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>{cards.length} Total</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Card Grid (showFilterBar is false so NO duplicate second filter row is rendered!) */}
      <div>
        <CardGrid
          cards={cards}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          showFilterBar={false}
        />
      </div>

      {/* Dynamic Sub-Routes Showcase */}
      {sites.length > 0 && (
        <ScrollReveal direction="up" delay={0.1}>
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-950/40 via-[#090d1a] to-cyan-950/20 border border-purple-500/25 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
                  <Globe className="w-4 h-4" />
                  <span>Active Dynamic Sub-Routes</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Direct Slugs & Connected Sites
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm font-light max-w-xl">
                  Standalone HTML sub-sites deployed dynamically on SKEDZ-S.PORTAL under custom URL slugs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => onNavigateToSite(`/${site.slug}`)}
                    className="px-4 py-2 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-mono transition cursor-pointer"
                  >
                    /{site.slug}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Quick Inquire Banner */}
      <ScrollReveal direction="up" delay={0.15}>
        <div className="p-8 rounded-3xl bg-[#090d1a]/80 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Need a Custom Website or Video Edit?
            </h3>
            <p className="text-xs text-slate-400 font-light">
              Direct collaboration with 2+ years web engineering and 3+ years video editing experience.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onContact}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              Contact SKEDZ
            </button>
            <button
              onClick={onOpenReviews}
              className="px-5 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Read Client Reviews
            </button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
