import { useState } from "react";
import { Share2, Menu, X, Shield } from "lucide-react";
import SkedzLogo from "./SkedzLogo";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSocials: () => void;
  onOpenPrivacy: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenSocials,
  onOpenPrivacy,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "services", label: "Services" },
    { id: "reviews", label: "Reviews" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#030712]/80 border-b border-purple-500/15 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-3 cursor-pointer group"
          id="portal-brand-logo"
        >
          <SkedzLogo size="sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-base text-slate-100 group-hover:text-purple-300 transition-colors">
                SKEDZ
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Core Portal Online" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Video Editing & Web Dev
            </p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/5 backdrop-blur-md">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Actions: Socials Popup Trigger & Privacy */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            id="open-social-popup-btn"
            onClick={onOpenSocials}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs font-medium transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Socials</span>
          </button>

          <button
            id="open-privacy-policy-btn"
            onClick={onOpenPrivacy}
            title="Privacy & Legal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            id="mobile-socials-btn"
            onClick={onOpenSocials}
            className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 border-t border-purple-500/10 bg-[#030712]/95 backdrop-blur-2xl">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === item.id
                    ? "bg-purple-600/30 text-purple-200 border border-purple-500/30"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between px-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPrivacy();
                }}
                className="text-xs text-slate-400 hover:text-purple-300 flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Privacy & Policy</span>
              </button>

              <div className="text-[11px] text-slate-500 font-mono">
                skedz.dev
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
