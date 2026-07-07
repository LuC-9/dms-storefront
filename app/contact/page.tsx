"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Mail, MapPin, Phone, Send, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/storefront/reveal";

const contactDetails = [
  {
    Icon: MapPin,
    label: "Address",
    value: "78/45 Latouche Road, Anwar Ganj, Mulganj, Kanpur, Uttar Pradesh — 208001, India",
  },
  {
    Icon: Phone,
    label: "Phone",
    value: "512-2362054",
    mono: true,
  },
  {
    Icon: Mail,
    label: "Email",
    value: "deltamillstores@example.com",
  },
  {
    Icon: Clock,
    label: "Business hours",
    value: "Mon – Sat, 9:00 AM to 6:30 PM IST",
  },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", company: "", phone: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as { error?: { message?: string } }).error?.message ?? "Failed to send. Please try again.";
        setError(msg);
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2rem] bg-iron-800 px-6 py-12 shadow-card-hover md:px-10 md:py-16">
            <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-safety-orange/20 blur-3xl" />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-2xl space-y-5"
            >
              <p className="industrial-eyebrow">Get in touch</p>
              <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
                Tell us what you need sourced.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-steel-200">
                Send product names, quantities, pressure ratings, or application details. We will help
                confirm availability and get back with the right next step.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-steel-300">
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">Stock checks</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">Bulk quotes</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">Same-day dispatch guidance</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <Reveal direction="left" className="space-y-6">
              <div>
                <p className="industrial-eyebrow">Contact details</p>
                <h2 className="section-heading mt-2">Reach the Kanpur desk</h2>
                <p className="mt-3 text-sm leading-relaxed text-steel-500">
                  For quick replies, include the item name, quantity, brand preference, and delivery city.
                </p>
              </div>
              <Stagger className="space-y-4">
                {contactDetails.map(({ Icon, label, value, mono }) => (
                  <StaggerItem key={label}>
                    <div className="card-surface flex gap-4 p-4">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-safety-orange/10">
                        <Icon className="h-5 w-5 text-safety-orange" strokeWidth={1.7} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-steel-400">{label}</p>
                        <p className={`text-sm leading-relaxed text-iron-800 ${mono ? "font-mono tracking-[0.02em]" : ""}`}>
                          {value}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
              <div className="rounded-2xl bg-iron-800 p-5 text-white shadow-card">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 text-safety-orange" strokeWidth={1.7} />
                  <div>
                    <p className="text-xs font-semibold text-steel-300">Primary contact</p>
                    <p className="mt-1 font-display text-lg font-semibold">
                      Mr. Vineet Awasthi
                    </p>
                    <p className="text-sm text-steel-300">Proprietor, Delta Mill Stores</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" className="card-surface p-5 md:p-6">
              <div className="mb-6">
                <p className="industrial-eyebrow">Send an enquiry</p>
                <h2 className="section-heading mt-2">Request stock or pricing</h2>
              </div>

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3 rounded-2xl bg-safety-orange/10 p-6 ring-1 ring-safety-orange/20"
                >
                  <p className="font-display text-lg font-semibold text-safety-orange">
                    Enquiry received
                  </p>
                  <p className="text-sm text-steel-500">
                    Thank you for contacting Delta Mill Stores. We will get back to you within
                    one business day.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-steel-500">
                        Full name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full rounded-xl border border-steel-200 bg-white px-3 py-2.5 text-sm text-iron-800 shadow-sm placeholder:text-steel-400 transition-[border-color,box-shadow] focus:border-safety-orange focus:shadow-md"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-steel-500">
                        Company
                      </label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                        className="w-full rounded-xl border border-steel-200 bg-white px-3 py-2.5 text-sm text-iron-800 shadow-sm placeholder:text-steel-400 transition-[border-color,box-shadow] focus:border-safety-orange focus:shadow-md"
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-steel-500">
                      Phone number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-xl border border-steel-200 bg-white px-3 py-2.5 text-sm text-iron-800 shadow-sm placeholder:text-steel-400 transition-[border-color,box-shadow] focus:border-safety-orange focus:shadow-md"
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-steel-500">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full rounded-xl border border-steel-200 bg-white px-3 py-2.5 text-sm text-iron-800 shadow-sm placeholder:text-steel-400 transition-[border-color,box-shadow] focus:border-safety-orange focus:shadow-md"
                      placeholder="Describe your requirement — product names, quantities, specifications…"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-safety-orange font-semibold text-alloy-white shadow-sm hover:bg-accent-600 hover:shadow-md disabled:opacity-60"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Sending…" : "Send enquiry"}
                  </Button>
                </form>
              )}
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
