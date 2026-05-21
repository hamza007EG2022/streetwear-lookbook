"use client";

import { useEffect, useState, useCallback, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";

type SiteData = any;

const TABS = [
  "Brand", "Colors", "Hero", "Products", "Lookbook", "Collections", "Marquee", "Reviews", "Pages", "Banners", "Newsletter", "About", "Contact", "Tasks", "Messages", "Orders", "Password"
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

  useEffect(() => {
    if (!auth) return;
    let knownCount = 0;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (res.ok) {
          const { orders } = await res.json();
          if (tab !== "Orders" && orders.length > knownCount) {
            setNewOrders(orders.length - knownCount);
          }
          if (tab === "Orders") {
            setNewOrders(0);
          }
          knownCount = orders.length;
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
      <div className="flex-1 ml-64 p-8">
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
          {tab === "Orders" && <OrdersSection />}
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
      <nav className="flex-1 p-4 space-y-1">
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

function OrdersSection() {
  const [orders, setOrders] = useState<any[]>([]);

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

  function parsePrice(price: string): number {
    return parseFloat((price || "").replace(/[^0-9.]/g, "")) || 0;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold tracking-tight">Orders ({orders.length})</h2>
      {orders.length === 0 ? (
        <p className="text-xs opacity-30 italic">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o: any) => {
            const unitPrice = parsePrice(o.productPrice);
            return (
              <div key={o.id} className="border border-black/5 bg-white rounded p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">{o.productName}</p>
                    <p className="text-[10px] opacity-40 mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-medium">{o.productPrice} × {o.items.reduce((s: number, i: any) => s + (i.quantity || 0), 0)}</p>
                    <button onClick={() => deleteOrder(o.id)}
                      className="text-[10px] tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs border-t border-black/5 pt-3">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Customer</p>
                    <p>{o.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Phone</p>
                    <p>{o.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Address</p>
                    <p className="max-w-[200px] break-words">{o.customerAddress || <span className="opacity-30">—</span>}</p>
                  </div>
                  {o.deliveryNote && (
                    <div>
                      <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Delivery Note</p>
                      <p className="max-w-[200px] break-words text-zinc-500">{o.deliveryNote}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Items</p>
                    {o.items.map((item: any, i: number) => {
                      const sub = (unitPrice * item.quantity).toFixed(2);
                      return <p key={i}>{item.size} × {item.quantity} = {sub}</p>;
                    })}
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-0.5">Total</p>
                    <p className="font-medium">
                      {(o.totalPrice ?? (unitPrice * o.items.reduce((s: number, i: any) => s + (i.quantity || 0), 0))).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
