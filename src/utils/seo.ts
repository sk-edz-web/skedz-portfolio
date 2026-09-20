/**
 * SKEDZ S-Portal Dynamic SEO & Schema Engine
 * Dynamically updates document title, meta tags (description, keywords, robots),
 * OpenGraph, Twitter cards, canonical URLs, and Schema.org JSON-LD per page.
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  canonicalPath?: string;
  ogType?: string;
  ogImage?: string;
}

const DEFAULT_KEYWORDS =
  "sk edz, skedz, sk portal, skedz s-portal, sarathi skedz, skedz video editing, sk edz web developer, video editor startup, full-stack developer portfolio, dynamic sub-sites, high retention video editing, react web apps";

const DEFAULT_IMAGE =
  "https://res.cloudinary.com/dntcjdw7r/image/upload/v1789761077/skedzlogo_aeql4d.jpg";

const PAGE_SEO_MAP: Record<string, SEOConfig> = {
  home: {
    title: "SKEDZ – Video Editing & Web Development Startup | Official S-Portal",
    description:
      "Official SKEDZ (Sarathi) S-Portal. High-impact cinematic video editing, YouTube production, high-retention post-production, and modern full-stack web development startup.",
    keywords:
      "sk edz, skedz, sk portal, skedz s-portal, sarathi skedz, sk edz startup, skedz video editing, skedz web developer, next-gen digital studio",
    canonicalPath: "/",
  },
  services: {
    title: "Services & Completed Works | SKEDZ Startup (Web & Video Portfolio)",
    description:
      "Explore SKEDZ creative post-production works, video editing portfolio, and production-ready React web platforms. Filter by Video Editing, Web Architecture, and Series.",
    keywords:
      "sk edz works, skedz portfolio, skedz projects, sk portal showcase, video editing works, web development projects, sk edz video editor, freelance developer",
    canonicalPath: "/services",
  },
  reviews: {
    title: "Verified Client Reviews & Ratings | SKEDZ Official S-Portal",
    description:
      "Read authentic client reviews and verified ratings for SKEDZ video editing and web development services. 100% genuine collaborator feedback with anti-spam protection.",
    keywords:
      "sk edz reviews, skedz ratings, sk portal feedback, verified client reviews, skedz video editing reviews, sarathi reviews, client testimonials",
    canonicalPath: "/reviews",
  },
  contact: {
    title: "Contact & Direct Collaboration | SKEDZ Video Editing & Web Development",
    description:
      "Collaborate directly with SKEDZ (Sarathi). Inquire about cinematic video editing, YouTube content pipelines, or custom full-stack web development projects.",
    keywords:
      "contact skedz, hire sk edz, sk portal inquiry, skedz email, skedz phone, sk edz instagram, video editing consultation, web development quote",
    canonicalPath: "/contact",
  },
  admin: {
    title: "SKEDZ Command Studio | Secure Admin Operations",
    description:
      "Administrative command studio for SKEDZ S-Portal. Manage project cards, dynamic edge sub-sites, security audits, and client inquiries.",
    keywords: "skedz admin, sk portal command studio, admin portal",
    canonicalPath: "/admin.html",
  },
};

function setOrUpdateMeta(attribute: "name" | "property", value: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setOrUpdateCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function updateSchemaJsonLd(pageKey: string, config: SEOConfig, origin: string) {
  const scriptId = "skedz-dynamic-seo-schema";
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  const currentUrl = `${origin}${config.canonicalPath || ""}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${currentUrl}#webpage`,
        "url": currentUrl,
        "name": config.title,
        "description": config.description,
        "isPartOf": {
          "@type": "WebSite",
          "@id": `${origin}/#website`,
          "name": "SKEDZ",
          "alternateName": ["SK EDZ", "skedz", "sk portal", "SKEDZ S-Portal"],
          "url": origin,
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "SKEDZ Home",
              "item": origin,
            },
            ...(pageKey !== "home"
              ? [
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": config.title.split("|")[0].trim(),
                    "item": currentUrl,
                  },
                ]
              : []),
          ],
        },
      },
    ],
  };

  script.textContent = JSON.stringify(schema, null, 2);
}

export function updatePageSEO(
  pageKey: "home" | "services" | "reviews" | "about" | "contact" | "admin" | "site" | string,
  customSiteInfo?: { title?: string; description?: string; slug?: string } | string
) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const origin = window.location.origin;
  let config: SEOConfig;

  if (pageKey === "site" && typeof customSiteInfo === "object" && customSiteInfo) {
    const slug = customSiteInfo.slug || "site";
    const siteTitle = customSiteInfo.title || "Dynamic Sub-Site";
    config = {
      title: `${siteTitle} | Deployed on SKEDZ S-Portal`,
      description:
        customSiteInfo.description ||
        `Standalone dynamic sub-site /${slug} hosted on SKEDZ edge infrastructure.`,
      keywords: `sk edz, skedz, sk portal, /${slug}, ${siteTitle}, sub-site deployment`,
      canonicalPath: `/${slug}`,
    };
  } else {
    config = PAGE_SEO_MAP[pageKey] || PAGE_SEO_MAP.home;
  }

  // 1. Title
  document.title = config.title;

  // 2. Primary Meta Tags
  setOrUpdateMeta("name", "description", config.description);
  setOrUpdateMeta("name", "keywords", `${config.keywords}, ${DEFAULT_KEYWORDS}`);
  setOrUpdateMeta("name", "robots", pageKey === "admin" ? "noindex, nofollow" : "index, follow");

  // 3. OpenGraph Tags
  const fullUrl = `${origin}${config.canonicalPath || ""}`;
  setOrUpdateMeta("property", "og:title", config.title);
  setOrUpdateMeta("property", "og:description", config.description);
  setOrUpdateMeta("property", "og:url", fullUrl);
  setOrUpdateMeta("property", "og:type", config.ogType || "website");
  setOrUpdateMeta("property", "og:image", config.ogImage || DEFAULT_IMAGE);
  setOrUpdateMeta("property", "og:site_name", "SKEDZ S-Portal");

  // 4. Twitter Cards
  setOrUpdateMeta("name", "twitter:title", config.title);
  setOrUpdateMeta("name", "twitter:description", config.description);
  setOrUpdateMeta("name", "twitter:image", config.ogImage || DEFAULT_IMAGE);

  // 5. Canonical Link
  setOrUpdateCanonical(fullUrl);

  // 6. Dynamic JSON-LD Structured Data
  updateSchemaJsonLd(pageKey, config, origin);
}
