"use client";

import { useState, useEffect } from "react";
import { usePublicData } from "@/components/DataContext";

export default function AboutPage() {
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

  const { about, brand } = data;

  return (
    <div className="pt-16 min-h-screen animate-fade-in">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-4">About</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">{about.title || brand.name}</h2>
            <div className="text-sm opacity-70 leading-relaxed max-w-md"><p>{about.text}</p></div>
          </div>
          <div className="space-y-4">
            {about.images && about.images.length > 0 ? (
              about.images.map((img: string, i: number) => (
                <div key={i} className="bg-zinc-100 aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
              ))
            ) : (
              <div className="bg-zinc-100 aspect-[4/3] flex items-center justify-center border border-zinc-200">
                <span className="text-xs tracking-widest uppercase opacity-30">Brand Image</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
