import React, { useState, useRef } from "react";
import JSZip from "jszip";
import { SiteFile, DynamicSite } from "../../types";
import { safeFetchJson } from "../../lib/apiHelper";
import {
  getMimeType,
  isBinaryFile,
  getFileLanguage,
  detectProjectType,
} from "../../lib/fileTypes";
import {
  X,
  Upload,
  FolderUp,
  FileArchive,
  FileCode,
  FilePlus,
  Trash2,
  Edit3,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Code2,
} from "lucide-react";

interface ProjectFileDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (site: DynamicSite) => void;
  token: string | null;
  showToast: (msg: string) => void;
  saveOfflineData: (patch: any) => void;
  existingSites: DynamicSite[];
}

export default function ProjectFileDeployModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  showToast,
  saveOfflineData,
  existingSites,
}: ProjectFileDeployModalProps) {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<SiteFile[]>([]);
  const [entryFile, setEntryFile] = useState<string>("");
  const [deploying, setDeploying] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active file editor / inspector
  const [activeEditingPath, setActiveEditingPath] = useState<string | null>(null);
  const [editFileContent, setEditFileContent] = useState("");
  const [editFileName, setEditFileName] = useState("");

  // New file creator
  const [isCreatingNewFile, setIsCreatingNewFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileTemplate, setNewFileTemplate] = useState<"html" | "css" | "js" | "json" | "md" | "custom">("html");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto-detect project type and total size
  const projectType = detectProjectType(files);
  const totalBytes = files.reduce((acc, f) => acc + (f.size || f.content?.length || 0), 0);

  // Suggest slug & title from files if empty
  const updateProjectMetadataFromFiles = (newFiles: SiteFile[]) => {
    if (newFiles.length === 0) return;

    // Find best entry file
    let candidateEntry = entryFile;
    if (!candidateEntry) {
      const indexHtml = newFiles.find(
        (f) => f.name.toLowerCase() === "index.html" || f.path.toLowerCase() === "index.html"
      );
      if (indexHtml) {
        candidateEntry = indexHtml.path;
      } else {
        const readme = newFiles.find(
          (f) => f.name.toLowerCase() === "readme.md" || f.path.toLowerCase() === "readme.md"
        );
        if (readme) {
          candidateEntry = readme.path;
        } else {
          candidateEntry = newFiles[0].path;
        }
      }
      setEntryFile(candidateEntry);
    }

    if (!slug) {
      const first = newFiles[0];
      const rawName = first.path.split("/")[0] || first.name;
      const clean = rawName
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .slice(0, 30);
      setSlug(clean || "project");
    }

    if (!title) {
      // If HTML has <title>, try extracting
      const htmlFile = newFiles.find((f) => f.path.endsWith(".html") || f.path.endsWith(".htm"));
      if (htmlFile && typeof htmlFile.content === "string") {
        const titleMatch = htmlFile.content.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          setTitle(titleMatch[1].trim());
          return;
        }
      }
      const raw = newFiles[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(raw.charAt(0).toUpperCase() + raw.slice(1));
    }
  };

  // 1. Handle Multiple File Upload
  const handleMultipleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);

    const loadedFiles: SiteFile[] = [...files];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = (file as any).webkitRelativePath || file.name;
      const cleanPath = relPath.replace(/^\/+/, "");

      const isBinary = isBinaryFile(file.name);
      if (isBinary) {
        const base64 = await readFileAsBase64(file);
        const existingIdx = loadedFiles.findIndex((f) => f.path === cleanPath);
        const siteFile: SiteFile = {
          name: file.name,
          path: cleanPath,
          content: base64,
          contentType: getMimeType(file.name),
          size: file.size,
          isBinary: true,
        };
        if (existingIdx !== -1) loadedFiles[existingIdx] = siteFile;
        else loadedFiles.push(siteFile);
      } else {
        const text = await readFileAsText(file);
        const existingIdx = loadedFiles.findIndex((f) => f.path === cleanPath);
        const siteFile: SiteFile = {
          name: file.name,
          path: cleanPath,
          content: text,
          contentType: getMimeType(file.name),
          size: file.size,
          isBinary: false,
        };
        if (existingIdx !== -1) loadedFiles[existingIdx] = siteFile;
        else loadedFiles.push(siteFile);
      }
    }

    setFiles(loadedFiles);
    updateProjectMetadataFromFiles(loadedFiles);
    showToast(`Loaded ${fileList.length} file(s)`);
  };

  // 2. Handle ZIP File Upload
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    try {
      showToast("Unpacking ZIP archive...");
      const zip = await JSZip.loadAsync(file);
      const extracted: SiteFile[] = [];

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        // Skip OS hidden files like __MACOSX or .DS_Store
        if (relativePath.includes("__MACOSX") || relativePath.includes(".DS_Store")) continue;

        const cleanPath = relativePath.replace(/^\/+/, "");
        const fileName = cleanPath.split("/").pop() || cleanPath;

        if (isBinaryFile(fileName)) {
          const b64 = await zipEntry.async("base64");
          extracted.push({
            name: fileName,
            path: cleanPath,
            content: b64,
            contentType: getMimeType(fileName),
            isBinary: true,
          });
        } else {
          const text = await zipEntry.async("string");
          extracted.push({
            name: fileName,
            path: cleanPath,
            content: text,
            contentType: getMimeType(fileName),
            size: text.length,
            isBinary: false,
          });
        }
      }

      if (extracted.length === 0) {
        throw new Error("No files found inside the ZIP archive.");
      }

      setFiles(extracted);
      updateProjectMetadataFromFiles(extracted);
      showToast(`Successfully extracted ${extracted.length} files from ${file.name}!`);
    } catch (err: any) {
      console.error("ZIP load error:", err);
      setUploadError(err.message || "Failed to parse ZIP archive");
    } finally {
      e.target.value = "";
    }
  };

  // 3. Helper FileReader
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const b64 = res.split(",")[1] || "";
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 4. Manual File Creation
  const handleCreateNewFile = () => {
    if (!newFilePath.trim()) {
      alert("Please enter a file path (e.g. index.html or api/data.json)");
      return;
    }
    const cleanPath = newFilePath.trim().replace(/^\/+/, "");
    const fileName = cleanPath.split("/").pop() || cleanPath;

    let initialTemplate = "";
    if (newFileTemplate === "html") {
      initialTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "New Web Page"}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-gray-950 text-white min-h-screen p-8">
  <h1 class="text-3xl font-bold mb-4">${title || "Hello World"}</h1>
  <p class="text-gray-400">Deployed live on SKEDZ Portal.</p>
  <script src="script.js"></script>
</body>
</html>`;
    } else if (newFileTemplate === "css") {
      initialTemplate = `/* Project Styling */
body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #030712;
  color: #f8fafc;
}`;
    } else if (newFileTemplate === "js") {
      initialTemplate = `// Sub-Site Interactive Script
console.log("Sub-site loaded successfully!");

fetch('./data.json')
  .then(res => res.json())
  .then(data => console.log("Loaded local project data:", data))
  .catch(err => console.warn("No data.json yet"));
`;
    } else if (newFileTemplate === "json") {
      initialTemplate = JSON.stringify(
        {
          name: title || "Sub-site Project",
          version: "1.0.0",
          status: "active",
          items: [
            { id: 1, title: "Item 1", value: 100 },
            { id: 2, title: "Item 2", value: 250 },
          ],
        },
        null,
        2
      );
    } else if (newFileTemplate === "md") {
      initialTemplate = `# ${title || "Project Documentation"}

Welcome to the live project documentation hosted on **SKEDZ-S.PORTAL**.

### Features:
- Direct Markdown rendering
- Full code syntax highlighting
- Native link resolution
`;
    }

    const newFileObj: SiteFile = {
      name: fileName,
      path: cleanPath,
      content: initialTemplate,
      contentType: getMimeType(fileName),
      size: initialTemplate.length,
      isBinary: false,
    };

    const updated = [...files, newFileObj];
    setFiles(updated);
    updateProjectMetadataFromFiles(updated);
    setIsCreatingNewFile(false);
    setNewFilePath("");
    showToast(`Created new file ${cleanPath}`);
  };

  // 5. Open File in Built-in Editor
  const handleOpenFileEditor = (file: SiteFile) => {
    if (file.isBinary) {
      alert("Binary files (images, archives) cannot be edited as text.");
      return;
    }
    setActiveEditingPath(file.path);
    setEditFileName(file.name);
    setEditFileContent(file.content);
  };

  const handleSaveFileEdit = () => {
    if (!activeEditingPath) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.path === activeEditingPath
          ? {
              ...f,
              content: editFileContent,
              size: editFileContent.length,
            }
          : f
      )
    );
    showToast(`Saved changes to ${activeEditingPath}`);
    setActiveEditingPath(null);
  };

  // 6. Remove File
  const handleRemoveFile = (pathToRemove: string) => {
    const remaining = files.filter((f) => f.path !== pathToRemove);
    setFiles(remaining);
    if (entryFile === pathToRemove) {
      setEntryFile(remaining[0]?.path || "");
    }
  };

  // 7. Deploy Entire Project
  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!slug.trim()) {
      alert("Please enter a route slug (e.g. 'portfolio' or 'webapp')");
      return;
    }

    if (files.length === 0) {
      alert("Please add or upload at least one file to deploy.");
      return;
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
    if (!cleanSlug) {
      alert("Invalid slug format. Use letters, numbers, hyphens or underscores.");
      return;
    }

    setDeploying(true);
    setUploadError(null);

    const payload = {
      slug: cleanSlug,
      title: title || cleanSlug,
      description: description || `Deployed ${files.length} file(s) • ${projectType.toUpperCase()}`,
      files,
      entryFile: entryFile || files[0].path,
      projectType,
    };

    try {
      const resp = await safeFetchJson<{ success: boolean; site: DynamicSite }>("/api/sites/upload-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok || !resp.data?.success || !resp.data?.site) {
        console.warn("Backend server deployment returned non-success, saving locally:", resp.error);
        // Fallback to local storage for offline / static mode
        const existingIdx = existingSites.findIndex((s) => s.slug.toLowerCase() === cleanSlug);
        const localSite: DynamicSite = {
          id: existingIdx !== -1 ? existingSites[existingIdx].id : `site-${Date.now()}`,
          slug: cleanSlug,
          title: title || cleanSlug,
          description: description || `Deployed ${files.length} file(s) • ${projectType.toUpperCase()}`,
          files,
          entryFile: entryFile || files[0].path,
          projectType,
          fileName: entryFile || files[0].path,
          fileSize: totalBytes,
          author: "Admin",
          createdAt: existingIdx !== -1 ? existingSites[existingIdx].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedSites =
          existingIdx !== -1
            ? existingSites.map((s) => (s.id === localSite.id ? localSite : s))
            : [...existingSites, localSite];

        saveOfflineData({ sites: updatedSites });
        showToast(`Deployed locally! Available at /${cleanSlug}`);
        onSuccess(localSite);
        onClose();
        return;
      }

      showToast(`Deployed! Resolves live at ${cleanSlug}.skedz.vercel.app and /${cleanSlug}`);
      onSuccess(resp.data.site);
      onClose();
    } catch (err: any) {
      console.error("Deploy error:", err);
      setUploadError(err.message || "Failed to deploy project");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="w-full max-w-4xl rounded-3xl bg-[#090d1a] border border-purple-500/30 shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Deploy Multi-File Fullstack Web & Code</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 uppercase">
                  {projectType}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Upload HTML, CSS, JS, JSON, Markdown, Python, or complete ZIP folders with zero limits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload Action Toolbar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Multiple Files */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 text-xs font-semibold transition"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Upload Files</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleMultipleFiles(e.target.files)}
            className="hidden"
          />

          {/* Folder Upload */}
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 text-xs font-semibold transition"
          >
            <FolderUp className="w-4 h-4 text-cyan-400" />
            <span>Upload Folder</span>
          </button>
          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            // @ts-ignore
            directory="true"
            multiple
            onChange={(e) => handleMultipleFiles(e.target.files)}
            className="hidden"
          />

          {/* ZIP Archive */}
          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition"
          >
            <FileArchive className="w-4 h-4 text-indigo-400" />
            <span>Upload ZIP</span>
          </button>
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={handleZipUpload}
            className="hidden"
          />

          {/* Add New File */}
          <button
            type="button"
            onClick={() => setIsCreatingNewFile(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold transition"
          >
            <FilePlus className="w-4 h-4 text-emerald-400" />
            <span>+ New File</span>
          </button>
        </div>

        {/* Inline Create File Creator */}
        {isCreatingNewFile && (
          <div className="mt-4 p-4 rounded-2xl bg-black/50 border border-emerald-500/40 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 font-mono">Create New Project File</span>
              <button
                type="button"
                onClick={() => setIsCreatingNewFile(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Path e.g. api/users.json or style.css"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <select
                value={newFileTemplate}
                onChange={(e) => setNewFileTemplate(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl bg-[#090d1a] border border-white/10 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              >
                <option value="html">HTML Template</option>
                <option value="css">CSS Template</option>
                <option value="js">JavaScript Template</option>
                <option value="json">JSON API Template</option>
                <option value="md">Markdown Template</option>
                <option value="custom">Blank File</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreateNewFile}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Create File
              </button>
            </div>
          </div>
        )}

        {/* Files Explorer Table */}
        <div className="mt-4 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Project Files ({files.length})</span>
            <span>Total: {(totalBytes / 1024).toFixed(1)} KB</span>
          </div>

          {files.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              No files in project yet. Click &quot;Upload Files&quot;, &quot;Upload Folder&quot;, &quot;Upload ZIP&quot;, or &quot;+ New File&quot; above.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto divide-y divide-white/5 font-mono text-xs">
              {files.map((file) => {
                const isEntry = entryFile === file.path;
                const lang = getFileLanguage(file.name);

                return (
                  <div
                    key={file.path}
                    className={`px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition ${
                      isEntry ? "bg-purple-950/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setEntryFile(file.path)}
                        title={isEntry ? "Current Entrypoint" : "Click to set as Entrypoint"}
                        className={`p-1 rounded-md transition ${
                          isEntry
                            ? "text-amber-400 hover:text-amber-300"
                            : "text-slate-600 hover:text-slate-300"
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" fill={isEntry ? "currentColor" : "none"} />
                      </button>

                      <span className="text-white font-medium truncate">{file.path}</span>

                      {isEntry && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-purple-600/60 text-purple-200 border border-purple-400/40">
                          ENTRY
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-slate-400 border border-white/5">
                        {lang}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-500 text-[11px]">
                        {((file.size || file.content?.length || 0) / 1024).toFixed(1)} KB
                      </span>

                      {!file.isBinary && (
                        <button
                          type="button"
                          onClick={() => handleOpenFileEditor(file)}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 transition"
                          title="View / Edit Code"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.path)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                        title="Remove File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inline Code Editor Modal / Drawer */}
        {activeEditingPath && (
          <div className="mt-4 p-4 rounded-2xl bg-[#030712] border border-purple-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white">
                  Editing: <span className="text-cyan-300">{activeEditingPath}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveEditingPath(null)}
                  className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveFileEdit}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                >
                  Save Code
                </button>
              </div>
            </div>
            <textarea
              rows={10}
              value={editFileContent}
              onChange={(e) => setEditFileContent(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-slate-100 focus:border-purple-500 focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}

        {/* Routing & Metadata Form */}
        <form onSubmit={handleDeploy} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Subdomain & Route Slug *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-white/5 border border-r-0 border-white/10 rounded-l-xl text-slate-400 text-xs font-mono">
                  /
                </span>
                <input
                  type="text"
                  required
                  placeholder="portfolio"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-r-xl bg-white/[0.04] border border-white/10 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] font-mono text-cyan-300 mt-1 flex items-center gap-1">
                <ExternalLink className="w-2.5 h-2.5" />
                <span>Subdomain: </span>
                <span className="underline font-bold">
                  {slug ? `${slug}.skedz.vercel.app` : "project.skedz.vercel.app"}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Project Title
              </label>
              <input
                type="text"
                placeholder="Interactive Showcase"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="Multi-file fullstack web app with JSON endpoints & styles"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Deployment Submit Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-[11px] font-mono text-slate-400">
              Entrypoint: <span className="text-purple-300 font-bold">{entryFile || "index.html"}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-medium hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deploying || files.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition cursor-pointer"
              >
                {deploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deploying Project...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Deploy Fullstack Project Live</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
