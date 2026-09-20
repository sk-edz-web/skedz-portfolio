export interface ProjectCard {
  id: string;
  title: string;
  subtitle: string;
  category: 'series' | 'portfolio' | 'editing' | 'web' | 'featured' | 'app' | string;
  description: string;
  thumbnail: string;
  images?: string[]; // Multiple images support
  linkType?: 'internal' | 'external' | 'app' | 'download'; // 'internal' = this website/sub-site, 'external' = other web, 'app' = installable app/apk
  internalSiteSlug?: string; // Connected site slug if internal
  linkUrl: string; // Destination URL or internal route e.g. /slug or external https://... or app download
  downloadUrl?: string; // Optional direct download/install file link
  fileSize?: string; // Optional app file size e.g. 24MB
  isApp?: boolean; // If true or if linkType is app, render "Install" button
  tags: string[];
  featured?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  handle: string;
  url: string;
  iconName: string;
  likes: number;
  color: string;
  order: number;
}

export interface SiteFile {
  name: string; // e.g. "index.html", "style.css", "data.json", "README.md"
  path: string; // relative path e.g. "index.html", "css/style.css", "api/data.json"
  content: string; // text or base64
  contentType?: string; // MIME type e.g. "text/html", "application/json"
  size?: number;
  isBinary?: boolean;
}

export interface DynamicSite {
  id: string;
  slug: string; // e.g. 'newsite'
  title: string;
  description: string;
  customHtml?: string;
  customCss?: string;
  externalUrl?: string;
  fileName?: string;
  fileSize?: number;
  files?: SiteFile[]; // Multi-file fullstack bundle support
  entryFile?: string; // e.g. "index.html" or "README.md"
  projectType?: 'web' | 'fullstack' | 'markdown' | 'json' | 'code' | 'other';
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SecurityAuditLog {
  id: string;
  ip: string;
  device: string;
  userAgent: string;
  browser: string;
  os: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  usernameAttempted: string;
}

export interface BlockedIpRecord {
  ip: string;
  failedAttempts: number;
  blockedAt: number;
  unblockAt: number;
  lastAttemptDevice: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  databaseURL?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export interface CustomerReview {
  id: string;
  name: string;
  rating: number; // 1 to 5 stars
  comment: string;
  deviceId?: string;
  createdAt: string;
}

export interface PortalData {
  cards: ProjectCard[];
  socials: SocialLink[];
  sites: DynamicSite[];
  reviews?: CustomerReview[];
  auditLogs: SecurityAuditLog[];
  blockedIps: Record<string, BlockedIpRecord>;
  inquiries: ContactInquiry[];
  firebaseConfig?: FirebaseConfig | null;
  lastUpdated: number;
}
