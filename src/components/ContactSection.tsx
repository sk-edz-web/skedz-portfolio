import { useState } from "react";
import { Mail, Send, CheckCircle, AlertCircle, MessageSquare, MessageCircle, ShieldCheck } from "lucide-react";
import { FirebaseConfig } from "../types";
import { saveContactMessageToFirestore } from "../lib/firebase";
import ScrollReveal from "./ScrollReveal";

interface ContactSectionProps {
  initialSubject?: string;
  firebaseConfig?: FirebaseConfig | null;
}

export default function ContactSection({ initialSubject = "", firebaseConfig }: ContactSectionProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    initialSubject ? `Inquiry regarding: ${initialSubject}\n\n` : ""
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [savedToFirebase, setSavedToFirebase] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("error");
      setStatusMessage("Please provide your name, email, and a message.");
      return;
    }

    setStatus("loading");
    setSavedToFirebase(false);

    try {
      let fbSuccess = false;
      // 1. Save directly to Firebase Firestore
      try {
        await saveContactMessageToFirestore(firebaseConfig, { name, email, phone, message });
        fbSuccess = true;
        setSavedToFirebase(true);
      } catch (fbErr: any) {
        console.warn("Direct Firebase write note:", fbErr);
      }

      // 2. Also register in real-time server database if available
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, message }),
        });

        let data: any = null;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        }

        if (!res.ok && !fbSuccess) {
          throw new Error(data?.error || "Failed to deliver message via server.");
        }
      } catch (fetchErr: any) {
        if (!fbSuccess) {
          throw fetchErr;
        }
      }

      setStatus("success");
      if (fbSuccess) {
        setStatusMessage("Your direct message has been saved to Firebase Firestore & transmitted to SKEDZ!");
      } else {
        setStatusMessage("Your message has been delivered to SKEDZ!");
      }

      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err: any) {
      setStatus("error");
      setStatusMessage(err.message || "An error occurred while transmitting your message.");
    }
  };

  return (
    <section className="w-full space-y-12">
      {/* Contact Header */}
      <ScrollReveal direction="up" delay={0.05} className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Get in Touch with SKEDZ
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-light">
          Have a video editing project, web design brief, or custom collaboration in mind? Send a direct message below.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact Info Cards (2 cols) */}
        <ScrollReveal direction="up" delay={0.1} className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl bg-[#090d1a]/80 border border-purple-500/20 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-6">Direct Support Channels</h3>

            <div className="space-y-4">
              {/* Email */}
              <a
                href="mailto:skedz.contact@gmail.com"
                className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-purple-500/30 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-110 transition">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono uppercase">Official Email</div>
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-purple-300 transition">
                    skedz.contact@gmail.com
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Direct response within 24h</div>
                </div>
              </a>

              {/* WhatsApp Direct Message */}
              <a
                href="https://wa.me/919345306572?text=Hello%20SKEDZ%2C%20I%20would%20like%20to%20discuss%20a%20project"
                target="_blank"
                rel="noreferrer"
                className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] hover:bg-emerald-950/20 border border-white/5 hover:border-emerald-500/40 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-110 shadow-[0_0_12px_rgba(16,185,129,0.2)] transition">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-emerald-400 font-mono uppercase font-semibold">WhatsApp Message</div>
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition font-mono">
                    +91 9345306572
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Click to chat directly on WhatsApp</div>
                </div>
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Encrypted Transmission
              </span>
              <span>Rate Protected</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Contact Form (3 cols) */}
        <ScrollReveal direction="up" delay={0.15} className="lg:col-span-3">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#090d1a]/80 border border-purple-500/20 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-2">Send a Direct Message</h3>
            <p className="text-xs text-slate-400 mb-6">
              Fill out the form below. Messages are stored securely for SKEDZ review.
            </p>

            {status === "success" && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3 mb-6">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-sm">Message Transmitted!</p>
                  <p className="mt-0.5">{statusMessage}</p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 mb-6">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <div>
                  <p className="font-semibold text-sm">Submission Error</p>
                  <p className="mt-0.5">{statusMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-purple-500 focus:outline-none text-slate-100 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-purple-500 focus:outline-none text-slate-100 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-purple-500 focus:outline-none text-slate-100 text-sm transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                  Message / Project Details *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe your editing project, web design needs, timeline, or consultation inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-purple-500 focus:outline-none text-slate-100 text-sm transition leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-[0_0_20px_rgba(147,51,234,0.35)] transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{status === "loading" ? "Transmitting..." : "Send Direct Message"}</span>
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
