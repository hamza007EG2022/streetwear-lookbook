import fs from 'fs/promises';
import path from 'path';
import { put, del, list } from '@vercel/blob';

const DATA_PATH = path.join(process.cwd(), 'data', 'store.json');
const BLOB_KEY = 'store.json';

export interface Product {
  id: string;
  name: string;
  photos: string[];
  price: string;
  description: string;
  category: string;
  sizes: string[];
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

export interface SiteData {
  brand: { name: string; logo: string; tagline: string };
  colors: SiteColors;
  hero: { title: string; subtitle: string; backgroundImage: string };
  products: Product[];
  lookbook: LookbookItem[];
  about: { title: string; text: string; images: string[] };
  contact: { email: string; instagram: string; additional: string };
  chats: Chat[];
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
  brand: { name: "TRIO-Fashion Streetwear", logo: "/placeholder-logo.svg", tagline: "Urban Luxury Streetwear" },
  colors: { ...DEFAULT_COLORS },
  hero: { title: "NEW COLLECTION", subtitle: "SS 2026", backgroundImage: "/placeholder-hero.jpg" },
  products: [],
  lookbook: [],
  about: { title: "OUR STORY", text: "Born from the streets, crafted for the bold.", images: [] },
  contact: { email: "hello@brand.com", instagram: "@brand", additional: "Based in New York City" },
  chats: [],
  encryptionKey: "",
  adminPassword: "",
  adminToken: "",
};

function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function readFromBlob(): Promise<SiteData | null> {
  try {
    const { blobs } = await list();
    const blob = blobs.find((b) => b.pathname === BLOB_KEY);
    if (!blob) return null;
    const res = await fetch(blob.url);
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeToBlob(data: SiteData): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await put(BLOB_KEY, json, { contentType: 'application/json', access: 'private' });
}

export async function getData(): Promise<SiteData> {
  if (useBlob()) {
    const parsed = await readFromBlob();
    if (parsed) {
      return { ...defaults, ...parsed, colors: { ...defaults.colors, ...parsed.colors } };
    }
    await writeToBlob(defaults);
    return defaults;
  }

  try {
    const content = await fs.readFile(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    return { ...defaults, ...parsed, colors: { ...defaults.colors, ...parsed.colors } };
  } catch {
    return defaults;
  }
}

export async function saveData(data: SiteData): Promise<void> {
  if (useBlob()) {
    await writeToBlob(data);
    return;
  }

  const dir = path.dirname(DATA_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
