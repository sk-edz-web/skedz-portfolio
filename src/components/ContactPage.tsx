import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  MapPin, 
  Clock, 
  Sparkles,
  PhoneCall,
  CheckCircle2
} from 'lucide-react';
import { SiteSettings } from '../types';
import { createInquiry } from '../services/firebase';

interface ContactPageProps {
  settings: SiteSettings;
  onOpenPhoneChoice: () => void;
}

export default function ContactPage({ settings, onOpenPhoneChoice }: ContactPageProps) {
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = settings.email || 'sarathik354@gmail.com';
  const phone = settings.phone || '9345306572';
  const rawDigits = phone.replace(/\D/g, '');
  const waNumber = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${email}`;
  };

  const handleSendCustomMail = async (e: FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim() && !formSubject.trim()) return;

    setIsSubmitting(true);
    try {
      // Record inquiry in Firebase for Admin viewing
      await createInquiry({
        name: formName.trim() || 'Client via Website',
        subject: formSubject.trim() || 'Project Inquiry',
        message: formMessage.trim(),
        method: 'email',
        createdAt: Date.now(),
        read: false
      });
      setSubmitSuccessMessage('Inquiry logged and opening your email client!');
      setTimeout(() => setSubmitSuccessMessage(null), 4000);
    } catch (err) {
      console.warn('Inquiry record warning:', err);
    } finally {
      setIsSubmitting(false);
    }

    const subject = encodeURIComponent(formSubject || 'Inquiry regarding Web / Edit Project');
    const body = encodeURIComponent(
      `Hi Sarathi,\n\nMy name is ${formName || 'a client'}.\n\nMessage:\n${formMessage}\n\nLooking forward to hearing from you!`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleSendCustomWhatsApp = async () => {
    if (!formMessage.trim() && !formSubject.trim()) return;

    setIsSubmitting(true);
    try {
      // Record inquiry in Firebase for Admin viewing
      await createInquiry({
        name: formName.trim() || 'WhatsApp Visitor',
        subject: formSubject.trim() || 'WhatsApp Discussion',
        message: formMessage.trim(),
        method: 'whatsapp',
        createdAt: Date.now(),
        read: false
      });
      setSubmitSuccessMessage('Inquiry logged and opening WhatsApp!');
      setTimeout(() => setSubmitSuccessMessage(null), 4000);
    } catch (err) {
      console.warn('Inquiry record warning:', err);
    } finally {
      setIsSubmitting(false);
    }

    const text = encodeURIComponent(
      `Hi Sarathi! My name is ${formName || 'a client'}. I would like to discuss: ${formMessage || formSubject || 'a project'}.`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="contact-page-root" className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-slate-900">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 mb-3"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight mb-3"
        >
          Let's Build or Edit Together
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 text-xs sm:text-sm leading-relaxed"
        >
          Ready to launch a new web app or produce captivating video content? Reach out directly via email, phone, or WhatsApp.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Col: Direct One-Click Channels */}
        <div className="lg:col-span-5 space-y-4">
          {/* Email Direct Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-full">
                Direct Email
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-1 font-heading">
              Email Correspondence
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Click to open your default mail app or copy the address.
            </p>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-800 truncate">
                {email}
              </span>
              <button
                id="btn-copy-email-contact-page"
                onClick={() => handleCopy(email, 'email')}
                title="Copy Email"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                {copied === 'email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              id="btn-click-email-app"
              onClick={handleEmailClick}
              className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Open Mail App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Phone / WhatsApp Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                Phone & Chat
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-1 font-heading">
              Direct Phone & WhatsApp
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Clicking prompts you to choose between direct phone call or WhatsApp message.
            </p>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-800">
                +91 {phone}
              </span>
              <button
                id="btn-copy-phone-contact-page"
                onClick={() => handleCopy(phone, 'phone')}
                title="Copy Phone"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                {copied === 'phone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              id="btn-click-phone-prompt"
              onClick={onOpenPhoneChoice}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call or WhatsApp</span>
            </button>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-600 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>Based in Tamil Nadu, India (IST / UTC+5:30)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Response time: Usually within 2 to 4 hours</span>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Compose Message Form */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 mb-1 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Express Inquiry</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1.5 font-heading">
              Send a Quick Inquiry
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Fill in your thoughts and dispatch directly via Email or WhatsApp in one tap.
            </p>

            <AnimatePresence>
              {submitSuccessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submitSuccessMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSendCustomMail} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name
                </label>
                <input
                  id="input-contact-name"
                  type="text"
                  placeholder="e.g. Alex Miller"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs placeholder-slate-400 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Type / Subject
                </label>
                <input
                  id="input-contact-subject"
                  type="text"
                  placeholder="e.g. Web App or Video Edit"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs placeholder-slate-400 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Details
                </label>
                <textarea
                  id="input-contact-message"
                  rows={4}
                  placeholder="Tell me a bit about your timeline, scope, or idea..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 focus:border-sky-500 text-slate-800 text-xs placeholder-slate-400 focus:outline-none transition-colors resize-none shadow-xs"
                />
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="submit"
                  id="btn-dispatch-email"
                  className="py-2.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send via Email</span>
                </button>

                <button
                  type="button"
                  id="btn-dispatch-whatsapp"
                  onClick={handleSendCustomWhatsApp}
                  className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
