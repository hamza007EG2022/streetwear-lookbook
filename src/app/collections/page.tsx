"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CollectionsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 pt-20">
        <div className="animate-pulse text-center">
          <div className="text-2xl font-black tracking-[0.15em] uppercase text-black/20 mb-3">TRIO</div>
          <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const allCategories = [...new Set<string>(
    (data.products || [])
      .filter((p: any) => p.visible !== false)
      .map((p: any) => p.category?.toLowerCase().trim())
      .filter(Boolean)
  )];

  const collections = data.collections || [];

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.1em] uppercase mb-2">Collections</h1>
        <p className="text-sm opacity-40 tracking-widest uppercase mb-12">Explore our drops and categories</p>

        {collections.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs tracking-[0.35em] font-bold uppercase text-black/40 mb-8">Our Drops</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {collections.map((c: any) => (
                <Link key={c.id} href={`/?category=${encodeURIComponent(c.category)}`}
                  className="group relative overflow-hidden bg-zinc-900 aspect-[3/4] block">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${c.photo})` }} />
                  <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/20" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold tracking-[0.15em] uppercase text-white">{c.title}</h3>
                    {c.subtitle && <p className="text-[10px] tracking-widest uppercase text-white/50 mt-1">{c.subtitle}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xs tracking-[0.35em] font-bold uppercase text-black/40 mb-8">Categories</h2>
        {allCategories.length === 0 ? (
          <p className="text-xs opacity-30 italic">No categories found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allCategories.map((cat: string) => (
              <Link key={cat} href={`/?category=${encodeURIComponent(cat)}`
              } className="border border-black/10 px-5 py-4 text-sm tracking-wider uppercase hover:bg-black hover:text-white transition-colors text-center">
                {cat}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
