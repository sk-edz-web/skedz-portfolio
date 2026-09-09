import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
  Film, 
  ArrowRight, 
  PhoneCall, 
  Sparkles, 
  ChevronDown, 
  Layers, 
  Terminal, 
  Video, 
  Award,
  Briefcase,
  Send,
  Instagram
} from 'lucide-react';
import { ActivePage, SiteSettings } from '../types';

interface HomePageProps {
  settings: SiteSettings;
  onNavigate: (page: ActivePage) => void;
  onOpenContactModal: () => void;
}

export default function HomePage({
  settings,
  onNavigate,
  onOpenContactModal,
}: HomePageProps) {
  // Smooth role transition between Web Developer and Freelance Editor (independent autoplay)
  const roles = [settings.role1 || 'Web Developer', settings.role2 || 'Freelance Editor'];
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roles.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [roles.length]);

  const activeRole = roles[roleIndex];
  const isWeb = roleIndex === 0;

  const scrollToExperience = () => {
    const el = document.getElementById('experience-scroll-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full text-slate-800 overflow-hidden bg-slate-50">
      {/* ================= HERO FIRST SCREEN ================= */}
      <section
        id="hero-first-screen"
        className="relative min-h-[88vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-20 pb-14"
      >
        {/* Soft, clean light ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-[140px] opacity-40 transition-colors duration-1000"
            style={{ backgroundColor: isWeb ? '#bae6fd' : '#e9d5ff' }}
          />
          <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-sky-100/70 blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-indigo-100/60 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center text-center">
          {/* Autoplaying Animated Role Heading with Fixed Rigid Height (Zero Layout Shift) */}
          <div className="mb-4 flex flex-col items-center w-full">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Hello, welcome to my portfolio
            </span>

            {/* Static "I am a" with only the role name transitioning smoothly in place */}
            <div className="relative w-full h-16 sm:h-20 md:h-24 flex items-center justify-center">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-none flex items-center justify-center flex-wrap gap-x-2 sm:gap-x-3.5">
                <span className="text-slate-900 shrink-0 select-none">I am a</span>
                <span className="relative inline-flex items-center min-w-[190px] sm:min-w-[280px] md:min-w-[360px] h-[1.3em] overflow-hidden align-middle">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activeRole}
                      initial={{ opacity: 0, y: 18, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -18, filter: 'blur(3px)' }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`absolute left-0 font-black whitespace-nowrap ${
                        isWeb
                          ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent'
                          : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent'
                      }`}
                    >
                      {activeRole}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md">
              Transitioning seamlessly between modern Web Development and cinematic Video Editing.
            </p>
          </div>

          {/* Center Image with line: left side "Web Developer", right side "Editor" */}
          <div className="relative my-6 sm:my-8 w-full flex items-center justify-center">
            {/* Left label & dividing line */}
            <div className="hidden sm:flex items-center flex-1 justify-end pr-6">
              <div className="text-right">
                <span className="block text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center justify-end gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-sky-600" />
                  {settings.role1 || 'Web Developer'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Full-Stack & Frontend</span>
              </div>
              <div className="ml-4 w-20 md:w-32 h-[2px] bg-gradient-to-l from-sky-500/80 to-transparent" />
            </div>

            {/* Center User Image Container linking to Instagram */}
            <motion.a
              id="hero-center-avatar-container"
              href="https://instagram.com/skedz.dev"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative group cursor-pointer block"
              title="Click to visit Sarathi on Instagram (@skedz.dev)"
            >
              {/* Outer Glow Ring */}
              <div 
                className="absolute -inset-2 rounded-full blur-md opacity-50 group-hover:opacity-90 transition-all duration-500"
                style={{
                  background: isWeb
                    ? 'conic-gradient(from 0deg, #38bdf8, #818cf8, #38bdf8)'
                    : 'conic-gradient(from 0deg, #c084fc, #f43f5e, #c084fc)',
                }}
              />

              {/* Light Frame with Image */}
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-full p-1.5 bg-white border-2 border-slate-200 shadow-xl overflow-hidden">
                <img
                  id="hero-profile-image"
                  src={settings.avatarUrl || 'https://i.ibb.co/MyQn2Mnh/myimg.jpg'}
                  alt={settings.name || 'Sarathi'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://i.ibb.co/MyQn2Mnh/myimg.jpg';
                  }}
                  className="w-full h-full object-cover rounded-full filter contrast-105 group-hover:scale-105 transition-transform duration-500"
                />

                {/* Instagram hover overlay badge */}
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full flex flex-col items-center justify-center text-white p-3 text-center">
                  <Instagram className="w-6 h-6 text-pink-400 mb-1" />
                  <span className="text-[11px] font-bold tracking-wide">@skedz.dev</span>
                  <span className="text-[9px] text-slate-200 mt-0.5">Open Instagram ↗</span>
                </div>

                {/* Role badge overlay at bottom of circle */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-900/90 text-[10px] font-bold text-white shadow-md flex items-center gap-1.5 whitespace-nowrap">
                  <span>{settings.name || 'Sarathi'}</span>
                  <Instagram className="w-2.5 h-2.5 text-pink-400" />
                </div>
              </div>
            </motion.a>

            {/* Right label & dividing line */}
            <div className="hidden sm:flex items-center flex-1 justify-start pl-6">
              <div className="mr-4 w-20 md:w-32 h-[2px] bg-gradient-to-r from-purple-500/80 to-transparent" />
              <div className="text-left">
                <span className="block text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center justify-start gap-1.5">
                  <Film className="w-3.5 h-3.5 text-purple-600" />
                  {settings.role2 || 'Freelance Editor'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Cinematics & Motion</span>
              </div>
            </div>
          </div>

          {/* Mobile indicator for roles */}
          <div className="sm:hidden flex items-center justify-center gap-3 text-xs font-semibold mt-1 mb-3">
            <span className="text-sky-700 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" /> {settings.role1 || 'Web Developer'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-purple-700 flex items-center gap-1">
              <Film className="w-3.5 h-3.5" /> {settings.role2 || 'Freelance Editor'}
            </span>
          </div>

          {/* Hero Subtitle */}
          <p className="max-w-xl text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mb-5">
            {settings.heroSubtitle || 'Merging engineering precision with visual storytelling to build modern digital experiences.'}
          </p>

          {/* Primary Action Buttons (Always visible and responsive across screen sizes) */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <button
              id="btn-hero-explore-works"
              onClick={() => onNavigate('works')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-400" />
              <span>Explore Works</span>
            </button>

            <button
              id="btn-hero-contact-modal"
              onClick={onOpenContactModal}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-105 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span>Get in Touch</span>
            </button>
          </div>

          {/* Compact Scroll Down Link */}
          <button
            id="btn-scroll-to-experience"
            onClick={scrollToExperience}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-sky-600 transition-colors group"
          >
            <span>View Experience</span>
            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-sky-500 group-hover:scale-105 transition-all shadow-xs">
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-600" />
            </div>
          </button>
        </div>
      </section>

      {/* ================= FIRST SCROLL: EXPERIENCE SECTION (CLEAN LIGHT THEME) ================= */}
      <section
        id="experience-scroll-section"
        className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/90 bg-white"
      >
        {/* Subtle ambient gradient */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-700 mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>Track Record & Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight mb-2">
              Professional Experience
            </h2>
            <p className="max-w-lg mx-auto text-xs sm:text-sm text-slate-600">
              Years of dedicated practice crafting clean codebases and cinematic video productions.
            </p>
          </div>

          {/* Dual Experience Cards in Clean Light Aesthetics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Card 1: Web Developer Experience */}
            <motion.div
              id="card-experience-web"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="relative p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="block text-2xl sm:text-3xl font-black text-sky-600 font-heading">
                    {settings.webExperienceYears || '3+ Years'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">In Web Development</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2 font-heading group-hover:text-sky-600 transition-colors">
                {settings.role1 || 'Web Developer'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                {settings.webExperienceDesc || 'Building responsive, modern, high-performance web applications and interactive experiences.'}
              </p>

              {/* Web Skills */}
              <div className="pt-4 border-t border-slate-100">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Core Technologies:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(settings.skillsWeb || ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Firebase']).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Card 2: Editor Experience */}
            <motion.div
              id="card-experience-editor"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="relative p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-300 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="block text-2xl sm:text-3xl font-black text-purple-600 font-heading">
                    {settings.editorExperienceYears || '4+ Years'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">In Video & Motion</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2 font-heading group-hover:text-purple-600 transition-colors">
                {settings.role2 || 'Freelance Editor'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                {settings.editorExperienceDesc || 'Crafting cinematic edits, color grading, motion graphics, and engaging visual storytelling.'}
              </p>

              {/* Editor Skills */}
              <div className="pt-4 border-t border-slate-100">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Production Suite:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(settings.skillsEdit || ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Color Grading', 'Sound Design']).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-100 text-purple-700 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ================= RESIZED COMPACT CALL-TO-ACTION BUTTONS ================= */}
          <div
            id="experience-cta-buttons"
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            {/* 1. Explore My Work Button (Compact, sleek size) */}
            <motion.button
              id="btn-explore-my-work"
              onClick={() => onNavigate('works')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Explore My Work</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            {/* 2. Contact for More Info Button (Compact, sleek size) */}
            <motion.button
              id="btn-contact-more-info"
              onClick={onOpenContactModal}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>Contact for More Info</span>
            </motion.button>
          </div>

          {/* Fast Highlights Bar */}
          <div className="mt-12 p-5 rounded-2xl bg-slate-50 border border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="block text-xl sm:text-2xl font-black text-slate-900 font-heading">100%</span>
              <span className="text-[11px] text-slate-500">Real-Time Sync</span>
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-black text-sky-600 font-heading">Fast</span>
              <span className="text-[11px] text-slate-500">Responsive UI</span>
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-black text-purple-600 font-heading">4K</span>
              <span className="text-[11px] text-slate-500">Cinematic Delivery</span>
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-black text-emerald-600 font-heading">Direct</span>
              <span className="text-[11px] text-slate-500">WhatsApp / Call</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
