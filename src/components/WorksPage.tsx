import { useState, type MouseEvent } from 'react';
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
  Sliders
} from 'lucide-react';
import { ProjectCategory, ProjectItem } from '../types';
import ImageAdjustModal from './ImageAdjustModal';

interface WorksPageProps {
  projects: ProjectItem[];
}

export default function WorksPage({ projects }: WorksPageProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | ProjectCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioInitialImage, setStudioInitialImage] = useState<string>('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&auto=format&fit=crop&q=80');

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

  const handlePrevImage = (projectId: string, max: number, e: MouseEvent) => {
    e.stopPropagation();
    setImageIndices((prev) => {
      const current = prev[projectId] || 0;
      return { ...prev, [projectId]: (current - 1 + max) % max };
    });
  };

  const handleNextImage = (projectId: string, max: number, e: MouseEvent) => {
    e.stopPropagation();
    setImageIndices((prev) => {
      const current = prev[projectId] || 0;
      return { ...prev, [projectId]: (current + 1) % max };
    });
  };

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

        {/* Search Field & Launch Live Edit Studio Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
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

          <button
            id="btn-launch-edit-studio"
            type="button"
            onClick={() => {
              const firstEditImg = projects.find((p) => p.category === 'edit')?.images?.[0];
              if (firstEditImg) setStudioInitialImage(firstEditImg);
              setIsStudioOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap cursor-pointer shrink-0"
            title="Open Sarathi's Live Edit Studio (Photo & Video Grading App)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Live Edit Studio</span>
          </button>
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
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
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
            const currentImgIdx = imageIndices[project.id] || 0;
            const activeImage = images[currentImgIdx];

            return (
              <motion.article
                key={project.id}
                id={`project-card-${project.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                {/* Media Header / Image Carousel */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden select-none border-b border-slate-100">
                  {images.length > 0 ? (
                    <>
                      <img
                        src={activeImage}
                        alt={project.title}
                        onClick={() => setPreviewImage(activeImage)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103 cursor-pointer"
                      />

                      {/* Image navigation controls if multiple images exist */}
                      {images.length > 1 && (
                        <>
                          <button
                            id={`btn-prev-img-${project.id}`}
                            onClick={(e) => handlePrevImage(project.id, images.length, e)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-next-img-${project.id}`}
                            onClick={(e) => handleNextImage(project.id, images.length, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Dots counter */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md">
                            {images.map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${
                                  i === currentImgIdx ? 'w-3 bg-sky-400' : 'w-1.5 bg-white/60'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                      {isWebCategory ? <Code2 className="w-8 h-8 mb-1.5 text-slate-300" /> : <Film className="w-8 h-8 mb-1.5 text-slate-300" />}
                      <span className="text-[11px] font-medium">No Image Provided</span>
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <div className="absolute top-2.5 left-2.5">
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

                  {/* Featured Badge */}
                  {project.featured && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Featured</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-slate-900 mb-1.5 font-heading group-hover:text-sky-600 transition-colors line-clamp-1">
                    {project.title}
                  </h3>

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

                  {/* Bottom Actions: Link button (Compact, sleek) */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isWebCategory && project.images?.[0] && (
                        <button
                          type="button"
                          onClick={() => {
                            setStudioInitialImage(project.images[0]);
                            setIsStudioOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Open this frame in the Creative Edit Studio"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Grade Still</span>
                        </button>
                      )}

                      {project.link && project.link !== '#' ? (
                        <motion.a
                          id={`btn-visit-project-${project.id}`}
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
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
                        <span className="text-[11px] text-slate-400 italic">Direct showcase</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

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

      {/* Interactive Creative Edit Studio Modal (Live Photo & Video App Suite) */}
      {isStudioOpen && (
        <ImageAdjustModal
          isOpen={isStudioOpen}
          imageUrl={studioInitialImage}
          title="Creative Edit Studio (Live App)"
          defaultAspectRatio="16:9"
          onClose={() => setIsStudioOpen(false)}
          onSave={(savedUrl) => {
            setStudioInitialImage(savedUrl);
            setIsStudioOpen(false);
          }}
        />
      )}
    </div>
  );
}
