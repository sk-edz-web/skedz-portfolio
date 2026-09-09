import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActivePage, ProjectItem, SiteSettings } from './types';
import { 
  subscribeToProjects, 
  subscribeToSiteSettings, 
  defaultSettings 
} from './services/firebase';
import IntroAnimation from './components/IntroAnimation';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import WorksPage from './components/WorksPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import ContactActionModal from './components/ContactActionModal';
import AdminPortal from './components/AdminPortal';

export default function App() {
  // Determine initial route from URL
  const getInitialPage = (): ActivePage => {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    
    if (path.includes('admin') || search.includes('page=admin')) {
      return 'admin';
    }
    if (path.includes('work') || search.includes('page=work')) {
      return 'works';
    }
    if (path.includes('about') || search.includes('page=about')) {
      return 'about';
    }
    if (path.includes('contact') || search.includes('page=contact')) {
      return 'contact';
    }
    return 'home';
  };

  const [activePage, setActivePage] = useState<ActivePage>(getInitialPage);
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(() => {
    // If user lands directly on admin, skip intro
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (path.includes('admin') || search.includes('page=admin')) return true;
    return false;
  });

  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Subscribe to real-time Firebase data
  useEffect(() => {
    const unsubSettings = subscribeToSiteSettings((updated) => {
      setSettings(updated);
    });

    const unsubProjects = subscribeToProjects((updatedList) => {
      setProjects(updatedList);
    });

    return () => {
      unsubSettings();
      unsubProjects();
    };
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation handler
  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
    let targetPath = '/';
    if (page === 'works') targetPath = '/work.html';
    else if (page === 'about') targetPath = '/about';
    else if (page === 'contact') targetPath = '/contact';
    else if (page === 'admin') targetPath = '/admin.html';

    window.history.pushState(null, '', targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIntroComplete = () => {
    setHasSeenIntro(true);
    sessionStorage.setItem('sarathi_intro_seen', 'true');
  };

  // If viewing admin portal, render Admin directly (Private)
  if (activePage === 'admin') {
    return (
      <AdminPortal
        projects={projects}
        settings={settings}
        onExitAdmin={() => handleNavigate('home')}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Starting Intro Animation Screen */}
      <AnimatePresence>
        {!hasSeenIntro && (
          <IntroAnimation onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      {/* Main Glass Navigation Header */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        settings={settings}
        onOpenContactModal={() => setIsContactModalOpen(true)}
      />

      {/* Page Content with Smooth Motion Transitions */}
      <main className="flex-1 w-full relative">
        <AnimatePresence mode="wait">
          {activePage === 'home' && (
            <motion.div
              key="home-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <HomePage
                settings={settings}
                onNavigate={handleNavigate}
                onOpenContactModal={() => setIsContactModalOpen(true)}
              />
            </motion.div>
          )}

          {activePage === 'works' && (
            <motion.div
              key="works-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <WorksPage projects={projects} />
            </motion.div>
          )}

          {activePage === 'about' && (
            <motion.div
              key="about-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <AboutPage
                settings={settings}
                onNavigate={handleNavigate}
                onOpenContactModal={() => setIsContactModalOpen(true)}
              />
            </motion.div>
          )}

          {activePage === 'contact' && (
            <motion.div
              key="contact-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <ContactPage
                settings={settings}
                onOpenPhoneChoice={() => setIsContactModalOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Interactive Contact Choice Modal (Email & Call vs WhatsApp) */}
      <ContactActionModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        settings={settings}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/90 bg-white py-8 px-4 text-center text-xs text-slate-500 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 font-heading">
              {settings.name || 'Sarathi'}
            </span>
            <span>•</span>
            <span className="text-slate-500">Web Developer & Freelance Editor</span>
          </div>

          <div className="flex items-center gap-5 text-slate-600 font-medium">
            <button
              onClick={() => handleNavigate('home')}
              className="hover:text-sky-600 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigate('works')}
              className="hover:text-sky-600 transition-colors"
            >
              Works
            </button>
            <button
              onClick={() => handleNavigate('about')}
              className="hover:text-sky-600 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => handleNavigate('contact')}
              className="hover:text-sky-600 transition-colors"
            >
              Contact
            </button>
          </div>

          <div>
            <span>© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
