import { motion } from 'motion/react';
import { 
  User, 
  Code2, 
  Film, 
  Sparkles, 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle,
  Briefcase,
  Instagram
} from 'lucide-react';
import { ActivePage, SiteSettings } from '../types';

interface AboutPageProps {
  settings: SiteSettings;
  onNavigate: (page: ActivePage) => void;
  onOpenContactModal: () => void;
}

export default function AboutPage({
  settings,
  onNavigate: _onNavigate,
  onOpenContactModal,
}: AboutPageProps) {
  return (
    <div id="about-page-root" className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-slate-900">
      {/* Header section */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-700 mb-3"
        >
          <User className="w-3.5 h-3.5" />
          <span>Biography & Skillset</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight mb-3"
        >
          About {settings.name || 'Sarathi'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 text-xs sm:text-sm leading-relaxed"
        >
          A dual-craft creative bringing technical precision to code and expressive storytelling to video production.
        </motion.p>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-12 items-start">
        {/* Left Col: Photo Card & Quick Facts */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 flex flex-col items-center"
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs text-center">
            {/* Avatar frame with Instagram link */}
            <a
              href="https://instagram.com/skedz.dev"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Sarathi on Instagram (@skedz.dev)"
              className="group relative mx-auto w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm mb-4 block cursor-pointer"
            >
              <img
                src={settings.avatarUrl || 'https://i.ibb.co/MyQn2Mnh/myimg.jpg'}
                alt={settings.name || 'Sarathi'}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://i.ibb.co/MyQn2Mnh/myimg.jpg';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-2">
                <Instagram className="w-5 h-5 text-pink-400 mb-1" />
                <span className="text-[11px] font-bold">@skedz.dev</span>
                <span className="text-[9px] text-slate-200">Open Instagram ↗</span>
              </div>
            </a>

            <h2 className="text-xl font-bold text-slate-900 font-heading mb-1">
              {settings.name || 'Sarathi'}
            </h2>
            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-4">
              Web Developer & Freelance Editor
            </p>

            {/* Badges / Quick info */}
            <div className="space-y-2 text-left text-xs border-t border-slate-100 pt-3 text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Tamil Nadu, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">{settings.email || 'sarathik354@gmail.com'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>+91 {settings.phone || '9345306572'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Available for Freelance & Full-Time</span>
              </div>
            </div>

            {/* Compact CTA Button */}
            <button
              id="btn-about-connect-cta"
              onClick={onOpenContactModal}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Get In Touch
            </button>
          </div>
        </motion.div>

        {/* Right Col: Story & Dual Strengths */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-7 space-y-6"
        >
          {/* Narrative bio */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 font-heading mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Who I Am</span>
            </h3>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-3">
              {settings.aboutBio ||
                'Hello! I am Sarathi, an enthusiastic Web Developer and creative Video Editor based in Tamil Nadu. I bridge the worlds of programming and cinematic design—building clean, high-performance web products while also directing dynamic visual edits.'}
            </p>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Whether building accessible, responsive frontends or cutting footage with rhythm, speed, and emotion, I focus on delivering polished results that leave a lasting impression.
            </p>
          </div>

          {/* Dual Crafts Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Craft 1: Web Development */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-3">
                <Code2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1 font-heading">
                Web Development
              </h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                {settings.aboutPhilosophyWeb || 'Clean architecture, component modularity, fluid responsiveness, and aesthetic precision.'}
              </p>
              <div className="flex flex-wrap gap-1">
                {(settings.skillsWeb || ['React', 'TypeScript', 'Tailwind', 'Next.js', 'Firebase']).map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-sky-50 border border-sky-100 text-sky-700 text-[10px] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Craft 2: Video Editing */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-3">
                <Film className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1 font-heading">
                Video & Motion
              </h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                {settings.aboutPhilosophyEdit || 'Rhythm, pacing, immersive color grading, and visual storytelling that captures attention.'}
              </p>
              <div className="flex flex-wrap gap-1">
                {(settings.skillsEdit || ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Color Grading']).map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Experience Milestones */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 font-heading mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <span>Core Workflow & Standards</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-900 mb-0.5">Mobile-First Precision</span>
              <span className="text-xs text-slate-500">All web layouts adapt seamlessly from compact phone displays to ultra-wide desktop monitors.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-900 mb-0.5">High-Impact Pacing</span>
              <span className="text-xs text-slate-500">Video edits calibrated for high viewer retention, sound sync, and dynamic transitions.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-900 mb-0.5">Direct Communication</span>
              <span className="text-xs text-slate-500">Always accessible via WhatsApp and email for fast turnaround and collaborative updates.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
