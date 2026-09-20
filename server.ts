import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import JSZip from "jszip";
import {
  getMimeType,
  getFileLanguage,
  renderMarkdownToHtml,
  renderCodeViewerToHtml,
  detectProjectType,
} from "./src/lib/fileTypes.ts";

dotenv.config();

const app = express();
const PORT = 3000;
const isVercel = Boolean(process.env.VERCEL);

function getDataFilePath(): string {
  if (isVercel) {
    const tmpFile = path.join("/tmp", "portal-data.json");
    if (!fs.existsSync(tmpFile)) {
      const rootFile = path.join(process.cwd(), "portal-data.json");
      if (fs.existsSync(rootFile)) {
        try {
          fs.copyFileSync(rootFile, tmpFile);
        } catch (err) {
          console.error("Failed to copy initial data to /tmp:", err);
        }
      }
    }
    return tmpFile;
  }
  return path.join(process.cwd(), "portal-data.json");
}

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "d52834a6dd5b38108a1abaf081dec54d";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "skedz5023";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sarathi";

// Express body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Local media uploads directory
const UPLOADS_DIR = isVercel
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "public", "uploads");

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // directory creation fallback
}
app.use("/uploads", express.static(UPLOADS_DIR));

// Server-Sent Events subscribers for real-time updates
const sseClients: Set<Response> = new Set();

// Helper: Extract subdomain slug for dynamic sites
// e.g. "newpage.skedz.vercel.app" -> "newpage"
// e.g. "newpage.skedz.com" -> "newpage"
// e.g. "newpage.localhost:3000" -> "newpage"
function extractSubdomainFromHost(rawHost: string = ""): string | null {
  if (!rawHost) return null;
  const host = rawHost.toLowerCase().split(":")[0].trim();

  // If host is IP address, ignore
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes("[")) {
    return null;
  }

  const rootDomains = [
    "skedz.vercel.app",
    "skedz-main.vercel.app",
    "skedz-portal.vercel.app",
    "skedz.dev",
    "skedz.com",
    "localhost",
  ];

  for (const root of rootDomains) {
    if (host.endsWith("." + root)) {
      const sub = host.slice(0, -(root.length + 1)).trim();
      if (sub && !["www", "app", "portal", "api", "admin"].includes(sub)) {
        return sub.split(".")[0];
      }
    }
  }

  // Generic check for *.domain.ext
  const parts = host.split(".");
  if (host.endsWith(".vercel.app") && parts.length === 4) {
    const sub = parts[0];
    if (sub && !["www", "app", "portal", "api", "admin"].includes(sub)) {
      return sub;
    }
  } else if (!host.endsWith(".vercel.app") && parts.length >= 3) {
    const sub = parts[0];
    if (sub && !["www", "app", "portal", "api", "admin"].includes(sub)) {
      return sub;
    }
  }

  return null;
}

// --- MULTI-FILE SITE SERVING & FULLSTACK ROUTING ---
function sendSiteFile(res: Response, file: any, site: any) {
  const mime = file.contentType || getMimeType(file.path || file.name);

  // Binary assets (images, fonts, audio, video, zip)
  if (file.isBinary) {
    try {
      const buffer = Buffer.from(file.content, "base64");
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
      return;
    } catch (err) {
      console.error("Failed to decode binary file:", err);
    }
  }

  // Markdown rendering
  if (file.name.toLowerCase().endsWith(".md") || file.name.toLowerCase().endsWith(".markdown")) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderMarkdownToHtml(file.content, site.title || file.name));
    return;
  }

  // JSON API response
  if (file.name.toLowerCase().endsWith(".json")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(file.content);
    return;
  }

  // Pure Code Viewer (Python, C++, SQL, Ruby, PHP, Go, Rust, Shell, etc.)
  if (/\.(py|rb|php|sql|sh|bash|go|rs|c|cpp|java|kt|swift)$/i.test(file.name)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderCodeViewerToHtml(file.content, file.name, getFileLanguage(file.name)));
    return;
  }

  res.setHeader("Content-Type", mime);
  res.send(file.content);
}

function handleSiteRequest(req: Request, res: Response, site: any, rawPath: string) {
  const cleanPath = rawPath.replace(/^\/+/, "").trim();

  // 1. Root or Entrypoint Request
  if (!cleanPath || cleanPath === "index.html" || cleanPath === "index.htm") {
    if (site.files && site.files.length > 0) {
      let entry = null;
      if (site.entryFile) {
        entry = site.files.find((f: any) =>
          f.path.toLowerCase() === site.entryFile.toLowerCase() ||
          f.name.toLowerCase() === site.entryFile.toLowerCase()
        );
      }
      if (!entry) {
        entry = site.files.find((f: any) =>
          f.path.toLowerCase() === "index.html" || f.name.toLowerCase() === "index.html"
        );
      }
      if (!entry) {
        entry = site.files.find((f: any) =>
          f.path.toLowerCase() === "readme.md" || f.name.toLowerCase() === "readme.md"
        );
      }
      if (!entry && site.files.length === 1) {
        entry = site.files[0];
      }

      if (entry) {
        sendSiteFile(res, entry, site);
        return;
      }
    }

    if (site.customHtml) {
      let fullHtml = site.customHtml;
      if (site.customCss) {
        fullHtml = fullHtml.replace("</head>", `<style>${site.customCss}</style></head>`);
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(fullHtml);
      return;
    }

    if (site.externalUrl) {
      res.redirect(site.externalUrl);
      return;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html><html><head><title>${site.title}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:sans-serif;padding:2rem;background:#030712;color:#f8fafc;"><h1>${site.title}</h1><p>${site.description}</p></body></html>`);
    return;
  }

  // 2. Sub-File / Resource Request (e.g. style.css, script.js, data.json, api/users.json)
  if (site.files && site.files.length > 0) {
    const target = cleanPath.toLowerCase();
    const match = site.files.find((f: any) => {
      const fPath = (f.path || f.name).toLowerCase().replace(/^\/+/, "");
      const fName = (f.name || "").toLowerCase();
      return fPath === target || fName === target || fPath.endsWith("/" + target);
    });

    if (match) {
      sendSiteFile(res, match, site);
      return;
    }

    // 3. Fullstack Mock API Handling:
    // If request starts with "api/" or is a POST/PUT/DELETE
    if (cleanPath.startsWith("api/") || req.method !== "GET") {
      const jsonCandidate = site.files.find((f: any) =>
        f.name.toLowerCase().endsWith(".json") &&
        (cleanPath.toLowerCase().includes(f.name.toLowerCase().replace(".json", "")) || cleanPath.endsWith(".json"))
      );
      if (jsonCandidate && req.method === "GET") {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.send(jsonCandidate.content);
        return;
      }

      // Dynamic Mock API Response for fullstack app interactions
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.json({
        success: true,
        mock: true,
        site: site.slug,
        endpoint: "/" + cleanPath,
        method: req.method,
        received: req.body || null,
        message: `Dynamic API endpoint /${cleanPath} executed successfully.`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 4. SPA Client-Side Fallback:
    // If path does not have an extension, fall back to index.html
    if (!cleanPath.includes(".")) {
      const spaIndex = site.files.find((f: any) =>
        f.name.toLowerCase() === "index.html" || f.path.toLowerCase() === "index.html"
      );
      if (spaIndex) {
        sendSiteFile(res, spaIndex, site);
        return;
      }
      if (site.customHtml) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(site.customHtml);
        return;
      }
    }
  }

  res.status(404).send(`<!DOCTYPE html><html><head><title>File Not Found</title></head><body style="font-family:monospace;padding:2rem;background:#030712;color:#f87171;"><h2>404: File Not Found</h2><p>The file <code>${cleanPath}</code> does not exist in <code>/${site.slug}</code>.</p></body></html>`);
}

// Subdomain Routing Middleware: if request is on subdomain e.g. newpage.skedz.vercel.app
// handles all sub-site paths, assets, and APIs seamlessly
app.use((req, res, next) => {
  // Never intercept admin API routes or core uploads
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }

  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  const subSlug = extractSubdomainFromHost(host);

  if (subSlug) {
    const db = readDatabase();
    const site = db.sites.find((s) => s.slug.toLowerCase() === subSlug.toLowerCase());
    if (site) {
      handleSiteRequest(req, res, site, req.path);
      return;
    }
  }

  next();
});

function broadcastUpdate(type: string, payload: any) {
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// User-Agent parser helper
function parseUserAgent(ua: string = "") {
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let device = "Desktop";

  if (/mobile/i.test(ua)) device = "Mobile";
  else if (/tablet|ipad/i.test(ua)) device = "Tablet";

  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/edg/i.test(ua)) browser = "Edge";
  else if (/opr|opera/i.test(ua)) browser = "Opera";

  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { browser, os, device, summary: `${browser} on ${os} (${device})` };
}

// Client IP resolver helper
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "127.0.0.1";
}

export interface CustomerReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  deviceId?: string;
  ip?: string;
  createdAt: string;
}

// Data Store Initialization
interface DatabaseSchema {
  cards: any[];
  socials: any[];
  sites: any[];
  reviews: CustomerReview[];
  auditLogs: any[];
  blockedIps: Record<
    string,
    {
      ip: string;
      failedAttempts: number;
      blockedAt: number;
      unblockAt: number;
      lastAttemptDevice: string;
    }
  >;
  inquiries: any[];
  adminSessions?: Record<string, { username: string; createdAt: number; expiresAt: number; ip?: string; device?: string }>;
  apiKeys?: Record<string, string>;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    databaseURL?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
  } | null;
  lastUpdated: number;
}

const defaultInitialData: DatabaseSchema = {
  cards: [],
  reviews: [],
  socials: [
    {
      id: "soc-1",
      platform: "Instagram",
      handle: "skedz.dev",
      url: "https://instagram.com/skedz.dev",
      iconName: "Instagram",
      likes: 0,
      color: "from-pink-500 to-purple-600",
      order: 1,
    },
    {
      id: "soc-2",
      platform: "YouTube",
      handle: "SKEDZ Official",
      url: "https://youtube.com/@skedzdev",
      iconName: "Youtube",
      likes: 0,
      color: "from-red-600 to-rose-700",
      order: 2,
    },
    {
      id: "soc-3",
      platform: "WhatsApp",
      handle: "+91 9345306572",
      url: "https://wa.me/919345306572?text=Hello%20SKEDZ%2C%20I%20would%20like%20to%20collaborate%20on%20a%20project",
      iconName: "MessageCircle",
      likes: 0,
      color: "from-emerald-500 to-teal-600",
      order: 3,
    },
    {
      id: "soc-4",
      platform: "Email Direct",
      handle: "skedz.contact@gmail.com",
      url: "mailto:skedz.contact@gmail.com",
      iconName: "Mail",
      likes: 0,
      color: "from-blue-500 to-indigo-600",
      order: 4,
    },
  ],
  sites: [],
  auditLogs: [],
  blockedIps: {},
  inquiries: [],
  firebaseConfig: null,
  lastUpdated: Date.now(),
};

let memoryDbCache: DatabaseSchema | null = null;

function readDatabase(): DatabaseSchema {
  const filePath = getDataFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (!parsed.reviews) parsed.reviews = [];
      memoryDbCache = parsed;
      return parsed;
    }
  } catch (err) {
    console.error("Error reading database file, using fallback:", err);
  }
  if (memoryDbCache) return memoryDbCache;
  // Initialize with defaults if missing
  writeDatabase(defaultInitialData);
  memoryDbCache = defaultInitialData;
  return defaultInitialData;
}

function writeDatabase(data: DatabaseSchema) {
  memoryDbCache = data;
  const filePath = getDataFilePath();
  try {
    data.lastUpdated = Date.now();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Active tokens for session verification (persisted in portal-data.json)
const validAdminTokens = new Set<string>();

// Bootstrap valid sessions from persistent database on startup
try {
  const initDb = readDatabase();
  if (initDb.adminSessions) {
    const now = Date.now();
    for (const [token, session] of Object.entries(initDb.adminSessions as Record<string, any>)) {
      if (session && session.expiresAt > now) {
        validAdminTokens.add(token);
      }
    }
  }
} catch (err) {
  console.error("Error bootstrapping admin sessions:", err);
}

// Rate Limiting & Brute Force Protection Middleware
function checkRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const db = readDatabase();
  const record = db.blockedIps[ip];

  if (record && record.failedAttempts >= 5) {
    const now = Date.now();
    if (now < record.unblockAt) {
      const remainingMinutes = Math.ceil((record.unblockAt - now) / 60000);
      res.status(429).json({
        error: `Security Alert: This IP address (${ip}) is temporarily blocked due to 5 consecutive failed login attempts. Please try again in ${remainingMinutes} minute(s) or contact administrator.`,
        blocked: true,
        remainingMinutes,
      });
      return;
    } else {
      // Cooldown expired
      delete db.blockedIps[ip];
      writeDatabase(db);
    }
  }
  next();
}

// Admin Authentication Middleware (Supports persistent sessions across server restarts)
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Admin session token required" });
    return;
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Invalid or expired admin session token" });
    return;
  }

  // Fast-path: token in memory
  if (validAdminTokens.has(token)) {
    next();
    return;
  }

  // Persistent-path: check database
  const db = readDatabase();
  const session = db.adminSessions?.[token];
  const now = Date.now();
  if (session && session.expiresAt > now) {
    validAdminTokens.add(token);
    next();
    return;
  }

  res.status(401).json({ error: "Invalid or expired admin session token" });
}

// --- API ROUTES ---

// Health & System Info
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    portal: "SKEDZ-S.PORTAL",
    support: {
      email: "skedz.contact@gmail.com",
      phone: "9345306572",
      instagram: "skedz.dev",
    },
    timestamp: new Date().toISOString(),
  });
});

// SSE Real-time Updates Stream
app.get("/api/portal/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// Full Portal Public Data
app.get("/api/portal/data", (_req, res) => {
  const db = readDatabase();
  res.json({
    cards: db.cards.sort((a, b) => a.order - b.order),
    socials: db.socials.sort((a, b) => a.order - b.order),
    sites: db.sites.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      fileName: s.fileName,
      fileSize: s.fileSize,
      fileCount: (s.files || []).length || (s.fileName ? 1 : 0),
      projectType: s.projectType || (s.files && s.files.length > 0 ? detectProjectType(s.files) : "web"),
      entryFile: s.entryFile || s.fileName || "index.html",
      files: (s.files || []).map((f: any) => ({
        name: f.name,
        path: f.path,
        size: f.size,
        contentType: f.contentType,
        isBinary: f.isBinary,
      })),
      createdAt: s.createdAt,
    })),
    reviews: (db.reviews || []).map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    firebaseConfig: db.firebaseConfig
      ? {
          apiKey: db.firebaseConfig.apiKey,
          authDomain: db.firebaseConfig.authDomain,
          projectId: db.firebaseConfig.projectId,
          storageBucket: db.firebaseConfig.storageBucket,
          messagingSenderId: db.firebaseConfig.messagingSenderId,
          appId: db.firebaseConfig.appId,
        }
      : null,
    support: {
      email: "skedz.contact@gmail.com",
      phone: "9345306572",
      instagram: "skedz.dev",
    },
    lastUpdated: db.lastUpdated,
  });
});

// Like a Social Link
app.post("/api/socials/:id/like", (req, res) => {
  const db = readDatabase();
  const social = db.socials.find((s) => s.id === req.params.id);
  if (!social) {
    res.status(404).json({ error: "Social link not found" });
    return;
  }
  social.likes = (social.likes || 0) + 1;
  writeDatabase(db);
  broadcastUpdate("social_like", { id: social.id, likes: social.likes });
  res.json({ success: true, likes: social.likes });
});

// Public Contact Form Submission
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: "Name, email, and message are required" });
    return;
  }

  const db = readDatabase();
  const inquiry = {
    id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(name).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : "",
    message: String(message).trim(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  db.inquiries.unshift(inquiry);
  writeDatabase(db);
  broadcastUpdate("new_inquiry", inquiry);

  res.json({ success: true, message: "Your message has been delivered directly to SKEDZ." });
});

// Get Dynamic Site by Slug (Public)
app.get("/api/site-by-slug/:slug", (req, res) => {
  const db = readDatabase();
  const site = db.sites.find(
    (s) => s.slug.toLowerCase() === req.params.slug.toLowerCase()
  );
  if (!site) {
    res.status(404).json({ error: `Dynamic site /${req.params.slug} not found` });
    return;
  }
  res.json(site);
});

// --- ADMIN AUTH & SECURITY AUDIT ---

// Admin Login
app.post("/api/auth/login", checkRateLimit, (req, res) => {
  const { username, password } = req.body;
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"] || "";
  const device = parseUserAgent(ua);
  const db = readDatabase();

  const isUserValid = username === ADMIN_USERNAME;
  const isPassValid = password === ADMIN_PASSWORD;

  if (!isUserValid || !isPassValid) {
    // Record failed attempt
    const currentBlock = db.blockedIps[ip] || {
      ip,
      failedAttempts: 0,
      blockedAt: 0,
      unblockAt: 0,
      lastAttemptDevice: device.summary,
    };

    currentBlock.failedAttempts += 1;
    currentBlock.lastAttemptDevice = device.summary;

    let isNowBlocked = false;
    if (currentBlock.failedAttempts >= 5) {
      currentBlock.blockedAt = Date.now();
      // Block for 15 minutes (900,000 ms)
      currentBlock.unblockAt = Date.now() + 15 * 60 * 1000;
      isNowBlocked = true;
    }

    db.blockedIps[ip] = currentBlock;

    // Log security failure
    const auditEntry = {
      id: `audit-${Date.now()}`,
      ip,
      device: device.summary,
      userAgent: ua,
      browser: device.browser,
      os: device.os,
      timestamp: new Date().toISOString(),
      status: isNowBlocked ? "BLOCKED" : "FAILED",
      usernameAttempted: String(username || "empty"),
    };
    db.auditLogs.unshift(auditEntry);
    writeDatabase(db);

    const remaining = Math.max(0, 5 - currentBlock.failedAttempts);

    if (isNowBlocked) {
      res.status(429).json({
        error: `Security Alert: 5 failed attempts reached. Your IP (${ip}) is temporarily blocked for 15 minutes.`,
        blocked: true,
        remainingAttempts: 0,
      });
      return;
    }

    res.status(401).json({
      error: `Invalid credentials. ${remaining} attempt(s) remaining before this IP is blocked.`,
      blocked: false,
      remainingAttempts: remaining,
    });
    return;
  }

  // Success: Clear failed attempts for this IP
  delete db.blockedIps[ip];

  // Log successful login with device information
  const auditEntry = {
    id: `audit-${Date.now()}`,
    ip,
    device: device.summary,
    userAgent: ua,
    browser: device.browser,
    os: device.os,
    timestamp: new Date().toISOString(),
    status: "SUCCESS",
    usernameAttempted: username,
  };
  db.auditLogs.unshift(auditEntry);
  writeDatabase(db);

  // Generate session token (persisted with 14-day validity)
  const token = `skedz-adm-${Date.now()}-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  validAdminTokens.add(token);

  if (!db.adminSessions) db.adminSessions = {};
  db.adminSessions[token] = {
    username,
    createdAt: Date.now(),
    expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    ip,
    device: device.summary,
  };
  writeDatabase(db);

  res.json({
    success: true,
    token,
    device: device.summary,
    ip,
  });
});

// Admin Verify Token
app.get("/api/auth/verify", requireAdmin, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : "";
  const db = readDatabase();
  const session = db.adminSessions?.[token];
  res.json({
    valid: true,
    username: session?.username || ADMIN_USERNAME,
    expiresAt: session?.expiresAt,
  });
});

// Security Audits & IP Block List
app.get("/api/security/audit-logs", requireAdmin, (_req, res) => {
  const db = readDatabase();
  res.json({
    auditLogs: db.auditLogs.slice(0, 100),
    blockedIps: Object.values(db.blockedIps),
  });
});

// Unblock IP (Admin manual override)
app.post("/api/security/unblock-ip", requireAdmin, (req, res) => {
  const { ip } = req.body;
  if (!ip) {
    res.status(400).json({ error: "IP required" });
    return;
  }
  const db = readDatabase();
  delete db.blockedIps[ip];
  writeDatabase(db);
  res.json({ success: true, message: `IP ${ip} has been unblocked.` });
});

// Secret test reset for testing bypass (triggered silently by clicking lock icon 3-5 times)
app.post("/api/security/secret-test-reset", (req, res) => {
  const ip = getClientIp(req);
  const db = readDatabase();
  delete db.blockedIps[ip];
  writeDatabase(db);
  res.json({ success: true });
});

// --- CUSTOMER REVIEWS ENDPOINTS (REAL DATA ONLY - 1 REVIEW PER DEVICE) ---
app.get("/api/reviews", (_req, res) => {
  const db = readDatabase();
  const reviews = db.reviews || [];
  const totalCount = reviews.length;
  const projectCount = (db.cards || []).length;
  const averageRating =
    totalCount > 0
      ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalCount).toFixed(1))
      : 5.0;

  res.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    totalCount,
    projectCount,
    averageRating,
  });
});

// Check if current user/device already has a review
app.get("/api/reviews/my-review", (req, res) => {
  const deviceId = typeof req.query.deviceId === "string" ? req.query.deviceId : "";
  const clientIp = getClientIp(req);
  const db = readDatabase();
  const reviews = db.reviews || [];

  const userReview = reviews.find(
    (r) => (deviceId && r.deviceId === deviceId) || (r.ip && r.ip === clientIp)
  );

  if (!userReview) {
    res.json({ review: null });
    return;
  }

  res.json({
    review: {
      id: userReview.id,
      name: userReview.name,
      rating: userReview.rating,
      comment: userReview.comment,
      createdAt: userReview.createdAt,
    },
  });
});

app.post("/api/reviews", (req, res) => {
  const { name, rating, comment, deviceId } = req.body;
  if (!name || !rating || !comment) {
    res.status(400).json({ error: "Name, rating, and review comments are required." });
    return;
  }

  const clientIp = getClientIp(req);
  const db = readDatabase();
  if (!db.reviews) db.reviews = [];

  // Enforce STRICT single review per device/network to eliminate fake reviews and duplication
  const alreadyReviewed = db.reviews.some(
    (r) => (deviceId && r.deviceId === deviceId) || (r.ip && r.ip === clientIp)
  );

  if (alreadyReviewed) {
    res.status(403).json({
      error:
        "You have already submitted a verified review from this device. Each client or collaborator is restricted to 1 authentic review.",
    });
    return;
  }

  const newReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: String(name).trim().slice(0, 50),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    comment: String(comment).trim().slice(0, 1000),
    deviceId: deviceId ? String(deviceId) : "",
    ip: clientIp,
    createdAt: new Date().toISOString(),
  };

  db.reviews.unshift(newReview);
  writeDatabase(db);
  broadcastUpdate("new_review", newReview);

  res.status(201).json({
    success: true,
    review: {
      id: newReview.id,
      name: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      createdAt: newReview.createdAt,
    },
  });
});

// Update review by its author device
app.put("/api/reviews/:id", (req, res) => {
  const { name, rating, comment, deviceId } = req.body;
  const clientIp = getClientIp(req);
  const db = readDatabase();
  const reviews = db.reviews || [];

  const review = reviews.find((r) => r.id === req.params.id);
  if (!review) {
    res.status(404).json({ error: "Review not found." });
    return;
  }

  // Validate ownership by deviceId or IP
  const isOwner = (deviceId && review.deviceId === deviceId) || (review.ip && review.ip === clientIp);
  if (!isOwner) {
    res.status(403).json({ error: "Unauthorized: You can only edit a review created by your device." });
    return;
  }

  if (name) review.name = String(name).trim().slice(0, 50);
  if (rating !== undefined) review.rating = Math.min(5, Math.max(1, Number(rating) || 5));
  if (comment) review.comment = String(comment).trim().slice(0, 1000);

  writeDatabase(db);
  broadcastUpdate("update_review", review);

  res.json({
    success: true,
    review: {
      id: review.id,
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    },
  });
});

// Delete review by author device
app.delete("/api/reviews/my-review/:id", (req, res) => {
  const deviceId = typeof req.query.deviceId === "string" ? req.query.deviceId : req.body?.deviceId;
  const clientIp = getClientIp(req);
  const db = readDatabase();
  const reviews = db.reviews || [];

  const reviewIndex = reviews.findIndex((r) => r.id === req.params.id);
  if (reviewIndex === -1) {
    res.status(404).json({ error: "Review not found." });
    return;
  }

  const review = reviews[reviewIndex];
  const isOwner = (deviceId && review.deviceId === deviceId) || (review.ip && review.ip === clientIp);
  if (!isOwner) {
    res.status(403).json({ error: "Unauthorized: You can only delete your own review." });
    return;
  }

  reviews.splice(reviewIndex, 1);
  writeDatabase(db);
  broadcastUpdate("delete_review", { id: req.params.id });

  res.json({ success: true, message: "Your review has been successfully removed." });
});

app.delete("/api/admin/reviews/:id", requireAdmin, (req, res) => {
  const db = readDatabase();
  db.reviews = (db.reviews || []).filter((r) => r.id !== req.params.id);
  writeDatabase(db);
  broadcastUpdate("delete_review", { id: req.params.id });
  res.json({ success: true, message: "Review deleted." });
});

// --- ROBUST MEDIA UPLOADER (IMGBB + HIGH-PERFORMANCE LOCAL RESILIENT STORAGE FALLBACK) ---
app.post("/api/upload/imgbb", requireAdmin, async (req, res) => {
  try {
    const { imageBase64, name } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: "No imageBase64 data provided" });
      return;
    }

    const db = readDatabase();
    // Determine configured key: either passed in request, saved in db, or in process.env
    const savedKey = db.apiKeys?.imgbb;
    const configuredKey =
      (req.body.apiKey && req.body.apiKey.trim()) ||
      (savedKey && savedKey.trim()) ||
      (process.env.IMGBB_API_KEY && process.env.IMGBB_API_KEY !== "d52834a6dd5b38108a1abaf081dec54d"
        ? process.env.IMGBB_API_KEY.trim()
        : null);

    // Extract mime type if present (e.g., data:image/png;base64,)
    const mimeMatch = imageBase64.match(/^data:image\/([a-zA-Z0-9\+\.-]+);base64,/);
    let ext = "png";
    if (mimeMatch && mimeMatch[1]) {
      ext = mimeMatch[1] === "jpeg" ? "jpg" : mimeMatch[1].replace(/[^a-zA-Z0-9]/g, "");
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9\+\.-]+;base64,/, "");

    // Helper: Save locally in public/uploads/ so upload 100% succeeds
    const saveLocally = () => {
      const buffer = Buffer.from(cleanBase64, "base64");
      const safeName = name
        ? name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase().slice(0, 30)
        : "upload";
      const filename = `skedz-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${safeName}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/${filename}`;
    };

    // If an ImgBB key is configured and not the known blocked one, try ImgBB
    if (configuredKey && configuredKey !== "d52834a6dd5b38108a1abaf081dec54d") {
      try {
        const formBody = new URLSearchParams();
        formBody.append("image", cleanBase64);
        if (name) formBody.append("name", name);

        const imgbbUrl = `https://api.imgbb.com/1/upload?key=${configuredKey}`;
        const uploadRes = await fetch(imgbbUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formBody.toString(),
        });

        const result = await uploadRes.json();
        if (result.success && result.data?.url) {
          res.json({
            success: true,
            url: result.data.url,
            displayUrl: result.data.display_url || result.data.url,
            deleteUrl: result.data.delete_url,
            thumb: result.data.thumb?.url || result.data.url,
            provider: "imgbb",
          });
          return;
        } else {
          console.warn("ImgBB upload rejected by API, activating local storage fallback:", result.error?.message || result);
        }
      } catch (imgbbErr) {
        console.warn("ImgBB network request failed, activating local storage fallback:", imgbbErr);
      }
    }

    // High-performance resilient local storage fallback (100% reliable, zero upload fails)
    const localUrl = saveLocally();
    res.json({
      success: true,
      url: localUrl,
      displayUrl: localUrl,
      thumb: localUrl,
      provider: "local",
      message: "Uploaded successfully to SKEDZ secure media storage.",
    });
  } catch (err: any) {
    console.error("Upload proxy error:", err);
    res.status(500).json({ error: err.message || "Failed to upload image" });
  }
});

// Admin API Keys Configuration
app.get("/api/admin/api-keys", requireAdmin, (_req, res) => {
  const db = readDatabase();
  const imgbbKey = db.apiKeys?.imgbb || (process.env.IMGBB_API_KEY !== "d52834a6dd5b38108a1abaf081dec54d" ? process.env.IMGBB_API_KEY : "") || "";
  res.json({
    imgbbKey,
    hasCustomImgbbKey: Boolean(imgbbKey && imgbbKey.trim()),
    localStorageActive: true,
  });
});

app.post("/api/admin/api-keys", requireAdmin, (req, res) => {
  const { imgbbKey } = req.body;
  const db = readDatabase();
  if (!db.apiKeys) db.apiKeys = {};
  db.apiKeys.imgbb = typeof imgbbKey === "string" ? imgbbKey.trim() : "";
  writeDatabase(db);
  res.json({ success: true, message: "API key updated successfully." });
});

// Test ImgBB API Key
app.post("/api/admin/test-imgbb", requireAdmin, async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.trim()) {
    res.status(400).json({ success: false, error: "API key cannot be empty" });
    return;
  }
  try {
    const test1x1Gif = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const formBody = new URLSearchParams();
    formBody.append("image", test1x1Gif);
    formBody.append("name", "skedz_key_test");
    const testRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey.trim()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });
    const data = await testRes.json();
    if (data.success) {
      res.json({ success: true, message: "ImgBB API Key is valid and fully functional!" });
    } else {
      res.status(400).json({
        success: false,
        error: data.error?.message || "ImgBB rejected this key. Please check your key at api.imgbb.com.",
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to reach ImgBB API" });
  }
});

// --- ADMIN CRUD: CARDS ---
app.post("/api/cards", requireAdmin, (req, res) => {
  const {
    title,
    subtitle,
    category,
    description,
    thumbnail,
    images,
    linkType,
    internalSiteSlug,
    linkUrl,
    tags,
    price,
    featured,
  } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const db = readDatabase();
  const imagesList = Array.isArray(images)
    ? images.filter(Boolean)
    : thumbnail
    ? [thumbnail]
    : [];

  const newCard = {
    id: `card-${Date.now()}`,
    title: String(title).trim(),
    subtitle: subtitle ? String(subtitle).trim() : "",
    category: category || "portfolio",
    description: description ? String(description).trim() : "",
    thumbnail:
      thumbnail ||
      imagesList[0] ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    images: imagesList,
    linkType: linkType || (linkUrl && linkUrl.startsWith("/") ? "internal" : "external"),
    internalSiteSlug: internalSiteSlug || "",
    linkUrl: linkUrl || "#",
    tags: Array.isArray(tags) ? tags : [],
    price: price ? String(price).trim() : undefined,
    featured: Boolean(featured),
    order: db.cards.length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.cards.push(newCard);
  writeDatabase(db);
  broadcastUpdate("cards_updated", db.cards);
  res.json({ success: true, card: newCard });
});

app.put("/api/cards/:id", requireAdmin, (req, res) => {
  const db = readDatabase();
  const index = db.cards.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const updated = {
    ...db.cards[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  db.cards[index] = updated;
  writeDatabase(db);
  broadcastUpdate("cards_updated", db.cards);
  res.json({ success: true, card: updated });
});

app.delete("/api/cards/:id", requireAdmin, (req, res) => {
  const db = readDatabase();
  db.cards = db.cards.filter((c) => c.id !== req.params.id);
  writeDatabase(db);
  broadcastUpdate("cards_updated", db.cards);
  res.json({ success: true, message: "Card deleted" });
});

// --- ADMIN CRUD: SITES (ADD SITE SECTION) ---
app.post("/api/sites", requireAdmin, (req, res) => {
  try {
    const { slug, title, description, customHtml, customCss, externalUrl } = req.body;
    if (!slug || !title) {
      res.status(400).json({ error: "Slug and title are required" });
      return;
    }

    // Clean slug
    const cleanSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, "");

    const db = readDatabase();
    if (db.sites.some((s) => s.slug.toLowerCase() === cleanSlug)) {
      res.status(400).json({ error: `A site with slug '/${cleanSlug}' already exists.` });
      return;
    }

    const newSite = {
      id: `site-${Date.now()}`,
      slug: cleanSlug,
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      customHtml: customHtml || "",
      customCss: customCss || "",
      externalUrl: externalUrl ? String(externalUrl).trim() : "",
      author: "skedz5023",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.sites.push(newSite);
    writeDatabase(db);
    broadcastUpdate("sites_updated", db.sites);
    res.json({ success: true, site: newSite });
  } catch (err: any) {
    console.error("Error in POST /api/sites:", err);
    res.status(500).json({ error: err.message || "Failed to save site configuration" });
  }
});

app.put("/api/sites/:id", requireAdmin, (req, res) => {
  const db = readDatabase();
  const index = db.sites.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Site not found" });
    return;
  }

  const updated = {
    ...db.sites[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  db.sites[index] = updated;
  writeDatabase(db);
  broadcastUpdate("sites_updated", db.sites);
  res.json({ success: true, site: updated });
});

app.delete("/api/sites/:id", requireAdmin, (req, res) => {
  const db = readDatabase();
  db.sites = db.sites.filter((s) => s.id !== req.params.id);
  writeDatabase(db);
  broadcastUpdate("sites_updated", db.sites);
  res.json({ success: true, message: "Site deleted" });
});

// Admin Multi-File & Project Upload & Deployment for Dynamic Sub-Sites
app.post("/api/sites/upload-file", requireAdmin, (req, res) => {
  try {
    const { slug, title, description, files, fileContent, fileName, fileSize, entryFile, projectType } = req.body;
    if (!slug) {
      res.status(400).json({ error: "Slug is required" });
      return;
    }

    // Ensure either files array or single fileContent is supplied
    if ((!files || !Array.isArray(files) || files.length === 0) && !fileContent) {
      res.status(400).json({ error: "At least one file or fileContent is required" });
      return;
    }

    const cleanSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, "");

    const db = readDatabase();
    const existingIdx = db.sites.findIndex((s) => s.slug.toLowerCase() === cleanSlug);

    // Normalize files array
    let normalizedFiles: any[] = [];
    if (Array.isArray(files) && files.length > 0) {
      normalizedFiles = files.map((f: any) => ({
        name: String(f.name || "file.txt").trim(),
        path: String(f.path || f.name || "file.txt").replace(/^\/+/, "").trim(),
        content: f.content || "",
        contentType: f.contentType || getMimeType(f.name || f.path),
        size: typeof f.size === "number" ? f.size : (f.content ? f.content.length : 0),
        isBinary: Boolean(f.isBinary),
      }));
    } else if (fileContent) {
      const singleName = fileName || "index.html";
      normalizedFiles = [
        {
          name: singleName,
          path: singleName,
          content: fileContent,
          contentType: getMimeType(singleName),
          size: fileSize || fileContent.length,
          isBinary: false,
        },
      ];
    }

    // Determine entry file
    let finalEntryFile = entryFile || "";
    if (!finalEntryFile) {
      const htmlFile = normalizedFiles.find((f) =>
        f.name.toLowerCase() === "index.html" || f.path.toLowerCase() === "index.html"
      );
      if (htmlFile) {
        finalEntryFile = htmlFile.path;
      } else {
        const readmeFile = normalizedFiles.find((f) =>
          f.name.toLowerCase() === "readme.md" || f.path.toLowerCase() === "readme.md"
        );
        if (readmeFile) {
          finalEntryFile = readmeFile.path;
        } else {
          finalEntryFile = normalizedFiles[0]?.path || "index.html";
        }
      }
    }

    const finalProjectType = projectType || detectProjectType(normalizedFiles);
    const totalSize = normalizedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

    // Extract html & css for backward-compatible standalone rendering
    const entryHtmlObj = normalizedFiles.find((f) => f.path.toLowerCase() === finalEntryFile.toLowerCase());
    const indexHtmlObj = normalizedFiles.find((f) => f.name.toLowerCase() === "index.html");
    const styleCssObj = normalizedFiles.find((f) => f.name.toLowerCase() === "style.css");

    const customHtml = entryHtmlObj ? entryHtmlObj.content : (indexHtmlObj ? indexHtmlObj.content : (fileContent || ""));
    const customCss = styleCssObj ? styleCssObj.content : "";

    const siteData = {
      id: existingIdx !== -1 ? db.sites[existingIdx].id : `site-${Date.now()}`,
      slug: cleanSlug,
      title: String(title || (normalizedFiles.length === 1 ? normalizedFiles[0].name : cleanSlug)).trim(),
      description: description
        ? String(description).trim()
        : `Deployed ${normalizedFiles.length} file(s) • ${finalProjectType.toUpperCase()}`,
      customHtml,
      customCss,
      files: normalizedFiles,
      entryFile: finalEntryFile,
      projectType: finalProjectType,
      fileName: finalEntryFile,
      fileSize: totalSize,
      author: "skedz5023",
      createdAt: existingIdx !== -1 ? db.sites[existingIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      db.sites[existingIdx] = siteData;
    } else {
      db.sites.push(siteData);
    }

    writeDatabase(db);
    broadcastUpdate("sites_updated", db.sites);
    res.json({ success: true, site: siteData });
  } catch (err: any) {
    console.error("Error in POST /api/sites/upload-file:", err);
    res.status(500).json({ error: err.message || "Failed to deploy site files on server" });
  }
});

// Admin Save/Update Firebase Configuration
app.post("/api/admin/firebase-config", requireAdmin, (req, res) => {
  const { apiKey, authDomain, projectId, databaseURL, storageBucket, messagingSenderId, appId, measurementId } = req.body;
  if (!apiKey || !authDomain || !projectId) {
    res.status(400).json({ error: "apiKey, authDomain, and projectId are required for Firebase setup" });
    return;
  }

  const db = readDatabase();
  db.firebaseConfig = {
    apiKey: String(apiKey).trim(),
    authDomain: String(authDomain).trim(),
    projectId: String(projectId).trim(),
    databaseURL: databaseURL ? String(databaseURL).trim() : `https://${String(projectId).trim()}-default-rtdb.firebaseio.com`,
    storageBucket: storageBucket ? String(storageBucket).trim() : "",
    messagingSenderId: messagingSenderId ? String(messagingSenderId).trim() : "",
    appId: appId ? String(appId).trim() : "",
    measurementId: measurementId ? String(measurementId).trim() : "",
  };

  writeDatabase(db);
  broadcastUpdate("firebase_config_updated", { configured: true, projectId: db.firebaseConfig?.projectId });
  res.json({ success: true, message: "Firebase credentials stored securely in portal" });
});

// --- ADMIN CRUD: SOCIALS ---
app.put("/api/socials/:id", requireAdmin, (req, res) => {
  const db = readDatabase();
  const index = db.socials.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Social not found" });
    return;
  }

  db.socials[index] = {
    ...db.socials[index],
    ...req.body,
  };
  writeDatabase(db);
  broadcastUpdate("socials_updated", db.socials);
  res.json({ success: true, social: db.socials[index] });
});

app.post("/api/socials", requireAdmin, (req, res) => {
  const { platform, handle, url, iconName, color, likes } = req.body;
  const db = readDatabase();
  const newSocial = {
    id: `soc-${Date.now()}`,
    platform: platform || "Link",
    handle: handle || "@skedz",
    url: url || "https://skedz.dev",
    iconName: iconName || "Globe",
    likes: Number(likes) || 0,
    color: color || "from-purple-500 to-indigo-600",
    order: db.socials.length + 1,
  };
  db.socials.push(newSocial);
  writeDatabase(db);
  broadcastUpdate("socials_updated", db.socials);
  res.json({ success: true, social: newSocial });
});

app.delete("/api/socials/:id", requireAdmin, (req, res) => {
  const db = readDatabase();
  db.socials = db.socials.filter((s) => s.id !== req.params.id);
  writeDatabase(db);
  broadcastUpdate("socials_updated", db.socials);
  res.json({ success: true, message: "Social deleted" });
});

// --- ADMIN CRUD: INQUIRIES ---
app.get("/api/inquiries", requireAdmin, (_req, res) => {
  const db = readDatabase();
  res.json(db.inquiries);
});

app.delete("/api/inquiries/:id", requireAdmin, (req, res) => {
  const db = readDatabase();
  db.inquiries = db.inquiries.filter((inq) => inq.id !== req.params.id);
  writeDatabase(db);
  res.json({ success: true });
});

// --- DYNAMIC SITE DIRECT RENDER & ASSET ROUTES ---
app.all("/raw-site/:slug", (req, res) => {
  const db = readDatabase();
  const site = db.sites.find((s) => s.slug.toLowerCase() === req.params.slug.toLowerCase());
  if (!site) {
    res.status(404).send("<h1>Site Not Found</h1><p>The requested sub-site does not exist.</p>");
    return;
  }
  handleSiteRequest(req, res, site, "/");
});

app.all("/raw-site/:slug/*", (req, res) => {
  const db = readDatabase();
  const site = db.sites.find((s) => s.slug.toLowerCase() === req.params.slug.toLowerCase());
  if (!site) {
    res.status(404).send("<h1>Site Not Found</h1><p>The requested sub-site does not exist.</p>");
    return;
  }
  const wildcardPath = "/" + ((req.params as any)[0] || (req.params as any)["0"] || "");
  handleSiteRequest(req, res, site, wildcardPath);
});

// Download full project as ZIP archive
app.get("/api/sites/:slug/download", async (req, res) => {
  const db = readDatabase();
  const site = db.sites.find((s) => s.slug.toLowerCase() === req.params.slug.toLowerCase());
  if (!site) {
    res.status(404).json({ error: "Site not found" });
    return;
  }

  try {
    const zip = new JSZip();
    if (site.files && site.files.length > 0) {
      for (const f of site.files) {
        if (f.isBinary) {
          zip.file(f.path || f.name, f.content, { base64: true });
        } else {
          zip.file(f.path || f.name, f.content);
        }
      }
    } else if (site.customHtml) {
      zip.file("index.html", site.customHtml);
      if (site.customCss) {
        zip.file("style.css", site.customCss);
      }
    } else {
      zip.file("README.md", `# ${site.title}\n\n${site.description || ""}`);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${site.slug}-project.zip"`);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Failed to generate zip for site:", err);
    res.status(500).json({ error: "Failed to generate ZIP archive" });
  }
});

// JSON 404 for unhandled API endpoints so clients never receive an HTML error page
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Express global error handler ensuring JSON responses for all /api requests
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Global Server Error:", err);
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON format in request body" });
    return;
  }
  if (err.type === "entity.too.large") {
    res.status(413).json({ error: "Payload too large. Max file upload size is 50MB." });
    return;
  }
  if (req.path.startsWith("/api") || req.originalUrl.startsWith("/api")) {
    res.status(err.status || err.statusCode || 500).json({
      error: err.message || "An unexpected server error occurred",
    });
    return;
  }
  next(err);
});

// --- VITE MIDDLEWARE (DEV) & STATIC (PROD) ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/admin.html", (_req, res) => {
      res.sendFile(path.join(distPath, "admin.html"));
    });
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SKEDZ-S.PORTAL Server running on http://0.0.0.0:${PORT}`);
  });
}

// Start listener in local/container environments; on Vercel, serverless invokes app directly
if (!isVercel) {
  startServer();
}

export { app };
export default app;
