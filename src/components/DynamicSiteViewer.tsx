import { useEffect, useState } from "react";
import { DynamicSite, SiteFile } from "../types";
import { getFileLanguage } from "../lib/fileTypes";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  ShieldAlert,
  Download,
  Copy,
  Check,
  Files,
  X,
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
} from "lucide-react";

interface DynamicSiteViewerProps {
  slug: string;
  onBackToPortal: () => void;
}

export default function DynamicSiteViewer({ slug, onBackToPortal }: DynamicSiteViewerProps) {
  const [site, setSite] = useState<DynamicSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);
  const [showFilesDrawer, setShowFilesDrawer] = useState(false);
  const [selectedFileForDrawer, setSelectedFileForDrawer] = useState<SiteFile | null>(null);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    async function loadSite() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/site-by-slug/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          // Check local storage fallback
          const localData = JSON.parse(localStorage.getItem("skedz_portal_data_override") || "{}");
          const found = (localData.sites || []).find(
            (s: DynamicSite) => s.slug.toLowerCase() === slug.toLowerCase()
          );
          if (found) {
            setSite(found);
            return;
          }
          throw new Error(`Dynamic site "/${slug}" was not found or has been removed.`);
        }
        const data = await res.json();
        setSite(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dynamic site.");
      } finally {
        setLoading(false);
      }
    }
    loadSite();
  }, [slug]);

  const copySubdomain = () => {
    const domain = `${slug}.skedz.vercel.app`;
    navigator.clipboard.writeText(`https://${domain}`);
    setCopiedSubdomain(true);
    setTimeout(() => setCopiedSubdomain(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] text-slate-100 p-4">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono text-purple-300">Resolving multi-file site /{slug}...</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] text-slate-100 p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Dynamic Route Not Found</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">{error}</p>
        <button
          onClick={onBackToPortal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to SKEDZ-S.PORTAL
        </button>
      </div>
    );
  }

  const files: SiteFile[] =
    site.files && site.files.length > 0
      ? site.files
      : site.customHtml
      ? [
          {
            name: site.fileName || "index.html",
            path: site.fileName || "index.html",
            content: site.customHtml,
            size: site.fileSize || site.customHtml.length,
            contentType: "text/html",
          },
        ]
      : [];

  const deviceWidthClass =
    deviceMode === "mobile"
      ? "max-w-[390px] h-[844px] my-auto rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
      : deviceMode === "tablet"
      ? "max-w-[768px] h-[1024px] my-auto rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
      : "w-full h-full";

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 relative overflow-hidden">
      {/* Top Dynamic Bar */}
      <div className="h-14 bg-[#090d1a]/95 border-b border-purple-500/20 px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 gap-2">
        {/* Left: Back & Route */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onBackToPortal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portal</span>
          </button>
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-mono text-xs text-purple-300 font-bold">
              /{site.slug}
            </span>
            {site.projectType && (
              <span className="hidden md:inline px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                {site.projectType}
              </span>
            )}
          </div>
        </div>

        {/* Center: Device Mode Toggles */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`p-1.5 rounded-lg transition ${
              deviceMode === "desktop" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            className={`p-1.5 rounded-lg transition ${
              deviceMode === "tablet" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Tablet View"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`p-1.5 rounded-lg transition ${
              deviceMode === "mobile" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
            title="Reload Frame"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Subdomain Copy Pill */}
          <button
            onClick={copySubdomain}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono transition"
            title="Click to copy live subdomain URL"
          >
            {copiedSubdomain ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>{site.slug}.skedz.vercel.app</span>
              </>
            )}
          </button>

          {/* Files Drawer Toggle */}
          <button
            onClick={() => {
              setShowFilesDrawer(!showFilesDrawer);
              if (!selectedFileForDrawer && files.length > 0) {
                setSelectedFileForDrawer(files[0]);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              showFilesDrawer
                ? "bg-purple-600 text-white border-purple-500"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
            }`}
          >
            <Files className="w-3.5 h-3.5 text-cyan-400" />
            <span>Files ({files.length})</span>
          </button>

          {/* Download Project ZIP */}
          <a
            href={`/api/sites/${site.slug}/download`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition"
            title="Download Full Project ZIP"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">ZIP</span>
          </a>

          {/* Raw View External Link */}
          <a
            href={`/raw-site/${site.slug}/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-200 text-xs font-medium transition"
            title="Open Raw Sub-Site"
          >
            <span className="hidden sm:inline">Raw View</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full relative flex items-center justify-center bg-[#02040a] overflow-auto">
        <div className={`transition-all duration-300 ${deviceWidthClass}`}>
          <iframe
            key={iframeKey}
            title={site.title}
            src={`/raw-site/${site.slug}/`}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
            className="w-full h-full border-0 bg-white"
          />
        </div>

        {/* Collapsible Files Side-Drawer */}
        {showFilesDrawer && (
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[480px] bg-[#090d1a]/98 backdrop-blur-xl border-l border-purple-500/30 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Project Source Explorer</h4>
                <span className="text-xs text-slate-400 font-mono">({files.length} files)</span>
              </div>
              <button
                onClick={() => setShowFilesDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* File Selector Pills */}
            <div className="px-3 py-2 border-b border-white/5 flex gap-2 overflow-x-auto font-mono text-xs">
              {files.map((f) => {
                const isSel = selectedFileForDrawer?.path === f.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => setSelectedFileForDrawer(f)}
                    className={`px-3 py-1 rounded-lg shrink-0 transition flex items-center gap-1.5 ${
                      isSel
                        ? "bg-purple-600 text-white font-semibold"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{f.path}</span>
                    <span className="text-[10px] opacity-70">
                      ({getFileLanguage(f.name)})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Code / Content Viewer */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs">
              {selectedFileForDrawer ? (
                selectedFileForDrawer.isBinary ? (
                  <div className="text-center py-12 text-slate-400">
                    <p>Binary Asset: {selectedFileForDrawer.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      MIME: {selectedFileForDrawer.contentType || "binary"}
                    </p>
                  </div>
                ) : (
                  <pre className="whitespace-pre text-slate-200 leading-relaxed">
                    <code>{selectedFileForDrawer.content}</code>
                  </pre>
                )
              ) : (
                <p className="text-slate-500">Select a file above</p>
              )}
            </div>

            {/* Drawer Footer */}
            {selectedFileForDrawer && !selectedFileForDrawer.isBinary && (
              <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">
                  {((selectedFileForDrawer.size || selectedFileForDrawer.content.length) / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedFileForDrawer.content);
                    alert("Code copied to clipboard!");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                >
                  Copy File Code
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
