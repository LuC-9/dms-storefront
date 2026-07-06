"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-forge-950 py-14 md:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="max-w-xl space-y-4"
          >
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-safety-orange">
              Get in touch
            </p>
            <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-[0.03em] text-alloy-white md:text-5xl">
              Contact<br />Delta Mill
            </h1>
            <div className="h-px w-14 bg-safety-orange" />
            <p className="text-sm leading-relaxed text-blueprint-100/80">
              Contact us for quotations, stock checks, and bulk supply schedules. We respond to
              all enquiries within one business day.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact grid */}
      <section className="py-14 md:py-20">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            {/* Contact details */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="font-display text-xl font-bold uppercase tracking-[0.04em]">
                Contact details
              </h2>
              <div className="space-y-4">
                {contactDetails.map(({ Icon, label, value, mono }) => (
                  <motion.div
                    key={label}
                    variants={itemVariants}
                    className="flex gap-4 border border-steel-500/25 bg-alloy-white p-4"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-safety-orange/25 bg-safety-orange/8">
                      <Icon className="h-4 w-4 text-safety-orange" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-steel-400">
                        {label}
                      </p>
                      <p className={`text-sm text-iron-800 ${mono ? "font-mono tracking-[0.05em]" : ""}`}>
                        {value}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="border border-steel-500/25 bg-alloy-white p-5">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-steel-400">
                  Primary contact
                </p>
                <p className="mt-1 font-display text-lg font-semibold uppercase tracking-[0.04em]">
                  Ms. Shalini Awasthi
                </p>
                <p className="text-sm text-steel-500">Proprietor, Delta Mill Stores</p>
              </div>
            </motion.div>

            {/* Enquiry form */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="font-display text-xl font-bold uppercase tracking-[0.04em]">
                Send an enquiry
              </h2>

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3 border border-safety-orange/30 bg-safety-orange/5 p-6"
                >
                  <p className="font-display text-lg font-semibold uppercase tracking-[0.04em] text-safety-orange">
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
                      <label className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-steel-500">
                        Full name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-steel-500/30 bg-alloy-white px-3 py-2 text-sm text-iron-800 placeholder-steel-400 outline-none transition-[border-color] focus:border-safety-orange"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-steel-500">
                        Company
                      </label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                        className="w-full border border-steel-500/30 bg-alloy-white px-3 py-2 text-sm text-iron-800 placeholder-steel-400 outline-none transition-[border-color] focus:border-safety-orange"
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-steel-500">
                      Phone number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-steel-500/30 bg-alloy-white px-3 py-2 text-sm font-mono text-iron-800 placeholder-steel-400 outline-none transition-[border-color] focus:border-safety-orange"
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-steel-500">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full border border-steel-500/30 bg-alloy-white px-3 py-2 text-sm text-iron-800 placeholder-steel-400 outline-none transition-[border-color] focus:border-safety-orange"
                      placeholder="Describe your requirement — product names, quantities, specifications…"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-none border border-safety-orange bg-safety-orange font-display uppercase tracking-[0.05em] text-alloy-white hover:bg-safety-orange/90"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send enquiry
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
