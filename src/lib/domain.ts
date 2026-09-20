/**
 * Utility functions for subdomain and dynamic site routing
 * Supports:
 * - Subdomain on Vercel: e.g. "newpage.skedz.vercel.app" -> slug "newpage"
 * - Subdomain on custom domain: e.g. "newpage.skedz.com" -> slug "newpage"
 * - Local development: "newpage.localhost" -> slug "newpage"
 * - Direct path fallback: "/newpage" -> slug "newpage"
 */

export const ROOT_DOMAINS = [
  "skedz.vercel.app",
  "skedz-main.vercel.app",
  "skedz-portal.vercel.app",
  "skedz.dev",
  "skedz.com",
  "localhost",
];

/**
 * Extracts a dynamic site slug from hostname if request is on a subdomain
 */
export function extractSubdomainSlug(hostname: string): string | null {
  if (!hostname) return null;
  const host = hostname.toLowerCase().split(":")[0].trim();

  // If host is IP address, no subdomain
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes("[")) {
    return null;
  }

  // Check against known root domains e.g. *.skedz.vercel.app
  for (const root of ROOT_DOMAINS) {
    if (host.endsWith("." + root)) {
      const sub = host.slice(0, -(root.length + 1)).trim();
      // Ignore "www", "app", "portal", "api"
      if (sub && !["www", "app", "portal", "api", "admin"].includes(sub)) {
        // If nested e.g. foo.bar, take the first part
        return sub.split(".")[0];
      }
    }
  }

  // Generic fallback for any *.domain.ext (with at least 2 dots for standard domains)
  const parts = host.split(".");
  if (parts.length >= 3) {
    // If ending with vercel.app, parts: [subdomain, "skedz", "vercel", "app"] -> 4 parts
    if (host.endsWith(".vercel.app") && parts.length === 4) {
      const sub = parts[0];
      if (sub && !["www", "app", "portal", "api", "admin"].includes(sub)) {
        return sub;
      }
    }
    // For standard custom domain e.g. mysite.skedz.com
    if (!host.endsWith(".vercel.app") && parts.length === 3) {
      const sub = parts[0];
      if (sub && !["www", "app", "portal", "api", "admin"].includes(sub)) {
        return sub;
      }
    }
  }

  return null;
}

/**
 * Builds the canonical public URL for a given site slug
 * Prefers subdomain formatting: https://[slug].skedz.vercel.app
 */
export function getSiteSubdomainUrl(slug: string, currentHost?: string): string {
  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
  const host = (currentHost || (typeof window !== "undefined" ? window.location.host : "")).toLowerCase().split(":")[0];

  // If on Vercel domain skedz.vercel.app or child
  if (host.includes("skedz.vercel.app") || host.includes("vercel.app")) {
    return `https://${cleanSlug}.skedz.vercel.app`;
  }

  // If custom domain e.g. skedz.com
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && host.includes(".")) {
    const parts = host.split(".");
    const baseDomain = parts.slice(-2).join(".");
    return `https://${cleanSlug}.${baseDomain}`;
  }

  // Default standard Vercel subdomain
  return `https://${cleanSlug}.skedz.vercel.app`;
}
