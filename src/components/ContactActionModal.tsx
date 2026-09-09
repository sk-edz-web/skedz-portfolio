import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Phone, 
  MessageSquare, 
  ArrowLeft, 
  Check, 
  Copy, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { SiteSettings } from '../types';

interface ContactActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SiteSettings;
}

export default function ContactActionModal({ isOpen, onClose, settings }: ContactActionModalProps) {
  const [subPrompt, setSubPrompt] = useState<'none' | 'phone_choice'>('none');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const email = settings.email || 'sarathik354@gmail.com';
  const phone = settings.phone || '9345306572';
  const rawDigits = phone.replace(/\D/g, '');
  const waNumber = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    settings.whatsappMessage || 'Hi Sarathi, I saw your portfolio and would like to connect!'
  )}`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${email}`;
  };

  const handleCallClick = () => {
    window.location.href = `tel:${rawDigits}`;
  };

  const handleWhatsAppClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div 
        id="contact-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="contact-modal-card"
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 text-slate-900 max-h-[92dvh] overflow-y-auto my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top glowing accent border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

          {/* Close button */}
          <button
            id="btn-close-contact-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {subPrompt === 'none' ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 tracking-wider uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Let's Connect</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-1.5 font-heading">
                Get in Touch
              </h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Click an option below to initiate a conversation via email or phone.
              </p>

              <div className="space-y-2.5">
                {/* Email Option */}
                <div className="group relative flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 transition-all">
                  <button
                    id="btn-trigger-email"
                    onClick={handleEmailClick}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500">Email Address</span>
                      <span className="block text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition-colors break-all">
                        {email}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                    <button
                      id="btn-copy-email"
                      onClick={() => handleCopy(email, 'email')}
                      title="Copy Email"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      id="btn-open-email-client"
                      onClick={handleEmailClick}
                      title="Open Mail Client"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-200/60 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Phone Option -> Triggers Call vs WhatsApp Subprompt */}
                <div className="group relative flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 transition-all">
                  <button
                    id="btn-trigger-phone-choice"
                    onClick={() => setSubPrompt('phone_choice')}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500">Mobile Phone / WhatsApp</span>
                      <span className="block text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        +91 {phone}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                    <button
                      id="btn-copy-phone"
                      onClick={() => handleCopy(phone, 'phone')}
                      title="Copy Phone Number"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      id="btn-action-phone"
                      onClick={() => setSubPrompt('phone_choice')}
                      title="Call or WhatsApp"
                      className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                    >
                      Options
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-500">
                  Available for freelance projects, web development, and editing commissions.
                </span>
              </div>
            </div>
          ) : (
            /* Subprompt: Call vs WhatsApp? */
            <div>
              <button
                id="btn-back-to-contact-options"
                onClick={() => setSubPrompt('none')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to contact options</span>
              </button>

              <h3 className="text-lg font-bold text-slate-900 mb-1 font-heading">
                Contact: +91 {phone}
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                How would you like to connect right now?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                {/* Direct Call Button (Compact) */}
                <motion.button
                  id="btn-action-direct-call"
                  onClick={handleCallClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-sky-50 hover:bg-sky-100/70 border border-sky-200 text-center transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center mb-2 shadow-xs">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900">Direct Call</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Open Phone Dialer</span>
                </motion.button>

                {/* WhatsApp Button (Compact) */}
                <motion.button
                  id="btn-action-whatsapp"
                  onClick={handleWhatsAppClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-center transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900">WhatsApp</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Open Chat with Message</span>
                </motion.button>
              </div>

              <div className="text-center">
                <button
                  id="btn-copy-num-secondary"
                  onClick={() => handleCopy(phone, 'phone')}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {copiedField === 'phone' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Number copied to clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Or copy phone number: {phone}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
