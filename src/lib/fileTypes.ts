/**
 * Comprehensive MIME type & file extension mapping for multi-file hosting
 * Supports: HTML, CSS, JS, TS, JSX, TSX, JSON, Markdown, Python, Ruby, PHP, SQL,
 * Shell, Rust, Go, Java, C/C++, Images, Fonts, Audio, Video, CSV, XML, YAML.
 */

export const MIME_TYPES: Record<string, string> = {
  // Web Core
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  cjs: "application/javascript; charset=utf-8",
  ts: "application/typescript; charset=utf-8",
  tsx: "text/typescript; charset=utf-8",
  jsx: "text/javascript; charset=utf-8",

  // Data & Docs
  json: "application/json; charset=utf-8",
  jsonld: "application/ld+json; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  markdown: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  tsv: "text/tab-separated-values; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  yaml: "text/yaml; charset=utf-8",
  yml: "text/yaml; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  log: "text/plain; charset=utf-8",
  env: "text/plain; charset=utf-8",

  // Programming Languages
  py: "text/x-python; charset=utf-8",
  rb: "text/x-ruby; charset=utf-8",
  php: "text/x-php; charset=utf-8",
  sql: "application/sql; charset=utf-8",
  sh: "application/x-sh; charset=utf-8",
  bash: "application/x-sh; charset=utf-8",
  zsh: "application/x-sh; charset=utf-8",
  go: "text/x-go; charset=utf-8",
  rs: "text/rust; charset=utf-8",
  c: "text/x-c; charset=utf-8",
  cpp: "text/x-c++; charset=utf-8",
  h: "text/x-c; charset=utf-8",
  hpp: "text/x-c++; charset=utf-8",
  java: "text/x-java; charset=utf-8",
  kt: "text/x-kotlin; charset=utf-8",
  swift: "text/x-swift; charset=utf-8",
  dart: "application/vnd.dart; charset=utf-8",

  // Visual & Media
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  bmp: "image/bmp",
  tiff: "image/tiff",

  // Fonts
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",

  // Audio / Video
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  webm: "video/webm",

  // Documents / Packages
  pdf: "application/pdf",
  zip: "application/zip",
  tar: "application/x-tar",
  gz: "application/gzip",
};

export const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "tiff",
  "woff", "woff2", "ttf", "otf", "eot",
  "mp3", "wav", "ogg", "mp4", "webm",
  "pdf", "zip", "tar", "gz"
]);

export function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return MIME_TYPES[ext] || "text/plain; charset=utf-8";
}

export function isBinaryFile(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return BINARY_EXTENSIONS.has(ext);
}

export function getFileLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "html": case "htm": return "HTML";
    case "css": return "CSS";
    case "js": case "mjs": case "cjs": return "JavaScript";
    case "ts": return "TypeScript";
    case "tsx": return "React TSX";
    case "jsx": return "React JSX";
    case "json": return "JSON";
    case "md": case "markdown": return "Markdown";
    case "py": return "Python";
    case "rb": return "Ruby";
    case "php": return "PHP";
    case "sql": return "SQL";
    case "sh": case "bash": return "Shell";
    case "go": return "Go";
    case "rs": return "Rust";
    case "c": case "h": return "C";
    case "cpp": case "hpp": return "C++";
    case "java": return "Java";
    case "yaml": case "yml": return "YAML";
    case "xml": return "XML";
    case "svg": return "SVG";
    case "png": case "jpg": case "jpeg": case "webp": case "gif": return "Image";
    default: return ext.toUpperCase() || "File";
  }
}

export function detectProjectType(files: Array<{ path: string; name: string }>): 'web' | 'fullstack' | 'markdown' | 'json' | 'code' | 'other' {
  const paths = files.map(f => f.path.toLowerCase());
  const hasHtml = paths.some(p => p.endsWith(".html") || p.endsWith(".htm"));
  const hasJson = paths.some(p => p.endsWith(".json"));
  const hasJsOrTs = paths.some(p => p.endsWith(".js") || p.endsWith(".ts") || p.endsWith(".jsx") || p.endsWith(".tsx"));
  const hasMd = paths.some(p => p.endsWith(".md") || p.endsWith(".markdown"));

  if (hasHtml && (hasJsOrTs || hasJson)) return "fullstack";
  if (hasHtml) return "web";
  if (hasJson && paths.length === 1) return "json";
  if (hasMd && paths.length === 1) return "markdown";
  if (paths.some(p => /\.(py|rb|php|sql|sh|go|rs|cpp|c|java)$/.test(p))) return "code";
  return "other";
}

/**
 * Renders Markdown into clean styled HTML with GitHub/Dark theme
 */
export function renderMarkdownToHtml(md: string, title: string = "Markdown Document"): string {
  // Simple, safe client/server markdown-to-html renderer
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks: ```lang ... ```
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<div class="code-block"><div class="code-header">${lang || "code"}</div><pre><code>${code.trim()}</code></pre></div>`;
  });

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Unordered list items
  html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  // Paragraphs
  const paragraphs = html
    .split(/\n{2,}/)
    .map(p => {
      p = p.trim();
      if (!p) return "";
      if (/^<(h1|h2|h3|ul|ol|div|blockquote)/.test(p)) return p;
      return `<p>${p.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      color-scheme: dark;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2.5rem 1.5rem;
      background: #090d16;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.7;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #0d1322;
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.7);
    }
    h1, h2, h3 { color: #f8fafc; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; }
    h1 { font-size: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; color: #a78bfa; }
    h2 { font-size: 1.5rem; color: #38bdf8; }
    h3 { font-size: 1.2rem; }
    p { margin: 0.8rem 0; color: #cbd5e1; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .inline-code {
      background: rgba(255,255,255,0.08);
      padding: 0.2rem 0.4rem;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.88em;
      color: #f43f5e;
    }
    .code-block {
      margin: 1.2rem 0;
      background: #040711;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      overflow: hidden;
    }
    .code-header {
      background: rgba(255,255,255,0.04);
      padding: 0.4rem 0.8rem;
      font-size: 0.75rem;
      font-family: monospace;
      color: #94a3b8;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      text-transform: uppercase;
    }
    pre {
      margin: 0;
      padding: 1rem;
      overflow-x: auto;
    }
    pre code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9rem;
      color: #e2e8f0;
    }
    blockquote {
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      border-left: 4px solid #a78bfa;
      background: rgba(167, 139, 250, 0.05);
      color: #cbd5e1;
    }
    ul, ol { padding-left: 1.5rem; margin: 0.8rem 0; }
    li { margin: 0.3rem 0; }
  </style>
</head>
<body>
  <div class="container">
    ${paragraphs}
  </div>
</body>
</html>`;
}

/**
 * Formats raw code (Python, C++, JS, SQL, JSON, etc.) into an interactive HTML code viewer
 */
export function renderCodeViewerToHtml(code: string, fileName: string, language: string): string {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  const numberedLines = lines
    .map((line, idx) => `<span class="line-num">${idx + 1}</span><span class="line-content">${line || "&nbsp;"}</span>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName} - SKEDZ Source Viewer</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #040711;
      color: #f1f5f9;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.25rem;
      background: #0a0f1d;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .file-title {
      font-weight: 600;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .lang-badge {
      background: rgba(167, 139, 250, 0.15);
      border: 1px solid rgba(167, 139, 250, 0.3);
      color: #c4b5fd;
      font-size: 11px;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .copy-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }
    .copy-btn:hover { background: rgba(255,255,255,0.2); }
    pre {
      margin: 0;
      padding: 1rem 0;
      white-space: pre;
    }
    .code-container {
      display: flex;
      flex-direction: column;
    }
    .line-num {
      display: inline-block;
      width: 48px;
      text-align: right;
      padding-right: 16px;
      color: #475569;
      user-select: none;
    }
    .line-content {
      color: #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="file-title">
      <span>📄 ${fileName}</span>
      <span class="lang-badge">${language}</span>
      <span style="color:#64748b;font-size:11px;">(${lines.length} lines)</span>
    </div>
    <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('raw-code').textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy Code',2000)">Copy Code</button>
  </div>
  <pre><code>${numberedLines}</code></pre>
  <div id="raw-code" style="display:none;">${escaped}</div>
</body>
</html>`;
}
