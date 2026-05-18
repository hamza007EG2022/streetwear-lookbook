"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ProductPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const touchStartX = useRef(0);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        const p = d.products.find((prod: any) => prod.id === params.id);
        setProduct(p || null);
      })
      .catch(() => {});
  }, [params.id]);

  const photos = product?.photos || [];
  const currentPhoto = photos[selectedPhoto] || "";

  const goNext = useCallback(() => {
    if (selectedPhoto < photos.length - 1) setSelectedPhoto((p) => p + 1);
  }, [selectedPhoto, photos.length]);

  const goPrev = useCallback(() => {
    if (selectedPhoto > 0) setSelectedPhoto((p) => p - 1);
  }, [selectedPhoto]);

  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen, goNext, goPrev]);

  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext();
      else goPrev();
    }
  }

  function contactOrder() {
    if (product) {
      window.dispatchEvent(new CustomEvent("open-chat", {
        detail: { message: `I'm interested in: ${product.name} (${product.price})` },
      }));
    }
  }

  if (!data || !product) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase opacity-30">Loading...</p>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/lookbook" className="text-[10px] tracking-widest uppercase opacity-30 hover:opacity-100 transition-opacity">
          ← Back to Lookbook
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {/* Gallery */}
          <div>
            <div
              className="relative aspect-[4/5] bg-zinc-100 overflow-hidden cursor-pointer group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={() => photos.length > 0 && setFullscreen(true)}
            >
              {currentPhoto ? (
                <img src={currentPhoto} alt={product.name} className="w-full h-full object-cover transition-opacity duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs tracking-widest uppercase opacity-30">No Photo</span>
                </div>
              )}
              {photos.length > 1 && (
                <>
                  {selectedPhoto > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                      ‹
                    </button>
                  )}
                  {selectedPhoto < photos.length - 1 && (
                    <button onClick={(e) => { e.stopPropagation(); goNext(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                      ›
                    </button>
                  )}
                </>
              )}
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_: string, i: number) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setSelectedPhoto(i); }}
                      className={`w-2 h-2 rounded-full transition-colors ${i === selectedPhoto ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
              )}
            </div>

            {photos.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                {photos.map((url: string, i: number) => (
                  <button key={i} onClick={() => setSelectedPhoto(i)}
                    className={`w-16 h-16 flex-shrink-0 bg-zinc-100 border-2 overflow-hidden transition-colors ${
                      i === selectedPhoto ? "border-black" : "border-transparent opacity-60 hover:opacity-100"
                    }`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2">{product.category}</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{product.name}</h1>
            <p className="text-xl font-medium mb-6">{product.price}</p>

            <p className="text-sm opacity-60 leading-relaxed mb-8">{product.description}</p>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-3">Available Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${
                        selectedSize === s
                          ? "bg-black text-white border-black"
                          : "border-black/20 hover:border-black/60"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={contactOrder}
              className="w-full md:w-auto bg-black text-white px-10 py-3 text-sm tracking-[0.2em] uppercase hover:opacity-80 transition-opacity mt-auto">
              Contact to Order
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Viewer */}
      {fullscreen && currentPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setFullscreen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button onClick={() => setFullscreen(false)}
            className="absolute top-6 right-6 text-white/60 hover:text-white text-xl z-10">
            ✕
          </button>

          {selectedPhoto > 0 && (
            <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-6 text-white/40 hover:text-white text-3xl z-10">
              ‹
            </button>
          )}
          {selectedPhoto < photos.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-6 text-white/40 hover:text-white text-3xl z-10">
              ›
            </button>
          )}

          <img
            src={currentPhoto}
            alt={product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_: string, i: number) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setSelectedPhoto(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === selectedPhoto ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>

          <p className="absolute bottom-6 right-6 text-white/30 text-xs">
            {selectedPhoto + 1} / {photos.length}
          </p>
        </div>
      )}
    </div>
  );
}
