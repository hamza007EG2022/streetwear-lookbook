import fs from 'fs/promises';
import path from 'path';
import { put, head } from '@vercel/blob';

const DATA_PATH = path.join(process.cwd(), 'data', 'store.json');
const BLOB_KEY = 'store.json';

let cachedStoreUrl: string | null = null;
let cachedData: SiteData | null = null;

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
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

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
  if (!url) return null;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${url}?t=${Date.now()}`);
      if (!res.ok) {
        if (i < 2) { await new Promise(r => setTimeout(r, 1000)); continue; }
        return null;
      }
      const text = await res.text();
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

export async function getData(): Promise<SiteData> {
  if (useBlob()) {
    const parsed = await readFromBlob();
    if (parsed) {
      return { ...defaults, ...parsed, colors: { ...defaults.colors, ...parsed.colors }, contact: { ...defaults.contact, ...parsed.contact } };
    }
    // Only write defaults if blob genuinely doesn't exist
    const blobUrl = await getBlobUrl();
    if (!blobUrl) {
      // double-check: head() might have transiently failed
      let reallyMissing = true;
      for (let i = 0; i < 3; i++) {
        try {
          const info = await head(BLOB_KEY);
          if (info?.url) { reallyMissing = false; break; }
        } catch { /* retry */ }
        await new Promise(r => setTimeout(r, 1000));
      }
      if (!reallyMissing) return { ...defaults };
      try {
        await writeToBlob(defaults);
      } catch {
        // first write might fail
      }
    }
    return { ...defaults };
  }

  try {
    const content = await fs.readFile(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    return { ...defaults, ...parsed, colors: { ...defaults.colors, ...parsed.colors }, contact: { ...defaults.contact, ...parsed.contact } };
  } catch {
    return defaults;
  }
}

export async function saveData(data: SiteData): Promise<void> {
  data._updatedAt = Date.now();
  if (useBlob()) {
    await writeToBlob(data);
    return;
  }

  const dir = path.dirname(DATA_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
