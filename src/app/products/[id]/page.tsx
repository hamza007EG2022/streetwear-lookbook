"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const sizeChart = [
  { label: "XS", chest: "86-91", waist: "71-76", length: "69" },
  { label: "S", chest: "91-97", waist: "76-81", length: "71" },
  { label: "M", chest: "97-102", waist: "81-86", length: "74" },
  { label: "L", chest: "102-107", waist: "86-91", length: "76" },
  { label: "XL", chest: "107-112", waist: "91-97", length: "79" },
  { label: "XXL", chest: "112-117", waist: "97-102", length: "81" },
];

const stockLabels: Record<string, { label: string; color: string }> = {
  in_stock: { label: "In Stock", color: "text-green-600" },
  low_stock: { label: "Low Stock", color: "text-amber-600" },
  out_of_stock: { label: "Sold Out", color: "text-red-600" },
};

const allSizes = ["XS", "S", "M", "L", "XL", "XXL"];

export default function ProductPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderStep, setOrderStep] = useState<"choose" | "build" | "details" | "done">("choose");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
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

  function openOrderModal() {
    const initial: Record<string, number> = {};
    (product?.sizes || [...allSizes]).forEach((s: string) => { initial[s] = 0; });
    setQuantities(initial);
    setForm({ name: "", phone: "", address: "", note: "" });
    setOrderStep("choose");
    setOrderError("");
    setShowOrderModal(true);
  }

  function totalItems(): number {
    return Object.values(quantities).reduce((a, b) => a + b, 0);
  }

  function orderTotal(): number {
    const price = parseFloat(product?.price?.replace(/[^0-9.]/g, "") || "0");
    return totalItems() * price;
  }

  function selectedItems() {
    return Object.entries(quantities).filter(([, q]) => q > 0).map(([size, q]) => ({ size, quantity: q }));
  }

  async function handleSubmitOrder() {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) return;
    setSubmitting(true);
    setOrderError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productPhoto: photos[0] || "",
          items: selectedItems(),
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          deliveryAddress: form.address.trim(),
          note: form.note.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setOrderStep("done");
    } catch {
      setOrderError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const related = data?.products?.filter((p: any) => p.id !== product?.id && p.category === product?.category) || [];

  if (!data || !product) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase opacity-30">Loading...</p>
      </div>
    );
  }

  const stockInfo = stockLabels[product.stock] || stockLabels.in_stock;
  const priceNum = parseFloat(product.price?.replace(/[^0-9.]/g, "") || "0");

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
            <p className="text-xl font-medium mb-4">{product.price}</p>

            <p className={`text-xs tracking-wider uppercase mb-6 ${stockInfo.color}`}>
              {stockInfo.label}
            </p>

            <p className="text-sm opacity-60 leading-relaxed mb-6">{product.description}</p>

            {product.material && (
              <div className="mb-6">
                <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-1">Material</p>
                <p className="text-sm">{product.material}</p>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] tracking-[0.3em] uppercase opacity-40">Available Sizes</p>
                  <button onClick={() => setShowSizeGuide(true)}
                    className="text-[10px] tracking-widest uppercase underline opacity-40 hover:opacity-100">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button key={s} onClick={() => { setSelectedSize(s); }}
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

            <button onClick={openOrderModal}
              className="w-full md:w-auto bg-black text-white px-10 py-3 text-sm tracking-[0.2em] uppercase hover:opacity-80 transition-opacity mt-auto">
              Contact to Order
            </button>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-24">
            <p className="text-xs tracking-[0.3em] uppercase opacity-30 mb-8">Related Products</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.slice(0, 4).map((p: any) => (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="group block bg-zinc-50 border border-black/5 overflow-hidden">
                  <div className="aspect-[3/4] bg-zinc-100 overflow-hidden">
                    {p.photos?.[0] ? (
                      <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px] tracking-widest uppercase opacity-30">No Photo</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-[10px] opacity-40 mt-0.5">{p.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
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
            className="absolute top-6 right-6 text-white/60 hover:text-white text-xl z-10">✕</button>
          {selectedPhoto > 0 && (
            <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-6 text-white/40 hover:text-white text-3xl z-10">‹</button>
          )}
          {selectedPhoto < photos.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-6 text-white/40 hover:text-white text-3xl z-10">›</button>
          )}
          <img src={currentPhoto} alt={product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_: string, i: number) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setSelectedPhoto(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === selectedPhoto ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
          <p className="absolute bottom-6 right-6 text-white/30 text-xs">{selectedPhoto + 1} / {photos.length}</p>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[100] bg-black/20 flex items-center justify-center" onClick={() => setShowSizeGuide(false)}>
          <div className="bg-white p-8 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold tracking-wider uppercase">Size Guide</h2>
              <button onClick={() => setShowSizeGuide(false)} className="text-sm opacity-30 hover:opacity-100">✕</button>
            </div>
            <p className="text-[10px] tracking-widest uppercase opacity-30 mb-4">Measurements in centimeters</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left py-2 font-medium tracking-wider uppercase">Size</th>
                  <th className="text-left py-2 font-medium tracking-wider uppercase">Chest</th>
                  <th className="text-left py-2 font-medium tracking-wider uppercase">Waist</th>
                  <th className="text-left py-2 font-medium tracking-wider uppercase">Length</th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((row) => (
                  <tr key={row.label} className="border-b border-black/5">
                    <td className="py-2 font-medium">{row.label}</td>
                    <td className="py-2 opacity-60">{row.chest} cm</td>
                    <td className="py-2 opacity-60">{row.waist} cm</td>
                    <td className="py-2 opacity-60">{row.length} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] opacity-30 mt-4">Fit may vary by style. Contact us for exact measurements.</p>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[100] bg-black/20 flex items-center justify-center" onClick={() => setShowOrderModal(false)}>
          <div className="bg-white max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/5">
              <div>
                <h2 className="text-sm font-bold tracking-wider uppercase">Order</h2>
                <p className="text-[10px] opacity-40 mt-0.5">{product.name} — {product.price}</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="text-sm opacity-30 hover:opacity-100">✕</button>
            </div>

            {/* Step: Choose method */}
            {orderStep === "choose" && (
              <div className="p-6 space-y-4">
                <p className="text-xs tracking-widest uppercase opacity-40">Choose how to order</p>
                <button disabled
                  className="w-full flex items-center gap-4 border border-black/10 p-4 text-left opacity-50 cursor-not-allowed">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="text-sm font-medium">Order via WhatsApp</p>
                    <p className="text-[10px] opacity-40">Coming soon</p>
                  </div>
                </button>
                <button onClick={() => setOrderStep("build")}
                  className="w-full flex items-center gap-4 border border-black/10 p-4 text-left hover:bg-zinc-50 transition-colors">
                  <span className="text-2xl">🛍️</span>
                  <div>
                    <p className="text-sm font-medium">Order via Website</p>
                    <p className="text-[10px] opacity-40">Select sizes and checkout</p>
                  </div>
                </button>
              </div>
            )}

            {/* Step 1: Build order */}
            {orderStep === "build" && (
              <div className="p-6">
                <p className="text-[10px] tracking-widest uppercase opacity-40 mb-4">Step 1 of 2 — Select sizes & quantities</p>
                <div className="space-y-3 mb-6">
                  {(product.sizes || allSizes).map((size: string) => (
                    <div key={size} className="flex items-center justify-between border-b border-black/5 pb-3">
                      <span className="text-sm font-medium">{size}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setQuantities((prev) => ({ ...prev, [size]: Math.max(0, (prev[size] || 0) - 1) }))}
                          className="w-8 h-8 border border-black/10 flex items-center justify-center text-sm hover:bg-zinc-50 transition-colors disabled:opacity-20"
                          disabled={(quantities[size] || 0) === 0}>−</button>
                        <span className="w-6 text-center text-sm font-medium">{quantities[size] || 0}</span>
                        <button onClick={() => setQuantities((prev) => ({ ...prev, [size]: (prev[size] || 0) + 1 }))}
                          className="w-8 h-8 border border-black/10 flex items-center justify-center text-sm hover:bg-zinc-50 transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live summary */}
                <div className="bg-zinc-50 p-4 mb-6">
                  {totalItems() === 0 ? (
                    <p className="text-xs opacity-30 italic">Your order is empty</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Order Summary</p>
                      {selectedItems().map(({ size, quantity }) => (
                        <div key={size} className="flex justify-between text-xs">
                          <span>{size} × {quantity}</span>
                          <span className="opacity-60">{(priceNum * quantity).toFixed(2)} EGP</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-black/10">
                        <span>Total</span>
                        <span>{orderTotal().toFixed(2)} EGP</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setOrderStep("choose")}
                    className="flex-1 border border-black/10 py-2 text-xs tracking-widest uppercase hover:bg-zinc-50">Back</button>
                  <button onClick={() => setOrderStep("details")}
                    disabled={totalItems() === 0}
                    className="flex-1 bg-black text-white py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customer details */}
            {orderStep === "details" && (
              <div className="p-6">
                <p className="text-[10px] tracking-widest uppercase opacity-40 mb-4">Step 2 of 2 — Your details</p>

                {(product.sizes || []).length > 0 && (
                  <div className="bg-zinc-50 p-3 mb-4 space-y-1">
                    <p className="text-[10px] tracking-widest uppercase opacity-40">Order Summary</p>
                    {selectedItems().map(({ size, quantity }) => (
                      <p key={size} className="text-xs">{size} × {quantity}</p>
                    ))}
                    <p className="text-xs font-bold pt-1 border-t border-black/10">Total: {orderTotal().toFixed(2)} EGP</p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full Name *" className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40" />
                  </div>
                  <div>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Phone Number *" type="tel" className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40" />
                  </div>
                  <div>
                    <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Delivery Address *" rows={3}
                      className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40 resize-none" />
                  </div>
                  <div>
                    <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Note or special request (optional)" rows={2}
                      className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40 resize-none" />
                  </div>
                </div>

                {orderError && <p className="text-xs text-red-500 mb-4">{orderError}</p>}

                <div className="flex gap-2">
                  <button onClick={() => setOrderStep("build")}
                    className="flex-1 border border-black/10 py-2 text-xs tracking-widest uppercase hover:bg-zinc-50">Back</button>
                  <button onClick={handleSubmitOrder}
                    disabled={!form.name.trim() || !form.phone.trim() || !form.address.trim() || submitting}
                    className="flex-1 bg-black text-white py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed">
                    {submitting ? "Submitting..." : "Submit Order"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {orderStep === "done" && (
              <div className="p-6 text-center">
                <p className="text-3xl mb-4">✅</p>
                <h3 className="text-lg font-bold tracking-tight mb-2">Order Placed!</h3>
                <p className="text-sm opacity-60 mb-1">Thank you, {form.name}.</p>
                <p className="text-sm opacity-60 mb-6">We'll contact you at {form.phone} soon to confirm.</p>

                {selectedItems().length > 0 && (
                  <div className="bg-zinc-50 p-4 mb-6 text-left max-w-xs mx-auto">
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Order Summary</p>
                    {selectedItems().map(({ size, quantity }) => (
                      <p key={size} className="text-xs">{size} × {quantity}</p>
                    ))}
                    <p className="text-xs font-bold pt-2 border-t border-black/10 mt-2">{orderTotal().toFixed(2)} EGP</p>
                  </div>
                )}

                <button onClick={() => setShowOrderModal(false)}
                  className="bg-black text-white px-8 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
