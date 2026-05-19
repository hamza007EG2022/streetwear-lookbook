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
      <section className="relative h-screen flex items-center overflow-hidden bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: `url(${hero.backgroundImage})`,
            filter: "brightness(0.4) saturate(1.2)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-red-400 mb-6 animate-fade-up">
              {hero.subtitle}
            </p>
            <h1 className="text-6xl md:text-9xl font-black tracking-tight text-white leading-[0.9] mb-6 animate-fade-up-delay">
              {hero.title}
            </h1>
            <p className="text-sm md:text-base tracking-[0.2em] uppercase text-white/40 max-w-md animate-fade-up-delay-2">
              {brand.tagline}
            </p>
            <div className="mt-10 flex gap-4 animate-fade-up-delay-2">
              <Link
                href="/lookbook"
                className="bg-white text-black px-10 py-3 text-xs font-bold tracking-[0.25em] uppercase transition-all hover:bg-white/80"
              >
                Explore
              </Link>
              <Link
                href="/products"
                className="border border-white/30 text-white px-10 py-3 text-xs font-bold tracking-[0.25em] uppercase transition-all hover:bg-white hover:text-black"
              >
                Shop
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-white/30">Featured Drops</h2>
            <Link href="/lookbook" className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.slice(0, 3).map((p: any, i: number) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group relative overflow-hidden bg-zinc-900 aspect-[3/4] block"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${p.photos?.[0] || ""})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-red-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{p.category}</p>
                  <h3 className="text-lg font-bold tracking-tight text-white">{p.name}</h3>
                  <p className="text-xs text-white/50 mt-1">{p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-white/10 py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/20 mb-4">The Culture</p>
          <p className="text-3xl md:text-5xl font-black tracking-tight text-white/90 max-w-3xl mx-auto leading-tight">
            Streetwear isn&apos;t just what you wear.
            <br />
            <span className="text-white/40">It&apos;s who you are.</span>
          </p>
          <div className="mt-12 flex justify-center gap-8 text-xs font-bold tracking-[0.25em] uppercase text-white/20">
            <span>Quality</span>
            <span className="text-white/50">·</span>
            <span>Culture</span>
            <span className="text-white/50">·</span>
            <span>Originals</span>
          </div>
        </div>
      </section>
    </>
  );
}
