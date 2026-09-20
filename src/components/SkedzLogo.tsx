import React, { useState } from "react";

interface SkedzLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  rounded?: boolean;
  bordered?: boolean;
}

export default function SkedzLogo({
  className = "",
  size = "md",
  rounded = true,
  bordered = true,
}: SkedzLogoProps) {
  const [imgError, setImgError] = useState(false);

  // Exact Cloudinary logo provided by user
  const OFFICIAL_LOGO_URL =
    "https://res.cloudinary.com/dntcjdw7r/image/upload/v1789761077/skedzlogo_aeql4d.jpg";
  const FALLBACK_LOGO_URL = "/skedzlogo.jpg";

  // Size mappings
  const sizeClasses = {
    xs: "w-7 h-7",
    sm: "w-9 h-9",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    hero: "w-32 h-32 sm:w-40 sm:h-40",
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const radiusClass = rounded ? "rounded-2xl" : "rounded-none";

  return (
    <div
      className={`relative inline-block shrink-0 overflow-hidden ${currentSize} ${radiusClass} ${
        bordered
          ? "border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
          : ""
      } ${className}`}
    >
      <div className={`w-full h-full overflow-hidden bg-[#030712] ${radiusClass}`}>
        <img
          src={!imgError ? OFFICIAL_LOGO_URL : FALLBACK_LOGO_URL}
          alt="SKEDZ Official Logo"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover select-none transition-transform duration-300 hover:scale-105"
        />
      </div>
    </div>
  );
}
