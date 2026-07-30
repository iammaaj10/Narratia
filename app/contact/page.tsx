"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

export default function ContactPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successDetails, setSuccessDetails] = useState<{ messageId: string; timestamp: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("maaijb1122@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit form.");
      }

      setStatus("success");
      setSuccessDetails({ messageId: data.messageId, timestamp: data.timestamp });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  const faqs = [
    {
      q: "How fast will I get a response?",
      a: "Our core team reads every message. Typical response times are under 4 hours on business days.",
    },
    {
      q: "How does Narratia protect my creative story IP?",
      a: "Your manuscript data is encrypted at rest and in transit. Your stories are never used to train public AI models.",
    },
    {
      q: "Can I export my screenplay to Final Draft or PDF?",
      a: "Yes! Narratia natively supports exporting to Final Draft (.fdx), PDF, Markdown (.md), ePub, and plain text.",
    },
    {
      q: "Where can I request new AI features?",
      a: "Select 'Feature Request' in the subject field above or join our Discord community to chat directly with our team.",
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#06070a] text-slate-100"}`}>
      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${isLight ? "bg-white/80 border-slate-200" : "bg-[#06070a]/80 border-white/10"
        }`}>
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md">N</div>
            <span className="font-bold text-xl tracking-tight outfit">Narratia</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/docs" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Docs</a>
            <a href="/login" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Sign in</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-6xl mx-auto px-6 pt-6 pb-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2.5 inline-block">
            Get in Touch
          </span>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 outfit ${isLight ? "text-slate-900" : "text-white"}`}>
            We'd love to hear from you.
          </h1>
          <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Have a question about Narratia, need support, or want to suggest an AI feature? Drop us a message below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Contact Cards & Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`p-6 rounded-2xl border backdrop-blur-md transition-all ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0b0c10]/90 border-white/10"
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm outfit">Direct Support Email</h3>
                  <p className="text-xs text-slate-400">Average response time: &lt; 4 hours</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs font-mono">
                <span>maajb1122@gmail.com</span>
                <button onClick={handleCopyEmail} className="text-indigo-400 font-semibold hover:underline flex items-center gap-1">
                  {copiedEmail ? "Copied! ✓" : "Copy"}
                </button>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border backdrop-blur-md transition-all ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0b0c10]/90 border-white/10"
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm outfit">Join the Community</h3>
                  <p className="text-xs text-slate-400">Connect with fellow authors & creators</p>
                </div>
              </div>
              <div className="flex gap-3">
                <a href="https://discord.com" target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl border text-center text-xs font-semibold transition-all hover:border-indigo-500 border-slate-200 dark:border-white/10">
                  Discord Community
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-xl border text-center text-xs font-semibold transition-all hover:border-indigo-500 border-slate-200 dark:border-white/10">
                  Twitter / X
                </a>
              </div>
            </div>

            {/* Quick FAQs */}
            <div className={`p-6 rounded-2xl border backdrop-blur-md ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0b0c10]/90 border-white/10"
              }`}>
              <h3 className="font-bold text-base mb-4 outfit">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-slate-100 dark:border-white/[0.06] pb-3 last:border-0 last:pb-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full text-left font-medium text-xs flex items-center justify-between hover:text-indigo-400 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <span className="text-indigo-400">{openFaq === idx ? "−" : "+"}</span>
                    </button>
                    {openFaq === idx && (
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed pl-2 border-l-2 border-indigo-500/40">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Working Contact Form */}
          <div className="lg:col-span-7">
            <div className={`p-8 rounded-3xl border backdrop-blur-xl transition-all shadow-xl ${isLight ? "bg-white border-slate-200" : "bg-[#0b0c10]/90 border-white/10"
              }`}>
              {status === "success" && successDetails ? (
                <div className="text-center py-10 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl mx-auto">
                    ✓
                  </div>
                  <h2 className="text-2xl font-bold outfit">Message Sent Successfully!</h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out. We have logged your submission and sent a notification to our support team.
                  </p>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs font-mono space-y-1 max-w-sm mx-auto">
                    <div className="text-slate-400">Reference ID: <span className="text-indigo-400">{successDetails.messageId}</span></div>
                    <div className="text-slate-400">Timestamp: {new Date(successDetails.timestamp).toLocaleTimeString()}</div>
                  </div>
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setFormData({ name: "", email: "", subject: "General Inquiry", message: "" });
                    }}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all outfit"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1 outfit">Send a Message</h2>
                    <p className="text-xs text-slate-400">Fill out the fields below and we'll get back to you promptly.</p>
                  </div>

                  {status === "error" && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">Your Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Maaj Bhadgaonkar"
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                          }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                          }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-wider">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-[#0f1117] border-white/10 text-white"
                        }`}
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Partnership & Press">Partnership & Press</option>
                      <option value="Report a Bug">Report a Bug</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Message</label>
                      <span className="text-[11px] font-mono text-slate-400">{formData.message.length} / 1000</span>
                    </div>
                    <textarea
                      required
                      rows={5}
                      maxLength={1000}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your story project or how we can help..."
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                        }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 outfit"
                  >
                    {status === "submitting" ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Sending message...
                      </>
                    ) : (
                      "Send Message to Team"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
