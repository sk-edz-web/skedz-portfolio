import React, { useState, useEffect, useRef } from "react";
import { ProjectCard } from "../types";
import {
  ExternalLink,
  Tag,
  ArrowUpRight,
  X,
  Calendar,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Download,
  Smartphone,
  Layers,
  MousePointer,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

interface CardGridProps {
  cards: ProjectCard[];
  onOpenCardFullPage?: (card: ProjectCard) => void;
  activeFilter?: string;
  searchQuery?: string;
  showFilterBar?: boolean;
}

export function isAppCard(card: ProjectCard): boolean {
  if (card.isApp) return true;
  if (card.linkType === "app" || card.linkType === "download") return true;
  if (card.downloadUrl && card.downloadUrl.trim().length > 0) return true;
  if (card.category?.toLowerCase() === "app") return true;
  if (
    card.tags &&
    card.tags.some((t) =>
      /^(app|apk|application|download|installer|android|ios)$/i.test(t.trim())
    )
  )
    return true;
  if (
    card.linkUrl &&
    /\.(apk|exe|dmg|ipa|zip)$/i.test(card.linkUrl.split("?")[0])
  )
    return true;
  return false;
}

export default function CardGrid({
  cards,
  onOpenCardFullPage,
  activeFilter = "all",
  searchQuery = "",
  showFilterBar = false,
}: CardGridProps) {
  const [filter, setFilter] = useState<string>(activeFilter);
  const [selectedCard, setSelectedCard] = useState<ProjectCard | null>(null);
  const [activeModalImgIndex, setActiveModalImgIndex] = useState<number>(0);

  // Wheel & touch swipe refs for smooth image scrolling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Sync activeFilter prop
  useEffect(() => {
    if (activeFilter) {
      setFilter(activeFilter);
    }
  }, [activeFilter]);

  // Reset modal image index when selectedCard changes
  useEffect(() => {
    setActiveModalImgIndex(0);
  }, [selectedCard?.id]);

  // Fullscreen Lightbox state
  const [lightbox, setLightbox] = useState<{
    images: string[];
    currentIndex: number;
    title: string;
  } | null>(null);

  const categories = [
    { id: "all", label: "All Works" },
    { id: "editing", label: "Video Editing" },
    { id: "web", label: "Web Development" },
    { id: "series", label: "Series" },
  ];

  const filteredCards = cards.filter((card) => {
    const matchesCategory =
      !filter || filter === "all"
        ? true
        : filter === "featured"
        ? !!card.featured
        : card.category?.toLowerCase() === filter.toLowerCase();

    if (!matchesCategory) return false;

    if (!searchQuery || !searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const matchTitle = card.title?.toLowerCase().includes(query);
    const matchSub = card.subtitle?.toLowerCase().includes(query);
    const matchDesc = card.description?.toLowerCase().includes(query);
    const matchCat = card.category?.toLowerCase().includes(query);
    const matchTags = card.tags?.some((t) => t.toLowerCase().includes(query));

    return matchTitle || matchSub || matchDesc || matchCat || matchTags;
  });

  // Card Navigation in Modal
  const currentCardIdx = selectedCard
    ? filteredCards.findIndex((c) => c.id === selectedCard.id)
    : -1;

  const goToNextCard = () => {
    if (filteredCards.length <= 1 || currentCardIdx === -1) return;
    const nextIdx = (currentCardIdx + 1) % filteredCards.length;
    setSelectedCard(filteredCards[nextIdx]);
    setActiveModalImgIndex(0);
  };

  const goToPrevCard = () => {
    if (filteredCards.length <= 1 || currentCardIdx === -1) return;
    const prevIdx =
      (currentCardIdx - 1 + filteredCards.length) % filteredCards.length;
    setSelectedCard(filteredCards[prevIdx]);
    setActiveModalImgIndex(0);
  };

  // Next / Prev Image in Current Card (loops within current project)
  const goToNextImage = () => {
    if (!selectedCard) return;
    const detailImages =
      selectedCard.images && selectedCard.images.length > 0
        ? selectedCard.images
        : [selectedCard.thumbnail];
    if (detailImages.length <= 1) return;
    setActiveModalImgIndex((prev) => (prev + 1) % detailImages.length);
  };

  const goToPrevImage = () => {
    if (!selectedCard) return;
    const detailImages =
      selectedCard.images && selectedCard.images.length > 0
        ? selectedCard.images
        : [selectedCard.thumbnail];
    if (detailImages.length <= 1) return;
    setActiveModalImgIndex(
      (prev) => (prev - 1 + detailImages.length) % detailImages.length
    );
  };

  // Touch Swipe Handlers for Mobile (horizontal swipe only, never blocking vertical scroll)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    // Only handle horizontal dominant swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        goToNextImage();
      } else {
        goToPrevImage();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox) {
          setLightbox(null);
        } else if (selectedCard) {
          setSelectedCard(null);
        }
      }

      // Lightbox navigation
      if (lightbox && lightbox.images.length > 1) {
        if (e.key === "ArrowRight") {
          setLightbox((prev) =>
            prev
              ? {
                  ...prev,
                  currentIndex: (prev.currentIndex + 1) % prev.images.length,
                }
              : null
          );
        } else if (e.key === "ArrowLeft") {
          setLightbox((prev) =>
            prev
              ? {
                  ...prev,
                  currentIndex:
                    (prev.currentIndex - 1 + prev.images.length) %
                    prev.images.length,
                }
              : null
          );
        }
      } else if (selectedCard) {
        // Card modal keyboard navigation
        if (e.key === "ArrowRight") {
          goToNextImage();
        } else if (e.key === "ArrowLeft") {
          goToPrevImage();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox, selectedCard, activeModalImgIndex, currentCardIdx]);

  const openFullscreenImage = (
    images: string[],
    index: number,
    title: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }
    setLightbox({
      images:
        images.length > 0
          ? images
          : [
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
            ],
      currentIndex: index >= 0 && index < images.length ? index : 0,
      title,
    });
  };

  const handleLaunchCard = (card: ProjectCard, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const isApp = isAppCard(card);
    const targetUrl = card.downloadUrl || card.linkUrl;

    if (isApp) {
      if (targetUrl && targetUrl !== "#") {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (onOpenCardFullPage) {
      onOpenCardFullPage(card);
    } else if (targetUrl && targetUrl !== "#") {
      if (targetUrl.startsWith("/")) {
        window.location.href = targetUrl;
      } else {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <div className="w-full">
      {/* Optional Filter Pills */}
      {showFilterBar && cards.length > 0 && (
        <ScrollReveal
          direction="up"
          delay={0.05}
          className="flex flex-wrap items-center justify-between gap-3 mb-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`filter-tab-${cat.id}`}
                onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                  filter === cat.id
                    ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                    : "bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing <span className="text-purple-300 font-bold">{filteredCards.length}</span> Project(s)
          </div>
        </ScrollReveal>
      )}

      {/* Grid Layout */}
      {cards.length === 0 ? (
        <div className="p-12 sm:p-16 text-center rounded-2xl bg-[#090d1a]/80 border border-purple-500/20 backdrop-blur-xl max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Layers className="w-7 h-7 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Projects Published Yet</h3>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 font-light">
            Real-time synchronization is active. Upload or deploy your video editing works, web architectures, or sub-sites directly via the administrative portal.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for Real-Time Content</span>
          </div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 max-w-md mx-auto">
          <Layers className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-200 text-sm font-semibold mb-1">No matching projects found</p>
          <p className="text-slate-400 text-xs font-light">
            Try adjusting your search query or selecting a different category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCards.map((card, cIdx) => {
            const cardImages =
              card.images && card.images.length > 0
                ? card.images
                : [card.thumbnail];
            const isInternal =
              card.linkType === "internal" ||
              (card.linkUrl && card.linkUrl.startsWith("/"));
            const isApp = isAppCard(card);

            return (
              <ScrollReveal
                key={card.id}
                direction="up"
                delay={Math.min(0.05 * cIdx, 0.25)}
                distance={20}
                className="h-full"
              >
                {/* Clicking anywhere on the card opens the Full-Screen Card Modal */}
                <div
                  id={`project-card-${card.id}`}
                  onClick={() => setSelectedCard(card)}
                  className="group relative h-full rounded-2xl bg-[#090d1a]/90 border border-purple-500/20 hover:border-purple-400/50 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(147,51,234,0.25)] cursor-pointer flex flex-col"
                >
                  {/* Image Section */}
                  <div className="relative w-full aspect-video min-h-[200px] max-h-[260px] bg-[#050811] overflow-hidden flex items-center justify-center">
                    <img
                      src={card.thumbnail || cardImages[0]}
                      alt={card.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d1a] via-transparent to-black/30 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[10px] font-mono tracking-wider font-semibold uppercase bg-black/75 backdrop-blur-md border border-white/10 text-purple-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {card.category}
                      </span>

                      {isApp ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl text-[10px] font-mono font-medium bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-200">
                          <Smartphone className="w-2.5 h-2.5 text-emerald-300" />
                          App
                        </span>
                      ) : isInternal ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl text-[10px] font-mono font-medium bg-indigo-950/80 backdrop-blur-md border border-indigo-500/30 text-indigo-200">
                          <Globe className="w-2.5 h-2.5 text-cyan-300" />
                          Connected Site
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl text-[10px] font-mono font-medium bg-black/60 backdrop-blur-md border border-white/10 text-slate-300">
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          External Web
                        </span>
                      )}
                    </div>

                    {/* Dedicated Zoom Icon Button */}
                    <button
                      onClick={(e) =>
                        openFullscreenImage(cardImages, 0, card.title, e)
                      }
                      title="View Fullscreen Image"
                      className="absolute top-3 right-3 p-2 rounded-2xl bg-black/70 hover:bg-purple-600 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Multiple Images Indicator: Clean Dots */}
                    {cardImages.length > 1 && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 flex items-center gap-1.5 pointer-events-none">
                        {cardImages.map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`rounded-full transition-all ${
                              dotIdx === 0
                                ? "w-4 h-1.5 bg-purple-400"
                                : "w-1.5 h-1.5 bg-white/40"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Details Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-1 mb-1">
                        {card.title}
                      </h3>
                      <p className="text-xs text-purple-300/90 font-medium mb-3 line-clamp-1">
                        {card.subtitle}
                      </p>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4 font-light">
                        {card.description}
                      </p>
                    </div>

                    {/* Tags & Action Buttons */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {card.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-white/[0.04] text-[10px] text-slate-300 font-mono"
                          >
                            <Tag className="w-2.5 h-2.5 text-cyan-400" />
                            {tag}
                          </span>
                        ))}
                        {card.tags.length > 2 && (
                          <span className="text-[10px] text-slate-500 font-mono self-center">
                            +{card.tags.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => handleLaunchCard(card, e)}
                        className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
                          isApp
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                            : "bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30"
                        }`}
                      >
                        {isApp ? (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Install</span>
                          </>
                        ) : (
                          <>
                            <span>Open</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRUE FULL-SCREEN CARD EXPERIENCE (Edge-to-Edge, Locked Image Radius Frame) */}
      {/* ========================================================================= */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 w-screen h-screen bg-[#060812] text-white flex flex-col overflow-hidden animate-in fade-in select-none"
        >
          {/* Top Full-Width Navigation Bar */}
          <header className="w-full h-16 px-4 sm:px-8 bg-[#090d1a]/95 border-b border-white/10 flex items-center justify-between shrink-0 z-30 backdrop-blur-xl">
            {/* Left: Back / Category */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCard(null)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-purple-600/30 hover:border-purple-500/50 border border-white/10 text-slate-200 hover:text-white text-xs font-mono transition cursor-pointer"
                title="Back to Showcase (Esc)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Works</span>
              </button>

              <div className="h-4 w-px bg-white/10 hidden sm:block" />

              <span className="px-3 py-1 rounded-xl text-xs font-mono font-semibold uppercase bg-purple-600/30 text-purple-200 border border-purple-500/30">
                {selectedCard.category}
              </span>

              {isAppCard(selectedCard) && (
                <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  App
                </span>
              )}
            </div>

            {/* Center: Card Counter & Project Title (Hidden on small screens) */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 truncate max-w-md">
              <span className="text-white font-bold truncate">
                {selectedCard.title}
              </span>
              {filteredCards.length > 1 && (
                <span className="text-purple-300 shrink-0">
                  ({currentCardIdx + 1} / {filteredCards.length})
                </span>
              )}
            </div>

            {/* Right: Previous / Next Card + Close Button */}
            <div className="flex items-center gap-2">
              {filteredCards.length > 1 && (
                <div className="flex items-center gap-1 mr-1">
                  <button
                    onClick={goToPrevCard}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/5"
                    title="Previous Card"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNextCard}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/5"
                    title="Next Card"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedCard(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer border border-white/15"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Main Full-Screen Body - Freely Scrollable, Zero Locks */}
          <main className="flex-1 w-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 flex justify-center">
            <div className="w-full max-w-6xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {(() => {
                const detailImages =
                  selectedCard.images && selectedCard.images.length > 0
                    ? selectedCard.images
                    : [selectedCard.thumbnail];
                const activeImg =
                  detailImages[activeModalImgIndex] || detailImages[0];
                const isApp = isAppCard(selectedCard);

                return (
                  <>
                    {/* LEFT COLUMN: Free & Beautiful Media Stage */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                      {/* Image Frame with Smooth Rounded Radius & Click to Zoom */}
                      <div
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onClick={() =>
                          openFullscreenImage(
                            detailImages,
                            activeModalImgIndex,
                            selectedCard.title
                          )
                        }
                        className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[64vh] rounded-3xl overflow-hidden border border-purple-500/25 bg-[#050811] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center cursor-pointer group select-none transition-all"
                        title="Click image to view in full screen"
                      >
                        {/* Soft Ambient Glow from active image */}
                        <div
                          style={{ backgroundImage: `url(${activeImg})` }}
                          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-125 pointer-events-none transition-all duration-700"
                        />

                        {/* Foreground Image: Adapts freely to any aspect ratio */}
                        <img
                          key={activeImg}
                          src={activeImg}
                          alt={selectedCard.title}
                          referrerPolicy="no-referrer"
                          className="relative z-10 max-w-full max-h-full object-contain p-3 sm:p-6 select-none transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-2xl"
                        />

                        {/* Floating Click-to-Zoom Indicator */}
                        <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/80 hover:bg-purple-600 text-white backdrop-blur-md border border-white/20 text-xs font-mono flex items-center gap-2 shadow-lg transition pointer-events-none group-hover:border-purple-400">
                          <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Zoom Full Screen</span>
                        </div>

                        {/* Navigation Arrows on Left / Right (Clicking arrows won't zoom) */}
                        {detailImages.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                goToPrevImage();
                              }}
                              className="absolute left-3.5 z-20 p-3 rounded-full bg-black/80 hover:bg-purple-600 text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-xl hover:scale-110 active:scale-95"
                              title="Previous Image"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                goToNextImage();
                              }}
                              className="absolute right-3.5 z-20 p-3 rounded-full bg-black/80 hover:bg-purple-600 text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-xl hover:scale-110 active:scale-95"
                              title="Next Image"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Interactive Thumbnail Gallery Strip for Projects with multiple images */}
                      {detailImages.length > 1 && (
                        <div className="flex items-center gap-3 overflow-x-auto py-1 px-1 no-scrollbar">
                          {detailImages.map((imgUrl, thumbIdx) => (
                            <button
                              key={thumbIdx}
                              onClick={() => setActiveModalImgIndex(thumbIdx)}
                              className={`relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-[#050811] ${
                                activeModalImgIndex === thumbIdx
                                  ? "border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105"
                                  : "border-white/15 opacity-60 hover:opacity-100 hover:border-white/40"
                              }`}
                              title={`Image ${thumbIdx + 1}`}
                            >
                              <img
                                src={imgUrl}
                                alt={`Thumbnail ${thumbIdx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: Project Story, Details & Launch */}
                    <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-[#090d1a]/90 border border-purple-500/20 backdrop-blur-xl shadow-2xl">
                      <div className="space-y-6">
                        {/* Title & Subtitle */}
                        <div>
                          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-2">
                            {selectedCard.title}
                          </h1>
                          <p className="text-sm sm:text-base font-semibold text-purple-300 font-mono">
                            {selectedCard.subtitle}
                          </p>
                        </div>

                        {/* Story / Description */}
                        <div>
                          <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2.5">
                            About This Project
                          </h3>
                          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-light">
                            {selectedCard.description}
                          </p>
                        </div>

                        {/* Tech Stack / Tags */}
                        {selectedCard.tags && selectedCard.tags.length > 0 && (
                          <div>
                            <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2.5">
                              Tags & Technologies
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedCard.tags.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono text-purple-200"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-8 pt-5 border-t border-white/10 space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            <span>
                              {isApp
                                ? "Direct Installable Package"
                                : selectedCard.linkType === "internal" ||
                                  selectedCard.linkUrl?.startsWith("/")
                                ? "Hosted on SKEDZ Sub-Route"
                                : "Verified Showcase"}
                            </span>
                          </div>

                          {selectedCard.fileSize && (
                            <span className="text-emerald-400 font-bold px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/20">
                              {selectedCard.fileSize}
                            </span>
                          )}
                        </div>

                        {/* Dynamic Launch / Install Button */}
                        <button
                          onClick={() => handleLaunchCard(selectedCard)}
                          className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                            isApp
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30 hover:scale-[1.01]"
                              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40 hover:scale-[1.01]"
                          }`}
                        >
                          {isApp ? (
                            <>
                              <Download className="w-4 h-4" />
                              <span>Install App</span>
                            </>
                          ) : (
                            <>
                              <span>Open Full Page Site</span>
                              <ArrowUpRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-SCREEN IMAGE LIGHTBOX (Wheel scrollable & swipeable, Fixed X button) */}
      {/* ========================================================================= */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/96 backdrop-blur-2xl p-2 sm:p-6 animate-in fade-in select-none"
          onClick={() => setLightbox(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => {
            if (touchStartX.current === null || touchStartY.current === null) return;
            const deltaX = touchStartX.current - e.changedTouches[0].clientX;
            const deltaY = touchStartY.current - e.changedTouches[0].clientY;
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40 && lightbox.images.length > 1) {
              if (deltaX > 0) {
                setLightbox((prev) =>
                  prev
                    ? {
                        ...prev,
                        currentIndex: (prev.currentIndex + 1) % prev.images.length,
                      }
                    : null
                );
              } else {
                setLightbox((prev) =>
                  prev
                    ? {
                        ...prev,
                        currentIndex:
                          (prev.currentIndex - 1 + prev.images.length) %
                          prev.images.length,
                      }
                    : null
                );
              }
            }
            touchStartX.current = null;
            touchStartY.current = null;
          }}
        >
          {/* Fixed close button at top right - never hidden or scrolled under image */}
          <button
            onClick={() => setLightbox(null)}
            className="fixed top-4 sm:top-6 right-4 sm:right-6 z-[99999] p-3 sm:p-3.5 rounded-full bg-black/85 hover:bg-rose-600 text-white border border-white/25 shadow-2xl backdrop-blur-xl cursor-pointer hover:scale-110 active:scale-95 transition-all"
            title="Close image view (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous image button */}
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightbox({
                  ...lightbox,
                  currentIndex:
                    (lightbox.currentIndex - 1 + lightbox.images.length) %
                    lightbox.images.length,
                });
              }}
              className="fixed left-3 sm:left-6 z-[99999] p-3 sm:p-3.5 rounded-full bg-black/80 hover:bg-purple-600 text-white border border-white/20 shadow-2xl backdrop-blur-xl transition cursor-pointer hover:scale-110"
              title="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next image button */}
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightbox({
                  ...lightbox,
                  currentIndex:
                    (lightbox.currentIndex + 1) % lightbox.images.length,
                });
              }}
              className="fixed right-3 sm:right-6 z-[99999] p-3 sm:p-3.5 rounded-full bg-black/80 hover:bg-purple-600 text-white border border-white/20 shadow-2xl backdrop-blur-xl transition cursor-pointer hover:scale-110"
              title="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image Container */}
          <div
            className="relative max-w-[96vw] max-h-[92vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.images[lightbox.currentIndex]}
              alt={`${lightbox.title} full screen`}
              referrerPolicy="no-referrer"
              className="max-w-[94vw] max-h-[84vh] object-contain rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-white/15 select-none transition-all duration-300"
            />

            {/* Bottom Bar: Title + Indicator Dots */}
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-lg px-5 py-2.5 rounded-2xl bg-black/85 border border-white/15 text-xs font-mono text-slate-300 shadow-2xl backdrop-blur-md">
              <span className="font-bold text-white truncate max-w-xs">
                {lightbox.title}
              </span>

              {/* Clean Dots Indicator */}
              {lightbox.images.length > 1 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {lightbox.images.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() =>
                        setLightbox({ ...lightbox, currentIndex: dotIdx })
                      }
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        lightbox.currentIndex === dotIdx
                          ? "w-6 h-2 bg-purple-400 shadow-[0_0_10px_#c084fc]"
                          : "w-2 h-2 bg-white/40 hover:bg-white/70"
                      }`}
                      title={`Slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
