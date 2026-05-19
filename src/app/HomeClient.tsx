"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { PublicSiteData } from "@/lib/public-data";

export default function HomeClient({ initialData }: { initialData: PublicSiteData }) {
  const [data, setData] = useState(initialData);
  const [ready, setReady] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      requestAnimationFrame(() => setReady(true));
    }
  }, []);

  const { hero, brand, products } = data;

  const visibleProducts = products
    .filter((p: any) => p.visible !== false)
    .sort((a: any, b: any) => (a.priority || 999) - (b.priority || 999));

  const BADGE_LABELS: Record<string, string> = {
    new_arrival: "New Arrival",
    best_seller: "Best Seller",
    limited_edition: "Limited Edition",
    sale: "Sale",
  };

  return (
    <div className={`transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-zinc-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${hero.backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-8xl font-bold tracking-[0.1em] text-white mb-4 animate-fade-in">
            {hero.title}
          </h1>
          <p className="text-lg md:text-2xl tracking-[0.3em] text-white/70 uppercase animate-fade-in-delay">
            DEFINE YOUR STYLE — SS 2026
          </p>
          <p className="mt-6 text-sm tracking-[0.2em] text-white/50 uppercase animate-fade-in-delay-2">
            {brand.tagline}
          </p>
          <div className="mt-10 animate-fade-in-delay-2">
            <Link
              href="/lookbook"
              className="inline-block border border-white/30 text-white px-10 py-3 text-sm tracking-[0.2em] uppercase rounded-full transition-all duration-500 hover:bg-white hover:text-black hover:scale-105"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      {visibleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-12">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-xs tracking-[0.35em] font-bold uppercase text-black/40">Our Collection</h2>
            <Link href="/lookbook" className="text-[10px] tracking-[0.3em] uppercase text-black/30 hover:text-black/60 transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {visibleProducts.slice(0, 6).map((p: any) => {
              const badgeLabel = BADGE_LABELS[p.badge];
              return (
              <Link key={p.id} href={`/products/${p.id}`} className="group relative overflow-hidden bg-zinc-100 aspect-[3/4] block">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${p.photos?.[0] || ""})` }}
                />
                {badgeLabel && (
                  <span className="absolute top-3 left-3 bg-black text-white text-[9px] tracking-wider uppercase px-2 py-0.5 z-10">{badgeLabel}</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-white text-xs tracking-[0.25em] uppercase border border-white/60 px-6 py-2">
                    View Product
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-sm font-medium tracking-wider text-white drop-shadow-lg">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {p.discountPrice ? (
                      <>
                        <p className="text-xs text-white/90 font-medium">{p.discountPrice}</p>
                        <p className="text-[10px] text-white/50 line-through">{p.price}</p>
                      </>
                    ) : (
                      <p className="text-xs text-white/70">{p.price}</p>
                    )}
                  </div>
                </div>
              </Link>
            );})}
          </div>
        </section>
      )}
    </div>
  );
}
