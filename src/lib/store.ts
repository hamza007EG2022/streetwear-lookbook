import fs from 'fs/promises';
import path from 'path';
import { put, head } from '@vercel/blob';
import { getSupabase, useSupabase } from './supabase';

const DATA_PATH = path.join(process.cwd(), 'data', 'store.json');
const BLOB_KEY = 'store.json';

let cachedStoreUrl: string | null = null;
let cachedData: SiteData | null = null;
let storeBlocked = false;

const FALLBACK_HASH = '$2b$10$3X0qYp.sammqUsSPHFI9I.3ZedihIpv8zcKJtNaKjcPm.yMxKye7a';
const FALLBACK_TOKEN = 'fallback-session-token-2026';
const fallbackTokens = new Set<string>();

export interface Product {
  id: string;
  name: string;
  photos: string[];
  price: string;
  description: string;
  category: string;
  sizes: string[];
  material?: string;
  stock?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface LookbookItem {
  id: string;
  photo: string;
  caption: string;
  order: number;
}

export interface SiteColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  button: string;
  accent: string;
  navbar: string;
  footer: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  iv: string;
  sender: 'customer' | 'admin';
  timestamp: number;
  read: boolean;
}

export interface Chat {
  id: string;
  customerName: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface OrderItem {
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  productName: string;
  productPrice: string;
  items: OrderItem[];
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  createdAt: number;
}

export interface SiteData {
  _updatedAt?: number;
  brand: { name: string; logo: string; tagline: string };
  colors: SiteColors;
  hero: { title: string; subtitle: string; backgroundImage: string };
  products: Product[];
  lookbook: LookbookItem[];
  about: { title: string; text: string; images: string[] };
  contact: { email: string; instagram: string; whatsapp: string; phone: string; additional: string };
  chats: Chat[];
  orders: Order[];
  encryptionKey: string;
  adminPassword: string;
  adminToken: string;
}

export const DEFAULT_COLORS: SiteColors = {
  primary: "#ffffff",
  secondary: "#f5f5f0",
  background: "#f5f5f0",
  text: "#111111",
  button: "#111111",
  accent: "#111111",
  navbar: "#ffffff",
  footer: "#ffffff",
};

const defaults: SiteData = {
  _updatedAt: Date.now(),
  brand: { name: "TRIO-Fashion Streetwear", logo: "/placeholder-logo.svg", tagline: "Urban Luxury Streetwear" },
  colors: { ...DEFAULT_COLORS },
  hero: { title: "NEW COLLECTION", subtitle: "SS 2026", backgroundImage: "/placeholder-logo.svg" },
  products: [],
  lookbook: [],
  about: { title: "OUR STORY", text: "Born from the streets, crafted for the bold.", images: [] },
  contact: { email: "hello@brand.com", instagram: "@brand", whatsapp: "", phone: "", additional: "Based in New York City" },
  chats: [],
  orders: [],
  encryptionKey: "",
  adminPassword: "",
  adminToken: "",
};

function useBlob(): boolean {
  if (process.env.VERCEL) return true;
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export function isStoreBlocked(): boolean {
  return storeBlocked;
}

export function useFallbackToken(): string {
  const t = FALLBACK_TOKEN + '-' + Date.now();
  fallbackTokens.add(t);
  return t;
}

export function isValidFallbackToken(token: string): boolean {
  return fallbackTokens.has(token);
}

// ── Supabase ──────────────────────────────────────────────────────
// Type helpers for the generic Supabase client
type SB = ReturnType<typeof getSupabase>;
async function sbFrom(supabase: NonNullable<SB>) {
  return supabase.from("site_data") as any;
}

async function readFromSupabase(): Promise<SiteData | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const tbl = await sbFrom(supabase);
  const { data, error } = await tbl.select("data").eq("id", "default").maybeSingle();
  if (error || !data) return null;
  const parsed = data.data as SiteData;
  if (parsed && typeof parsed.brand?.name === 'string') {
    cachedData = parsed;
    return parsed;
  }
  return null;
}

async function writeToSupabase(d: SiteData): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  d._updatedAt = Date.now();
  const tbl = await sbFrom(supabase);
  const { error } = await tbl.upsert({ id: "default", data: d, updated_at: Date.now() });
  if (error) console.error("Supabase write error:", error);
  else cachedData = d;
}

export async function ensureTablesExist(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await (supabase.rpc as any)("exec_sql", {
      sql: `CREATE TABLE IF NOT EXISTS site_data (
        id TEXT PRIMARY KEY DEFAULT 'default',
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
      );
      ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN CREATE POLICY "anon_all" ON site_data FOR ALL USING (true) WITH CHECK (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
    });
  } catch {
    const tbl = await sbFrom(supabase);
    await tbl.select("id").limit(1).maybeSingle();
  }
}

// ── Blob / local fallback (unchanged) ──────────────────────────────

export async function blobExists(): Promise<boolean> {
  if (cachedStoreUrl) return true;
  try {
    const info = await head(BLOB_KEY);
    cachedStoreUrl = info.url;
    return true;
  } catch {
    return false;
  }
}

async function getBlobUrl(): Promise<string | null> {
  if (cachedStoreUrl) return cachedStoreUrl;
  try {
    const info = await head(BLOB_KEY);
    cachedStoreUrl = info.url;
    return info.url;
  } catch {
    return null;
  }
}

async function readFromBlob(): Promise<SiteData | null> {
  if (cachedData) return cachedData;
  const url = await getBlobUrl();
  if (!url) {
    if (process.env.VERCEL) {
      storeBlocked = true;
      console.error('Vercel Blob: no token or store unavailable');
    }
    return null;
  }
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${url}?t=${Date.now()}`);
      const text = await res.text();
      if (text.includes('blocked') || text.includes('suspended')) {
        storeBlocked = true;
        console.error('Vercel Blob store is blocked/suspended');
        return null;
      }
      if (!res.ok) {
        if (i < 2) { await new Promise(r => setTimeout(r, 1000)); continue; }
        return null;
      }
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.brand?.name === 'string') {
        cachedData = parsed;
        return parsed;
      }
      if (i < 2) await new Promise(r => setTimeout(r, 1000));
    } catch {
      if (i < 2) await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function writeToBlob(data: SiteData): Promise<void> {
  if (storeBlocked) {
    cachedData = data;
    return;
  }
  const json = JSON.stringify(data, null, 2);
  const result = await put(BLOB_KEY, json, {
    contentType: 'application/json',
    access: 'public',
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
  cachedStoreUrl = result.url;
  cachedData = data;
}

// ── Public API ─────────────────────────────────────────────────────

let tablesEnsured = false;

export async function getData(): Promise<SiteData> {
  if (useSupabase()) {
    if (!tablesEnsured) {
      await ensureTablesExist();
      tablesEnsured = true;
    }
    const parsed = await readFromSupabase();
    if (parsed) {
      return { ...defaults, ...parsed, colors: { ...defaults.colors, ...parsed.colors }, contact: { ...defaults.contact, ...parsed.contact } };
    }
    return { ...defaults };
  }

  if (useBlob()) {
    const parsed = await readFromBlob();
    if (parsed) {
      return { ...defaults, ...parsed, colors: { ...defaults.colors, ...parsed.colors }, contact: { ...defaults.contact, ...parsed.contact } };
    }
    const blobUrl = await getBlobUrl();
    if (!blobUrl) {
      let reallyMissing = true;
      for (let i = 0; i < 3; i++) {
        try {
          const info = await head(BLOB_KEY);
          if (info?.url) { reallyMissing = false; break; }
        } catch {}
        await new Promise(r => setTimeout(r, 1000));
      }
      if (!reallyMissing) return { ...defaults, adminPassword: FALLBACK_HASH };
      try {
        await writeToBlob(defaults);
      } catch {}
    }
    if (storeBlocked) return { ...defaults, adminPassword: FALLBACK_HASH };
    return { ...defaults };
  }

  try {
    const content = await fs.readFile(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    return { ...defaults, ...parsed, colors: { ...defaults.colors, ...parsed.colors }, contact: { ...defaults.contact, ...parsed.contact } };
  } catch {
    const onVercel = !!process.env.VERCEL;
    if (onVercel) return { ...defaults, adminPassword: FALLBACK_HASH };
    return defaults;
  }
}

export async function saveData(data: SiteData): Promise<void> {
  data._updatedAt = Date.now();

  if (useSupabase()) {
    await writeToSupabase(data);
    return;
  }

  if (storeBlocked) {
    cachedData = data;
    return;
  }
  if (useBlob()) {
    await writeToBlob(data);
    return;
  }

  try {
    const dir = path.dirname(DATA_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    cachedData = data;
  }
}
