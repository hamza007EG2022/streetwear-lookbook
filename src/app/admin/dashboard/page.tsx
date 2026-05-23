"use client";

import { useEffect, useState, useCallback, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";

type SiteData = any;

const TABS = [
  "Brand", "Colors", "Hero", "Products", "Lookbook", "Collections", "Marquee", "Reviews", "Pages", "Banners", "Newsletter", "About", "Contact", "Tasks", "Messages", "Orders", "Analytics", "Fraud", "Coupons", "Customers", "Password"
];

export default function DashboardPage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [auth, setAuth] = useState<boolean | null>(null);
  const [tab, setTab] = useState("Brand");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [newOrders, setNewOrders] = useState(0);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/check", { credentials: "include" });
      if (!res.ok) { setAuth(false); router.push("/admin/login"); return; }
      setAuth(true);
      const d = await fetch("/api/data", { credentials: "include" }).then((r) => r.json());
      setData(d);
    } catch { setAuth(false); router.push("/admin/login"); }
  }, [router]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const knownCountRef = useRef(-1);

  useEffect(() => {
    if (!auth) return;
    knownCountRef.current = -1;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (res.ok) {
          const { orders } = await res.json();
          if (knownCountRef.current === -1) {
            knownCountRef.current = orders.length;
            return;
          }
          if (tab !== "Orders" && orders.length > knownCountRef.current) {
            setNewOrders(orders.length - knownCountRef.current);
          }
          if (tab === "Orders") {
            setNewOrders(0);
          }
          knownCountRef.current = orders.length;
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [auth, tab]);

  async function saveField(path: string, value: any) {
    setSaving(true);
    setMsg("");
    const parts = path.split(".");
    const update: any = {};
    let obj = update;
    for (let i = 0; i < parts.length - 1; i++) {
      obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;

    try {
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(update),
      });
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
        setMsg("");
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error || `Error ${res.status}`);
      }
    } catch { setMsg("Network error"); } finally { setSaving(false); }
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || `Upload error ${res.status}`);
    }
    const { url } = await res.json();
    return url;
  }

  async function saveAll(updates: any) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
        setMsg("");
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error || `Error ${res.status}`);
      }
    } catch { setMsg("Network error"); } finally { setSaving(false); }
  }

  async function handleAction(action: any) {
    setSaving(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(action),
      });
      if (res.ok) {
        const newData = await res.json();
        setData(newData);
        setMsg("");
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error || `Error ${res.status}`);
      }
    } catch { setMsg("Network error"); } finally { setSaving(false); }
  }

  if (auth === null || !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-xs tracking-widest uppercase opacity-30">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <Sidebar tab={tab} setTab={setTab} msg={msg} saving={saving} newOrders={newOrders} setNewOrders={setNewOrders} />
      <div className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-4xl">
          {tab === "Brand" && <BrandSection data={data} saveField={saveField} uploadFile={uploadFile} />}
          {tab === "Colors" && <ColorsSection data={data} saveField={saveField} saveAll={saveAll} />}
          {tab === "Hero" && <HeroSection data={data} saveField={saveField} uploadFile={uploadFile} />}
          {tab === "Products" && <ProductsSection data={data} handleAction={handleAction} uploadFile={uploadFile} />}
          {tab === "Lookbook" && <LookbookSection data={data} handleAction={handleAction} uploadFile={uploadFile} />}
          {tab === "Collections" && <CollectionsSection data={data} handleAction={handleAction} uploadFile={uploadFile} />}
          {tab === "Marquee" && <MarqueeSection data={data} saveField={saveField} />}
          {tab === "Reviews" && <ReviewsSection data={data} handleAction={handleAction} uploadFile={uploadFile} />}
          {tab === "Pages" && <PagesSection data={data} saveField={saveField} />}
          {tab === "Banners" && <BannersSection data={data} saveField={saveField} uploadFile={uploadFile} />}
          {tab === "Newsletter" && <NewsletterSection data={data} />}
          {tab === "About" && <AboutSection data={data} saveField={saveField} uploadFile={uploadFile} />}
          {tab === "Contact" && <ContactSection data={data} saveField={saveField} />}
          {tab === "Tasks" && <TasksSection data={data} saveField={saveField} saveAll={saveAll} />}
          {tab === "Messages" && <MessagesSection />}
          {tab === "Orders" && <OrdersSection data={data} saveField={saveField} />}
          {tab === "Analytics" && <AnalyticsSection />}
          {tab === "Fraud" && <FraudSection />}
          {tab === "Coupons" && <CouponsSection data={data} saveAll={saveAll} />}
          {tab === "Customers" && <CustomersSection data={data} />}
          {tab === "Password" && <PasswordSection />}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab, msg, saving, newOrders, setNewOrders }: any) {
  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-black/5 flex flex-col">
      <div className="p-6 border-b border-black/5">
        <h1 className="text-sm font-bold tracking-[0.15em] uppercase">Admin</h1>
        <p className="text-[10px] tracking-widest uppercase opacity-30 mt-1">Dashboard</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === "Orders") setNewOrders(0); }}
            className={`w-full text-left px-4 py-2 text-xs tracking-widest uppercase rounded transition-colors flex items-center justify-between ${
              tab === t ? "bg-black text-white" : "hover:bg-zinc-100"
            }`}
          >
            <span>{t}</span>
            {t === "Orders" && newOrders > 0 && (
              <span className="bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {newOrders}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-black/5">
        <div className="flex items-center justify-between">
          {msg && <span className="text-[10px] text-green-600">{msg}</span>}
          {saving && <span className="text-[10px] opacity-30">Saving...</span>}
        </div>
        <a
          href="/"
          target="_blank"
          className="block mt-2 text-[10px] tracking-widest uppercase opacity-30 hover:opacity-100"
        >
          View Site →
        </a>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, rows }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] tracking-widest uppercase opacity-40">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 4}
          className="w-full border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 transition-colors resize-none"
        />
      ) : type === "color" ? (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 border border-black/10 cursor-pointer"
          />
          <span className="text-xs opacity-50 font-mono">{value}</span>
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 transition-colors"
        />
      )}
    </div>
  );
}

function ImageUpload({ current, onUpload, label }: any) {
  const [uploading, setUploading] = useState(false);
  async function handleFile(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err: any) {
      alert(err.message || "Upload failed");
    }
    e.target.value = "";
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <label className="text-[10px] tracking-widest uppercase opacity-40">{label || "Image"}</label>
      {current && (
        <div className="relative w-32 h-32 bg-zinc-100 border border-black/5 overflow-hidden">
          <img src={current} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <label className="inline-block cursor-pointer border border-black/10 px-3 py-1.5 text-xs hover:bg-black hover:text-white transition-colors">
        {uploading ? "Uploading..." : "Upload"}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
    </div>
  );
}

function BrandSection({ data, saveField, uploadFile }: any) {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold tracking-tight">Brand Settings</h2>
      <div className="space-y-4">
        <Field label="Brand Name" value={data.brand.name} onChange={(v: string) => saveField("brand.name", v)} />
        <Field label="Tagline" value={data.brand.tagline} onChange={(v: string) => saveField("brand.tagline", v)} />
        <ImageUpload
          label="Logo"
          current={data.brand.logo}
          onUpload={async (file: File) => {
            const url = await uploadFile(file);
            saveField("brand.logo", url);
            return url;
          }}
        />
      </div>
    </div>
  );
}

function ColorPicker({ label, color, onChange }: { label: string; color: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] tracking-widest uppercase opacity-50">{label}</label>
      <div className="flex items-center gap-3">
        <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 border border-black/10 rounded cursor-pointer" />
        <input type="text" value={color} onChange={(e) => onChange(e.target.value)} className="border border-black/10 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-black/40 transition-colors w-28" />
      </div>
    </div>
  );
}

function ColorsSection({ data, saveAll }: any) {
  const [locals, setLocals] = useState(data.colors);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(locals);

  useEffect(() => { setLocals(data.colors); latest.current = data.colors; }, [data.colors]);

  const c = locals;

  function handleChange(key: string, value: string) {
    const next = { ...latest.current, [key]: value };
    latest.current = next;
    setLocals(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => saveAll({ colors: next }), 500);
  }

  const previewStyle: React.CSSProperties = {
    backgroundColor: c.background,
    color: c.text,
    fontFamily: "var(--font-geist-sans), sans-serif",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Color Scheme</h2>
        <button
          onClick={() => {
            const defaults = {
              primary: "#ffffff", secondary: "#f5f5f0", background: "#f5f5f0",
              text: "#111111", button: "#111111", accent: "#111111",
              navbar: "#ffffff", footer: "#ffffff",
            };
            setLocals(defaults);
            saveAll({ colors: defaults });
          }}
          className="border border-black/10 px-4 py-1.5 text-[10px] tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <p className="text-xs tracking-widest uppercase opacity-30 mb-2">Main Colors</p>
          <ColorPicker label="Primary" color={c.primary} onChange={(v) => handleChange("primary", v)} />
          <ColorPicker label="Secondary" color={c.secondary} onChange={(v) => handleChange("secondary", v)} />
          <ColorPicker label="Background" color={c.background} onChange={(v) => handleChange("background", v)} />
          <ColorPicker label="Text" color={c.text} onChange={(v) => handleChange("text", v)} />
        </div>
        <div className="space-y-5">
          <p className="text-xs tracking-widest uppercase opacity-30 mb-2">UI Colors</p>
          <ColorPicker label="Button" color={c.button} onChange={(v) => handleChange("button", v)} />
          <ColorPicker label="Accent / Highlight" color={c.accent} onChange={(v) => handleChange("accent", v)} />
          <ColorPicker label="Navbar" color={c.navbar} onChange={(v) => handleChange("navbar", v)} />
          <ColorPicker label="Footer" color={c.footer} onChange={(v) => handleChange("footer", v)} />
        </div>
      </div>

      <div>
        <p className="text-xs tracking-widest uppercase opacity-30 mb-4">Live Preview</p>
        <div className="border border-black/10 rounded overflow-hidden" style={previewStyle}>
          <div style={{ backgroundColor: c.navbar, color: c.text, padding: "12px 20px", borderBottom: `1px solid ${c.text}15`, display: "flex", justifyContent: "space-between" }}>
            <span className="text-xs font-bold tracking-widest uppercase">BRAND</span>
            <span className="text-[10px] tracking-widest uppercase opacity-50">Home  Lookbook  About</span>
          </div>
          <div style={{ padding: "32px 20px", textAlign: "center" as const }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.05em", color: c.text }}>YOUR HEADLINE HERE</h2>
            <p style={{ fontSize: 12, letterSpacing: "0.2em", opacity: 0.5, marginTop: 8, color: c.text }}>Subtitle text</p>
            <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
              <span style={{ backgroundColor: c.button, color: c.primary, padding: "8px 24px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" as const }}>
                Button
              </span>
              <span style={{ border: `1px solid ${c.text}40`, color: c.text, padding: "8px 24px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" as const }}>
                Outline
              </span>
            </div>
          </div>
          <div style={{ backgroundColor: c.footer, color: c.text, borderTop: `1px solid ${c.text}15`, padding: "12px 20px", display: "flex", justifyContent: "space-between" }}>
            <span className="text-[10px] tracking-widest uppercase opacity-40">&copy; Brand</span>
            <span className="text-[10px] tracking-widest uppercase opacity-40">All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection({ data, saveField, uploadFile }: any) {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold tracking-tight">Hero Section</h2>
      <div className="space-y-4">
        <Field label="Title" value={data.hero.title} onChange={(v: string) => saveField("hero.title", v)} />
        <Field label="Subtitle" value={data.hero.subtitle} onChange={(v: string) => saveField("hero.subtitle", v)} />
        <ImageUpload
          label="Background Image"
          current={data.hero.backgroundImage}
          onUpload={async (file: File) => {
            const url = await uploadFile(file);
            saveField("hero.backgroundImage", url);
            return url;
          }}
        />
      </div>
    </div>
  );
}

const BADGE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "new_arrival", label: "New Arrival" },
  { value: "best_seller", label: "Best Seller" },
  { value: "limited_edition", label: "Limited Edition" },
  { value: "sale", label: "Sale" },
];

const GENDER_OPTIONS = [
  { value: "unisex", label: "Unisex" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
];

function ProductsSection({ data, handleAction, uploadFile }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", price: "", discountPrice: "", description: "", category: "", material: "", stock: "in_stock" as string, badge: "none" as string, gender: "unisex" as string, priority: 0, visible: true, photos: [] as string[], sizes: [] as string[], stockPerSize: {} as Record<string, number>, colorVariants: [] as { label: string; color: string; photos: string[] }[] });
  const [sizeInput, setSizeInput] = useState("");
  const [sizeStock, setSizeStock] = useState("");

  function resetForm() { setForm({ name: "", price: "", discountPrice: "", description: "", category: "", material: "", stock: "in_stock", badge: "none", gender: "unisex", priority: 0, visible: true, photos: [], sizes: [], stockPerSize: {}, colorVariants: [] }); }

  function editProduct(p: any) {
    setForm({ name: p.name, price: p.price, discountPrice: p.discountPrice || "", description: p.description, category: p.category, material: p.material || "", stock: p.stock || "in_stock", badge: p.badge || "none", gender: p.gender || "unisex", priority: p.priority || 0, visible: p.visible !== false, photos: p.photos || [], sizes: p.sizes || [], stockPerSize: p.stockPerSize || {}, colorVariants: p.colorVariants || [] });
    setEditing(p);
    setShowForm(true);
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      await handleAction({ type: "edit-product", product: { ...editing, ...form } });
    } else {
      await handleAction({ type: "add-product", product: form });
    }
    setShowForm(false);
    setEditing(null);
    resetForm();
  }

  async function uploadAndAddPhoto(file: File) {
    const url = await uploadFile(file);
    setForm((prev: any) => ({ ...prev, photos: [...prev.photos, url] }));
  }

  function removePhoto(index: number) {
    setForm((prev: any) => ({ ...prev, photos: prev.photos.filter((_: string, i: number) => i !== index) }));
  }

  function movePhoto(from: number, dir: number) {
    const to = from + dir;
    if (to < 0 || to >= form.photos.length) return;
    const arr = [...form.photos];
    [arr[from], arr[to]] = [arr[to], arr[from]];
    setForm((prev: any) => ({ ...prev, photos: arr }));
  }

  function addSize() {
    const s = sizeInput.trim().toUpperCase();
    if (s && !form.sizes.includes(s)) {
      setForm((prev: any) => ({ ...prev, sizes: [...prev.sizes, s], stockPerSize: { ...prev.stockPerSize, [s]: parseInt(sizeStock) || 0 } }));
      setSizeInput("");
      setSizeStock("");
    }
  }

  function removeSize(s: string) {
    setForm((prev: any) => {
      const { [s]: _, ...rest } = prev.stockPerSize;
      return { ...prev, sizes: prev.sizes.filter((x: string) => x !== s), stockPerSize: rest };
    });
  }

  const STOCK_LABELS: Record<string, { label: string; color: string }> = {
    in_stock: { label: "In Stock", color: "text-green-600" },
    low_stock: { label: "Low Stock", color: "text-amber-600" },
    out_of_stock: { label: "Sold Out", color: "text-red-500" },
  };

  const BADGE_LABELS: Record<string, string> = {
    new_arrival: "New Arrival",
    best_seller: "Best Seller",
    limited_edition: "Limited Edition",
    sale: "Sale",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Products</h2>
        <button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }}
          className="border border-black/10 px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowForm(false)}>
          <div className="bg-white p-6 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold tracking-wider uppercase mb-4">{editing ? "Edit" : "Add"} Product</h3>
            <form onSubmit={saveProduct} className="space-y-3">
              <Field label="Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} />
              <Field label="Price" value={form.price} onChange={(v: string) => setForm({ ...form, price: v })} />
              <Field label="Discount Price (optional)" value={form.discountPrice} onChange={(v: string) => setForm({ ...form, discountPrice: v })} placeholder="e.g. $45" />
              <Field label="Category" value={form.category} onChange={(v: string) => setForm({ ...form, category: v })} />
              <Field label="Description" type="textarea" value={form.description} onChange={(v: string) => setForm({ ...form, description: v })} />
              <Field label="Material" value={form.material} onChange={(v: string) => setForm({ ...form, material: v })} placeholder="e.g. 100% Cotton, Polyester Blend" />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest uppercase opacity-40">Badge</label>
                  <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className="w-full border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40">
                    {BADGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest uppercase opacity-40">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40">
                    {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest uppercase opacity-40">Stock Status</label>
                  <select value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40">
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Sold Out</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest uppercase opacity-40">Priority (lower = first)</label>
                  <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                    className="w-full border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40" />
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <label className="text-[10px] tracking-widest uppercase opacity-40">Visible on site</label>
                <button type="button" onClick={() => setForm({ ...form, visible: !form.visible })}
                  className={`w-9 h-5 rounded-full transition-colors ${form.visible ? 'bg-black' : 'bg-zinc-300'}`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${form.visible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest uppercase opacity-40">Photos (up to 6)</label>
                <div className="flex flex-wrap gap-2">
                  {form.photos.map((url: string, i: number) => (
                    <div key={i} className="relative w-20 h-20 bg-zinc-100 border border-black/5 overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/80 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} className="px-1 hover:text-black/60 disabled:opacity-20">◀</button>
                        <button type="button" onClick={() => removePhoto(i)} className="px-1 text-red-500">✕</button>
                        <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === form.photos.length - 1} className="px-1 hover:text-black/60 disabled:opacity-20">▶</button>
                      </div>
                    </div>
                  ))}
                  {form.photos.length < 6 && (
                    <label className="w-20 h-20 border border-dashed border-black/10 flex items-center justify-center cursor-pointer hover:border-black/40 transition-colors">
                      <span className="text-xs opacity-30">+</span>
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) { e.target.value = ""; await uploadAndAddPhoto(file); }
                      }} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest uppercase opacity-40">Sizes</label>
                <div className="flex flex-wrap gap-1.5">
                  {form.sizes.map((s: string) => (
                    <span key={s} className="inline-flex items-center gap-1 border border-black/10 px-2 py-0.5 text-[11px]">
                      {s}: {form.stockPerSize[s] || 0}pcs
                      <button type="button" onClick={() => removeSize(s)} className="text-red-400 hover:text-red-600">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                    placeholder="Size (e.g. XL)" className="w-24 border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-black/40" />
                  <input value={sizeStock} onChange={(e) => setSizeStock(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                    type="number" min="0" placeholder="Qty" className="w-20 border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-black/40" />
                  <button type="button" onClick={addSize} className="border border-black/10 px-3 py-1.5 text-xs hover:bg-black hover:text-white transition-colors">Add</button>
                </div>
              </div>

              {/* Color Variants */}
              <div className="space-y-2 pt-2 border-t border-black/5">
                <label className="text-[10px] tracking-widest uppercase opacity-40">Color Variants</label>
                {form.colorVariants.map((cv: { label: string; color: string; photos: string[] }, vi: number) => (
                  <div key={vi} className="border border-black/10 p-2 space-y-1.5 bg-zinc-50">
                    <div className="flex items-center gap-2">
                      <input type="color" value={cv.color} onChange={(e) => {
                        const arr = [...form.colorVariants];
                        arr[vi] = { ...arr[vi], color: e.target.value };
                        setForm({ ...form, colorVariants: arr });
                      }} className="w-7 h-7 p-0 border border-black/10 cursor-pointer" />
                      <input type="text" value={cv.label} onChange={(e) => {
                        const arr = [...form.colorVariants];
                        arr[vi] = { ...arr[vi], label: e.target.value };
                        setForm({ ...form, colorVariants: arr });
                      }} placeholder="e.g. Black" className="flex-1 border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-black/40" />
                      <button type="button" onClick={() => {
                        setForm({ ...form, colorVariants: form.colorVariants.filter((_: any, i: number) => i !== vi) });
                      }} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cv.photos.map((url: string, pi: number) => (
                        <div key={pi} className="relative w-12 h-12 bg-zinc-100 border border-black/5">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => {
                            const arr = [...form.colorVariants];
                            arr[vi] = { ...arr[vi], photos: arr[vi].photos.filter((_: string, i: number) => i !== pi) };
                            setForm({ ...form, colorVariants: arr });
                          }} className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full">✕</button>
                        </div>
                      ))}
                      {cv.photos.length < 6 && (
                        <label className="w-12 h-12 border border-dashed border-black/10 flex items-center justify-center cursor-pointer hover:border-black/40 transition-colors text-[10px]">
                          +<input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              e.target.value = "";
                              const url = await uploadFile(file);
                              const arr = [...form.colorVariants];
                              arr[vi] = { ...arr[vi], photos: [...arr[vi].photos, url] };
                              setForm({ ...form, colorVariants: arr });
                            }
                          }} />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
                {form.colorVariants.length < 6 && (
                  <button type="button" onClick={() => {
                    setForm({ ...form, colorVariants: [...form.colorVariants, { label: "", color: "#000000", photos: [] }] });
                  }} className="border border-dashed border-black/10 w-full py-2 text-xs opacity-30 hover:opacity-60 transition-opacity">+ Add Color Variant</button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs tracking-widest uppercase border border-black/10 hover:bg-zinc-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.products.length === 0 && <p className="text-xs opacity-30 italic col-span-full">No products added yet.</p>}
        {[...data.products]
          .sort((a: any, b: any) => (a.priority || 999) - (b.priority || 999))
          .map((p: any) => {
          const badgeLabel = BADGE_LABELS[p.badge];
          const st = STOCK_LABELS[p.stock] || STOCK_LABELS.in_stock;
          return (
          <div key={p.id} className="group bg-white border border-black/5 overflow-hidden">
            <div className="aspect-[3/4] bg-zinc-100 bg-cover bg-center relative" style={{ backgroundImage: `url(${p.photos?.[0] || ""})` }}>
              {badgeLabel && (
                <span className="absolute top-2 left-2 bg-black text-white text-[9px] tracking-wider uppercase px-2 py-0.5">{badgeLabel}</span>
              )}
              {p.discountPrice && (
                <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] tracking-wider uppercase px-2 py-0.5">{p.discountPrice}</span>
              )}
              {p.visible === false && (
                <span className="absolute bottom-2 left-2 bg-zinc-800/80 text-white text-[9px] tracking-wider uppercase px-2 py-0.5">Hidden</span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => editProduct(p)} className="flex-1 bg-white text-black text-[10px] py-1 uppercase tracking-wider hover:opacity-80">Edit</button>
                <button onClick={() => handleAction({ type: "delete-product", id: p.id })}
                  className="bg-red-500 text-white text-[10px] px-2 py-1 uppercase tracking-wider hover:opacity-80">✕</button>
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium truncate">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {p.discountPrice ? (
                  <>
                    <span className="text-xs font-medium">{p.discountPrice}</span>
                    <span className="text-[10px] opacity-30 line-through">{p.price}</span>
                  </>
                ) : (
                  <span className="text-xs">{p.price}</span>
                )}
              </div>
              <p className={`text-[10px] mt-0.5 ${st.color}`}>{st.label}</p>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function LookbookSection({ data, handleAction, uploadFile }: any) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Lookbook Photos</h2>
        <label className="cursor-pointer border border-black/10 px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
          Add Photos
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              for (const file of files) {
                const url = await uploadFile(file);
                await handleAction({ type: "add-lookbook", photo: url, caption: "" });
              }
            }} />
        </label>
      </div>

      {data.lookbook.length === 0 && <p className="text-xs opacity-30 italic">No lookbook photos yet.</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {data.lookbook.map((item: any) => (
          <div key={item.id} className="group relative aspect-[3/4] bg-zinc-100 border border-black/5 overflow-hidden">
            <img src={item.photo} alt={item.caption} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            <button onClick={() => handleAction({ type: "remove-lookbook", id: item.id })}
              className="absolute top-2 right-2 w-7 h-7 bg-white/80 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionsSection({ data, handleAction, uploadFile }: any) {
  const addCollection = async () => {
    const title = prompt("Collection title (e.g. SS26 T-SHIRT):");
    if (!title) return;
    const category = prompt("Category to filter (e.g. t-shirt):");
    if (!category) return;
    await handleAction({ type: "add-collection", title, category, photo: "" });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Collections / Drops</h2>
        <button onClick={addCollection}
          className="border border-black/10 px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
          Add Collection
        </button>
      </div>

      {data.collections.length === 0 && <p className="text-xs opacity-30 italic">No collections yet.</p>}

      <div className="grid grid-cols-1 gap-6">
        {data.collections.map((c: any) => (
          <div key={c.id} className="border border-black/5 bg-white rounded overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-48 h-32 bg-zinc-100 flex-shrink-0">
              {c.photo ? (
                <img src={c.photo} alt={c.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px] opacity-30">No Photo</span>
                </div>
              )}
            </div>
            <div className="flex-1 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-[10px] opacity-40 mt-0.5">Category: {c.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-[10px] tracking-widest uppercase border border-black/10 px-3 py-1 hover:bg-black hover:text-white transition-colors">
                  Photo
                  <input type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await uploadFile(file);
                        await handleAction({ type: "update-collection", id: c.id, photo: url });
                      }
                    }} />
                </label>
                <button onClick={() => handleAction({ type: "remove-collection", id: c.id })}
                  className="text-[10px] tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarqueeSection({ data, saveField }: any) {
  const defaults = { enabled: true, text: 'TRIO FASHION — SS 2026 — DEFINE YOUR STYLE — NEW COLLECTION — STREET HIGH QUALITY —', bgColor: '#000000', textColor: '#ffffff', speed: 5, textSize: 'medium', fontFamily: 'Audiowide' };
  const m = data.marquee ? { ...defaults, ...data.marquee } : defaults;
  const MARQUEE_FONTS = [
    'Audiowide', 'Bebas Neue', 'Oswald', 'Anton', 'Rajdhani',
    'Orbitron', 'Inter', 'Exo 2', 'Kanit', 'Prompt',
  ];
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold tracking-tight">Marquee Strip</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-[10px] tracking-widest uppercase opacity-40">Enabled</label>
          <button onClick={() => saveField("marquee.enabled", !m.enabled)}
            className={`relative w-10 h-5 rounded-full transition-colors ${m.enabled ? 'bg-black' : 'bg-zinc-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${m.enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <Field label="Text Content" type="textarea" value={m.text} onChange={(v: string) => saveField("marquee.text", v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Background Color" type="color" value={m.bgColor} onChange={(v: string) => saveField("marquee.bgColor", v)} />
          <Field label="Text Color" type="color" value={m.textColor} onChange={(v: string) => saveField("marquee.textColor", v)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] tracking-widest uppercase opacity-40">Scroll Speed: {m.speed}</label>
          <input type="range" min="1" max="10" value={m.speed}
            onChange={(e) => saveField("marquee.speed", parseInt(e.target.value))}
            className="w-full" />
          <div className="flex justify-between text-[10px] opacity-30">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] tracking-widest uppercase opacity-40">Text Size</label>
          <div className="flex gap-2">
            {['small', 'medium', 'large'].map((size) => (
              <button key={size}
                onClick={() => saveField("marquee.textSize", size)}
                className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors ${
                  m.textSize === size ? 'bg-black text-white border-black' : 'border-black/10 hover:bg-black/5'
                }`}>
                {size}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] tracking-widest uppercase opacity-40">Font</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {MARQUEE_FONTS.map((f) => (
              <button key={f}
                onClick={() => saveField("marquee.fontFamily", f)}
                className={`px-3 py-2 text-sm tracking-wider border transition-colors text-left ${
                  m.fontFamily === f ? 'bg-black text-white border-black' : 'border-black/10 hover:bg-black/5'
                }`}>
                <span style={{ fontFamily: `'${f}', sans-serif` }}>{f}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsSection({ data, handleAction, uploadFile }: any) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Customer Reviews</h2>
        <label className="cursor-pointer border border-black/10 px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
          Add Review
          <input type="file" accept="image/*,video/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = await uploadFile(file);
              await handleAction({ type: "add-review", photo: url, name: "", quote: "", rating: 5, mediaType: file.type.startsWith("video") ? "video" : "photo" });
            }} />
        </label>
      </div>

      {(!data.reviews || data.reviews.length === 0) && <p className="text-xs opacity-30 italic">No reviews yet.</p>}

      <div className="grid grid-cols-1 gap-6">
        {data.reviews?.map((r: any) => (
          <div key={r.id} className="border border-black/5 bg-white rounded overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-48 h-32 bg-zinc-100 flex-shrink-0">
              {r.type === "video" ? (
                <video src={r.photo} className="w-full h-full object-cover" />
              ) : r.photo ? (
                <img src={r.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px] opacity-30">No Media</span>
                </div>
              )}
            </div>
            <div className="flex-1 p-4 space-y-2">
              <input type="text" placeholder="Name" value={r.name || ""}
                onChange={(e) => handleAction({ type: "update-review", id: r.id, name: e.target.value })}
                className="w-full border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-black/40 transition-colors" />
              <textarea placeholder="Quote" value={r.quote || ""} rows={2}
                onChange={(e) => handleAction({ type: "update-review", id: r.id, quote: e.target.value })}
                className="w-full border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-black/40 transition-colors resize-none" />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star}
                    onClick={() => handleAction({ type: "update-review", id: r.id, rating: star })}
                    className={`text-lg ${(r.rating || 5) >= star ? 'text-black' : 'text-zinc-200'}`}>
                    ★
                  </button>
                ))}
              </div>
              <button onClick={() => handleAction({ type: "remove-review", id: r.id })}
                className="text-[10px] tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PagesSection({ data, saveField }: any) {
  const pages = [
    { key: "sizing", label: "Sizing Chart" },
    { key: "refund", label: "Refund & Exchange" },
    { key: "care", label: "Care Guide" },
    { key: "shipping", label: "Shipping & Delivery" },
  ];
  return (
    <div className="space-y-12">
      <h2 className="text-lg font-bold tracking-tight">Static Pages</h2>
      {pages.map((page) => {
        const p = data.pages?.[page.key] || { title: page.label, body: "" };
        return (
          <div key={page.key} className="border border-black/5 bg-white rounded p-6 space-y-4">
            <h3 className="text-sm font-bold tracking-wider uppercase">{page.label}</h3>
            <Field label="Page Title" value={p.title} onChange={(v: string) => saveField(`pages.${page.key}.title`, v)} />
            <Field label="Body (HTML)" type="textarea" value={p.body} onChange={(v: string) => saveField(`pages.${page.key}.body`, v)} rows={12} />
          </div>
        );
      })}
    </div>
  );
}

function BannersSection({ data, saveField, uploadFile }: any) {
  const banners = data.banners || [];
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editBgPosition, setEditBgPosition] = useState("center");

  const bgPositions = [
    { value: "center", label: "Center" },
    { value: "top", label: "Top" },
    { value: "bottom", label: "Bottom" },
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
    { value: "top left", label: "Top Left" },
    { value: "top right", label: "Top Right" },
    { value: "bottom left", label: "Bottom Left" },
    { value: "bottom right", label: "Bottom Right" },
  ];

  function addBanner() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    saveField("banners", [...banners, { id, image: "", title: "New Banner", subtitle: "", link: "/", active: true, order: banners.length, bgPosition: "center" }]);
    setEditing(id);
    setEditTitle("New Banner"); setEditSubtitle(""); setEditLink("/"); setEditImage(""); setEditBgPosition("center");
  }

  function saveBanner(id: string) {
    saveField("banners", banners.map((b: any) => b.id === id ? { ...b, title: editTitle, subtitle: editSubtitle, link: editLink, image: editImage, bgPosition: editBgPosition } : b));
    setEditing(null);
  }

  function deleteBanner(id: string) {
    saveField("banners", banners.filter((b: any) => b.id !== id));
    if (editing === id) setEditing(null);
  }

  function toggleActive(id: string) {
    saveField("banners", banners.map((b: any) => b.id === id ? { ...b, active: !b.active } : b));
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Promo Banners</h2>
        <button onClick={addBanner} className="border border-black/10 px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors">+ Add Banner</button>
      </div>
      {banners.length === 0 && <p className="text-xs opacity-30 italic">No banners yet.</p>}
      <div className="space-y-4">
        {banners.map((b: any) => (
          <div key={b.id} className="border border-black/5 bg-white p-4">
            {editing === b.id ? (
              <div className="space-y-3">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30" placeholder="Title" />
                <input value={editSubtitle} onChange={(e) => setEditSubtitle(e.target.value)} className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30" placeholder="Subtitle" />
                <input value={editLink} onChange={(e) => setEditLink(e.target.value)} className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30" placeholder="Link URL" />
                <div className="flex gap-2 items-center">
                  {editImage && <img src={editImage} className="w-16 h-16 object-cover bg-zinc-100" />}
                  <label className="border border-black/10 px-3 py-2 text-xs cursor-pointer hover:bg-zinc-50">
                    Upload Image
                    <input type="file" hidden accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await uploadFile(f); setEditImage(url); } }} />
                  </label>
                  <input value={editImage} onChange={(e) => setEditImage(e.target.value)} className="flex-1 border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30" placeholder="Or paste image URL" />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-2">Background Position</label>
                  <div className="grid grid-cols-3 gap-1.5 max-w-[280px]">
                    {bgPositions.map((pos) => (
                      <button key={pos.value} onClick={() => setEditBgPosition(pos.value)}
                        className={`text-[10px] tracking-wider uppercase px-2 py-1.5 border transition-colors ${
                          editBgPosition === pos.value ? 'bg-black text-white border-black' : 'border-black/10 hover:border-black/30'
                        }`}>
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveBanner(b.id)} className="bg-black text-white px-4 py-1.5 text-xs tracking-widest uppercase">Save</button>
                  <button onClick={() => setEditing(null)} className="border border-black/10 px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-zinc-100">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => toggleActive(b.id)} className={`w-3 h-3 rounded-full flex-shrink-0 ${b.active ? 'bg-green-500' : 'bg-zinc-300'}`} />
                {b.image && <img src={b.image} className="w-16 h-16 object-cover bg-zinc-100 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{b.title}</span>
                    <span className="text-[10px] opacity-30">{b.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  {b.subtitle && <p className="text-xs opacity-50 mt-0.5">{b.subtitle}</p>}
                  <p className="text-[10px] opacity-30 mt-0.5">Link: {b.link}</p>
                  <p className="text-[10px] opacity-30 mt-0.5">Position: {b.bgPosition || 'center'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(b.id); setEditTitle(b.title); setEditSubtitle(b.subtitle); setEditLink(b.link); setEditImage(b.image); setEditBgPosition(b.bgPosition || 'center'); }}
                    className="text-[10px] uppercase tracking-wider opacity-30 hover:opacity-100">Edit</button>
                  <button onClick={() => deleteBanner(b.id)} className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-600">Del</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterSection({ data }: any) {
  const list = data.newsletter || [];
  const copyEmails = () => {
    navigator.clipboard.writeText(list.map((e: any) => e.email).join("\n"));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Newsletter Subscribers</h2>
        <button onClick={copyEmails}
          className="border border-black/10 px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
          Export ({list.length})
        </button>
      </div>

      {list.length === 0 && <p className="text-xs opacity-30 italic">No subscribers yet.</p>}

      <div className="border border-black/5 bg-white divide-y divide-black/5 max-h-96 overflow-y-auto">
        {list.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span>{entry.email}</span>
            <span className="text-[10px] opacity-30">{new Date(entry.subscribedAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutSection({ data, saveField, uploadFile }: any) {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold tracking-tight">About Page</h2>
      <div className="space-y-4">
        <Field label="Title" value={data.about.title} onChange={(v: string) => saveField("about.title", v)} />
        <Field label="Text" type="textarea" value={data.about.text} onChange={(v: string) => saveField("about.text", v)} />
        <div className="space-y-2">
          <label className="text-[10px] tracking-widest uppercase opacity-40">Images</label>
          <div className="flex flex-wrap gap-2">
            {data.about.images.map((img: string, i: number) => (
              <div key={i} className="relative w-24 h-24 bg-zinc-100 border border-black/5 overflow-hidden group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button onClick={() => {
                  const newImages = data.about.images.filter((_: any, j: number) => j !== i);
                  saveField("about.images", newImages);
                }}
                  className="absolute top-1 right-1 w-5 h-5 bg-white/80 text-[10px] opacity-0 group-hover:opacity-100">✕</button>
              </div>
            ))}
            <label className="w-24 h-24 border border-dashed border-black/10 flex items-center justify-center cursor-pointer hover:border-black/40 transition-colors">
              <span className="text-xs opacity-30">+</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadFile(file);
                    saveField("about.images", [...(data.about.images || []), url]);
                  }
                }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactSection({ data, saveField }: any) {
  const [waTestMsg, setWaTestMsg] = useState("");
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold tracking-tight">Contact & Social</h2>
      <div className="space-y-4">
        <Field label="Email" value={data.contact.email} onChange={(v: string) => saveField("contact.email", v)} />
        <Field label="Instagram" value={data.contact.instagram} onChange={(v: string) => saveField("contact.instagram", v)} />
        <Field label="TikTok" value={data.contact.tiktok} onChange={(v: string) => saveField("contact.tiktok", v)} />
        <Field label="YouTube" value={data.contact.youtube} onChange={(v: string) => saveField("contact.youtube", v)} />
        <Field label="WhatsApp Number" value={data.contact.whatsapp} onChange={(v: string) => saveField("contact.whatsapp", v)} placeholder="+201234567890" />
        <Field label="Phone Number" value={data.contact.phone} onChange={(v: string) => saveField("contact.phone", v)} placeholder="+201234567890" />
        <Field label="Additional Info" type="textarea" value={data.contact.additional} onChange={(v: string) => saveField("contact.additional", v)} />
      </div>
      <div className="border-t border-black/5 pt-6">
        <h3 className="text-sm font-bold tracking-wider uppercase mb-4">Payment Accounts</h3>
        <div className="space-y-4">
          <Field label="InstaPay Account (username/number)" value={data.contact.instapay || ""} onChange={(v: string) => saveField("contact.instapay", v)} placeholder="e.g. @brand or 01012345678" />
          <Field label="Telda Account (number)" value={data.contact.telda || ""} onChange={(v: string) => saveField("contact.telda", v)} placeholder="e.g. 01012345678" />
          <Field label="Fawry Reference Code" value={data.contact.fawry || ""} onChange={(v: string) => saveField("contact.fawry", v)} placeholder="e.g. FAWRY-12345" />
        </div>
      </div>
      <div className="border-t border-black/5 pt-6">
        <h3 className="text-sm font-bold tracking-wider uppercase mb-4">Delivery Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-[10px] tracking-widest uppercase opacity-40">Cash on Delivery Enabled</label>
            <button onClick={() => saveField("contact.codEnabled", !data.contact.codEnabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${data.contact.codEnabled ? 'bg-black' : 'bg-zinc-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${data.contact.codEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <Field label="Delivery Fee (L.E.)" type="number" value={data.contact.deliveryFee ?? 80} onChange={(v: string) => saveField("contact.deliveryFee", parseFloat(v) || 0)} placeholder="80" />
          <Field label="Free Delivery Minimum (L.E.)" type="number" value={data.contact.freeDeliveryMinimum ?? 2000} onChange={(v: string) => saveField("contact.freeDeliveryMinimum", parseFloat(v) || 0)} placeholder="2000" />
        </div>
      </div>
      <div className="border-t border-black/5 pt-6">
        <h3 className="text-sm font-bold tracking-wider uppercase mb-4">WhatsApp Automation</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-widest uppercase opacity-40 mb-2 block">Provider</label>
            <select
              value={data.contact.whatsappProvider || "wa_me"}
              onChange={(e) => saveField("contact.whatsappProvider", e.target.value)}
              className="border border-black/10 px-3 py-2 text-xs outline-none focus:border-black/40 transition-colors w-full max-w-xs bg-white"
            >
              <option value="wa_me">wa.me links (manual — no API key needed)</option>
              <option value="callmebot">CallMeBot (automatic — requires API key)</option>
              <option value="whatsapp_cloud">WhatsApp Cloud API (Meta) — requires access token + phone number ID</option>
            </select>
          </div>
          <Field label="WhatsApp API Key / Access Token" value={data.contact.whatsappApiKey || ""} onChange={(v: string) => saveField("contact.whatsappApiKey", v)}
            placeholder={data.contact.whatsappProvider === "callmebot" ? "CallMeBot API key" : "WhatsApp Cloud API access token"} />
          {data.contact.whatsappProvider === "whatsapp_cloud" && (
            <Field label="Phone Number ID" value={data.contact.whatsappPhoneNumberId || ""} onChange={(v: string) => saveField("contact.whatsappPhoneNumberId", v)}
              placeholder="e.g. 123456789012345" />
          )}
          <div className="flex items-center gap-3">
            <button onClick={async () => {
              setWaTestMsg("Testing...");
              try {
                const res = await fetch("/api/test-whatsapp", { method: "POST", credentials: "include" });
                const d = await res.json();
                setWaTestMsg(d.ok ? "✅ Test sent! Check your WhatsApp." : `❌ ${d.error || "Test failed"}`);
              } catch { setWaTestMsg("❌ Connection error"); }
              setTimeout(() => setWaTestMsg(""), 8000);
            }}
              className="border border-black/20 px-4 py-2 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
              Test WhatsApp
            </button>
            {waTestMsg && <span className="text-xs">{waTestMsg}</span>}
          </div>
          <p className="text-[10px] opacity-40 leading-relaxed">
            Messages are sent automatically on: registration, payment confirmation, order status changes, coupon delivery, and fraud alerts.
            {data.contact.whatsappProvider === "wa_me" ? " With \"wa.me\" provider, messages are only logged in the server console. No actual WhatsApp message is sent." :
             data.contact.whatsappProvider === "callmebot" ? " With CallMeBot, messages are sent to the customer's phone. Get a free API key at callmebot.com. Note: CallMeBot may take 1-2 minutes to deliver." :
             " With WhatsApp Cloud API, messages are sent via Meta's official API. You need a Meta Business account, a WhatsApp Business Account, and a phone number registered with WhatsApp Business."}
          </p>
        </div>
      </div>
    </div>
  );
}

function TasksSection({ data, saveField, saveAll }: any) {
  const tasks = data.tasks || [];
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPhase, setEditPhase] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editStatus, setEditStatus] = useState<"planned" | "in_progress" | "completed">("planned");

  function addTask() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const newTasks = [...tasks, { id, title: "New Task", description: "", phase: "General", status: "planned", priority: "medium", order: tasks.length }];
    saveField("tasks", newTasks);
    setEditing(id);
    setEditTitle("New Task");
    setEditDesc("");
    setEditPhase("General");
    setEditPriority("medium");
    setEditStatus("planned");
  }

  function deleteTask(id: string) {
    saveField("tasks", tasks.filter((t: any) => t.id !== id));
    if (editing === id) setEditing(null);
  }

  function saveEdit(id: string) {
    saveField("tasks", tasks.map((t: any) => t.id === id ? { ...t, title: editTitle, description: editDesc, phase: editPhase, priority: editPriority, status: editStatus } : t));
    setEditing(null);
  }

  function toggleStatus(id: string) {
    const t = tasks.find((x: any) => x.id === id);
    if (!t) return;
    const next = t.status === "completed" ? "planned" : t.status === "in_progress" ? "completed" : "in_progress";
    saveField("tasks", tasks.map((x: any) => x.id === id ? { ...x, status: next } : x));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    const arr = [...tasks];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    saveField("tasks", arr.map((t, idx) => ({ ...t, order: idx })));
  }

  function moveDown(i: number) {
    if (i === tasks.length - 1) return;
    const arr = [...tasks];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    saveField("tasks", arr.map((t, idx) => ({ ...t, order: idx })));
  }

  const statusColor: Record<string, string> = { planned: "bg-zinc-200 text-zinc-600", in_progress: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700" };
  const priorityColor: Record<string, string> = { low: "text-zinc-400", medium: "text-amber-500", high: "text-red-500" };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Task / Bug Tracker</h2>
        <button onClick={addTask} className="border border-black/10 px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
          + Add Task
        </button>
      </div>

      {tasks.length === 0 && <p className="text-xs opacity-30 italic">No tasks yet.</p>}

      <div className="space-y-2">
        {tasks.map((task: any, i: number) => (
          <div key={task.id} className="border border-black/5 bg-white p-4">
            {editing === task.id ? (
              <div className="space-y-3">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30" placeholder="Task title" />
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 min-h-[60px]" placeholder="Description" />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-1">Phase</label>
                    <input value={editPhase} onChange={(e) => setEditPhase(e.target.value)} className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-1">Priority</label>
                    <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as any)} className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 bg-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-1">Status</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 bg-white">
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(task.id)} className="bg-black text-white px-4 py-1.5 text-xs tracking-widest uppercase">Save</button>
                  <button onClick={() => setEditing(null)} className="border border-black/10 px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-zinc-100">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button onClick={() => moveUp(i)} className="text-[10px] opacity-30 hover:opacity-100" disabled={i === 0}>▲</button>
                  <button onClick={() => moveDown(i)} className="text-[10px] opacity-30 hover:opacity-100" disabled={i === tasks.length - 1}>▼</button>
                </div>
                <button onClick={() => toggleStatus(task.id)} className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${task.status === "completed" ? "bg-green-500 border-green-500" : "border-black/20"}`}>
                  {task.status === "completed" && <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{task.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor[task.status] || ""}`}>{task.status.replace("_", " ")}</span>
                    <span className={`text-xs ${priorityColor[task.priority] || ""}`}>
                      {task.priority === "high" ? "!!!" : task.priority === "medium" ? "!!" : "!"}
                    </span>
                    <span className="text-[10px] opacity-30 uppercase">{task.phase}</span>
                  </div>
                  {task.description && <p className="text-xs opacity-50 mt-1">{task.description}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditing(task.id); setEditTitle(task.title); setEditDesc(task.description); setEditPhase(task.phase); setEditPriority(task.priority); setEditStatus(task.status); }}
                    className="text-[10px] uppercase tracking-wider opacity-30 hover:opacity-100">Edit</button>
                  <button onClick={() => deleteTask(task.id)} className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-600">Del</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesSection() {
  const [chats, setChats] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadChats() {
    try {
      const res = await fetch("/api/chat/conversations", { credentials: "include" });
      if (!res.ok) { setErr("Auth error"); return; }
      const data = await res.json();
      setChats(data.chats || []);
      setErr("");
    } catch { setErr("Connection error"); } finally { setLoading(false); }
  }

  useEffect(() => { loadChats(); const iv = setInterval(loadChats, 8000); return () => clearInterval(iv); }, []);

  async function openChat(chat: any) {
    setSelected(chat);
    await fetch("/api/chat/unread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ chatId: chat.id }),
    });
  }

  async function sendReply(e: FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selected) return;
    try {
      await fetch("/api/chat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatId: selected.id, text: replyText.trim() }),
      });
      setReplyText("");
      await loadChats();
      const updated = await fetch("/api/chat/conversations", { credentials: "include" }).then((r) => r.json());
      const found = (updated.chats || []).find((c: any) => c.id === selected.id);
      if (found) setSelected(found);
    } catch {}
  }

  if (loading) return <p className="text-xs opacity-30 italic">Loading messages...</p>;

  const unreadCount = chats.reduce((sum, c) => sum + c.messages.filter((m: any) => m.sender === "customer" && !m.read).length, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Messages</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} unread</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: 400 }}>
        <div className="border border-black/5 bg-white rounded overflow-y-auto" style={{ maxHeight: 500 }}>
          {chats.length === 0 && <p className="text-xs opacity-30 italic p-4">No conversations yet.</p>}
          {chats.map((chat) => {
            const unread = chat.messages.filter((m: any) => m.sender === "customer" && !m.read).length;
            const last = chat.messages[chat.messages.length - 1];
            return (
              <button
                key={chat.id}
                onClick={() => openChat(chat)}
                className={`w-full text-left p-4 border-b border-black/5 hover:bg-zinc-50 transition-colors ${selected?.id === chat.id ? "bg-zinc-100" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{chat.customerName}</span>
                  {unread > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unread}</span>}
                </div>
                {last && (
                  <p className="text-[11px] opacity-40 mt-1 truncate">
                    {last.sender === "admin" ? "You: " : ""}{last.text}
                  </p>
                )}
                <p className="text-[10px] opacity-30 mt-1">
                  {new Date(chat.createdAt).toLocaleDateString()}
                </p>
              </button>
            );
          })}
        </div>

        <div className="md:col-span-2 border border-black/5 bg-white rounded flex flex-col" style={{ maxHeight: 500 }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs opacity-30 italic">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-black/5">
                <p className="text-sm font-medium">{selected.customerName}</p>
                <p className="text-[10px] opacity-30">{selected.messages.length} messages</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender === "customer" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        msg.sender === "customer" ? "rounded-bl-md bg-zinc-100" : "rounded-br-md bg-black text-white"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "customer" ? "opacity-40" : "opacity-50 text-white/60"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendReply} className="p-3 border-t border-black/5 flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type reply..."
                  className="flex-1 border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40"
                />
                <button type="submit" disabled={!replyText.trim()}
                  className="bg-black text-white px-4 py-2 text-xs tracking-widest uppercase disabled:opacity-30">
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersSection({ data, saveField }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});

  function getWAStatusMessage(o: any, status: string): string {
    const shortId = o.id.slice(0, 8).toUpperCase();
    const trackingText = o.trackingNumber ? `\nTracking: ${o.trackingNumber}` : "";
    const msgs: Record<string, string> = {
      Confirmed: `Your payment has been confirmed! ✅ Your order #${shortId} is now being prepared. We will notify you when it ships.`,
      Preparing: `Your order #${shortId} is being prepared 📦 We'll notify you when it's on its way!`,
      Shipped: `Your order is on its way! 🚚 Order #${shortId} has been shipped. Expected delivery: 2-5 business days.${trackingText}`,
      Delivered: `Your order #${shortId} has been delivered! 🎉 Thank you for shopping with TRIO FASHION. We hope you love your pieces!`,
    };
    return msgs[status] || `TRIO FASHION — Order #${shortId} status: ${status}`;
  }

  function getWALink(phone: string, message: string): string {
    const clean = phone.replace(/[^0-9]/g, "");
    const waPhone = clean.startsWith("20") ? clean : "2" + clean.replace(/^0\+?/, "");
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  }

  useEffect(() => {
    fetch("/api/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {});
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (res.ok) {
          const d = await res.json();
          setOrders(d.orders || []);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function deleteOrder(id: string) {
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      if (res.ok) setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch {}
  }

  async function updateStatus(id: string, status: string) {
    setSavingStatus((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status }),
      });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    } catch {}
    setSavingStatus((prev) => ({ ...prev, [id]: false }));
  }

  async function saveNotes(id: string) {
    setSavingStatus((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, internalNotes: editNotes[id] || "" }),
      });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, internalNotes: editNotes[id] } : o));
    } catch {}
    setSavingStatus((prev) => ({ ...prev, [id]: false }));
  }

  function parsePrice(price: string): number {
    return parseFloat((price || "").replace(/[^0-9.]/g, "")) || 0;
  }

  function getOrderNumber(idx: number): string {
    return `#${(orders.length - idx).toString().padStart(4, "0")}`;
  }

  const STATUS_FLOW = ["Pending Verification", "Confirmed", "Preparing", "Shipped", "Delivered"];

  const statusColors: Record<string, string> = {
    "Pending Verification": "text-amber-600 bg-amber-50 border-amber-200",
    "Pending Fawry Payment": "text-blue-600 bg-blue-50 border-blue-200",
    "Cash on Delivery": "text-green-600 bg-green-50 border-green-200",
    Confirmed: "text-emerald-600 bg-emerald-50 border-emerald-200",
    Preparing: "text-indigo-600 bg-indigo-50 border-indigo-200",
    Shipped: "text-purple-600 bg-purple-50 border-purple-200",
    Delivered: "text-green-700 bg-green-100 border-green-300",
    Cancelled: "text-red-600 bg-red-50 border-red-200",
    Refunded: "text-orange-600 bg-orange-50 border-orange-200",
  };

  return (
    <>
      {/* Order Settings Panel */}
      <div className="border border-black/5 bg-white rounded p-6 mb-8">
        <h3 className="text-sm font-bold tracking-wider uppercase mb-4">Order Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Delivery Fee (L.E.)" type="number" value={data.contact.deliveryFee ?? 80}
            onChange={(v: string) => saveField("contact.deliveryFee", parseFloat(v) || 0)} placeholder="80" />
          <Field label="Free Delivery Minimum (L.E.)" type="number" value={data.contact.freeDeliveryMinimum ?? 2000}
            onChange={(v: string) => saveField("contact.freeDeliveryMinimum", parseFloat(v) || 0)} placeholder="2000" />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="text-[10px] tracking-widest uppercase opacity-40">Cash on Delivery Enabled</label>
          <button onClick={() => saveField("contact.codEnabled", !data.contact.codEnabled)}
            className={`relative w-10 h-5 rounded-full transition-colors ${data.contact.codEnabled ? 'bg-black' : 'bg-zinc-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${data.contact.codEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold tracking-tight">Orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="text-xs opacity-30 italic">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o: any, idx: number) => {
              const isNewFormat = o.items?.[0]?.name || o.items?.[0]?.productId;
              const unitPrice = parsePrice(o.productPrice);
              const isExpanded = expandedId === o.id;
              return (
                <div key={o.id} className="border border-black/5 bg-white rounded overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-black/5 flex items-start justify-between cursor-pointer hover:bg-zinc-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold tracking-wider">{getOrderNumber(idx)}</span>
                        {o.status && (
                          <span className={`text-[9px] tracking-wider uppercase px-2 py-0.5 border rounded ${statusColors[o.status] || "text-zinc-600 bg-zinc-50 border-zinc-200"}`}>
                            {o.status}
                          </span>
                        )}
                        {o.paymentMethod && (
                          <span className="text-[9px] tracking-wider uppercase opacity-40 border border-black/10 px-1.5 py-0.5">{o.paymentMethod.toUpperCase()}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1">
                        {isNewFormat ? o.items.map((i: any) => i.name).filter(Boolean).join(", ") : o.productName}
                      </p>
                      <p className="text-[10px] opacity-40 mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="text-xs opacity-30 ml-3">{isExpanded ? "▲" : "▼"}</span>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {/* Status Update */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] tracking-widest uppercase opacity-40">Update Status:</span>
                        <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="border border-black/10 bg-white px-3 py-1.5 text-xs outline-none focus:border-black/40">
                          {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                          <option disabled>───</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Refunded">Refunded</option>
                        </select>

                        {/* Fulfillment action buttons */}
                        {o.status === "Confirmed" && (
                          <button onClick={() => updateStatus(o.id, "Preparing")}
                            className="bg-indigo-600 text-white px-3 py-1.5 text-[10px] tracking-widest uppercase hover:opacity-80 transition-opacity">
                            🔄 Prepare Order
                          </button>
                        )}

                        {o.status === "Preparing" && (
                          <div className="flex items-center gap-2">
                            <input type="text" value={trackingInput[o.id] ?? ""}
                              onChange={(e) => setTrackingInput((prev) => ({ ...prev, [o.id]: e.target.value }))}
                              placeholder="Tracking number"
                              className="border border-black/10 px-2 py-1.5 text-xs outline-none focus:border-black/40 w-40" />
                            <button onClick={async () => {
                              const tn = trackingInput[o.id] || "";
                              if (!tn.trim()) return;
                              await fetch("/api/orders", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ id: o.id, status: "Shipped", trackingNumber: tn.trim() }),
                              });
                              setOrders((prev: any) => prev.map((p: any) => p.id === o.id ? { ...p, status: "Shipped", trackingNumber: tn.trim() } : p));
                              setTrackingInput((prev) => ({ ...prev, [o.id]: "" }));
                            }}
                              className="bg-purple-600 text-white px-3 py-1.5 text-[10px] tracking-widest uppercase hover:opacity-80 transition-opacity">
                              🚚 Mark Shipped
                            </button>
                          </div>
                        )}

                        {o.paymentMethod === "fawry" && o.status === "Pending Fawry Payment" && (
                          <button onClick={async () => {
                            try {
                              await fetch("/api/fawry-confirm", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ orderId: o.id }),
                              });
                              setOrders((prev: any) => prev.map((p: any) => p.id === o.id ? { ...p, status: "Confirmed", paymentStatus: "verified" } : p));
                            } catch {}
                          }}
                            className="bg-green-600 text-white px-3 py-1.5 text-[10px] tracking-widest uppercase hover:opacity-80 transition-opacity">
                            ✓ Confirm Fawry Payment
                          </button>
                        )}
                        {savingStatus[o.id] && <span className="text-[10px] opacity-30">Saving...</span>}
                      </div>

                      {/* Tracking number display */}
                      {o.trackingNumber && (
                        <div className="text-xs">
                          <span className="text-[10px] tracking-widest uppercase opacity-40">Tracking: </span>
                          <span className="font-mono font-medium">{o.trackingNumber}</span>
                        </div>
                      )}

                      {/* WhatsApp notification link */}
                      {o.customerPhone && (o.status === "Confirmed" || o.status === "Preparing" || o.status === "Shipped" || o.status === "Delivered") && (
                        <div>
                          <a href={getWALink(o.customerPhone, getWAStatusMessage(o, o.status))}
                            target="_blank"
                            className="text-[10px] tracking-widest uppercase text-green-600 hover:text-green-800 underline underline-offset-2">
                            📱 Send WhatsApp Update ({o.status})
                          </a>
                        </div>
                      )}

                      {/* Customer Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Customer</p>
                          <p className="font-medium">{o.customerName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Phone</p>
                          <p>{o.customerPhone}</p>
                        </div>
                        {o.governorate && (
                          <div>
                            <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Governorate</p>
                            <p>{o.governorate}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Address</p>
                          <p className="break-words">{o.customerAddress || <span className="opacity-30">—</span>}</p>
                        </div>
                        {o.deliveryNote && (
                          <div className="col-span-2">
                            <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Delivery Note</p>
                            <p className="text-zinc-500">{o.deliveryNote}</p>
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div>
                        <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Items</p>
                        <div className="border border-black/5 divide-y divide-black/5">
                          {o.items.map((item: any, i: number) => {
                            if (isNewFormat) {
                              const itemPrice = parsePrice(item.discountPrice || item.price);
                              const sub = (itemPrice * item.quantity).toFixed(2);
                              return (
                                <div key={i} className="flex items-center gap-3 px-3 py-2">
                                  {item.photo && <img src={item.photo} alt="" className="w-10 h-12 object-cover bg-zinc-100" />}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{item.name || "Item"}</p>
                                    <p className="text-[10px] opacity-40">
                                      {item.size} × {item.quantity}{item.colorLabel ? ` — ${item.colorLabel}` : ""}
                                    </p>
                                  </div>
                                  <span className="text-xs font-medium">{item.discountPrice || item.price}</span>
                                  <span className="text-xs opacity-50">= {sub}</span>
                                </div>
                              );
                            }
                            const sub = (unitPrice * item.quantity).toFixed(2);
                            return (
                              <div key={i} className="flex items-center justify-between px-3 py-2">
                                <span className="text-xs">{item.size} × {item.quantity}</span>
                                <span className="text-xs font-medium">{sub}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs">
                        <div>
                          <span className="opacity-40">Subtotal: </span>
                          <span className="font-medium">{isNewFormat && o.subtotal != null ? o.subtotal.toFixed(2) : (o.totalPrice ?? 0).toFixed(2)} L.E.</span>
                        </div>
                        <div>
                          <span className="opacity-40">Delivery: </span>
                          <span className="font-medium">{o.deliveryFee != null ? `${o.deliveryFee.toFixed(2)} L.E.` : "—"}</span>
                        </div>
                        <div>
                          <span className="opacity-40">Total: </span>
                          <span className="font-bold">{(o.total ?? o.totalPrice ?? 0).toFixed(2)} L.E.</span>
                        </div>
                        <div>
                          <span className="opacity-40">Payment: </span>
                          <span className="font-medium uppercase">{o.paymentMethod || "—"}</span>
                        </div>
                      </div>

                      {/* Screenshot */}
                      {o.screenshot && (
                        <div>
                          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Payment Screenshot</p>
                          <a href={o.screenshot} target="_blank" className="inline-block border border-black/5">
                            <img src={o.screenshot} alt="Payment proof" className="w-48 h-auto object-cover" />
                          </a>
                        </div>
                      )}

                      {/* Internal Notes */}
                      <div>
                        <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Internal Notes</p>
                        <div className="flex gap-2">
                          <textarea value={editNotes[o.id] ?? o.internalNotes ?? ""}
                            onChange={(e) => setEditNotes((prev) => ({ ...prev, [o.id]: e.target.value }))}
                            rows={2}
                            placeholder="Add internal notes about this order..."
                            className="flex-1 border border-black/10 px-3 py-2 text-xs outline-none focus:border-black/40 resize-none" />
                          <button onClick={() => saveNotes(o.id)}
                            className="border border-black/10 px-3 py-1 text-[10px] tracking-widest uppercase hover:bg-black hover:text-white transition-colors whitespace-nowrap">
                            Save Notes
                          </button>
                        </div>
                        {savingStatus[o.id] && <span className="text-[10px] opacity-30 mt-1 block">Saving...</span>}
                      </div>

                      {/* Delete */}
                      <div className="border-t border-black/5 pt-3 flex justify-end">
                        <button onClick={() => deleteOrder(o.id)}
                          className="text-[10px] tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors">
                          Delete Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function AnalyticsSection() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setAnalytics(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><p className="text-xs opacity-30">Loading analytics...</p></div>;
  if (!analytics) return <div className="p-6"><p className="text-xs text-red-500">Failed to load analytics</p></div>;

  const paymentValues = Object.values(analytics.paymentBreakdown || {}) as number[];
  const maxPayment = Math.max(...paymentValues, 1);
  const govValues = Object.values(analytics.governorateBreakdown || {}) as number[];
  const maxGov = Math.max(...govValues, 1);
  const maxDaily = Math.max(...(analytics.dailyOrders || []).map((d: any) => d.count), 1);
  const maxSeller = Math.max(...(analytics.bestSellers || []).map((s: any) => s.quantity), 1);

  const paymentLabels: Record<string, string> = {
    instapay: "InstaPay", telda: "Telda", fawry: "Fawry", cod: "Cash on Delivery", unknown: "Unknown",
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <h2 className="text-sm font-bold tracking-wider uppercase">Analytics</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-black/10 p-6">
          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Total Orders</p>
          <p className="text-3xl font-bold">{analytics.totalOrders}</p>
        </div>
        <div className="bg-white border border-black/10 p-6">
          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">{analytics.totalRevenue.toLocaleString()} L.E.</p>
        </div>
        <div className="bg-white border border-black/10 p-6">
          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Total Customers</p>
          <p className="text-3xl font-bold">{analytics.totalCustomers}</p>
        </div>
        <div className="bg-white border border-black/10 p-6">
          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">New This Month</p>
          <p className="text-3xl font-bold">{analytics.newCustomersThisMonth}</p>
        </div>
        <div className="bg-white border border-black/10 p-6">
          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Abandoned Carts</p>
          <p className="text-3xl font-bold">{analytics.abandonedCart}</p>
        </div>
        <div className="bg-white border border-black/10 p-6">
          <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Revenue / Customer</p>
          <p className="text-3xl font-bold">{analytics.revenuePerCustomerAvg.toLocaleString()} L.E.</p>
        </div>
      </div>

      {/* Top Spenders */}
      {analytics.topSpenders?.length > 0 && (
        <div>
          <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Most Loyal Customers (Top Spenders)</p>
          <div className="space-y-2">
            {analytics.topSpenders.map((c: any, i: number) => (
              <div key={c.id} className="flex items-center gap-3 text-xs">
                <span className="w-5 text-right opacity-40">{i + 1}.</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="opacity-50">{c.phone}</span>
                <span className="font-medium">{c.lifetimeSpend.toLocaleString()} L.E.</span>
                <span className="opacity-30">({c.orderCount} orders)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Payment Methods</p>
        <div className="space-y-2">
          {Object.entries(analytics.paymentBreakdown || {}).sort(([, a]: any, [, b]: any) => b - a).map(([method, count]: any) => (
            <div key={method} className="flex items-center gap-3">
              <span className="text-xs w-28">{paymentLabels[method] || method}</span>
              <div className="flex-1 h-5 bg-zinc-100 relative">
                <div className="absolute inset-y-0 left-0 bg-black transition-all" style={{ width: `${(count / maxPayment) * 100}%` }} />
              </div>
              <span className="text-xs font-medium w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Best Selling Products</p>
        <div className="space-y-2">
          {(analytics.bestSellers || []).map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs w-5 text-right opacity-40">{i + 1}.</span>
              <span className="text-xs flex-1 truncate">{item.name}</span>
              <div className="flex-1 h-5 bg-zinc-100 relative">
                <div className="absolute inset-y-0 left-0 bg-black transition-all" style={{ width: `${(item.quantity / maxSeller) * 100}%` }} />
              </div>
              <span className="text-xs font-medium w-8 text-right">{item.quantity}</span>
            </div>
          ))}
          {(!analytics.bestSellers || analytics.bestSellers.length === 0) && (
            <p className="text-xs opacity-30">No sales data yet</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Orders by Governorate</p>
        <div className="space-y-2">
          {Object.entries(analytics.governorateBreakdown || {}).sort(([, a]: any, [, b]: any) => b - a).map(([gov, count]: any) => (
            <div key={gov} className="flex items-center gap-3">
              <span className="text-xs w-36 truncate">{gov === "Unknown" ? "(not set)" : gov}</span>
              <div className="flex-1 h-5 bg-zinc-100 relative">
                <div className="absolute inset-y-0 left-0 bg-black transition-all" style={{ width: `${(count / maxGov) * 100}%` }} />
              </div>
              <span className="text-xs font-medium w-8 text-right">{count}</span>
            </div>
          ))}
          {Object.keys(analytics.governorateBreakdown || {}).length === 0 && (
            <p className="text-xs opacity-30">No order data yet</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Daily Orders (Last 30 Days)</p>
        <div className="flex items-end gap-[2px] h-40">
          {(analytics.dailyOrders || []).map((day: any) => (
            <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div
                className="w-full bg-black transition-all min-h-[1px]"
                style={{ height: `${Math.max((day.count / maxDaily) * 100, 1)}%` }}
              />
              {day.count > 0 && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] opacity-0 group-hover:opacity-100 whitespace-nowrap bg-black text-white px-1.5 py-0.5 transition-opacity">
                  {day.date}: {day.count}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] opacity-30">{analytics.dailyOrders?.[0]?.date}</span>
          <span className="text-[8px] opacity-30">{analytics.dailyOrders?.[analytics.dailyOrders.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}

function FraudSection() {
  const [flaggedAccounts, setFlaggedAccounts] = useState<any[]>([]);
  const [fraudEvents, setFraudEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  async function loadData() {
    try {
      const res = await fetch("/api/fraud", { credentials: "include" });
      if (!res.ok) return;
      const d = await res.json();
      setFlaggedAccounts(d.flaggedAccounts || []);
      setFraudEvents(d.fraudEvents || []);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function unblockAccount(accountId: string, reason?: string) {
    try {
      const res = await fetch("/api/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "unblock", accountId, reason: reason || "Unblocked by admin" }),
      });
      if (res.ok) {
        const d = await res.json();
        setFlaggedAccounts(d.flaggedAccounts || []);
        setFraudEvents(d.fraudEvents || []);
        setActionMsg("Account unblocked");
        setTimeout(() => setActionMsg(""), 3000);
      }
    } catch {}
  }

  async function clearEvents() {
    try {
      await fetch("/api/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "clear" }),
      });
      setFraudEvents([]);
      setActionMsg("Event log cleared");
      setTimeout(() => setActionMsg(""), 3000);
    } catch {}
  }

  const severityColors: Record<string, string> = {
    low: "text-yellow-600 bg-yellow-50 border-yellow-200",
    medium: "text-orange-600 bg-orange-50 border-orange-200",
    high: "text-red-600 bg-red-50 border-red-200",
    critical: "text-red-800 bg-red-100 border-red-300",
  };

  const eventLabels: Record<string, string> = {
    duplicate_transaction: "Duplicate Transaction",
    failed_verification: "Failed Verification",
    too_many_unconfirmed: "Too Many Unconfirmed",
    tampered_screenshot: "Tampered Screenshot",
    account_blocked: "Account Blocked",
    account_unblocked: "Account Unblocked",
  };

  if (loading) return <p className="text-xs opacity-30 italic">Loading fraud data...</p>;

  return (
    <div className="space-y-8">
      {actionMsg && <p className="text-xs text-green-600">{actionMsg}</p>}

      {/* Flagged Accounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight">Flagged Accounts ({flaggedAccounts.length})</h2>
        </div>
        {flaggedAccounts.length === 0 ? (
          <p className="text-xs opacity-30 italic">No flagged accounts.</p>
        ) : (
          <div className="space-y-3">
            {flaggedAccounts.map((acc: any) => (
              <div key={acc.id} className={`border bg-white p-4 ${acc.blocked ? 'border-red-300 bg-red-50/30' : 'border-amber-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{acc.phone}</span>
                      <span className={`text-[9px] tracking-wider uppercase px-2 py-0.5 border rounded ${severityColors[acc.severity] || ''}`}>
                        {acc.severity}
                      </span>
                      {acc.blocked && (
                        <span className="text-[9px] tracking-wider uppercase px-2 py-0.5 border rounded text-red-700 bg-red-100 border-red-300">
                          BLOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1">{acc.reason}</p>
                    <p className="text-[10px] opacity-40 mt-1">
                      {new Date(acc.createdAt).toLocaleString()}
                      {acc.customerId && ` — Customer ID: ${acc.customerId.slice(0, 8)}...`}
                    </p>
                    {acc.unblockedAt && (
                      <p className="text-[10px] text-green-600 mt-0.5">Unblocked {new Date(acc.unblockedAt).toLocaleString()}</p>
                    )}
                  </div>
                  {acc.blocked && (
                    <button onClick={() => unblockAccount(acc.id)}
                      className="border border-black/10 px-3 py-1 text-[10px] tracking-widest uppercase hover:bg-black hover:text-white transition-colors shrink-0 ml-3">
                      Unblock
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fraud Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight">Fraud Event Log ({fraudEvents.length})</h2>
          {fraudEvents.length > 0 && (
            <button onClick={clearEvents}
              className="border border-black/10 px-3 py-1 text-[10px] tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
              Clear Log
            </button>
          )}
        </div>
        {fraudEvents.length === 0 ? (
          <p className="text-xs opacity-30 italic">No fraud events.</p>
        ) : (
          <div className="border border-black/5 bg-white divide-y divide-black/5 max-h-96 overflow-y-auto">
            {fraudEvents.map((ev: any) => (
              <div key={ev.id} className="px-4 py-2.5 text-xs flex items-start gap-3">
                <span className={`text-[9px] tracking-wider uppercase px-1.5 py-0.5 border rounded shrink-0 mt-0.5 ${
                  ev.type.includes("blocked") ? "text-red-600 bg-red-50 border-red-200" : "text-amber-600 bg-amber-50 border-amber-200"
                }`}>
                  {eventLabels[ev.type] || ev.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p><span className="opacity-50">{ev.phone}</span>{ev.orderId ? ` — Order: ${ev.orderId.slice(0, 8)}...` : ""}</p>
                  <p className="opacity-40 mt-0.5">{ev.details}</p>
                </div>
                <span className="text-[10px] opacity-30 shrink-0">{new Date(ev.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CouponsSection({ data, saveAll }: any) {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("10");
  const [type, setType] = useState<"fixed" | "percentage" | "free_delivery">("fixed");
  const [minOrder, setMinOrder] = useState("0");
  const [maxUses, setMaxUses] = useState("1");
  const [assignAll, setAssignAll] = useState(false);
  const [assignToIds, setAssignToIds] = useState("");
  const [msg, setMsg] = useState("");

  async function createCoupon() {
    setMsg("");
    if (!code.trim()) { setMsg("Enter a coupon code"); return; }
    try {
      const coupons = [...(data.coupons || [])];
      coupons.push({
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        code: code.trim().toUpperCase(),
        discount: parseFloat(discount) || 0,
        type,
        minOrder: parseFloat(minOrder) || 0,
        maxUses: parseInt(maxUses) || 1,
        usedCount: 0,
        expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
        assignedTo: assignAll ? ["*"] : assignToIds.split(",").map((s) => s.trim()).filter(Boolean),
        active: true,
      });
      await saveAll({ coupons });
      setCode("");
      setMsg("Coupon created!");
    } catch { setMsg("Error creating coupon"); }
  }

  async function toggleActive(coupon: any) {
    const coupons = (data.coupons || []).map((c: any) => c.id === coupon.id ? { ...c, active: !c.active } : c);
    await saveAll({ coupons });
  }

  async function deleteCoupon(id: string) {
    const coupons = (data.coupons || []).filter((c: any) => c.id !== id);
    await saveAll({ coupons });
  }

  const now = Date.now();

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold tracking-tight">Coupons ({data.coupons?.length || 0})</h2>

      {/* Create Coupon */}
      <div className="border border-black/5 bg-white rounded p-6 space-y-4">
        <h3 className="text-sm font-bold tracking-wider uppercase">Create Coupon</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-1">Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40" />
          </div>
          <div>
            <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)}
              className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40 bg-white">
              <option value="fixed">Fixed Amount (L.E.)</option>
              <option value="percentage">Percentage (%)</option>
              <option value="free_delivery">Free Delivery</option>
            </select>
          </div>
          {type !== "free_delivery" && (
            <div>
              <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-1">Discount{type === "percentage" ? " (%)" : " (L.E.)"}</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-1">Min. Order (L.E.)</label>
            <input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)}
              className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40" />
          </div>
          <div>
            <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-1">Max Uses</label>
            <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
              className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={assignAll} onChange={(e) => setAssignAll(e.target.checked)} className="accent-black" />
              Assign to all customers
            </label>
          </div>
        </div>
        {!assignAll && (
          <div>
            <label className="text-[10px] tracking-widest uppercase opacity-40 block mb-1">Assign to Customer IDs (comma-separated)</label>
            <input value={assignToIds} onChange={(e) => setAssignToIds(e.target.value)}
              placeholder="e.g. id1, id2, id3"
              className="w-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/40" />
          </div>
        )}
        <button onClick={createCoupon}
          className="bg-black text-white px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">
          Create Coupon
        </button>
        {msg && <p className={`text-xs ${msg.includes("Error") ? "text-red-500" : "text-green-600"}`}>{msg}</p>}
      </div>

      {/* Coupon List */}
      <div className="space-y-2">
        {(!data.coupons || data.coupons.length === 0) ? (
          <p className="text-xs opacity-30 italic">No coupons created yet.</p>
        ) : (
          data.coupons.map((coupon: any) => (
            <div key={coupon.id} className="border border-black/5 bg-white p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold tracking-wider ${coupon.active ? "" : "line-through opacity-40"}`}>{coupon.code}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 border rounded ${
                    coupon.type === "free_delivery" ? "text-green-600 border-green-200" :
                    coupon.type === "percentage" ? "text-blue-600 border-blue-200" : "text-black border-black/20"
                  }`}>
                    {coupon.type === "free_delivery" ? "Free Delivery" : coupon.type === "percentage" ? `${coupon.discount}%` : `${coupon.discount} L.E.`}
                  </span>
                  {!coupon.active && <span className="text-[10px] text-red-500">Disabled</span>}
                  {coupon.expiresAt < now && <span className="text-[10px] text-red-500">Expired</span>}
                </div>
                <p className="text-[10px] opacity-40 mt-0.5">
                  Used {coupon.usedCount || 0}/{coupon.maxUses} · Min: {coupon.minOrder} L.E. · 
                  Expires {new Date(coupon.expiresAt).toLocaleDateString("en-EG")} ·
                  Assigned to: {coupon.assignedTo?.includes("*") ? "All" : `${coupon.assignedTo?.length || 0} customers`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button onClick={() => toggleActive(coupon)}
                  className={`text-[10px] tracking-widest uppercase px-2 py-1 border transition-colors ${
                    coupon.active ? "border-red-200 text-red-500 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"
                  }`}>
                  {coupon.active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => deleteCoupon(coupon.id)}
                  className="text-[10px] tracking-widest uppercase text-red-500 hover:text-red-700">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CustomersSection({ data }: any) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fraudData, setFraudData] = useState<{ flaggedAccounts: any[] }>({ flaggedAccounts: [] });

  useEffect(() => {
    fetch("/api/fraud", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFraudData(d))
      .catch(() => {});
  }, []);

  const customers = (data?.customers || []).filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  function getFraudInfo(customer: any): { risk: string; color: string } {
    const flag = fraudData.flaggedAccounts?.find((f: any) => f.phone === customer.phone || f.customerId === customer.id);
    if (customer.blacklisted || flag?.blocked === true) return { risk: "High", color: "text-red-600 bg-red-50" };
    if (flag || customer.failedPaymentAttempts && customer.failedPaymentAttempts >= 2) return { risk: "Medium", color: "text-orange-600 bg-orange-50" };
    return { risk: "Low", color: "text-green-600 bg-green-50" };
  }

  function getAccountStatus(customer: any): string {
    if (customer.blacklisted) return "Blacklisted";
    const flag = fraudData.flaggedAccounts?.find((f: any) => f.phone === customer.phone || f.customerId === customer.id);
    if (flag) return "Flagged";
    return "Active";
  }

  function getCustomerOrders(customer: any) {
    return (data?.orders || []).filter((o: any) => o.customerId === customer.id || o.phone === customer.phone);
  }

  function getMostViewedProducts(customer: any) {
    return (customer.viewedProducts || []).sort((a: any, b: any) => b.count - a.count).slice(0, 5);
  }

  function getMostPurchasedCategories(customer: any) {
    return (customer.browsedCategories || []).sort((a: any, b: any) => b.count - a.count).slice(0, 5);
  }

  function getCustomerCoupons(customer: any) {
    return (data?.coupons || []).filter((c: any) => c.assignedTo === "*" || (Array.isArray(c.assignedTo) && c.assignedTo.includes(customer.id)));
  }

  function formatDate(ts: number) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
  }

  const statusColors: Record<string, string> = {
    "Pending Verification": "text-yellow-600 bg-yellow-50",
    "Pending Fawry Payment": "text-yellow-600 bg-yellow-50",
    "Cash on Delivery": "text-blue-600 bg-blue-50",
    Confirmed: "text-indigo-600 bg-indigo-50",
    Preparing: "text-violet-600 bg-violet-50",
    Shipped: "text-orange-600 bg-orange-50",
    Delivered: "text-green-600 bg-green-50",
    Cancelled: "text-red-600 bg-red-50",
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h2 className="text-sm font-bold tracking-wider uppercase">Customer Intelligence</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, phone, or email..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setExpandedId(null); }}
        className="w-full border border-black/10 px-4 py-2.5 text-xs outline-none focus:border-black/40 transition-colors"
      />

      {/* Customer List */}
      <div className="space-y-2">
        {customers.length === 0 && (
          <p className="text-xs opacity-30 italic">{search ? "No customers match your search." : "No customers registered yet."}</p>
        )}
        {customers.map((customer: any) => {
          const orders = getCustomerOrders(customer);
          const totalItems = orders.reduce((sum: number, o: any) => sum + (o.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 0), 0);
          const fraudInfo = getFraudInfo(customer);
          const status = getAccountStatus(customer);
          const expanded = expandedId === customer.id;

          return (
            <div key={customer.id} className="border border-black/5 bg-white">
              {/* Row */}
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors text-xs"
                onClick={() => setExpandedId(expanded ? null : customer.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{customer.name || "—"}</p>
                  <p className="opacity-40 truncate">{customer.phone}{customer.email ? ` · ${customer.email}` : ""}</p>
                </div>
                <div className="hidden md:block text-right">
                  <p className="font-medium">{customer.lifetimeSpend?.toLocaleString() || 0} L.E.</p>
                  <p className="opacity-40">{customer.orderCount || 0} orders</p>
                </div>
                <div className="hidden md:block text-right">
                  <p className="font-medium">{customer.loyaltyPoints || 0} pts</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-medium ${fraudInfo.color}`}>{fraudInfo.risk}</span>
                <span className={`px-2 py-0.5 text-[10px] font-medium ${
                  status === "Blacklisted" ? "text-red-600 bg-red-50" : status === "Flagged" ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50"
                }`}>{status}</span>
                <span className="text-xs opacity-20">{expanded ? "▲" : "▼"}</span>
              </div>

              {/* Expanded detail */}
              {expanded && (
                <div className="border-t border-black/5 px-4 py-4 space-y-6 text-xs">
                  {/* Profile Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Name</p>
                      <p className="font-medium">{customer.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Phone</p>
                      <p className="font-medium">{customer.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Email</p>
                      <p className="font-medium">{customer.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Registered</p>
                      <p className="font-medium">{formatDate(customer.createdAt)}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-50 p-3">
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Total Orders</p>
                      <p className="text-lg font-bold">{orders.length}</p>
                    </div>
                    <div className="bg-zinc-50 p-3">
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Total Spent</p>
                      <p className="text-lg font-bold">{customer.lifetimeSpend?.toLocaleString() || 0} L.E.</p>
                    </div>
                    <div className="bg-zinc-50 p-3">
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Items Purchased</p>
                      <p className="text-lg font-bold">{totalItems}</p>
                    </div>
                  </div>

                  {/* Loyalty & Fraud */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Loyalty Points</p>
                      <p className="text-xl font-bold">{customer.loyaltyPoints || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Fraud Risk / Account Status</p>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-xs font-medium ${fraudInfo.color}`}>{fraudInfo.risk} Risk</span>
                        <span className={`px-2 py-1 text-xs font-medium ${
                          status === "Blacklisted" ? "text-red-600 bg-red-50" : status === "Flagged" ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50"
                        }`}>{status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Most Viewed Products */}
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Most Viewed Products</p>
                    {(() => {
                      const views = getMostViewedProducts(customer);
                      return views.length > 0 ? (
                        <div className="space-y-1">
                          {views.map((v: any) => (
                            <div key={v.productId} className="flex items-center gap-2">
                              <span className="opacity-60 w-40 truncate">{v.productId}</span>
                              <div className="flex-1 h-3 bg-zinc-100 relative">
                                <div className="absolute inset-y-0 left-0 bg-black/60" style={{ width: `${Math.min((v.count / Math.max(...views.map((x: any) => x.count))) * 100, 100)}%` }} />
                              </div>
                              <span className="font-medium w-6 text-right">{v.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="opacity-30 italic">No product views tracked</p>;
                    })()}
                  </div>

                  {/* Most Purchased Categories */}
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Most Purchased Categories</p>
                    {(() => {
                      const cats = getMostPurchasedCategories(customer);
                      return cats.length > 0 ? (
                        <div className="space-y-1">
                          {cats.map((cat: any) => (
                            <div key={cat.category} className="flex items-center gap-2">
                              <span className="opacity-60 w-40 truncate">{cat.category}</span>
                              <div className="flex-1 h-3 bg-zinc-100 relative">
                                <div className="absolute inset-y-0 left-0 bg-black/60" style={{ width: `${Math.min((cat.count / Math.max(...cats.map((x: any) => x.count))) * 100, 100)}%` }} />
                              </div>
                              <span className="font-medium w-6 text-right">{cat.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="opacity-30 italic">No category data tracked</p>;
                    })()}
                  </div>

                  {/* Coupons */}
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Assigned Coupons</p>
                    {(() => {
                      const coupons = getCustomerCoupons(customer);
                      return coupons.length > 0 ? (
                        <div className="space-y-1">
                          {coupons.map((cp: any) => (
                            <div key={cp.code || cp.id} className="flex items-center gap-3 text-xs">
                              <span className="font-mono text-[10px] bg-zinc-100 px-1.5 py-0.5">{cp.code}</span>
                              <span className="opacity-60">{cp.type === "percentage" ? `${cp.discount}% off` : cp.type === "free_delivery" ? "Free Delivery" : `${cp.discount} L.E. off`}</span>
                              <span className={`px-1.5 py-0.5 text-[10px] font-medium ${cp.usedCount >= cp.maxUses ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}>
                                {cp.usedCount >= cp.maxUses ? "Used" : "Available"}
                              </span>
                              {cp.expiresAt && <span className="opacity-30">Expires {formatDate(cp.expiresAt)}</span>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="opacity-30 italic">No coupons assigned</p>;
                    })()}
                  </div>

                  {/* Order History */}
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Order History ({orders.length})</p>
                    {orders.length > 0 ? (
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {orders.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).map((o: any) => (
                          <div key={o.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-black/5 last:border-0">
                            <span className="font-mono text-[10px] opacity-40 w-20 truncate">{o.id?.slice(0, 8)}</span>
                            <span className="w-24 truncate">{formatDate(o.createdAt)}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium ${statusColors[o.status] || "text-zinc-600 bg-zinc-50"}`}>{o.status || "—"}</span>
                            <span className="font-medium w-20 text-right">{o.total?.toLocaleString() || o.totalPrice?.toLocaleString() || "—"} L.E.</span>
                            <span className="opacity-40 flex-1 truncate">{o.items?.map((i: any) => i.name || i.productId).join(", ") || o.productName || ""}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="opacity-30 italic">No orders placed</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) { setMsg("Passwords don't match"); return; }
    if (newPass.length < 4) { setMsg("Minimum 4 characters"); return; }
    try {
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPass }),
      });
      if (res.ok) { setMsg("Password changed"); setCurrent(""); setNewPass(""); setConfirm(""); }
      else setMsg("Error changing password");
    } catch { setMsg("Error"); }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold tracking-tight">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xs">
        <Field label="New Password" type="password" value={newPass} onChange={setNewPass} />
        <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} />
        {msg && <p className="text-xs opacity-60">{msg}</p>}
        <button type="submit" className="bg-black text-white px-6 py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">
          Update Password
        </button>
      </form>
    </div>
  );
}
