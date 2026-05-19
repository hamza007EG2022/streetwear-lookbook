"use client";

import { useEffect, useState } from "react";

export default function ContactPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { contact, brand } = data;

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-red-400 mb-4">Contact</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
              Get in Touch
            </h2>
            <p className="text-sm text-white/40 max-w-md">
              For inquiries, collaborations, or just to say hello.
            </p>
          </div>

          <div className="space-y-10">
            {contact.email && (
              <div className="border-l-2 border-white/10 pl-6">
                <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30 mb-3">Email</h3>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-xl font-bold tracking-tight hover:text-white/60 transition-colors"
                >
                  {contact.email}
                </a>
              </div>
            )}

            {contact.instagram && (
              <div className="border-l-2 border-white/10 pl-6">
                <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30 mb-3">Instagram</h3>
                <a
                  href={`https://instagram.com/${contact.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-bold tracking-tight hover:text-white/60 transition-colors"
                >
                  {contact.instagram}
                </a>
              </div>
            )}

            {contact.additional && (
              <div className="border-l-2 border-white/10 pl-6">
                <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30 mb-3">Info</h3>
                <p className="text-sm text-white/60">{contact.additional}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
