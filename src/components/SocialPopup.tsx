import { useState } from "react";
import { SocialLink } from "../types";
import {
  X,
  Heart,
  ExternalLink,
  Instagram,
  Youtube,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Check,
  Copy,
  Share2,
} from "lucide-react";
import SkedzLogo from "./SkedzLogo";

interface SocialPopupProps {
  isOpen: boolean;
  onClose: () => void;
  socials: SocialLink[];
  onLikeSocial: (id: string) => void;
}

export default function SocialPopup({
  isOpen,
  onClose,
  socials,
  onLikeSocial,
}: SocialPopupProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const getSocialIcon = (iconName: string, platform: string) => {
    const key = (iconName || platform).toLowerCase();
    if (key.includes("instagram") || key.includes("insta")) {
      return <Instagram className="w-5 h-5 text-pink-400" />;
    }
    if (key.includes("youtube") || key.includes("yt")) {
      return <Youtube className="w-5 h-5 text-red-500" />;
    }
    if (key.includes("whatsapp")) {
      return <MessageCircle className="w-5 h-5 text-emerald-400" />;
    }
    if (key.includes("phone") || key.includes("call")) {
      return <Phone className="w-5 h-5 text-emerald-400" />;
    }
    if (key.includes("mail") || key.includes("email")) {
      return <Mail className="w-5 h-5 text-cyan-400" />;
    }
    return <Globe className="w-5 h-5 text-purple-400" />;
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedIds((prev) => new Set(prev).add(id));
    onLikeSocial(id);
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#090d1a]/95 border border-purple-500/25 p-6 sm:p-8 shadow-[0_0_50px_rgba(147,51,234,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <SkedzLogo size="sm" />
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Connect with SKEDZ
              </h3>
              <p className="text-xs text-slate-400">
                Official handles, direct lines & real-time appreciation
              </p>
            </div>
          </div>
          <button
            id="close-social-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Social Cards List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {socials.map((social) => {
            const hasLiked = likedIds.has(social.id);
            return (
              <div
                key={social.id}
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-purple-500/30 transition-all shadow-sm"
              >
                {/* Left info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                    {getSocialIcon(social.iconName, social.platform)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {social.platform}
                      </span>
                    </div>
                    <p className="text-xs text-purple-300 font-mono truncate">
                      {social.handle}
                    </p>
                  </div>
                </div>

                {/* Right controls: Like button + External link + Copy */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Like Button */}
                  <button
                    id={`like-btn-${social.id}`}
                    onClick={(e) => handleLike(social.id, e)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      hasLiked
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 scale-105"
                        : "bg-white/5 hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 border border-white/5"
                    }`}
                    title="Leave a like"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        hasLiked
                          ? "fill-rose-500 text-rose-500"
                          : "text-slate-400 group-hover:text-rose-400"
                      }`}
                    />
                    <span className="font-mono">{social.likes}</span>
                  </button>

                  {/* Copy handle */}
                  <button
                    onClick={(e) => handleCopy(social.id, social.handle, e)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 transition"
                    title="Copy Handle"
                  >
                    {copiedId === social.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Direct Link */}
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 transition"
                    title="Visit Official Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct Footer info */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>Official Contact: <span className="text-slate-200 font-mono">skedz.contact@gmail.com</span></span>
          <a
            href="https://wa.me/919345306572?text=Hello%20SKEDZ%2C%20I%20would%20like%20to%20discuss%20a%20project"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp: +91 9345306572</span>
          </a>
        </div>
      </div>
    </div>
  );
}
