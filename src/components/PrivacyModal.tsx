import { X, Shield, Lock, FileText, Check } from "lucide-react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-[#090d1a] border border-purple-500/30 p-6 sm:p-8 max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(147,51,234,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Privacy Policy & Legal Terms</h3>
              <p className="text-xs text-slate-400">SKEDZ-S.PORTAL Official Guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Text Content */}
        <div className="py-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-light pr-2">
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              1. Information Collection & Real-Time Sync
            </h4>
            <p>
              SKEDZ-S.PORTAL operates with high data transparency. When submitting inquiries through our contact terminal, 
              your name, email, and optional phone number are securely stored in the portal backend database solely to facilitate 
              direct communication with SKEDZ. We do not sell, rent, or trade your personal data to third parties.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              2. Security Audits & IP Rate Limiting
            </h4>
            <p>
              To safeguard administrative endpoints, automated security monitors record client IP addresses and user-agent 
              device characteristics during authentication attempts. If an unauthorized IP attempts 5 consecutive invalid logins, 
              the IP is temporarily blocked to prevent brute-force intrusion. Security logs are retained for audit and defense integrity.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              3. Dynamic Sub-Sites & Third-Party Services
            </h4>
            <p>
              Sub-sites hosted dynamically through the portal (e.g., <code>/newsite</code>) may embed external style sheets, CDN assets, 
              or Cloudinary / ImgBB media assets. All trademarks, project code snippets, and series representations remain the intellectual 
              property of SKEDZ and respective project owners.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-pink-400" />
              4. Contact & Regulatory Inquiries
            </h4>
            <p>
              For legal questions, data removal requests, or collaboration terms, reach the administrative office directly:
              <br />
              <strong className="text-purple-300">Email:</strong> skedz.contact@gmail.com
              <br />
              <strong className="text-purple-300">WhatsApp:</strong> +91 9345306572 (Chat & Project Inquiries)
              <br />
              <strong className="text-purple-300">Instagram:</strong> @skedz.dev
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Last Updated: September 2026 • Version 2.4
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
