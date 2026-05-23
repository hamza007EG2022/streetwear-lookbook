"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useCustomer } from "@/lib/customer-auth-context";

const GOVS = [
  "Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Cairo", "Dakahlia",
  "Damietta", "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr El Sheikh", "Luxor",
  "Matrouh", "Minya", "Monufia", "New Valley", "North Sinai", "Port Said",
  "Qalyubia", "Qena", "Red Sea", "Sharqia", "Sohag", "South Sinai", "Suez",
];

function parsePrice(price: string): number {
  return parseFloat((price || "").replace(/[^0-9.]/g, "")) || 0;
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

function validatePhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "Please enter your phone number";
  if (!/^(010|011|012|015)\d{8}$/.test(trimmed)) return "Please enter a valid Egyptian phone number";
  return "";
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalItems, clearCart } = useCart();
  const { customer } = useCustomer();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [govError, setGovError] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Step 3
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentError, setPaymentError] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [screenshotError, setScreenshotError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; message?: string; waLink?: string; fawryRef?: string } | null>(null);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Step 4
  const [orderId, setOrderId] = useState("");

  // Delivery settings from server
  const [deliveryFeeAmount, setDeliveryFeeAmount] = useState(80);
  const [freeMin, setFreeMin] = useState(2000);
  const [codEnabled, setCodEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        if (d.contact) {
          setDeliveryFeeAmount(d.contact.deliveryFee ?? 80);
          setFreeMin(d.contact.freeDeliveryMinimum ?? 2000);
          setCodEnabled(d.contact.codEnabled !== false);
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce((sum, item) => {
    return sum + parsePrice(item.discountPrice || item.price) * item.quantity;
  }, 0);
  const deliveryFee = subtotal >= freeMin ? 0 : deliveryFeeAmount;
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "free_delivery") {
      couponDiscount = deliveryFee;
    } else if (appliedCoupon.type === "percentage") {
      couponDiscount = subtotal * (appliedCoupon.discount / 100);
    } else {
      couponDiscount = appliedCoupon.discount;
    }
  }
  const total = subtotal + deliveryFee - couponDiscount;

  useEffect(() => {
    if (items.length === 0 && step < 4) {
      router.push("/");
    }
  }, [items, step, router]);

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

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        if (marker) { marker.setLatLng([lat, lng]); }
        else {
          marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            reverseGeocode(pos.lat, pos.lng);
          });
        }
        await reverseGeocode(lat, lng);
      });

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
      }
    };
  }, [showMapPicker]);

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "User-Agent": "TrioFashionApp/1.0" } }
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
        setAddressError("");
        setTimeout(() => setShowMapPicker(false), 200);
      }
    } catch {}
  }

  async function uploadScreenshot(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const { url } = await res.json();
    return url;
  }

  function validateStep1(): boolean {
    const ne = validateFullName(name);
    const pe = validatePhone(phone);
    const ae = !address.trim() ? "Please enter your delivery address" : "";
    const ge = !governorate ? "Please select your governorate" : "";
    setNameError(ne);
    setPhoneError(pe);
    setAddressError(ae);
    setGovError(ge);
    return !ne && !pe && !ae && !ge;
  }

  function validateStep3(): boolean {
    if (!paymentMethod) { setPaymentError("Please select a payment method"); return false; }
    setPaymentError("");
    if (paymentMethod !== "cod" && paymentMethod !== "fawry") {
      if (!screenshot) { setScreenshotError("Please upload a payment screenshot"); return false; }
      setScreenshotError("");
      if (!transactionId.trim()) { setPaymentError("Please enter the transaction ID from your payment"); return false; }
    }
    return true;
  }

  async function submitOrder() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            discountPrice: i.discountPrice,
            photo: i.photo,
            color: i.color,
            colorLabel: i.colorLabel,
            size: i.size,
            quantity: i.quantity,
          })),
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerAddress: address.trim(),
          governorate,
          deliveryNote: deliveryNote.trim(),
          paymentMethod,
          screenshot: screenshot || undefined,
          customerId: customer?.id || null,
          transactionId: transactionId.trim() || undefined,
          couponId: appliedCoupon?.couponId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Mark coupon as used
        if (appliedCoupon?.couponId) {
          fetch("/api/customer/apply-coupon", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ couponId: appliedCoupon.couponId }),
          }).catch(() => {});
        }

        setOrderId(data.orderId);
        clearCart();

        // Auto-verify InstaPay/Telda payments
        if ((paymentMethod === "instapay" || paymentMethod === "telda") && transactionId.trim()) {
          setVerifying(true);
          try {
            const vres = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                method: paymentMethod,
                transactionId: transactionId.trim(),
                amount: total,
                screenshotUrl: screenshot || "",
              }),
            });
            const vdata = await vres.json();
            setVerificationResult({
              verified: vdata.verified,
              message: vdata.message || (vdata.verified ? "Payment verified!" : "Verification failed"),
              waLink: vdata.waLink,
            });
          } catch { setVerificationResult({ verified: false, message: "Verification error — contact support" }); }
          setVerifying(false);
        }

        // Store fawry ref code if present
        if (data.fawryReferenceCode) {
          setVerificationResult({ verified: true, fawryRef: data.fawryReferenceCode });
        }

        setStep(4);
      }
    } catch {}
    setSubmitting(false);
  }

  if (items.length === 0 && step < 4) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-xs opacity-30">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-2xl mx-auto px-6">
        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tracking-wider transition-colors ${
                step >= s ? "bg-black text-white" : "bg-zinc-100 text-zinc-300"
              }`}>
                {step > s ? "✓" : s}
              </div>
              {s < 4 && <div className={`w-8 h-px transition-colors ${step > s ? "bg-black" : "bg-zinc-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <div>
            <h1 className="text-lg font-bold tracking-tight mb-8">Customer Information</h1>
            <div className="space-y-5">
              <div>
                <input value={name} onChange={(e) => { setName(e.target.value); setNameError(""); }}
                  placeholder="Full Name (First, Middle, Last)"
                  className={`w-full border px-4 py-3 text-sm outline-none transition-colors ${
                    nameError ? "border-red-400" : name && !nameError ? "border-green-500" : "border-black/20 focus:border-black/60"
                  }`} />
                {nameError && <p className="text-[10px] text-red-500 mt-1">{nameError}</p>}
              </div>
              <div>
                <input value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                  placeholder="Phone Number (010, 011, 012, 015)"
                  type="tel"
                  className={`w-full border px-4 py-3 text-sm outline-none transition-colors ${
                    phoneError ? "border-red-400" : phone && !phoneError ? "border-green-500" : "border-black/20 focus:border-black/60"
                  }`} />
                {phoneError && <p className="text-[10px] text-red-500 mt-1">{phoneError}</p>}
              </div>
              <div>
                <select value={governorate} onChange={(e) => { setGovernorate(e.target.value); setGovError(""); }}
                  className={`w-full border px-4 py-3 text-sm outline-none transition-colors bg-white ${
                    govError ? "border-red-400" : governorate ? "border-green-500" : "border-black/20 focus:border-black/60"
                  }`}>
                  <option value="">Select Governorate</option>
                  {GOVS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {govError && <p className="text-[10px] text-red-500 mt-1">{govError}</p>}
              </div>
              <div>
                <div className="flex gap-2">
                  <input value={address} onChange={(e) => { setAddress(e.target.value); setAddressError(""); }}
                    placeholder="Delivery Address"
                    className={`flex-1 border px-4 py-3 text-sm outline-none transition-colors ${
                      addressError ? "border-red-400" : address && !addressError ? "border-green-500" : "border-black/20 focus:border-black/60"
                    }`} />
                  <button type="button" onClick={() => setShowMapPicker(true)}
                    className="border border-black/20 px-4 py-3 text-sm hover:bg-zinc-100 transition-colors shrink-0"
                    title="Pick location on map">
                    📍
                  </button>
                </div>
                {addressError && <p className="text-[10px] text-red-500 mt-1">{addressError}</p>}
              </div>
              <div>
                <textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Delivery Note (Optional) — e.g. Ring the bell twice, apartment 4..."
                  rows={2}
                  className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-black/60 resize-none" />
              </div>
              <button onClick={() => { if (validateStep1()) setStep(2); }}
                className="w-full bg-black text-white py-3.5 text-xs tracking-[0.25em] uppercase font-medium hover:opacity-80 transition-opacity">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Order Summary */}
        {step === 2 && (
          <div>
            <h1 className="text-lg font-bold tracking-tight mb-8">Order Summary</h1>
            <div className="space-y-4 mb-8">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 border-b border-black/5 pb-4">
                  <div className="w-16 h-20 bg-zinc-100 flex-shrink-0 overflow-hidden">
                    <img src={item.photo} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <div className="flex gap-2 mt-0.5 text-[10px] tracking-wider uppercase opacity-40">
                      {item.colorLabel && <span>{item.colorLabel}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">{item.discountPrice || item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Coupon */}
            <div className="border border-black/10 p-4 mb-4">
              <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Coupon Code</p>
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); setAppliedCoupon(null); }}
                  placeholder="Enter coupon code"
                  disabled={!!appliedCoupon}
                  className="flex-1 border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/60 disabled:opacity-40" />
                {!appliedCoupon ? (
                  <button onClick={async () => {
                    if (!couponCode.trim()) return;
                    if (!customer) { setCouponError("Please log in to use coupons"); return; }
                    setCouponLoading(true);
                    setCouponError("");
                    try {
                      const res = await fetch("/api/customer/apply-coupon", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
                      });
                      const data = await res.json();
                      if (data.valid) {
                        setAppliedCoupon(data);
                      } else {
                        setCouponError(data.error || "Invalid coupon");
                      }
                    } catch { setCouponError("Failed to validate coupon"); }
                    setCouponLoading(false);
                  }}
                    className="border border-black/20 px-4 py-2 text-xs tracking-widest uppercase hover:bg-zinc-100 transition-colors disabled:opacity-40"
                    disabled={couponLoading || !couponCode.trim()}>
                    {couponLoading ? "..." : "Apply"}
                  </button>
                ) : (
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                    className="border border-red-200 text-red-500 px-4 py-2 text-xs tracking-widest uppercase hover:bg-red-50 transition-colors">
                    Remove
                  </button>
                )}
              </div>
              {couponError && <p className="text-[10px] text-red-500 mt-1">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-[10px] text-green-600 mt-1">✓ {appliedCoupon.label} applied</p>
              )}
            </div>

            <div className="border-t border-black/10 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-50">Subtotal</span>
                <span className="font-medium">{subtotal.toFixed(2)} L.E.</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-50">Delivery Fee</span>
                <span className="font-medium">{deliveryFee === 0 ? <span className="text-green-600">Free</span> : `${deliveryFee.toFixed(2)} L.E.`}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span className="opacity-80">Discount ({appliedCoupon.label})</span>
                  <span className="font-medium">-{couponDiscount.toFixed(2)} L.E.</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <p className="text-[10px] opacity-30">Free delivery on orders over {freeMin.toLocaleString()} L.E.</p>
              )}
              <div className="flex justify-between border-t border-black/10 pt-3 text-base font-bold">
                <span>Total</span>
                <span>{total.toFixed(2)} L.E.</span>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)}
                className="flex-1 border border-black/20 py-3 text-xs tracking-widest uppercase hover:bg-zinc-50 transition-colors">
                Back
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 bg-black text-white py-3 text-xs tracking-[0.25em] uppercase font-medium hover:opacity-80 transition-opacity">
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div>
            <h1 className="text-lg font-bold tracking-tight mb-8">Payment Method</h1>
            <div className="space-y-4 mb-8">
              {/* InstaPay */}
              <label className={`block border-2 p-5 cursor-pointer transition-colors ${
                paymentMethod === "instapay" ? "border-black bg-zinc-50" : "border-black/10 hover:border-black/30"
              }`}>
                <input type="radio" name="payment" value="instapay" checked={paymentMethod === "instapay"}
                  onChange={() => { setPaymentMethod("instapay"); setPaymentError(""); }} className="sr-only" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">IP</div>
                  <div>
                    <p className="text-sm font-bold tracking-tight">InstaPay</p>
                    <p className="text-[10px] opacity-40 mt-0.5">Send the exact total via InstaPay</p>
                  </div>
                </div>
              </label>

              {/* Telda */}
              <label className={`block border-2 p-5 cursor-pointer transition-colors ${
                paymentMethod === "telda" ? "border-black bg-zinc-50" : "border-black/10 hover:border-black/30"
              }`}>
                <input type="radio" name="payment" value="telda" checked={paymentMethod === "telda"}
                  onChange={() => { setPaymentMethod("telda"); setPaymentError(""); }} className="sr-only" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm">TD</div>
                  <div>
                    <p className="text-sm font-bold tracking-tight">Telda</p>
                    <p className="text-[10px] opacity-40 mt-0.5">Send the exact total via Telda</p>
                  </div>
                </div>
              </label>

              {/* Fawry */}
              <label className={`block border-2 p-5 cursor-pointer transition-colors ${
                paymentMethod === "fawry" ? "border-black bg-zinc-50" : "border-black/10 hover:border-black/30"
              }`}>
                <input type="radio" name="payment" value="fawry" checked={paymentMethod === "fawry"}
                  onChange={() => { setPaymentMethod("fawry"); setPaymentError(""); }} className="sr-only" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">FW</div>
                  <div>
                    <p className="text-sm font-bold tracking-tight">Fawry</p>
                    <p className="text-[10px] opacity-40 mt-0.5">Pay at any Fawry machine or app</p>
                  </div>
                </div>
              </label>

              {/* Cash on Delivery */}
              {codEnabled && (
                <label className={`block border-2 p-5 cursor-pointer transition-colors ${
                  paymentMethod === "cod" ? "border-black bg-zinc-50" : "border-black/10 hover:border-black/30"
                }`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"}
                    onChange={() => { setPaymentMethod("cod"); setPaymentError(""); }} className="sr-only" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">COD</div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">Cash on Delivery</p>
                      <p className="text-[10px] opacity-40 mt-0.5">Pay when your order arrives</p>
                    </div>
                  </div>
                </label>
              )}

              {paymentError && <p className="text-[10px] text-red-500">{paymentError}</p>}

              {/* Payment Instructions */}
              {paymentMethod === "instapay" && (
                <div className="border border-black/10 p-5 space-y-3 bg-zinc-50">
                  <p className="text-xs font-bold tracking-wider uppercase">InstaPay Instructions</p>
                  <p className="text-xs opacity-60">Send <strong>{total.toFixed(2)} L.E.</strong> to the InstaPay account below, then upload a screenshot of the confirmation.</p>
                  <div className="bg-white border border-black/10 p-3 text-sm font-mono">
                    InstaPay: <span className="font-bold" id="instapay-account">Loading...</span>
                    <button onClick={() => {
                      const el = document.getElementById("instapay-account");
                      if (el) { navigator.clipboard.writeText(el.textContent || ""); }
                    }} className="ml-2 text-[10px] underline opacity-40 hover:opacity-100">Copy</button>
                  </div>
                  <PaymentAccountField field="instapay" elementId="instapay-account" />
                  <div>
                    <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-2">Transaction ID / Reference</label>
                    <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter transaction ID from InstaPay"
                      className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/60" />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-2">Upload Payment Screenshot</label>
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadScreenshot(file);
                        setScreenshot(url);
                        setScreenshotError("");
                      } catch { setScreenshotError("Upload failed"); }
                      e.target.value = "";
                    }} className="w-full text-xs" />
                    {screenshot && <span className="text-[10px] text-green-600 mt-1 block">✓ Screenshot uploaded</span>}
                    {screenshotError && <p className="text-[10px] text-red-500 mt-1">{screenshotError}</p>}
                  </div>
                </div>
              )}

              {paymentMethod === "telda" && (
                <div className="border border-black/10 p-5 space-y-3 bg-zinc-50">
                  <p className="text-xs font-bold tracking-wider uppercase">Telda Instructions</p>
                  <p className="text-xs opacity-60">Send <strong>{total.toFixed(2)} L.E.</strong> to the Telda account below, then upload a screenshot of the confirmation.</p>
                  <div className="bg-white border border-black/10 p-3 text-sm font-mono">
                    Telda: <span className="font-bold" id="telda-account">Loading...</span>
                    <button onClick={() => {
                      const el = document.getElementById("telda-account");
                      if (el) { navigator.clipboard.writeText(el.textContent || ""); }
                    }} className="ml-2 text-[10px] underline opacity-40 hover:opacity-100">Copy</button>
                  </div>
                  <PaymentAccountField field="telda" elementId="telda-account" />
                  <div>
                    <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-2">Transaction ID / Reference</label>
                    <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter transaction ID from Telda"
                      className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/60" />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-2">Upload Payment Screenshot</label>
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadScreenshot(file);
                        setScreenshot(url);
                        setScreenshotError("");
                      } catch { setScreenshotError("Upload failed"); }
                      e.target.value = "";
                    }} className="w-full text-xs" />
                    {screenshot && <span className="text-[10px] text-green-600 mt-1 block">✓ Screenshot uploaded</span>}
                    {screenshotError && <p className="text-[10px] text-red-500 mt-1">{screenshotError}</p>}
                  </div>
                </div>
              )}

              {paymentMethod === "fawry" && (
                <div className="border border-black/10 p-5 space-y-3 bg-zinc-50">
                  <p className="text-xs font-bold tracking-wider uppercase">Fawry Instructions</p>
                  <p className="text-xs opacity-60">Go to any Fawry machine or the Fawry app and pay using the reference code below.</p>
                  <div className="bg-white border border-black/10 p-3 text-sm font-mono">
                    Fawry Code: <span className="font-bold" id="fawry-code">Loading...</span>
                    <button onClick={() => {
                      const el = document.getElementById("fawry-code");
                      if (el) { navigator.clipboard.writeText(el.textContent || ""); }
                    }} className="ml-2 text-[10px] underline opacity-40 hover:opacity-100">Copy</button>
                  </div>
                  <PaymentAccountField field="fawry" elementId="fawry-code" />
                </div>
              )}

              {paymentMethod === "cod" && (
                <div className="border border-black/10 p-5 space-y-2 bg-zinc-50">
                  <p className="text-xs font-bold tracking-wider uppercase">Cash on Delivery</p>
                  <p className="text-xs opacity-60">Pay <strong>{total.toFixed(2)} L.E.</strong> in cash when your order arrives at your door.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 border border-black/20 py-3 text-xs tracking-widest uppercase hover:bg-zinc-50 transition-colors">
                Back
              </button>
              <button onClick={() => { if (validateStep3()) submitOrder(); }} disabled={submitting}
                className="flex-1 bg-black text-white py-3 text-xs tracking-[0.25em] uppercase font-medium hover:opacity-80 transition-opacity disabled:opacity-30">
                {submitting ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="text-center py-12">
            {(paymentMethod === "cod" || verificationResult?.fawryRef) ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-green-600">✓</span>
              </div>
            ) : verifying ? (
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-xl text-amber-600">⏳</span>
              </div>
            ) : verificationResult?.verified ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-green-600">✓</span>
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-red-500">✗</span>
              </div>
            )}

            <h1 className="text-xl font-bold tracking-tight mb-2">Thank You for Your Order!</h1>
            <p className="text-sm opacity-50 mb-6">Order #{orderId.slice(0, 8).toUpperCase()}</p>

            {/* COD - no verification needed */}
            {paymentMethod === "cod" && (
              <div className="border border-black/10 p-6 text-left space-y-3 mb-8 bg-zinc-50">
                <p className="text-xs font-bold tracking-wider uppercase text-green-600 mb-3">✓ Order Placed — Cash on Delivery</p>
                <p className="text-xs opacity-60">Pay {total.toFixed(2)} L.E. in cash when your order arrives.</p>
              </div>
            )}

            {/* Fawry - show reference code */}
            {paymentMethod === "fawry" && verificationResult?.fawryRef && (
              <div className="border border-black/10 p-6 text-left space-y-3 mb-8 bg-zinc-50">
                <p className="text-xs font-bold tracking-wider uppercase mb-3">Pay via Fawry</p>
                <p className="text-xs opacity-60 mb-3">Use the reference code below to pay at any Fawry machine or the Fawry app:</p>
                <div className="bg-white border border-black/10 p-4 text-center">
                  <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Reference Code</p>
                  <p className="text-2xl font-black tracking-wider">{verificationResult.fawryRef}</p>
                  <button onClick={() => navigator.clipboard.writeText(verificationResult.fawryRef || "")}
                    className="mt-2 text-[10px] underline opacity-40 hover:opacity-100">Copy Code</button>
                </div>
                <p className="text-[10px] opacity-40 mt-3">Amount: {total.toFixed(2)} L.E. — Order will be confirmed once payment is received.</p>
              </div>
            )}

            {/* InstaPay/Telda - show verification result */}
            {(paymentMethod === "instapay" || paymentMethod === "telda") && (
              <>
                {verifying ? (
                  <div className="border border-black/10 p-6 mb-8 bg-zinc-50">
                    <p className="text-sm mb-2">Verifying your payment...</p>
                    <p className="text-xs opacity-40">Checking transaction ID, amount, and fraud status</p>
                  </div>
                ) : verificationResult?.verified ? (
                  <div className="border border-green-200 bg-green-50 p-6 mb-8">
                    <p className="text-sm font-bold text-green-700 mb-1">✓ Payment Verified Automatically</p>
                    <p className="text-xs text-green-600">Your order has been confirmed! We'll start preparing it right away.</p>
                    {verificationResult.waLink && (
                      <a href={verificationResult.waLink} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-3 text-xs text-green-700 underline">
                        Get Order Confirmation →
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="border border-red-200 bg-red-50 p-6 mb-8">
                    <p className="text-sm font-bold text-red-600 mb-1">✗ Payment Verification Failed</p>
                    <p className="text-xs text-red-500">{verificationResult?.message || "Verification failed. Please contact support."}</p>
                    {verificationResult?.waLink && (
                      <a href={verificationResult.waLink} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-3 text-xs text-red-600 underline">
                        View WhatsApp Notification →
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="border border-black/10 p-6 text-left space-y-3 mb-8 bg-zinc-50">
              <p className="text-xs font-bold tracking-wider uppercase mb-3">Order Summary</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}{item.size ? ` (${item.size})` : ""}</span>
                  <span className="font-medium">{item.discountPrice || item.price}</span>
                </div>
              ))}
              <div className="border-t border-black/10 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Subtotal</span>
                  <span>{subtotal.toFixed(2)} L.E.</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Delivery</span>
                  <span>{deliveryFee === 0 ? "Free" : `${deliveryFee.toFixed(2)} L.E.`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-black/10 pt-2">
                  <span>Total</span>
                  <span>{total.toFixed(2)} L.E.</span>
                </div>
              </div>
              <div className="border-t border-black/10 pt-3 text-xs space-y-1 opacity-60">
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Phone:</strong> {phone}</p>
                <p><strong>Governorate:</strong> {governorate}</p>
                <p><strong>Payment:</strong> {paymentMethod.toUpperCase()}</p>
              </div>
            </div>

            <button onClick={() => router.push("/")}
              className="bg-black text-white px-10 py-3 text-xs tracking-[0.2em] uppercase hover:opacity-80 transition-opacity">
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-[120] bg-black/20 flex items-center justify-center" onClick={() => setShowMapPicker(false)}>
          <div className="bg-white p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold tracking-wider uppercase">Drop a Pin</h3>
              <button onClick={() => setShowMapPicker(false)} className="text-sm opacity-30 hover:opacity-100">✕</button>
            </div>
            <p className="text-[10px] opacity-40 mb-3">Click anywhere on the map to place your exact delivery location.</p>
            <div ref={mapContainerRef} className="w-full h-[360px] z-10" />
            <p className="text-[9px] opacity-30 text-center mt-3">Click the map to drop a pin. Powered by OpenStreetMap.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentAccountField({ field, elementId }: { field: string; elementId: string }) {
  const [val, setVal] = useState("Loading...");

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        const v = d.contact?.[field] || "Not set";
        setVal(v);
        const el = document.getElementById(elementId);
        if (el) el.textContent = v;
      })
      .catch(() => {});
  }, [field, elementId]);

  return null;
}
