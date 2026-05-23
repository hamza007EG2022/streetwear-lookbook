"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomer } from "@/lib/customer-auth-context";

const ORDER_STATUS_FLOW = ["Pending Verification", "Confirmed", "Preparing", "Shipped", "Delivered"];

export default function AccountPage() {
  const router = useRouter();
  const { customer, loading, logout } = useCustomer();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [redeemAmount, setRedeemAmount] = useState(100);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState("");

  // Address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrAddress, setAddrAddress] = useState("");
  const [addrGovernorate, setAddrGovernorate] = useState("");
  const [addrDefault, setAddrDefault] = useState(false);

  const governorates = [
    "Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Cairo", "Dakahlia", "Damietta",
    "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr El Sheikh", "Luxor", "Matruh", "Minya",
    "Monufia", "New Valley", "North Sinai", "Port Said", "Qalyubia", "Qena", "Red Sea",
    "Sharqia", "Sohag", "South Sinai", "Suez",
  ];

  useEffect(() => {
    if (loading) return;
    if (!customer) { router.push("/login"); return; }

    fetch("/api/customer/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setOrdersLoading(false); })
      .catch(() => setOrdersLoading(false));

    fetch("/api/customer/coupons", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setCoupons(d.coupons || []); setCouponsLoading(false); })
      .catch(() => setCouponsLoading(false));

    fetch("/api/customer/insights", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setInsights(d))
      .catch(() => {});
  }, [customer, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-xs tracking-widest uppercase opacity-30">Loading...</p></div>;
  if (!customer) return null;

  async function addAddress() {
    if (!addrAddress || !addrGovernorate) return;
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: addrLabel, address: addrAddress, governorate: addrGovernorate, isDefault: addrDefault }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (customer) customer.addresses = data.addresses;
        setShowAddressForm(false);
        setAddrAddress("");
        setAddrGovernorate("");
      }
    } catch {}
  }

  async function deleteAddress(addressId: string) {
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (customer) customer.addresses = data.addresses;
      }
    } catch {}
  }

  function getStatusProgress(status: string): number {
    const idx = ORDER_STATUS_FLOW.indexOf(status);
    return idx >= 0 ? ((idx + 1) / ORDER_STATUS_FLOW.length) * 100 : 0;
  }

  function getTotalPaid(order: any): string {
    const total = order.total || order.totalPrice || 0;
    return total.toLocaleString();
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight">My Account</h1>
            <p className="text-xs opacity-40 mt-1">{customer.name} — {customer.phone}</p>
          </div>
          <button onClick={() => { logout(); router.push("/"); }}
            className="text-[10px] tracking-widest uppercase underline opacity-40 hover:opacity-100">
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-black/10 mb-8 overflow-x-auto">
          {[
            { key: "orders", label: "Orders" },
            { key: "addresses", label: "Addresses" },
            { key: "coupons", label: "Coupons" },
            { key: "wishlist", label: "Wishlist" },
            { key: "loyalty", label: "Loyalty" },
            { key: "insights", label: "Insights" },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 text-xs tracking-widest uppercase whitespace-nowrap transition-colors ${
                tab === t.key ? "border-b-2 border-black font-medium" : "opacity-30 hover:opacity-60"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-4">
            <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Order History</p>
            {ordersLoading ? (
              <p className="text-xs opacity-30">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm opacity-40 mb-4">No orders yet</p>
                <Link href="/lookbook"
                  className="inline-block bg-black text-white px-8 py-2 text-xs tracking-widest uppercase hover:opacity-80">
                  Start Shopping
                </Link>
              </div>
            ) : (
              orders.map((order: any) => (
                <div key={order.id} className="bg-white border border-black/5">
                  <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full flex items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-4">
                      {order.items?.[0]?.photo && (
                        <img src={order.items[0].photo} alt="" className="w-12 h-14 object-cover bg-zinc-100" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{order.items?.[0]?.name || order.productName || "Order"}</p>
                        <p className="text-[10px] opacity-40 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{getTotalPaid(order)} L.E.</p>
                      <p className={`text-[10px] mt-0.5 ${order.status === "Delivered" ? "text-green-600" : "text-amber-600"}`}>
                        {order.status || "Pending"}
                      </p>
                    </div>
                  </button>

                  {expandedOrder === order.id && (
                    <div className="border-t border-black/5 p-4 space-y-4">
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[10px] tracking-widest uppercase opacity-40 mb-2">
                          {ORDER_STATUS_FLOW.map((s) => (
                            <span key={s} className={ORDER_STATUS_FLOW.indexOf(order.status) >= ORDER_STATUS_FLOW.indexOf(s) ? "text-black font-medium" : ""}>
                              {s === "Pending Verification" ? "Placed" : s}
                            </span>
                          ))}
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-black rounded-full transition-all" style={{ width: `${getStatusProgress(order.status)}%` }} />
                        </div>
                      </div>

                      {/* Items */}
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-t border-black/5">
                          {item.photo && <img src={item.photo} alt="" className="w-10 h-12 object-cover bg-zinc-100" />}
                          <div className="flex-1">
                            <p className="text-xs font-medium">{item.name || "Item"}</p>
                            <p className="text-[10px] opacity-40">{item.size} × {item.quantity}</p>
                          </div>
                          <p className="text-xs">{item.price || ""}</p>
                        </div>
                      ))}

                      <div className="border-t border-black/10 pt-3 space-y-1 text-xs">
                        <div className="flex justify-between"><span className="opacity-40">Subtotal</span><span>{order.subtotal?.toFixed(2)} L.E.</span></div>
                        <div className="flex justify-between"><span className="opacity-40">Delivery</span><span>{order.deliveryFee === 0 ? "Free" : `${order.deliveryFee?.toFixed(2)} L.E.`}</span></div>
                        <div className="flex justify-between font-medium"><span>Total</span><span>{order.total?.toFixed(2) || order.totalPrice?.toFixed(2)} L.E.</span></div>
                      </div>

                      <div className="text-[10px] opacity-40 space-y-0.5">
                        <p>Address: {order.customerAddress}</p>
                        {order.governorate && <p>Governorate: {order.governorate}</p>}
                        <p>Payment: {order.paymentMethod || "N/A"}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {tab === "addresses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs tracking-widest uppercase opacity-40">Saved Addresses</p>
              <button onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-[10px] underline opacity-40 hover:opacity-100">
                {showAddressForm ? "Cancel" : "+ Add Address"}
              </button>
            </div>

            {showAddressForm && (
              <div className="bg-white border border-black/10 p-4 space-y-3 mb-4">
                <input value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="Label (Home, Work, etc.)"
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/60" />
                <input value={addrAddress} onChange={(e) => setAddrAddress(e.target.value)}
                  placeholder="Full Address"
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/60" />
                <select value={addrGovernorate} onChange={(e) => setAddrGovernorate(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/60">
                  <option value="">Select Governorate</option>
                  {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs opacity-50 cursor-pointer">
                  <input type="checkbox" checked={addrDefault} onChange={(e) => setAddrDefault(e.target.checked)} className="accent-black" />
                  Set as default address
                </label>
                <button onClick={addAddress}
                  className="bg-black text-white px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80">
                  Save Address
                </button>
              </div>
            )}

            {customer.addresses?.length === 0 ? (
              <p className="text-xs opacity-30 text-center py-8">No saved addresses</p>
            ) : (
              customer.addresses?.map((addr: any) => (
                <div key={addr.id} className="bg-white border border-black/5 p-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{addr.label} {addr.isDefault && <span className="text-[10px] opacity-40">(Default)</span>}</p>
                    <p className="text-xs opacity-50 mt-1">{addr.address}</p>
                    <p className="text-[10px] opacity-40">{addr.governorate}</p>
                  </div>
                  <button onClick={() => deleteAddress(addr.id)}
                    className="text-[10px] underline opacity-30 hover:opacity-100">Remove</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Coupons Tab */}
        {tab === "coupons" && (
          <div className="space-y-4">
            <p className="text-xs tracking-widest uppercase opacity-40 mb-4">My Coupons</p>
            {couponsLoading ? (
              <p className="text-xs opacity-30">Loading coupons...</p>
            ) : coupons.length === 0 ? (
              <p className="text-xs opacity-30 text-center py-8">No coupons available</p>
            ) : (
              coupons.map((coupon: any) => (
                <div key={coupon.id} className="bg-white border border-black/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold tracking-wider">{coupon.code}</p>
                    <p className="text-xs mt-1">
                      {coupon.type === "percentage" ? `${coupon.discount}% OFF` : `${coupon.discount} L.E. OFF`}
                      {coupon.minOrder > 0 && <span className="opacity-40"> — Min. order {coupon.minOrder} L.E.</span>}
                    </p>
                  </div>
                  <span className="text-[10px] opacity-40">
                    Expires {new Date(coupon.expiresAt).toLocaleDateString("en-EG")}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {tab === "wishlist" && (
          <div className="space-y-4">
            <p className="text-xs tracking-widest uppercase opacity-40 mb-4">My Wishlist</p>
            {customer.wishlist?.length === 0 ? (
              <p className="text-xs opacity-30 text-center py-8">Your wishlist is empty</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Wishlist items would link to products — for now show IDs */}
                {customer.wishlist.map((pid: string) => (
                  <Link key={pid} href={`/products/${pid}`}
                    className="bg-white border border-black/5 p-4 text-center hover:border-black/30 transition-colors">
                    <p className="text-xs opacity-40">Product ID:</p>
                    <p className="text-[10px] mt-1 break-all">{pid.slice(0, 20)}...</p>
                    <p className="text-[10px] underline mt-2 opacity-40 hover:opacity-100">View Product →</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loyalty Tab */}
        {tab === "loyalty" && (
          <div className="space-y-4">
            <div className="bg-white border border-black/5 p-8 text-center">
              <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Loyalty Points</p>
              <p className="text-5xl font-black">{customer.loyaltyPoints || 0}</p>
              <p className="text-xs opacity-40 mt-2">Redeem for discounts on your next order</p>
              <div className="mt-6 text-xs opacity-50 space-y-2">
                <p>• Earn 10 points for every 100 L.E. spent</p>
                <p>• 100 points = 10 L.E. discount</p>
                <p>• First order: +50 bonus points</p>
                <p>• Birthday month: double points</p>
                <p>• Refer a friend: +100 points</p>
              </div>
            </div>

            {/* Redeem */}
            {(customer.loyaltyPoints || 0) >= 100 && (
              <div className="bg-white border border-black/5 p-6">
                <p className="text-[10px] tracking-widest uppercase opacity-40 mb-4">Redeem Points</p>
                <div className="flex items-center gap-3">
                  <select value={redeemAmount} onChange={(e) => setRedeemAmount(parseInt(e.target.value))}
                    className="border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40">
                    {Array.from({ length: Math.floor((customer.loyaltyPoints || 0) / 100) }, (_, i) => (i + 1) * 100).map((v) => (
                      <option key={v} value={v}>{v} points = {(v / 100) * 10} L.E.</option>
                    ))}
                  </select>
                  <button onClick={async () => {
                    setRedeeming(true);
                    setRedeemMsg("");
                    try {
                      const res = await fetch("/api/customer/redeem-points", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ points: redeemAmount }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        customer.loyaltyPoints = data.remainingPoints;
                        setRedeemMsg(`✓ Coupon ${data.code} created — ${data.discount} L.E. off!`);
                      } else {
                        setRedeemMsg(`✗ ${data.error || "Failed to redeem"}`);
                      }
                    } catch { setRedeemMsg("✗ Network error"); }
                    setRedeeming(false);
                  }}
                    disabled={redeeming}
                    className="bg-black text-white px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-40">
                    {redeeming ? "..." : "Redeem"}
                  </button>
                </div>
                {redeemMsg && <p className={`text-xs mt-2 ${redeemMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{redeemMsg}</p>}
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {tab === "insights" && (
          <div className="space-y-4">
            <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Shopping Insights</p>
            {!insights ? (
              <p className="text-xs opacity-30">Loading...</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-black/5 p-4 text-center">
                    <p className="text-2xl font-black">{insights.orderCount || 0}</p>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mt-1">Orders</p>
                  </div>
                  <div className="bg-white border border-black/5 p-4 text-center">
                    <p className="text-2xl font-black">{insights.lifetimeSpend.toLocaleString()}</p>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mt-1">L.E. Spent</p>
                  </div>
                  <div className="bg-white border border-black/5 p-4 text-center">
                    <p className="text-2xl font-black">{insights.averageOrderValue.toLocaleString()}</p>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mt-1">Avg Order</p>
                  </div>
                  <div className="bg-white border border-black/5 p-4 text-center">
                    <p className="text-2xl font-black">{insights.loyaltyPoints || 0}</p>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mt-1">Points</p>
                  </div>
                </div>

                {insights.browsedCategories?.length > 0 && (
                  <div className="bg-white border border-black/5 p-4">
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-3">Top Categories</p>
                    <div className="space-y-2">
                      {insights.browsedCategories.slice(0, 5).map((c: any) => (
                        <div key={c.category} className="flex items-center justify-between text-xs">
                          <span>{c.category}</span>
                          <span className="opacity-40">{c.count} view{c.count !== 1 ? "s" : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights.lastActiveAt && (
                  <p className="text-[10px] opacity-30 text-center">
                    Last active: {new Date(insights.lastActiveAt).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
