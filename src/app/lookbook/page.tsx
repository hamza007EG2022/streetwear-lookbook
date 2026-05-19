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
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-4">Lookbook</h1>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-16">
          The Collection
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <div className="image-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`bg-zinc-100 aspect-[3/4] flex items-center justify-center border border-zinc-200 ${i === 0 ? "tall" : ""} ${i === 3 ? "wide" : ""}`}
              >
                <span className="text-xs tracking-widest uppercase opacity-30">
                  Photo {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <div className="image-grid">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="group relative overflow-hidden bg-zinc-100 aspect-[3/4] cursor-pointer"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${item.photo})` }}
                />
                {item.caption && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-6">
                    <p className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
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
