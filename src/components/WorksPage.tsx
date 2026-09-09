import { useState, useEffect, useRef, type TouchEvent, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
  Film, 
  ExternalLink, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Sparkles, 
  Search, 
  Maximize2,
  Share2,
  Check
} from 'lucide-react';
import { ProjectCategory, ProjectItem } from '../types';
import ProjectFullscreenModal from './ProjectFullscreenModal';
import { shareProjectCard } from '../utils/share';

interface CardSwipeCarouselProps {
  images: string[];
  title: string;
  isWebCategory: boolean;
  onOpenCard: () => void;
}

function CardSwipeCarousel({ images, title, isWebCategory, onOpenCard }: CardSwipeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const didSwipeRef = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didSwipeRef.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      didSwipeRef.current = true;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) && images.length > 1) {
      didSwipeRef.current = true;
      if (deltaX < 0) {
        // Swipe Left -> Next
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else {
        // Swipe Right -> Prev
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;

    setTimeout(() => {
      didSwipeRef.current = false;
    }, 150);
  };

  const handleContainerClick = (e: MouseEvent) => {
    if (didSwipeRef.current) {
      e.stopPropagation();
      return;
    }
    onOpenCard();
  };

  if (!images || images.length === 0) {
    return (
      <div 
        onClick={onOpenCard}
        className="relative aspect-[16/10] sm:aspect-video w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 rounded-t-2xl overflow-hidden cursor-pointer"
      >
        {isWebCategory ? <Code2 className="w-8 h-8 mb-1.5 text-slate-300" /> : <Film className="w-8 h-8 mb-1.5 text-slate-300" />}
        <span className="text-[11px] font-medium">No Image Provided</span>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[16/10] sm:aspect-video w-full bg-slate-900/5 overflow-hidden rounded-t-2xl select-none group/media cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleContainerClick}
    >
      {/* Horizontal Sliding Track for Swipe */}
      <div
        className="flex h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="min-w-full h-full relative overflow-hidden bg-slate-100 shrink-0">
            <img
              src={img}
              alt={`${title} - frame ${idx + 1}`}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 pointer-events-none"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Swipe and Navigation Controls if multiple images */}
      {images.length > 1 && (
        <>
          {/* Desktop Hover Arrows */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md opacity-0 group-hover/media:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % images.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md opacity-0 group-hover/media:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator & Swipe Hint */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md z-10 pointer-events-none">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-3.5 bg-sky-400' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
            <span className="text-[9px] text-white/70 font-semibold pl-1 sm:hidden">Swipe</span>
          </div>
        </>
      )}
    </div>
  );
}

interface WorksPageProps {
  projects: ProjectItem[];
}

export default function WorksPage({ projects }: WorksPageProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | ProjectCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFullscreenProject, setSelectedFullscreenProject] = useState<ProjectItem | null>(null);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Check URL query parameters for direct shared project links (?project=... or ?work=...)
  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const targetProjectId = params.get('project') || params.get('work') || params.get('p');

    if (targetProjectId) {
      // Find matching project by ID (case-insensitive or exact match)
      const matched = projects.find(
        (p) => p.id === targetProjectId || p.id.toLowerCase() === targetProjectId.toLowerCase()
      );
      if (matched) {
        setSelectedFullscreenProject(matched);
        if (activeCategory !== 'all' && matched.category !== activeCategory) {
          setActiveCategory('all');
        }
      }
    }
  }, [projects]);

  // Handle browser back/forward history for modals
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('project') || params.get('work') || params.get('p');
      if (targetId && projects.length > 0) {
        const found = projects.find(
          (p) => p.id === targetId || p.id.toLowerCase() === targetId.toLowerCase()
        );
        setSelectedFullscreenProject(found || null);
      } else {
        setSelectedFullscreenProject(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [projects]);

  // Quick card share handler
  const handleQuickShare = async (project: ProjectItem, e: MouseEvent) => {
    e.stopPropagation();
    const result = await shareProjectCard(project);
    setCopiedCardId(project.id);
    if (result.method === 'clipboard') {
      setToastNotification(`Link copied for "${project.title}"! Anyone opening this link lands on this card.`);
    } else if (result.success) {
      setToastNotification(`Opening share options for "${project.title}"...`);
    }
    setTimeout(() => setCopiedCardId(null), 2500);
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Filter projects by category and search
  const filteredProjects = projects.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const webCount = projects.filter((p) => p.category === 'web').length;
  const editCount = projects.filter((p) => p.category === 'edit').length;

  return (
    <div id="works-page-root" className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-900">
      {/* Header section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-700 mb-3"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Curated Portfolio</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight mb-3"
        >
          Featured Works & Projects
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 text-xs sm:text-sm leading-relaxed"
        >
          Explore interactive web applications and cinematic video edits. Filter by specialty below.
        </motion.p>
      </div>

      {/* Filter and Search Bar with Compact, Refined Sizing */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8 pb-5 border-b border-slate-200/90">
        {/* 2 Main Categories: Web & Edit (Compact tabs) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-slate-200 shadow-xs w-full sm:w-auto overflow-x-auto">
          <button
            id="tab-filter-all"
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Works ({projects.length})
          </button>

          <button
            id="tab-filter-web"
            onClick={() => setActiveCategory('web')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeCategory === 'web'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Web Projects ({webCount})</span>
          </button>

          <button
            id="tab-filter-edit"
            onClick={() => setActiveCategory('edit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeCategory === 'edit'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video Edits ({editCount})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="w-full sm:w-72">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="input-search-works"
              type="text"
              placeholder="Search projects or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 shadow-xs transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 px-6 rounded-2xl bg-white border border-dashed border-slate-200 max-w-md mx-auto shadow-xs"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-500 mb-3">
            <Layers className="w-6 h-6 text-sky-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1 font-heading">
            {searchQuery ? 'No Matching Projects' : 'No Projects Published Yet'}
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {searchQuery
              ? 'Try adjusting your search query or clear the filter.'
              : 'This portfolio is in real-time mode. As soon as projects are uploaded in the private Admin portal, they will appear here instantly.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredProjects.map((project, index) => {
            const isWebCategory = project.category === 'web';
            const images = project.images && project.images.length > 0 ? project.images : [];

            return (
              <motion.article
                key={project.id}
                id={`project-card-${project.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 select-none"
              >
                {/* Media Header with Swipe Carousel & Uniform Radius */}
                <div className="relative w-full overflow-hidden rounded-t-2xl select-none border-b border-slate-100">
                  <CardSwipeCarousel
                    images={images}
                    title={project.title}
                    isWebCategory={isWebCategory}
                    onOpenCard={() => setSelectedFullscreenProject(project)}
                  />

                  {/* Category Pill Tag */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                        isWebCategory
                          ? 'bg-sky-600 text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {isWebCategory ? <Code2 className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                      <span>{isWebCategory ? 'Web' : 'Edit'}</span>
                    </span>
                  </div>

                  {/* Top Right Badges: Featured + Share + Fullscreen Indicator */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                    {project.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs pointer-events-none">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Featured</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleQuickShare(project, e)}
                      className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md transition-all shadow-xs cursor-pointer"
                      title="Share card direct link"
                    >
                      {copiedCardId === project.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3 h-3" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFullscreenProject(project)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-semibold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                      <span>Fullscreen</span>
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div 
                  className="p-4 flex flex-col flex-1 cursor-pointer"
                  onClick={() => setSelectedFullscreenProject(project)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-base font-bold text-slate-900 font-heading group-hover:text-sky-600 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 mb-3 line-clamp-3 leading-relaxed flex-1">
                    {project.description}
                  </p>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Actions: Link button (Clean, without admin studio) */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Share Card Button */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickShare(project, e)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 border border-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copy direct share link for this card"
                      >
                        {copiedCardId === project.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3 h-3" />
                            <span className="text-[10px]">Share</span>
                          </>
                        )}
                      </button>

                      {project.link && project.link !== '#' ? (
                        <motion.a
                          id={`btn-visit-project-${project.id}`}
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs ${
                            isWebCategory
                              ? 'bg-sky-600 hover:bg-sky-500'
                              : 'bg-purple-600 hover:bg-purple-500'
                          }`}
                        >
                          <span>{isWebCategory ? 'Visit Web' : 'Watch Edit'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </motion.a>
                      ) : (
                        <span className="text-[11px] text-sky-600 font-semibold flex items-center gap-1">
                          <span>View Details</span>
                          <Maximize2 className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Floating Toast Notification for Link Copying */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-3 text-xs max-w-md w-[90vw] sm:w-auto"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <span className="font-medium text-slate-200 leading-snug flex-1">{toastNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Project Showcase Modal (Triggered by tapping any card) */}
      <ProjectFullscreenModal
        project={selectedFullscreenProject}
        projects={filteredProjects.length > 0 ? filteredProjects : projects}
        onClose={() => setSelectedFullscreenProject(null)}
        onSelectProject={(proj) => setSelectedFullscreenProject(proj)}
      />

      {/* Lightbox / Fullscreen Image Preview */}
      <AnimatePresence>
        {previewImage && (
          <div
            id="lightbox-backdrop"
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="Full preview"
                className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
              />
              <button
                id="btn-close-lightbox"
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-semibold border border-white/20 hover:bg-black"
              >
                Close (ESC)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
