"use client";

import { useEffect, useState } from "react";

export default function AboutPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { about, brand } = data;

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-red-400 mb-4">About</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-8">
              {about.title || brand.name}
            </h2>
            <div className="text-sm leading-relaxed text-white/50 max-w-md">
              <p>{about.text}</p>
            </div>
          </div>

          <div className="space-y-4">
            {about.images && about.images.length > 0 ? (
              about.images.map((img: string, i: number) => (
                <div
                  key={i}
                  className="bg-zinc-900 aspect-[4/3] bg-cover bg-center"
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))
            ) : (
              <div className="bg-zinc-900 aspect-[4/3] flex items-center justify-center">
                <span className="text-[10px] font-bold tracking-widest uppercase text-white/20">
                  Brand Image
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
