"use client";

import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[6px] text-[14px] text-[#111827] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition placeholder:text-[#9CA3AF]";

const labelClass = "block text-[13px] font-medium text-[#6B7280] mb-1.5";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-8 pt-8 pb-20">

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-[#E5E7EB]">
          <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight">
            Contact
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Questions, feedback, or bug reports — we&apos;d love to hear from you
          </p>
        </div>

        {status === "sent" ? (
          <div className="border border-[#E5E7EB] rounded-[4px] bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-[#111827] mb-1">Message sent.</p>
            <p className="text-[13px] text-[#6B7280] mb-5">
              Thanks for reaching out. We&apos;ll get back to you as soon as possible.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="text-[13px] text-[#2563EB] hover:text-[#1D4ED8] transition"
            >
              Send another message →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border border-[#E5E7EB] rounded-[4px] bg-white p-6 space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Subject</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Bug report, Feature request, General question"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Message</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us what's on your mind..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {status === "error" && (
              <div className="border border-[#E5E7EB] rounded-[4px] px-4 py-3 text-[13px] text-[#B45309]">
                <span className="font-medium">Error:</span> Something went wrong. Please try again or email{" "}
                <a href="mailto:arensawa@gmail.com" className="text-[#2563EB] hover:text-[#1D4ED8]">
                  arensawa@gmail.com
                </a>{" "}
                directly.
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-medium rounded-[6px] transition"
            >
              {status === "sending" ? "Sending..." : "Send message →"}
            </button>

            <p className="text-[12px] text-[#9CA3AF] text-center">
              Or email us directly at{" "}
              <a href="mailto:arensawa@gmail.com" className="text-[#2563EB] hover:text-[#1D4ED8]">
                arensawa@gmail.com
              </a>
            </p>

          </form>
        )}

      </div>
    </main>
  );
}
