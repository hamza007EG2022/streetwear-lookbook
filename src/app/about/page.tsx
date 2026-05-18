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
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-4">
          About
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              {about.title || brand.name}
            </h2>
            <div className="prose prose-sm max-w-none opacity-70 leading-relaxed">
              <p>{about.text}</p>
            </div>
          </div>

          <div className="space-y-4">
            {about.images && about.images.length > 0 ? (
              about.images.map((img: string, i: number) => (
                <div
                  key={i}
                  className="bg-zinc-100 aspect-[4/3] bg-cover bg-center"
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))
            ) : (
              <div className="bg-zinc-100 aspect-[4/3] flex items-center justify-center border border-zinc-200">
                <span className="text-xs tracking-widest uppercase opacity-30">
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
