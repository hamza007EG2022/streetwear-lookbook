"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePublicData } from "@/components/DataContext";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/CartToast";
import { useCustomer } from "@/lib/customer-auth-context";

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

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ctx = usePublicData();
  const { addItem } = useCart();
  const { show: showToast } = useToast();
  const { customer } = useCustomer();
  const [data, setData] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(-1);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [waStep, setWaStep] = useState<'initial' | 'form'>('initial');
  const [waSize, setWaSize] = useState("");
  const [waQty, setWaQty] = useState(1);
  const [waColorIdx, setWaColorIdx] = useState(-1);
  const [waSizeErr, setWaSizeErr] = useState("");
  const [waColorErr, setWaColorErr] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (ctx) {
      setData(ctx);
      const p = ctx.products?.find((prod: any) => prod.id === params.id);
      if (p) setProduct(p);
    }
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        const p = d.products.find((prod: any) => prod.id === params.id);
        setProduct(p || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!product?.id || !customer?.id) return;
    fetch("/api/customer/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId: product.id, category: product.category }),
    }).catch(() => {});
  }, [product?.id, customer?.id]);

  const colorVariants = product?.colorVariants || [];
  const colorPhotos = selectedColorIdx >= 0 && colorVariants[selectedColorIdx]?.photos?.length
    ? colorVariants[selectedColorIdx].photos : null;
  const photos = colorPhotos || product?.photos || [];
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

  useEffect(() => {
    if (!product?.id) return;
    try {
      const raw = sessionStorage.getItem('recentlyViewed');
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      const updated = [product.id, ...viewed.filter((id: string) => id !== product.id)].slice(0, 6);
      sessionStorage.setItem('recentlyViewed', JSON.stringify(updated));
    } catch {}
  }, [product?.id]);

  useEffect(() => {
    if (product && searchParams.get('order') === 'true') {
      setShowOrderModal(true);
    }
  }, [product, searchParams]);

  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext();
      else goPrev();
    }
  }

  function handleColorChange(idx: number) {
    setSelectedColorIdx(idx);
    setSelectedPhoto(0);
  }

  function validateFullName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return "Please enter your full name";
    const words = trimmed.split(/\s+/);
    if (words.length < 3) return "Please enter your full name (First, Middle, Last)";
    const arabicRegex = /^[\u0600-\u06FF]+$/;
    const englishRegex = /^[A-Za-z]+$/;
    for (const word of words) {
      if (word.length < 2) return "Please enter your full name (First, Middle, Last)";
      if (!arabicRegex.test(word) && !englishRegex.test(word)) return "Please enter your full name (First, Middle, Last)";
    }
    return "";
  }

  function validateEgyptianPhone(phone: string): string {
    const trimmed = phone.trim();
    if (!trimmed) return "Please enter your phone number";
    if (!/^(010|011|012|015)\d{8}$/.test(trimmed)) return "Please enter a valid Egyptian phone number (010, 011, 012, or 015)";
    return "";
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "User-Agent": "TrioFashionApp/1.0" } }
      );
      const data = await res.json();
      if (data.display_name) {
        setCustomerAddress(data.display_name);
        setTimeout(() => setShowMapPicker(false), 200);
      }
    } catch {}
  }

  useEffect(() => {
    if (!showMapPicker || !mapContainerRef.current) return;
    if (mapRef.current) { mapRef.current.invalidateSize(); return; }

    let destroyed = false;

    async function initMap() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (destroyed || !mapContainerRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current, {
        center: [30.0444, 31.2357],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "&copy; Esri",
      }).addTo(map);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        attribution: "&copy; Esri",
      }).addTo(map);

      let marker: any = null;

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        if (marker) { marker.setLatLng([lat, lng]); }
        else {
          marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            reverseGeocode(pos.lat, pos.lng);
          });
        }
        reverseGeocode(lat, lng);
      });

      markerRef.current = null;
      mapRef.current = map;

      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 16),
          () => {},
          { timeout: 5000 }
        );
      } catch {}
    }

    initMap();

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMapPicker]);

  function submitWhatsAppOrder() {
    let valid = true;

    if (product?.sizes?.length > 0 && !waSize) {
      setWaSizeErr("Please select a size");
      valid = false;
    } else {
      setWaSizeErr("");
    }

    if (colorVariants.length > 0 && waColorIdx < 0) {
      setWaColorErr("Please select a color");
      valid = false;
    } else {
      setWaColorErr("");
    }

    const nameErr = validateFullName(customerName);
    if (nameErr) { setNameError(nameErr); valid = false; } else { setNameError(""); }

    const phoneErr = validateEgyptianPhone(customerPhone);
    if (phoneErr) { setPhoneError(phoneErr); valid = false; } else { setPhoneError(""); }

    if (!customerAddress.trim()) { setAddressError("Please enter your delivery address"); valid = false; } else { setAddressError(""); }

    if (!valid) return;

    const priceStr = product?.discountPrice || product?.price || '';
    const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    const total = (num * waQty).toFixed(2);
    const prefix = priceStr.replace(/[\d.,]+/, '');
    const colorLabel = waColorIdx >= 0 ? colorVariants[waColorIdx]?.label : '';
    const sizeStr = waSize || 'One Size';

    const message = `Hello TRIO FASHION! 🛍️
I would like to order:
📦 Product: ${product?.name}
🎨 Color: ${colorLabel || 'N/A'}
📏 Size: ${sizeStr}
🔢 Quantity: ${waQty}
💰 Price per item: ${priceStr}
💵 Total: ${prefix}${total}
👤 My Details:
Name: ${customerName.trim()}
Phone: ${customerPhone.trim()}
Address: ${customerAddress.trim()}
Please confirm my order. Thank you!`;

    const numOnly = data?.contact?.whatsapp?.replace(/[^0-9]/g, '') || '';
    if (numOnly) {
      window.open(`https://wa.me/${numOnly}?text=${encodeURIComponent(message)}`, '_blank');
    }

    setShowOrderModal(false);
    setWaStep('initial');
    setWaSize('');
    setWaQty(1);
    setWaColorIdx(-1);
    setWaSizeErr('');
    setWaColorErr('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setNameError('');
    setPhoneError('');
    setAddressError('');
  }

  const related = data?.products?.filter((p: any) => p.id !== product?.id && p.category === product?.category) || [];

  const recentlyViewedIds: string[] = (() => {
    try { return JSON.parse(sessionStorage.getItem('recentlyViewed') || '[]'); } catch { return []; }
  })();
  const recentlyViewedProducts = recentlyViewedIds
    .map((id: string) => data?.products?.find((p: any) => p.id === id))
    .filter((p: any) => p && p.id !== product?.id)
    .slice(0, 6);

  if (!data || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-pulse text-center">
          <div className="text-2xl font-black tracking-[0.15em] uppercase text-black/20 mb-3">TRIO</div>
          <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const stockInfo = stockLabels[product.stock] || stockLabels.in_stock;

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

            {colorVariants.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pb-2">
                {colorVariants.map((v: any, vi: number) => (
                  <button key={vi} onClick={() => handleColorChange(vi)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedColorIdx === vi ? 'border-black scale-110' : 'border-white/60 hover:border-black/40'
                    }`}
                    style={{ backgroundColor: v.color }}
                    title={v.label}
                  />
                ))}
                {selectedColorIdx >= 0 && (
                  <button onClick={() => handleColorChange(-1)}
                    className="text-[9px] text-black/30 hover:text-black/60 ml-auto tracking-wider">Clear</button>
                )}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2">{product.category}</p>
            {product.gender && product.gender !== 'unisex' && (
              <p className="text-[10px] tracking-[0.3em] uppercase opacity-30 mb-1">{product.gender}</p>
            )}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{product.name}</h1>

            {product.badge && product.badge !== 'none' && (
              <span className="inline-block bg-black text-white text-[9px] tracking-wider uppercase px-2 py-0.5 mb-3 w-fit">
                {product.badge === 'new_arrival' ? 'New Arrival' : product.badge === 'best_seller' ? 'Best Seller' : product.badge === 'limited_edition' ? 'Limited Edition' : 'Sale'}
              </span>
            )}

            {product.discountPrice ? (
              <div className="flex items-center gap-2 mb-4">
                <p className="text-xl font-medium text-red-600">{product.discountPrice}</p>
                <p className="text-sm opacity-30 line-through">{product.price}</p>
              </div>
            ) : (
              <p className="text-xl font-medium mb-4">{product.price}</p>
            )}

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

            {colorVariants.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2">Available Colors</p>
                <div className="flex items-center gap-3">
                  {colorVariants.map((v: any, vi: number) => (
                    <button key={vi} onClick={() => handleColorChange(vi)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs tracking-wider transition-all ${
                        selectedColorIdx === vi ? 'bg-black text-white border-black' : 'border-black/10 hover:border-black/30'
                      }`}>
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: v.color }} />
                      {v.label}
                    </button>
                  ))}
                  {selectedColorIdx >= 0 && (
                    <button onClick={() => handleColorChange(-1)}
                      className="text-[10px] text-black/30 hover:text-black/60 tracking-wider transition-colors">
                      Clear
                    </button>
                  )}
                </div>
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
                  {product.sizes.map((s: string) => {
                    const stockQty = product.stockPerSize?.[s];
                    const outOfStock = stockQty !== undefined && stockQty <= 0;
                    return (
                     <button key={s} onClick={() => !outOfStock && setSelectedSize(s)}
                       disabled={outOfStock}
className={`px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${
                         outOfStock
                          ? "border-red-200 text-red-300 cursor-not-allowed line-through"
                          : selectedSize === s
                            ? "bg-black text-white border-black"
                            : "border-black/20 hover:border-black/60"
                      }`}>
                      {s}{stockQty !== undefined && !outOfStock && <span className="ml-1 text-[9px] opacity-40">({stockQty})</span>}
                    </button>
                  );})}
                </div>
              </div>
            )}

            <button onClick={() => {
              addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
                discountPrice: product.discountPrice,
                photo: photos[selectedPhoto] || product.photos?.[0] || "",
                color: selectedColorIdx >= 0 ? colorVariants[selectedColorIdx]?.color : undefined,
                colorLabel: selectedColorIdx >= 0 ? colorVariants[selectedColorIdx]?.label : undefined,
                size: selectedSize || "One Size",
              });
              showToast("Added to cart ✓");
            }}
              className="w-full md:w-auto bg-black text-white px-10 py-3 text-sm tracking-[0.2em] uppercase hover:opacity-80 transition-opacity mb-3">
              ADD TO CART
            </button>
            <button onClick={() => setShowOrderModal(true)}
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
                  <div className="aspect-[3/4] bg-zinc-100 overflow-hidden relative">
                    {p.photos?.[0] ? (
                      <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px] tracking-widest uppercase opacity-30">No Photo</span>
                      </div>
                    )}
                    {p.badge && p.badge !== 'none' && (
                      <span className="absolute top-2 left-2 bg-black text-white text-[8px] tracking-wider uppercase px-1.5 py-0.5">{p.badge === 'new_arrival' ? 'New Arrival' : p.badge === 'best_seller' ? 'Best Seller' : p.badge === 'limited_edition' ? 'Limited Edition' : 'Sale'}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    {p.discountPrice ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-[10px] font-medium">{p.discountPrice}</p>
                        <p className="text-[9px] opacity-30 line-through">{p.price}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] opacity-40 mt-0.5">{p.price}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recentlyViewedProducts.length > 0 && (
          <div className="mt-16">
            <p className="text-xs tracking-[0.3em] uppercase opacity-30 mb-8">Recently Viewed</p>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
              {recentlyViewedProducts.map((p: any) => {
                const rv = recentlyViewedIds.indexOf(p.id);
                const rvi = rv >= 0 ? rv : -1;
                return (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="group flex-shrink-0 w-40 md:w-48 snap-start bg-zinc-50 border border-black/5 overflow-hidden">
                  <div className="aspect-[3/4] bg-zinc-100 overflow-hidden relative">
                    {p.photos?.[0] ? (
                      <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px] tracking-widest uppercase opacity-30">No Photo</span>
                      </div>
                    )}
                    {p.badge && p.badge !== 'none' && (
                      <span className="absolute top-2 left-2 bg-black text-white text-[8px] tracking-wider uppercase px-1.5 py-0.5">{p.badge === 'new_arrival' ? 'New Arrival' : p.badge === 'best_seller' ? 'Best Seller' : p.badge === 'limited_edition' ? 'Limited Edition' : 'Sale'}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    {p.discountPrice ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-[10px] font-medium">{p.discountPrice}</p>
                        <p className="text-[9px] opacity-30 line-through">{p.price}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] opacity-40 mt-0.5">{p.price}</p>
                    )}
                    {p.colorVariants?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        {p.colorVariants.map((v: any, cvi: number) => (
                          <span key={cvi} className="w-2.5 h-2.5 rounded-full border border-black/5" style={{ backgroundColor: v.color }} title={v.label} />
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );})}
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
        <div className="fixed inset-0 z-[100] bg-black/20 flex items-center justify-center" onClick={() => { setShowOrderModal(false); setNameError(""); setPhoneError(""); setAddressError(""); setWaStep('initial'); setWaSize(''); setWaQty(1); setWaColorIdx(-1); setWaSizeErr(''); setWaColorErr(''); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); }}>
          <div className="bg-white p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold tracking-wider uppercase">Contact to Order</h2>
              <button onClick={() => { setShowOrderModal(false); setNameError(""); setPhoneError(""); setAddressError(""); setWaStep('initial'); setWaSize(''); setWaQty(1); setWaColorIdx(-1); setWaSizeErr(''); setWaColorErr(''); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); }} className="text-sm opacity-30 hover:opacity-100">✕</button>
            </div>

            {waStep === 'initial' ? (
              <>
                <p className="text-[10px] opacity-40 mb-6 text-center">How would you like to order?</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setWaStep('form')}
                    className="w-full bg-green-600 text-white px-4 py-3 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">
                    ORDER VIA WHATSAPP
                  </button>
                  <button onClick={() => {
                    addItem({
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      discountPrice: product.discountPrice,
                      photo: photos[selectedPhoto] || product.photos?.[0] || "",
                      color: selectedColorIdx >= 0 ? colorVariants[selectedColorIdx]?.color : undefined,
                      colorLabel: selectedColorIdx >= 0 ? colorVariants[selectedColorIdx]?.label : undefined,
                      size: selectedSize || "One Size",
                    });
                    showToast("Added to cart ✓");
                    setShowOrderModal(false);
                    window.location.href = '/checkout';
                  }}
                    className="w-full bg-black text-white px-4 py-3 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">
                    ORDER VIA WEBSITE
                  </button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => { setWaStep('initial'); setWaSize(''); setWaQty(1); setWaColorIdx(-1); setWaSizeErr(''); setWaColorErr(''); }}
                  className="text-[10px] tracking-widest uppercase opacity-40 hover:opacity-100 mb-4 flex items-center gap-1">
                  ← Back
                </button>

                <div className="flex gap-4 mb-4">
                  {currentPhoto && (
                    <img src={currentPhoto} alt="" className="w-16 h-20 object-cover bg-zinc-100 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{product?.name}</p>
                    <p className="text-xs opacity-50 mt-0.5">
                      {product?.discountPrice ? <>{product.discountPrice} <span className="line-through opacity-50">{product.price}</span></> : product?.price}
                    </p>
                  </div>
                </div>

                {product?.sizes?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Size <span className="text-red-400">*</span></p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((s: string) => (
                        <button key={s} onClick={() => { setWaSize(s); setWaSizeErr(""); }}
                          className={`px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${
                            waSize === s ? "bg-black text-white border-black" : "border-black/20 hover:border-black/60"
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                    {waSizeErr && <p className="text-[10px] text-red-500 mt-1">{waSizeErr}</p>}
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Quantity <span className="text-red-400">*</span></p>
                  <div className="flex items-center gap-3 border border-black/20 px-3 py-2 w-fit">
                    <button onClick={() => setWaQty(Math.max(1, waQty - 1))}
                      className="w-7 h-7 border border-black/20 text-sm flex items-center justify-center hover:bg-zinc-100 transition-colors">−</button>
                    <span className="text-sm font-medium w-5 text-center">{waQty}</span>
                    <button onClick={() => setWaQty(waQty + 1)}
                      className="w-7 h-7 border border-black/20 text-sm flex items-center justify-center hover:bg-zinc-100 transition-colors">+</button>
                  </div>
                </div>

                {colorVariants.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Color <span className="text-red-400">*</span></p>
                    <div className="flex flex-wrap gap-2">
                      {colorVariants.map((v: any, vi: number) => (
                        <button key={vi} onClick={() => { setWaColorIdx(vi); setWaColorErr(""); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs tracking-wider transition-colors ${
                            waColorIdx === vi ? "bg-black text-white border-black" : "border-black/10 hover:border-black/30"
                          }`}>
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: v.color }} />
                          {v.label}
                        </button>
                      ))}
                    </div>
                    {waColorErr && <p className="text-[10px] text-red-500 mt-1">{waColorErr}</p>}
                  </div>
                )}

                <div className="border-t border-black/10 pt-4 mb-6 space-y-3">
                  <p className="text-[10px] tracking-widest uppercase opacity-40 mb-3">Your Details</p>
                  <div className="relative">
                    <input value={customerName}
                      onChange={(e) => { setCustomerName(e.target.value); setNameError(e.target.value ? validateFullName(e.target.value) : ""); }}
                      placeholder="Full Name (First, Middle, Last)"
                      className={`w-full border px-3 py-2 text-sm outline-none pr-7 ${
                        nameError ? "border-red-400 focus:border-red-500" : customerName && !nameError ? "border-green-500" : "border-black/20 focus:border-black/60"
                      }`} />
                    {customerName && !nameError && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>}
                    {nameError && <p className="text-[10px] text-red-500 mt-1">{nameError}</p>}
                  </div>
                  <div className="relative">
                    <input value={customerPhone}
                      onChange={(e) => { setCustomerPhone(e.target.value); setPhoneError(e.target.value ? validateEgyptianPhone(e.target.value) : ""); }}
                      placeholder="Phone Number (010, 011, 012, 015)"
                      type="tel"
                      className={`w-full border px-3 py-2 text-sm outline-none pr-7 ${
                        phoneError ? "border-red-400 focus:border-red-500" : customerPhone && !phoneError ? "border-green-500" : "border-black/20 focus:border-black/60"
                      }`} />
                    {customerPhone && !phoneError && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>}
                    {phoneError && <p className="text-[10px] text-red-500 mt-1">{phoneError}</p>}
                  </div>
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input value={customerAddress}
                          onChange={(e) => { setCustomerAddress(e.target.value); setAddressError(""); }}
                          placeholder="Delivery Address"
                          className={`w-full border px-3 py-2 text-sm outline-none pr-7 ${
                            addressError ? "border-red-400 focus:border-red-500" : customerAddress && !addressError ? "border-green-500" : "border-black/20 focus:border-black/60"
                          }`} />
                        {customerAddress && !addressError && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>}
                      </div>
                      <button type="button" onClick={() => setShowMapPicker(true)}
                        className="border border-black/20 px-3 py-2 text-sm hover:bg-zinc-100 transition-colors shrink-0"
                        title="Pick location on map">
                        📍
                      </button>
                    </div>
                    {addressError && <p className="text-[10px] text-red-500 mt-1">{addressError}</p>}
                  </div>
                </div>

                <button onClick={submitWhatsAppOrder}
                  className="w-full bg-green-600 text-white py-3 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">
                  Confirm & Open WhatsApp
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-[120] bg-black/20 flex items-center justify-center" onClick={() => { setShowMapPicker(false); }}>
          <div className="bg-white p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold tracking-wider uppercase">Drop a Pin</h3>
              <button onClick={() => { setShowMapPicker(false); }} className="text-sm opacity-30 hover:opacity-100">✕</button>
            </div>

            <p className="text-[10px] opacity-40 mb-3">Click anywhere on the map to place your exact delivery location. Drag the pin to fine-tune.</p>

            <div ref={mapContainerRef} className="w-full h-[360px] z-10" />

            <p className="text-[9px] opacity-30 text-center mt-3">
              Click the map to drop a pin. Powered by OpenStreetMap.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
