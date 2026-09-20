import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectCard, SocialLink, DynamicSite, FirebaseConfig } from "./types";
import { initFirebase, DEFAULT_FIREBASE_CONFIG } from "./lib/firebase";
import GalaxyCanvas from "./components/GalaxyCanvas";
import CustomCursor from "./components/CustomCursor";
import IntroScreen from "./components/IntroScreen";
import Navbar from "./components/Navbar";
import SocialPopup from "./components/SocialPopup";
import CardGrid from "./components/CardGrid";
import AboutSection from "./components/AboutSection";
import ContactSection from "./components/ContactSection";
import ServicesTimeline from "./components/ServicesTimeline";
import CustomerReviews from "./components/CustomerReviews";
import ServicesSection from "./components/ServicesSection";
import PrivacyModal from "./components/PrivacyModal";
import DynamicSiteViewer from "./components/DynamicSiteViewer";
import AdminDashboard from "./components/admin/AdminDashboard";
import SkedzLogo from "./components/SkedzLogo";
import ScrollReveal from "./components/ScrollReveal";
import { updatePageSEO } from "./utils/seo";
import { extractSubdomainSlug } from "./lib/domain";
import { ArrowRight, Mail, MessageCircle, Instagram, Globe, ChevronDown } from "lucide-react";

export default function App() {
  // Navigation & View state
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [hasCooked, setHasCooked] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");

  // Modals
  const [socialPopupOpen, setSocialPopupOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [inquirySubject, setInquirySubject] = useState("");

  // Portal Data State (Real-time synced)
  const [cards, setCards] = useState<ProjectCard[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [sites, setSites] = useState<DynamicSite[]>([]);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [, setLoading] = useState(true);

  // Listen to browser popstate (back/forward or URL changes)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Dynamic SEO meta tags, title & JSON-LD updates on tab or route change
  useEffect(() => {
    updatePageSEO(activeTab, currentPath);
  }, [activeTab, currentPath]);

  // Fetch initial portal data and subscribe to Server-Sent Events (Real-time updates)
  useEffect(() => {
    let sse: EventSource | null = null;

    async function loadData() {
      try {
        let data: any = null;
        try {
          const res = await fetch("/api/portal/data");
          const contentType = res.headers.get("content-type") || "";
          if (res.ok && contentType.includes("application/json")) {
            data = await res.json();
          }
        } catch {
          data = null;
        }

        // Static host fallback (e.g. Vercel static deployment)
        if (!data) {
          try {
            const fallbackRes = await fetch("/portal-data.json");
            if (fallbackRes.ok) {
              data = await fallbackRes.json();
            }
          } catch (e) {
            console.warn("Could not load /portal-data.json fallback:", e);
          }
        }

        // Check local storage overrides (from admin in static mode)
        try {
          const localOverride = localStorage.getItem("skedz_portal_data_override");
          if (localOverride) {
            const parsed = JSON.parse(localOverride);
            data = { ...(data || {}), ...parsed };
          }
        } catch {}

        if (data) {
          setCards(data.cards || []);
          setSocials(data.socials || []);
          setSites(data.sites || []);
          const activeFb = data.firebaseConfig || DEFAULT_FIREBASE_CONFIG;
          setFirebaseConfig(activeFb);
          initFirebase(activeFb);
        }
      } catch (err) {
        console.error("Error fetching portal data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    const handleDataChange = () => {
      loadData();
    };
    window.addEventListener("skedz_portal_data_changed", handleDataChange);

    // Setup SSE for real-time live sync
    try {
      sse = new EventSource("/api/portal/stream");
      sse.addEventListener("social_like", (e) => {
        const payload = JSON.parse(e.data);
        setSocials((prev) =>
          prev.map((s) => (s.id === payload.id ? { ...s, likes: payload.likes } : s))
        );
      });
      sse.addEventListener("cards_updated", (e) => {
        const updated = JSON.parse(e.data);
        setCards(updated);
      });
      sse.addEventListener("socials_updated", (e) => {
        const updated = JSON.parse(e.data);
        setSocials(updated);
      });
      sse.addEventListener("sites_updated", (e) => {
        const updated = JSON.parse(e.data);
        setSites(updated);
      });
      sse.addEventListener("firebase_config_updated", () => {
        // reload portal data on config update
        loadData();
      });
    } catch (err) {
      console.warn("SSE connection error:", err);
    }

    return () => {
      window.removeEventListener("skedz_portal_data_changed", handleDataChange);
      if (sse) sse.close();
    };
  }, []);

  // Handle Likes
  const handleLikeSocial = async (id: string) => {
    try {
      const res = await fetch(`/api/socials/${id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSocials((prev) =>
          prev.map((s) => (s.id === id ? { ...s, likes: data.likes } : s))
        );
      }
    } catch (err) {
      console.error("Failed to like social link:", err);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Check route matches
  const normalizedPath = currentPath.toLowerCase();
  const isAdminPath =
    normalizedPath === "/admin.html" ||
    normalizedPath === "/admin" ||
    normalizedPath === "/admin.html/";

  // Check if hostname has a subdomain slug (e.g. newpage.skedz.vercel.app -> "newpage")
  const subdomainSlug = typeof window !== "undefined" ? extractSubdomainSlug(window.location.hostname) : null;

  // Check if current path matches any dynamic sub-route (e.g. /newsite or /skedz)
  const pathSlugMatch =
    !isAdminPath &&
    normalizedPath !== "/" &&
    normalizedPath !== ""
      ? normalizedPath.replace(/^\//, "").split("/")[0]
      : null;

  const dynamicSlugMatch = subdomainSlug || pathSlugMatch;

  // If Admin URL is visited
  if (isAdminPath) {
    return (
      <AdminDashboard
        onExitAdmin={() => {
          navigateTo("/");
        }}
      />
    );
  }

  // If Dynamic Sub-Route URL is visited (e.g., /newsite)
  if (dynamicSlugMatch) {
    return (
      <DynamicSiteViewer
        slug={dynamicSlugMatch}
        onBackToPortal={() => {
          navigateTo("/");
        }}
      />
    );
  }

  // Normal Public Portal
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200">
      {/* 3D Interactive Cosmic Galaxy Starfield Canvas */}
      <GalaxyCanvas />

      {/* PC Cosmic Cursor Follower */}
      <CustomCursor />

      {/* Intro Cook Gateway Screen */}
      {!hasCooked ? (
        <IntroScreen onStart={() => setHasCooked(true)} />
      ) : (
        <div className="relative z-10 flex flex-col min-h-screen animate-in fade-in duration-500">
          {/* Public Navbar (Strictly NO admin references, only Home, About, Contact) */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenSocials={() => setSocialPopupOpen(true)}
            onOpenPrivacy={() => setPrivacyModalOpen(true)}
          />

          {/* Main View Area */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
            <AnimatePresence mode="wait">
              {/* ================= HOME TAB ================= */}
              {activeTab === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-20"
                >
                  {/* Single Frame Centered Hero Layout (Covers single screen frame comfortably) */}
                  <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center items-center text-center max-w-3xl mx-auto py-6 relative">
                    <div className="flex justify-center mb-6">
                      <SkedzLogo size="lg" />
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-cyan-300 tracking-tight leading-tight mb-5">
                      Next-Gen Video Editing & Web Development Startup
                    </h1>

                    <p className="text-slate-300 text-xs sm:text-base md:text-lg leading-relaxed font-light mb-8 max-w-2xl mx-auto">
                      Welcome to the digital studio of <strong className="text-purple-300 font-medium">SKEDZ</strong>. 
                      Specializing in high-impact cinematic video editing, visual storytelling, and high-performance modern web platforms.
                    </p>

                    {/* Action buttons: Explore Services and Connect */}
                    <div className="flex flex-wrap items-center justify-center gap-3.5 mb-10">
                      <button
                        onClick={() => {
                          setActiveTab("services");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-[0_0_25px_rgba(147,51,234,0.4)] transition cursor-pointer inline-flex items-center gap-2"
                      >
                        <span>See Our Services & Works</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setSocialPopupOpen(true)}
                        className="px-6 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 text-xs sm:text-sm font-medium transition cursor-pointer inline-flex items-center gap-2"
                      >
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <span>Connect with SKEDZ</span>
                      </button>
                    </div>

                    {/* Subtle Down Indicator */}
                    <div className="flex flex-col items-center gap-1 text-[11px] font-mono text-slate-400">
                      <span>Scroll to explore timeline & reviews</span>
                      <ChevronDown className="w-4 h-4 animate-bounce text-purple-400" />
                    </div>
                  </div>

                  {/* Alternating Services Timeline (Left / Right Layout) */}
                  <ServicesTimeline
                    onExploreProjects={() => {
                      setActiveTab("services");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onContact={() => {
                      setActiveTab("contact");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />

                  {/* Customer Reviews Preview (Real Data Only, Strict 1 per device) */}
                  <CustomerReviews
                    previewMode
                    onOpenReviewsPage={() => {
                      setActiveTab("reviews");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onNavigateToProjects={() => {
                      setActiveTab("services");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    projectCount={cards.length}
                  />

                  {/* Dynamic Route Callout (Only shown when sub-sites exist) */}
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
                              Edge Deployed Pages Available
                            </h3>
                            <p className="text-slate-300 text-xs sm:text-sm font-light max-w-xl">
                              Standalone sub-sites hosted and routed dynamically under direct slugs.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {sites.map((site) => (
                              <button
                                key={site.id}
                                onClick={() => navigateTo(`/${site.slug}`)}
                                className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-mono transition cursor-pointer"
                              >
                                /{site.slug}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  )}

                  {/* Quick Contact Teaser */}
                  <ScrollReveal direction="up" delay={0.15}>
                    <div className="p-8 rounded-3xl bg-[#090d1a]/80 border border-purple-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Direct Collaboration</h3>
                        <p className="text-xs text-slate-400 font-light">
                          Reach SKEDZ directly via WhatsApp, email, or verified Instagram.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href="mailto:skedz.contact@gmail.com"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>skedz.contact@gmail.com</span>
                        </a>
                        <a
                          href="https://wa.me/919345306572?text=Hello%20SKEDZ%2C%20I%20would%20like%20to%20discuss%20a%20project"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp (+91 9345306572)</span>
                        </a>
                      </div>
                    </div>
                  </ScrollReveal>
                </motion.div>
              )}

              {/* ================= SERVICES TAB ================= */}
              {activeTab === "services" && (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                >
                  <ServicesSection
                    cards={cards}
                    sites={sites}
                    onNavigateToSite={navigateTo}
                    onContact={() => {
                      setActiveTab("contact");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onOpenReviews={() => {
                      setActiveTab("reviews");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </motion.div>
              )}

              {/* ================= REVIEWS TAB ================= */}
              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                >
                  <CustomerReviews
                    onNavigateToProjects={() => {
                      setActiveTab("services");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    projectCount={cards.length}
                    firebaseConfig={firebaseConfig}
                  />
                </motion.div>
              )}

              {/* ================= ABOUT TAB ================= */}
              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                >
                  <AboutSection />
                </motion.div>
              )}

              {/* ================= CONTACT TAB ================= */}
              {activeTab === "contact" && (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                >
                  <ContactSection
                    initialSubject={inquirySubject}
                    firebaseConfig={firebaseConfig}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Public Footer */}
          <footer className="mt-auto border-t border-purple-500/15 bg-[#030712]/90 backdrop-blur-xl py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <SkedzLogo size="xs" />
                <span className="font-bold text-slate-200 tracking-wider font-mono">
                  SKEDZ
                </span>
                <span>•</span>
                <span>Video Editing & Web Development Startup</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPrivacyModalOpen(true)}
                  className="hover:text-purple-300 transition"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setSocialPopupOpen(true)}
                  className="hover:text-cyan-300 transition"
                >
                  Socials
                </button>
                <a
                  href="mailto:skedz.contact@gmail.com"
                  className="text-purple-400 hover:text-purple-300 transition font-mono"
                >
                  skedz.contact@gmail.com
                </a>
              </div>
            </div>
          </footer>

          {/* Socials Pop-up Card */}
          <SocialPopup
            isOpen={socialPopupOpen}
            onClose={() => setSocialPopupOpen(false)}
            socials={socials}
            onLikeSocial={handleLikeSocial}
          />

          {/* Privacy & Legal Policy Modal */}
          <PrivacyModal
            isOpen={privacyModalOpen}
            onClose={() => setPrivacyModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
