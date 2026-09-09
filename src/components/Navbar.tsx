import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  Code, 
  Film, 
  Briefcase, 
  User, 
  Send, 
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { ActivePage, SiteSettings } from '../types';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  settings: SiteSettings;
  onOpenContactModal: () => void;
}

export default function Navbar({
  activePage,
  onNavigate,
  settings,
  onOpenContactModal,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { id: ActivePage; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Code },
    { id: 'works', label: 'Works', icon: Briefcase },
    { id: 'about', label: 'About', icon: User },
    { id: 'contact', label: 'Contact', icon: Send },
  ];

  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/90 py-2.5 shadow-sm'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand / Logo */}
        <button
          id="btn-nav-brand"
          onClick={() => handleNavClick('home')}
          className="group flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[1.5px] shadow-sm shadow-sky-500/20 group-hover:shadow-md transition-all duration-300">
            <div className="w-full h-full bg-white rounded-[9px] overflow-hidden flex items-center justify-center">
              <img
                src="https://i.ibb.co/MyQn2Mnh/myimg.jpg"
                alt={settings.name || 'Sarathi'}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/myimg.jpeg';
                }}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors font-heading">
              {settings.name || 'Sarathi'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide flex items-center gap-1">
              <span>Developer</span>
              <span className="text-sky-500">•</span>
              <span>Editor</span>
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav
          id="desktop-nav"
          className="hidden md:flex items-center gap-1 p-1 rounded-full bg-slate-100/90 border border-slate-200/90 backdrop-blur-lg shadow-sm"
        >
          {navLinks.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <motion.button
            id="btn-nav-quick-contact"
            onClick={onOpenContactModal}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xs:inline sm:inline">Connect</span>
          </motion.button>

          {/* Mobile hamburger button */}
          <button
            id="btn-toggle-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-2xl px-4 py-3 overflow-hidden shadow-lg"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((item) => {
                const isActive = activePage === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-sky-600" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <Sparkles className="w-3.5 h-3.5 text-sky-600" />}
                  </button>
                );
              })}

              <div className="pt-2 mt-1 border-t border-slate-100">
                <button
                  id="btn-mobile-quick-contact"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenContactModal();
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call or WhatsApp</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
