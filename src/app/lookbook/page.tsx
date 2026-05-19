"use client";

import { useEffect, useState } from "react";

export default function LookbookPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const items = data.lookbook || [];

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-red-400 mb-4">Lookbook</p>
        <div className="flex items-end justify-between">
          <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
            The Collection
          </h2>
          <p className="hidden md:block text-[10px] tracking-[0.3em] uppercase text-white/20">{items.length} Looks</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <div className="image-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`bg-zinc-900 aspect-[3/4] flex items-center justify-center ${i === 0 ? "tall" : ""} ${i === 3 ? "wide" : ""}`}
              >
                <span className="text-[10px] font-bold tracking-widest uppercase text-white/20">
                  Photo {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <div className="image-grid">
            {items.map((item: any, i: number) => (
              <div
                key={item.id}
                className="group relative overflow-hidden bg-zinc-900 aspect-[3/4] cursor-pointer"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${item.photo})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-white text-xs font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.caption}
                    </p>
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
