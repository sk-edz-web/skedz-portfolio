import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Code2, 
  Film, 
  Calendar, 
  Sparkles, 
  Copy, 
  Check, 
  Maximize2,
  Share2,
  MessageCircle,
  Link2
} from 'lucide-react';
import { ProjectItem } from '../types';
import { getCardShareUrl, shareProjectCard, getWhatsAppShareUrl } from '../utils/share';

interface ProjectFullscreenModalProps {
  project: ProjectItem | null;
  projects: ProjectItem[];
  onClose: () => void;
  onSelectProject: (project: ProjectItem) => void;
}

export default function ProjectFullscreenModal({
  project,
  projects,
  onClose,
  onSelectProject
}: ProjectFullscreenModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Reset image index when project changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsZoomed(false);
  }, [project?.id]);

  // Keep URL in sync with the currently viewed project (?project=ID)
  useEffect(() => {
    if (!project) return;
    const url = new URL(window.location.href);
    url.searchParams.set('project', project.id);
    window.history.replaceState(null, '', url.toString());

    return () => {
      // Clean up parameter when closing modal
      const closeUrl = new URL(window.location.href);
      closeUrl.searchParams.delete('project');
      closeUrl.searchParams.delete('work');
      closeUrl.searchParams.delete('p');
      window.history.replaceState(null, '', closeUrl.toString());
    };
  }, [project?.id]);

  // Keyboard navigation (ESC to close, Left/Right for project/image)
  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight') {
        const images = project.images || [];
        if (images.length > 1 && currentImageIndex < images.length - 1) {
          setCurrentImageIndex((prev) => prev + 1);
        } else {
          // Next project
          const currentIndex = projects.findIndex((p) => p.id === project.id);
          if (currentIndex < projects.length - 1) {
            onSelectProject(projects[currentIndex + 1]);
          } else if (projects.length > 0) {
            onSelectProject(projects[0]);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        const images = project.images || [];
        if (images.length > 1 && currentImageIndex > 0) {
          setCurrentImageIndex((prev) => prev - 1);
        } else {
          // Prev project
          const currentIndex = projects.findIndex((p) => p.id === project.id);
          if (currentIndex > 0) {
            onSelectProject(projects[currentIndex - 1]);
          } else if (projects.length > 0) {
            onSelectProject(projects[projects.length - 1]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [project, projects, currentImageIndex, isZoomed, onClose, onSelectProject]);

  if (!project) return null;

  const images = project.images && project.images.length > 0 ? project.images : [];
  const activeImage = images[currentImageIndex] || '';
  const isWebCategory = project.category === 'web';
  const currentIndex = projects.findIndex((p) => p.id === project.id);
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : projects[projects.length - 1];
  const nextProject = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : projects[0];
  const cardShareUrl = getCardShareUrl(project.id);

  const handleCopyLink = async () => {
    await shareProjectCard(project);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div 
        id="fullscreen-project-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="fullscreen-project-container"
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Top Bar / Navigation Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/90 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isWebCategory ? 'bg-sky-600 text-white' : 'bg-purple-600 text-white'
                }`}
              >
                {isWebCategory ? <Code2 className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                <span>{isWebCategory ? 'Web Application' : 'Video Edit'}</span>
              </span>

              {project.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>Featured</span>
                </span>
              )}

              <span className="text-xs text-slate-400 hidden sm:inline-block">
                Project {currentIndex + 1} of {projects.length}
              </span>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {/* Quick prev/next project in header */}
              {projects.length > 1 && (
                <div className="hidden sm:flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
                  <button
                    type="button"
                    onClick={() => prevProject && onSelectProject(prevProject)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                    title={`Previous: ${prevProject?.title}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nextProject && onSelectProject(nextProject)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                    title={`Next: ${nextProject?.title}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Copy share link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                id="btn-close-project-fullscreen"
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Scrollable Modal Body */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
            {/* Cinematic Media Stage with Touch Swipe & Uniform Radius */}
            <div 
              className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 select-none group min-h-[280px] sm:min-h-[440px] max-h-[65vh] flex items-center justify-center"
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0].clientX;
                touchStartYRef.current = e.touches[0].clientY;
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current === null || touchStartYRef.current === null) return;
                const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
                const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
                if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) && images.length > 1) {
                  if (deltaX < 0) {
                    // Swipe Left -> Next
                    setCurrentImageIndex((prev) => (prev + 1) % images.length);
                  } else {
                    // Swipe Right -> Prev
                    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                  }
                }
                touchStartXRef.current = null;
                touchStartYRef.current = null;
              }}
            >
              {images.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
                  {/* Ambient Blurred Background (Ensures uniform presentation regardless of image size/ratio) */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-110 pointer-events-none transition-all duration-500"
                    style={{ backgroundImage: `url(${activeImage})` }}
                  />

                  {/* Main Image with strict rounded-xl border radius and contain fitting */}
                  <img
                    src={activeImage}
                    alt={project.title}
                    className={`relative z-10 max-w-full max-h-[58vh] object-contain rounded-xl shadow-2xl transition-transform duration-300 ${
                      isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                  />

                  {/* Image Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all shadow-md z-20 cursor-pointer"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => (prev + 1) % images.length);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all shadow-md z-20 cursor-pointer"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Zoom indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                    <button
                      type="button"
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title={isZoomed ? 'Zoom out' : 'Zoom in'}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isZoomed ? 'Reset' : 'Zoom'}</span>
                    </button>
                  </div>

                  {/* Image counter indicator & Swipe Hint */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold z-20 flex items-center gap-2">
                      <span>{currentImageIndex + 1} / {images.length}</span>
                      <span className="text-[10px] text-slate-300 border-l border-white/20 pl-2 sm:hidden">Swipe ↔</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500">
                  {isWebCategory ? <Code2 className="w-12 h-12 mb-2 text-slate-600" /> : <Film className="w-12 h-12 mb-2 text-slate-600" />}
                  <span className="text-sm font-medium">No preview images available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip (if multiple images) with uniform rounded-xl radius */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      idx === currentImageIndex
                        ? 'border-sky-500 shadow-md scale-102'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                  </button>
                ))}
              </div>
            )}

            {/* Project Details Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
                    {project.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-slate-700">{project.category} Showcase</span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {project.link && project.link !== '#' ? (
                    <motion.a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                        isWebCategory
                          ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
                          : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                      }`}
                    >
                      <span>{isWebCategory ? 'Visit Live Project' : 'Watch Video Edit'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  ) : null}
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-400 mr-1">Technologies & Tools:</span>
                  {project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Full Description */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Project Overview</h4>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Dedicated Card Share Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Share This Project Card
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Anyone opening this link lands directly into this card in full screen
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* WhatsApp Direct Share */}
                    <a
                      href={getWhatsAppShareUrl(project)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Share directly on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Native Web Share */}
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <button
                        type="button"
                        onClick={() => shareProjectCard(project)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                        title="Open device share sheet"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>More</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Link Bar with 1-click Copy */}
                <div className="flex items-center gap-2 bg-black/60 border border-slate-800 rounded-xl p-1.5 pl-3">
                  <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    readOnly
                    value={cardShareUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-transparent text-xs text-sky-300 font-mono focus:outline-none truncate selection:bg-sky-500 selection:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      copied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Project Carousel Navigator */}
          {projects.length > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/90 text-xs font-medium text-slate-600 shrink-0">
              <button
                type="button"
                onClick={() => prevProject && onSelectProject(prevProject)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-200/70 text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline font-bold">Previous:</span>
                <span className="truncate max-w-[120px] sm:max-w-[200px]">{prevProject?.title}</span>
              </button>

              <span className="text-slate-400 text-[11px]">
                Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-800">←</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-800">→</kbd> to navigate
              </span>

              <button
                type="button"
                onClick={() => nextProject && onSelectProject(nextProject)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-200/70 text-slate-700 transition-colors"
              >
                <span className="hidden sm:inline font-bold">Next:</span>
                <span className="truncate max-w-[120px] sm:max-w-[200px]">{nextProject?.title}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
