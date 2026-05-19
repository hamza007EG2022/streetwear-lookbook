"use client";

import { useState, useEffect } from "react";
import { usePublicData } from "@/components/DataContext";

export default function LookbookPage() {
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

  const items = data.lookbook || [];

  return (
    <div className="pt-16 min-h-screen animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <h1 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-4">Lookbook</h1>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">The Collection</h2>
      </div>
      {items.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}
                className={`bg-zinc-100 aspect-[2/3] flex items-center justify-center border border-zinc-200 ${i === 0 ? "md:row-span-2" : ""} ${i === 3 ? "md:col-span-2" : ""}`}>
                <span className="text-xs tracking-widest uppercase opacity-30">Photo {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {items.map((item: any) => (
              <div key={item.id} className="group relative overflow-hidden bg-zinc-100 aspect-[2/3] cursor-pointer">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${item.photo})` }} />
                {item.caption && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-6">
                    <p className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
