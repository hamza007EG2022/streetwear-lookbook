"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { PublicSiteData } from "@/lib/public-data";

export default function HomeClient({ initialData }: { initialData: PublicSiteData }) {
  const [data, setData] = useState(initialData);
  const [ready, setReady] = useState(false);
  const mounted = useRef(false);
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const router = useRouter();

  const [marqueeHovered, setMarqueeHovered] = useState(false);
  const [cardHovered, setCardHovered] = useState<Record<string, boolean>>({});
  const [activeDot, setActiveDot] = useState<Record<string, number>>({});
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [qvPhotoIdx, setQvPhotoIdx] = useState(0);
  const [qvColorIdx, setQvColorIdx] = useState(-1);
  const [qvSize, setQvSize] = useState("");

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      requestAnimationFrame(() => setReady(true));
    }
  }, []);

  useEffect(() => {
    if (quickViewProduct) { setQvPhotoIdx(0); setQvColorIdx(-1); setQvSize(""); }
  }, [quickViewProduct?.id]);

  const { hero, brand, products, marquee } = data;

  const marqueeContent = Array(20).fill(marquee?.text || 'TRIO FASHION — SS 2026 — DEFINE YOUR STYLE — NEW COLLECTION — STREET HIGH QUALITY —').join('   ');

  const visibleProducts = products
    .filter((p: any) => p.visible !== false)
    .filter((p: any) => !categoryFilter || p.category?.toLowerCase() === categoryFilter.toLowerCase())
    .sort((a: any, b: any) => (a.priority || 999) - (b.priority || 999));

  const BADGE_LABELS: Record<string, string> = {
    new_arrival: "New Arrival",
    best_seller: "Best Seller",
    limited_edition: "Limited Edition",
    sale: "Sale",
  };

  const stockLabels: Record<string, { label: string; color: string }> = {
    in_stock: { label: "In Stock", color: "text-green-600" },
    low_stock: { label: "Low Stock", color: "text-amber-600" },
    out_of_stock: { label: "Sold Out", color: "text-red-600" },
  };

  const qv = quickViewProduct;
  const qvStock = stockLabels[qv?.stock] || stockLabels.in_stock;
  const qvPhotos = qvColorIdx >= 0 && qv?.colorVariants?.[qvColorIdx]?.photos?.length
    ? qv.colorVariants[qvColorIdx].photos : qv?.photos || [];

  return (
    <div className={`transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-zinc-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${hero.backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
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
              className="inline-block border border-white/30 text-white px-10 py-3 text-sm tracking-[0.2em] uppercase rounded-full transition-all duration-500 hover:bg-white hover:text-black hover:scale-105 shine"
            >
              Explore Collection
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-scroll-down">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
            <path d="M7 13l5 5 5-5" />
            <path d="M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* Marquee */}
      {marquee?.enabled !== false && (
        <div
          className="overflow-hidden py-4"
          style={{ backgroundColor: marquee?.bgColor || '#000000', color: marquee?.textColor || '#ffffff' }}
          onMouseEnter={() => setMarqueeHovered(true)}
          onMouseLeave={() => setMarqueeHovered(false)}
        >
          <div
            className="animate-marquee whitespace-nowrap"
            style={{
              animationDuration: `${Math.max(5, 50 - (marquee?.speed || 5) * 4.5)}s`,
              fontFamily: marquee?.fontFamily || 'Audiowide',
              animationPlayState: marqueeHovered ? 'paused' : 'running',
            }}
          >
            <span className={`inline-block px-6 tracking-[0.3em] uppercase font-medium drop-shadow-[0_0_6px_rgba(255,255,255,0.12)] ${marquee?.textSize === 'large' ? 'text-xl' : marquee?.textSize === 'small' ? 'text-xs' : 'text-base'}`}>
              {marqueeContent}
            </span>
            <span className={`inline-block px-6 tracking-[0.3em] uppercase font-medium drop-shadow-[0_0_6px_rgba(255,255,255,0.12)] ${marquee?.textSize === 'large' ? 'text-xl' : marquee?.textSize === 'small' ? 'text-xs' : 'text-base'}`}>
              {marqueeContent}
            </span>
          </div>
        </div>
      )}

      {visibleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-12">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-sm tracking-[0.35em] font-bold uppercase text-black/40">Our Collection</h2>
            <Link href="/lookbook" className="text-[10px] tracking-[0.3em] uppercase text-black/30 hover:text-black/60 transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {visibleProducts.slice(0, 8).map((p: any, idx: number) => {
              const badgeLabel = BADGE_LABELS[p.badge];
              const ch = cardHovered[p.id] ?? false;
              const ad = activeDot[p.id] ?? -1;
              const variantPhoto = ad >= 0 && p.colorVariants?.[ad]?.photos?.[0] ? p.colorVariants[ad].photos[0] : null;
              const mainPhoto = variantPhoto || p.photos?.[0] || "";
              return (
              <div key={p.id} className="group animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                <div className="relative overflow-hidden bg-zinc-100 aspect-[3/4]"
                  onMouseEnter={() => setCardHovered({...cardHovered, [p.id]: true})}
                  onMouseLeave={() => { setCardHovered({...cardHovered, [p.id]: false}); setActiveDot({...activeDot, [p.id]: -1}); }}
                >
                  {/* Base photo */}
                  <img src={mainPhoto} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                    style={{ opacity: ch && !variantPhoto ? 0 : 1 }} />
                  {/* Hover photo (2nd product photo) */}
                  {p.photos?.[1] && (
                    <img src={p.photos[1]} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                      style={{ opacity: ch && !variantPhoto ? 1 : 0 }} />
                  )}
                  {badgeLabel && (
                    <span className="absolute top-3 left-3 bg-black text-white text-[9px] tracking-wider uppercase px-2 py-0.5 z-10">{badgeLabel}</span>
                  )}
                  {/* CHOOSE OPTIONS button */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                    <button onClick={() => { setQuickViewProduct(p); setQvColorIdx(-1); setQvPhotoIdx(0); setQvSize(""); }}
                      className="w-full bg-black text-white text-center py-3 text-xs tracking-[0.25em] uppercase">
                      CHOOSE OPTIONS
                    </button>
                  </div>
                </div>
                {/* Name and price - full width below card */}
                <div className="w-full pt-2.5">
                  <h3 className="text-base font-bold tracking-tight leading-tight">{p.name}</h3>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs opacity-40 uppercase tracking-wider">{p.category || ''}</span>
                    {p.discountPrice ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{p.discountPrice}</span>
                        <span className="text-[10px] opacity-40 line-through">{p.price}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold">{p.price}</span>
                    )}
                  </div>
                </div>
                {/* Color variant dots - hover to switch photo */}
                {p.colorVariants?.length > 0 && (
                  <div className="flex items-center gap-2 mt-2.5">
                    {p.colorVariants.map((v: any, cvi: number) => (
                      <span key={cvi}
                        onMouseEnter={() => setActiveDot({...activeDot, [p.id]: cvi})}
                        className={`w-4 h-4 rounded-full border cursor-pointer transition-transform hover:scale-125 ${
                          ad === cvi ? 'border-black scale-110' : 'border-black/20'
                        }`}
                        style={{ backgroundColor: v.color }}
                        title={v.label}
                      />
                    ))}
                  </div>
                )}
              </div>
            );})}
          </div>
        </section>
      )}

      {/* Promo Banner */}
      {data.banners?.filter((b: any) => b.active).length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          {data.banners.filter((b: any) => b.active).map((b: any) => (
            <div key={b.id} className="relative overflow-hidden bg-zinc-900 aspect-[2/1] md:aspect-[3/1] mb-4">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${b.image})`, backgroundPosition: b.bgPosition || 'center' }} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16">
                <h2 className="text-2xl md:text-5xl font-bold tracking-[0.05em] text-white max-w-lg">{b.title}</h2>
                {b.subtitle && <p className="text-sm md:text-base text-white/60 mt-2 max-w-md">{b.subtitle}</p>}
                {b.link && (
                  <Link href={b.link} className="inline-block mt-4 border border-white/40 text-white px-8 py-2.5 text-xs tracking-[0.2em] uppercase w-fit transition-all hover:bg-white hover:text-black">
                    Shop Now
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* OUR DROPS */}
      {data.collections?.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-sm tracking-[0.35em] font-bold uppercase text-black/40 mb-10">Our Drops</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.collections.map((c: any) => (
              <Link key={c.id} href={`/?category=${encodeURIComponent(c.category)}`}
                className="group relative overflow-hidden bg-zinc-900 aspect-[3/4] block">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${c.photo})` }} />
                <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/20" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold tracking-[0.15em] uppercase text-white">{c.title}</h3>
                  {c.subtitle && <p className="text-[10px] tracking-widest uppercase text-white/50 mt-1">{c.subtitle}</p>}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-white text-xs tracking-[0.25em] uppercase border border-white/60 px-6 py-2 bg-black/30 backdrop-blur-sm">
                    Shop Now
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* HEARD FROM YOU */}
      {data.reviews?.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-sm tracking-[0.35em] font-bold uppercase text-black/40 mb-10">Heard From You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.reviews.map((r: any) => (
              <div key={r.id} className="border border-black/5 bg-white p-6 space-y-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-sm ${(r.rating || 5) >= star ? 'text-black' : 'text-zinc-200'}`}>★</span>
                  ))}
                </div>
                {r.type === "video" ? (
                  <video src={r.photo} controls className="w-full aspect-video object-cover bg-zinc-100" />
                ) : r.photo ? (
                  <div className="w-full aspect-[4/3] bg-zinc-100 overflow-hidden">
                    <img src={r.photo} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : null}
                {r.quote && <p className="text-sm text-black/70 leading-relaxed italic">"{r.quote}"</p>}
                {r.name && <p className="text-xs tracking-widest uppercase font-medium">{r.name}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category Grid */}
      {(() => {
        const cats = [...new Set(data.products.filter((p: any) => p.category).map((p: any) => p.category))];
        if (cats.length === 0) return null;
        const catCol = data.collections || [];
        return (
          <section className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="text-sm tracking-[0.35em] font-bold uppercase text-black/40 mb-10">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cats.slice(0, 6).map((cat: any) => {
                const match = catCol.find((c: any) => c.category?.toLowerCase() === cat.toLowerCase());
                return (
                  <Link key={cat} href={`/?category=${encodeURIComponent(cat)}`}
                    className="group relative overflow-hidden bg-zinc-900 aspect-[4/3] block">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${match?.photo || ''})` }} />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-lg md:text-2xl font-bold tracking-[0.15em] uppercase">{cat}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* Quick View Popup */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-8"
          onClick={() => setQuickViewProduct(null)}>
          <div className="bg-white w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 md:rounded-lg"
            onClick={(e) => e.stopPropagation()}>

            {/* Left - Photos */}
            <div className="bg-zinc-100 relative">
              <div className="aspect-[4/5] md:aspect-[3/4] relative">
                <img src={qvPhotos[qvPhotoIdx] || ""} alt="" className="w-full h-full object-cover transition-opacity duration-300" />
                <button onClick={() => setQuickViewProduct(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/80 flex items-center justify-center md:hidden text-sm z-10">✕</button>
              </div>
              {qvPhotos.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {qvPhotos.map((url: string, i: number) => (
                    <button key={i} onClick={() => setQvPhotoIdx(i)}
                      className={`w-14 h-14 flex-shrink-0 border-2 overflow-hidden transition-colors ${
                        i === qvPhotoIdx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right - Details */}
            <div className="p-6 md:p-8 flex flex-col relative">
              <button onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-lg opacity-40 hover:opacity-100 transition-opacity hidden md:flex">✕</button>

              {qv.badge && qv.badge !== 'none' && (
                <span className="inline-block bg-black text-white text-[9px] tracking-wider uppercase px-2 py-0.5 mb-3 w-fit">
                  {BADGE_LABELS[qv.badge]}
                </span>
              )}

              <h2 className="text-xl font-bold tracking-tight">{qv.name}</h2>

              <div className="flex items-center gap-2 mt-2">
                {qv.discountPrice ? (
                  <>
                    <span className="text-lg font-bold">{qv.discountPrice}</span>
                    <span className="text-sm opacity-40 line-through">{qv.price}</span>
                  </>
                ) : (
                  <span className="text-lg font-bold">{qv.price}</span>
                )}
              </div>

              <p className={`text-xs tracking-wider uppercase mt-2 ${qvStock.color}`}>{qvStock.label}</p>

              {qv.description && (
                <p className="text-xs text-black/60 mt-4 leading-relaxed line-clamp-3">{qv.description}</p>
              )}

              {/* Color swatches */}
              {qv.colorVariants?.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Color</p>
                  <div className="flex gap-2">
                    {qv.colorVariants.map((v: any, vi: number) => (
                      <button key={vi} onClick={() => { setQvColorIdx(vi); setQvPhotoIdx(0); }}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          qvColorIdx === vi ? 'border-black scale-110' : 'border-transparent hover:border-black/40'
                        }`}
                        style={{ backgroundColor: v.color }} title={v.label} />
                    ))}
                    {qvColorIdx >= 0 && (
                      <button onClick={() => { setQvColorIdx(-1); setQvPhotoIdx(0); }}
                        className="text-[9px] text-black/30 hover:text-black/60 ml-auto tracking-wider">Clear</button>
                    )}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {qv.sizes?.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {qv.sizes.map((s: string) => {
                      const sqty = qv.stockPerSize?.[s];
                      const oos = sqty !== undefined && sqty <= 0;
                      return (
                      <button key={s} onClick={() => !oos && setQvSize(s)} disabled={oos}
                        className={`px-4 py-2 text-xs tracking-widest uppercase border transition-all ${
                          oos
                            ? 'border-red-200 text-red-300 cursor-not-allowed line-through'
                            : qvSize === s
                              ? 'bg-black text-white border-black'
                              : 'border-black/20 hover:border-black/60'
                        }`}>
                        {s}{sqty !== undefined && !oos && <span className="ml-1 opacity-40">({sqty})</span>}
                      </button>
                    );})}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-auto pt-8 space-y-3">
                <button onClick={() => { setQuickViewProduct(null); router.push(`/products/${qv.id}?order=true`); }}
                  className="w-full bg-black text-white py-3.5 text-xs tracking-[0.25em] uppercase font-medium transition-opacity hover:opacity-80">
                  ADD TO CART
                </button>
                <button onClick={() => { setQuickViewProduct(null); router.push(`/products/${qv.id}`); }}
                  className="w-full border border-black py-3.5 text-xs tracking-[0.25em] uppercase font-medium transition-colors hover:bg-black hover:text-white">
                  BUY IT NOW
                </button>
                <button onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/products/' + qv.id);
                }} className="w-full text-[10px] tracking-widest uppercase opacity-40 hover:opacity-100 transition-opacity py-2">
                  SHARE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
