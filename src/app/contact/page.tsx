"use client";

import { useState, useEffect } from "react";
import { usePublicData } from "@/components/DataContext";

export default function ContactPage() {
  const ctx = usePublicData();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (ctx) setData(ctx);
    fetch("/api/data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-pulse text-center">
          <div className="text-2xl font-black tracking-[0.15em] uppercase text-black/20 mb-3">TRIO</div>
          <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const { contact } = data;

  return (
    <div className="pt-16 min-h-screen animate-fade-in">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-4">Contact</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Get in Touch</h2>
            <p className="text-sm opacity-60 leading-relaxed mb-12 max-w-md">For inquiries, collaborations, or just to say hello.</p>
          </div>
          <div className="space-y-8">
            {contact.email && (
              <div>
                <h3 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-2">Email</h3>
                <a href={`mailto:${contact.email}`} className="text-lg font-medium hover:opacity-60 transition-opacity">{contact.email}</a>
              </div>
            )}
            {contact.instagram && (
              <div>
                <h3 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-2">Instagram</h3>
                <a href={`https://instagram.com/${contact.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  className="text-lg font-medium hover:opacity-60 transition-opacity">{contact.instagram}</a>
              </div>
            )}
            {contact.additional && (
              <div>
                <h3 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-2">Info</h3>
                <p className="text-sm opacity-70">{contact.additional}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
