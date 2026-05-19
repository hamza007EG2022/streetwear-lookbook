"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { hero, brand, products } = data;

  return (
    <>
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-zinc-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${hero.backgroundImage})`,
            filter: "brightness(0.6)",
          }}
        />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-8xl font-bold tracking-[0.1em] text-white mb-4 animate-fade-in">
            {hero.title}
          </h1>
          <p className="text-lg md:text-2xl tracking-[0.3em] text-white/70 uppercase animate-fade-in-delay">
            {hero.subtitle}
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

      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-12">Featured</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            {products.slice(0, 3).map((p: any) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group relative overflow-hidden bg-zinc-100 aspect-[3/4] block">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${p.photos?.[0] || ""})` }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-sm font-medium tracking-wider text-white drop-shadow-lg">{p.name}</h3>
                  <p className="text-xs text-white/70 mt-1">{p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
