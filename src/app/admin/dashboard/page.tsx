"use client";

import { useEffect, useState, useCallback, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";

type SiteData = any;

const TABS = [
  "Brand", "Colors", "Hero", "Products", "Lookbook", "About", "Contact", "Messages", "Orders", "Password"
];

export default function DashboardPage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [auth, setAuth] = useState<boolean | null>(null);
  const [tab, setTab] = useState("Brand");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [newOrdersCount, setNewOrdersCount] = useState(0);
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
    const check = async () => {
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (res.ok) {
          const d = await res.json();
          setNewOrdersCount((d.orders || []).filter((o: any) => o.status === "new").length);
        }
      } catch {}
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, []);

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
      <Sidebar tab={tab} setTab={setTab} msg={msg} saving={saving} newOrdersCount={newOrdersCount} />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl">
          {tab === "Brand" && <BrandSection data={data} saveField={saveField} uploadFile={uploadFile} />}
          {tab === "Colors" && <ColorsSection data={data} saveField={saveField} saveAll={saveAll} />}
          {tab === "Hero" && <HeroSection data={data} saveField={saveField} uploadFile={uploadFile} />}
          {tab === "Products" && <ProductsSection data={data} handleAction={handleAction} uploadFile={uploadFile} />}
          {tab === "Lookbook" && <LookbookSection data={data} handleAction={handleAction} uploadFile={uploadFile} />}
          {tab === "About" && <AboutSection data={data} saveField={saveField} uploadFile={uploadFile} />}
          {tab === "Contact" && <ContactSection data={data} saveField={saveField} />}
          {tab === "Messages" && <MessagesSection />}
          {tab === "Orders" && <OrdersSection />}
          {tab === "Password" && <PasswordSection />}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab, msg, saving, newOrdersCount }: any) {
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
            onClick={() => setTab(t)}
            className={`w-full flex items-center justify-between text-left px-4 py-2 text-xs tracking-widest uppercase rounded transition-colors ${
              tab === t ? "bg-black text-white" : "hover:bg-zinc-100"
            }`}
          >
            <span>{t}</span>
            {t === "Orders" && newOrdersCount > 0 && (
              <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none">{newOrdersCount}</span>
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

function Field({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] tracking-widest uppercase opacity-40">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
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

function ProductsSection({ data, handleAction, uploadFile }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", category: "", material: "", stock: "in_stock" as string, photos: [] as string[], sizes: [] as string[] });
  const [sizeInput, setSizeInput] = useState("");

  function resetForm() { setForm({ name: "", price: "", description: "", category: "", material: "", stock: "in_stock", photos: [], sizes: [] }); }

  function editProduct(p: any) {
    setForm({ name: p.name, price: p.price, description: p.description, category: p.category, material: p.material || "", stock: p.stock || "in_stock", photos: p.photos || [], sizes: p.sizes || [] });
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
      setForm((prev: any) => ({ ...prev, sizes: [...prev.sizes, s] }));
      setSizeInput("");
    }
  }

  function removeSize(s: string) {
    setForm((prev: any) => ({ ...prev, sizes: prev.sizes.filter((x: string) => x !== s) }));
  }

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
              <Field label="Category" value={form.category} onChange={(v: string) => setForm({ ...form, category: v })} />
              <Field label="Description" type="textarea" value={form.description} onChange={(v: string) => setForm({ ...form, description: v })} />
              <Field label="Material" value={form.material} onChange={(v: string) => setForm({ ...form, material: v })} placeholder="e.g. 100% Cotton, Polyester Blend" />
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
                <label className="text-[10px] tracking-widest uppercase opacity-40">Available Sizes</label>
                <div className="flex flex-wrap gap-1.5">
                  {form.sizes.map((s: string) => (
                    <span key={s} className="inline-flex items-center gap-1 border border-black/10 px-2 py-0.5 text-[11px]">
                      {s}
                      <button type="button" onClick={() => removeSize(s)} className="text-red-400 hover:text-red-600">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                    placeholder="e.g. S, M, L, XL" className="flex-1 border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-black/40" />
                  <button type="button" onClick={addSize} className="border border-black/10 px-3 py-1.5 text-xs hover:bg-black hover:text-white transition-colors">Add</button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-black text-white py-2 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs tracking-widest uppercase border border-black/10 hover:bg-zinc-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {data.products.length === 0 && <p className="text-xs opacity-30 italic">No products added yet.</p>}
        {data.products.map((p: any) => (
          <div key={p.id} className="flex items-center gap-4 bg-white border border-black/5 p-3">
            <div className="w-12 h-12 bg-zinc-100 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${p.photos?.[0] || ""})` }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs opacity-40">{p.price} · {p.category} · {p.photos?.length || 0} photos · {p.sizes?.length || 0} sizes</p>
            </div>
            <button onClick={() => editProduct(p)} className="text-[10px] tracking-widest uppercase opacity-30 hover:opacity-100">Edit</button>
            <button onClick={() => handleAction({ type: "delete-product", id: p.id })}
              className="text-[10px] tracking-widest uppercase text-red-400 hover:text-red-600">Delete</button>
          </div>
        ))}
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
        <Field label="Additional Info" type="textarea" value={data.contact.additional} onChange={(v: string) => saveField("contact.additional", v)} />
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

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  confirmed: "bg-amber-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
};

const statusLabels: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
};

const nextStatus: Record<string, string> = {
  new: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
  delivered: "delivered",
};

function OrdersSection() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [newCount, setNewCount] = useState(0);

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) return;
      const d = await res.json();
      setOrders(d.orders || []);
      setNewCount((d.orders || []).filter((o: any) => o.status === "new").length);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { loadOrders(); const iv = setInterval(loadOrders, 10000); return () => clearInterval(iv); }, []);

  async function advanceStatus(id: string, current: string) {
    const next = nextStatus[current];
    if (next === current) return;
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status: next }),
      });
      await loadOrders();
      if (selected?.id === id) setSelected((prev: any) => prev ? { ...prev, status: next } : null);
    } catch {}
  }

  if (loading) return <p className="text-xs opacity-30 italic">Loading orders...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Orders</h2>
        {newCount > 0 && (
          <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{newCount} new</span>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="text-xs opacity-30 italic">No orders yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-black/5 bg-white rounded overflow-y-auto" style={{ maxHeight: 500 }}>
            {orders.map((order) => (
              <button key={order.id} onClick={() => setSelected(order)}
                className={`w-full text-left p-4 border-b border-black/5 hover:bg-zinc-50 transition-colors ${selected?.id === order.id ? "bg-zinc-100" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{order.customerName}</span>
                  <span className={`text-white text-[10px] px-1.5 py-0.5 rounded ${statusColors[order.status] || "bg-zinc-400"}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <p className="text-[11px] opacity-40 truncate">{order.productName} · {order.totalPrice?.toFixed(2)} EGP</p>
                <p className="text-[10px] opacity-30 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>

          <div className="md:col-span-2 border border-black/5 bg-white rounded p-6" style={{ maxHeight: 500, overflowY: "auto" }}>
            {!selected ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs opacity-30 italic">Select an order</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold tracking-tight">{selected.customerName}</p>
                  <span className={`text-white text-[10px] px-2 py-0.5 rounded ${statusColors[selected.status] || "bg-zinc-400"}`}>
                    {statusLabels[selected.status] || selected.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Phone</p>
                    <p>{selected.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Date</p>
                    <p>{new Date(selected.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Delivery Address</p>
                  <p className="text-sm">{selected.deliveryAddress}</p>
                </div>

                {selected.note && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">Note</p>
                    <p className="text-sm opacity-60">{selected.note}</p>
                  </div>
                )}

                <div className="border-t border-black/5 pt-4">
                  <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Items Ordered</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{selected.productName} — {selected.productPrice}</p>
                    {(selected.items || []).map((item: any, i: number) => (
                      <p key={i} className="text-xs opacity-60">{item.size} × {item.quantity}</p>
                    ))}
                  </div>
                  <p className="text-sm font-bold mt-2">Total: {selected.totalPrice?.toFixed(2)} EGP</p>
                </div>

                <div className="border-t border-black/5 pt-4">
                  <p className="text-[10px] tracking-widest uppercase opacity-40 mb-2">Update Status</p>
                  <div className="flex gap-2">
                    {(["new", "confirmed", "shipped", "delivered"] as const).map((s) => (
                      <button key={s} onClick={() => advanceStatus(selected.id, selected.status)}
                        disabled={selected.status === s || nextStatus[selected.status] !== s && selected.status !== s}
                        className={`px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${
                          selected.status === s
                            ? `${statusColors[s]} text-white border-transparent`
                            : "border-black/10 hover:bg-zinc-50 disabled:opacity-20"
                        }`}>
                        {statusLabels[s]}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] opacity-30 mt-2">Click the next status to advance the order.</p>
                </div>
              </div>
            )}
          </div>
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
