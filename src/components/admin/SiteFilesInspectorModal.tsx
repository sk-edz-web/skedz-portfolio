import { useState } from "react";
import { DynamicSite, SiteFile } from "../../types";
import { getFileLanguage } from "../../lib/fileTypes";
import {
  X,
  FileCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Code2,
  FolderArchive,
  Layers,
} from "lucide-react";

interface SiteFilesInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: DynamicSite;
  showToast: (msg: string) => void;
}

export default function SiteFilesInspectorModal({
  isOpen,
  onClose,
  site,
  showToast,
}: SiteFilesInspectorModalProps) {
  const [selectedFile, setSelectedFile] = useState<SiteFile | null>(() => {
    if (site.files && site.files.length > 0) {
      return (
        site.files.find(
          (f) =>
            f.path.toLowerCase() === (site.entryFile || "index.html").toLowerCase() ||
            f.name.toLowerCase() === "index.html"
        ) || site.files[0]
      );
    }
    return null;
  });

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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

  const handleCopyContent = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    showToast(`Copied ${selectedFile.name} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = (file: SiteFile) => {
    if (file.isBinary) {
      const link = document.createElement("a");
      link.href = `data:${file.contentType || "application/octet-stream"};base64,${file.content}`;
      link.download = file.name;
      link.click();
    } else {
      const blob = new Blob([file.content], { type: file.contentType || "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    }
    showToast(`Downloaded ${file.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-5xl rounded-3xl bg-[#090d1a] border border-purple-500/30 shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{site.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  /{site.slug}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {files.length} deployed file(s) • Live at{" "}
                <a
                  href={`/raw-site/${site.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-300 hover:underline"
                >
                  {site.slug}.skedz.vercel.app
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/sites/${site.slug}/download`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition"
            >
              <FolderArchive className="w-4 h-4 text-cyan-400" />
              <span>Download ZIP</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Split: File Explorer + Code Viewer */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 min-h-0 overflow-hidden">
          {/* Left Column: File List */}
          <div className="rounded-2xl bg-black/40 border border-white/10 flex flex-col overflow-hidden">
            <div className="px-3.5 py-2.5 bg-white/[0.02] border-b border-white/10 text-xs font-mono font-semibold text-slate-400 flex items-center justify-between">
              <span>Project Files ({files.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5 font-mono text-xs">
              {files.map((f) => {
                const isSelected = selectedFile?.path === f.path;
                const isEntry = (site.entryFile || "index.html").toLowerCase() === f.path.toLowerCase();
                const lang = getFileLanguage(f.name);

                return (
                  <div
                    key={f.path}
                    onClick={() => setSelectedFile(f)}
                    className={`px-3 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition ${
                      isSelected
                        ? "bg-purple-600/20 text-white font-semibold"
                        : "text-slate-300 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? "text-cyan-400" : "text-slate-500"
                        }`}
                      />
                      <span className="truncate">{f.path}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEntry && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-purple-600 text-white font-bold">
                          ENTRY
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">{lang}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Code Viewer */}
          <div className="md:col-span-2 rounded-2xl bg-black/60 border border-white/10 flex flex-col overflow-hidden">
            {selectedFile ? (
              <>
                <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-white font-bold">{selectedFile.path}</span>
                    <span className="text-slate-500">
                      ({((selectedFile.size || selectedFile.content?.length || 0) / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/raw-site/${site.slug}/${selectedFile.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 transition"
                      title="Open Raw File"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleDownloadSingle(selectedFile)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-purple-300 transition"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {!selectedFile.isBinary && (
                      <button
                        onClick={handleCopyContent}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200">
                  {selectedFile.isBinary ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                      {selectedFile.contentType?.startsWith("image/") ? (
                        <div className="max-w-xs max-h-64 rounded-xl overflow-hidden border border-white/10 bg-black/40 p-2">
                          <img
                            src={`data:${selectedFile.contentType};base64,${selectedFile.content}`}
                            alt={selectedFile.name}
                            className="max-h-56 object-contain mx-auto rounded-lg"
                          />
                        </div>
                      ) : (
                        <p>Binary asset file ({selectedFile.contentType || "raw bytes"})</p>
                      )}
                    </div>
                  ) : (
                    <pre className="whitespace-pre font-mono leading-relaxed selection:bg-purple-600/40">
                      <code>{selectedFile.content}</code>
                    </pre>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-xs">
                Select a file on the left to inspect its contents.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
