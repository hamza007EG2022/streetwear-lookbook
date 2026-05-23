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
  discountPrice?: string;
  description: string;
  category: string;
  sizes: string[];
  stockPerSize?: Record<string, number>;
  material?: string;
  stock?: 'in_stock' | 'low_stock' | 'out_of_stock';
  badge?: 'none' | 'new_arrival' | 'best_seller' | 'limited_edition' | 'sale';
  visible?: boolean;
  gender?: 'unisex' | 'men' | 'women';
  priority?: number;
  colorVariants?: { label: string; color: string; photos: string[] }[];
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
  productId?: string;
  name?: string;
  price?: string;
  discountPrice?: string;
  photo?: string;
  color?: string;
  colorLabel?: string;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  productName?: string;
  productPrice?: string;
  items: OrderItem[];
  totalPrice?: number;
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  governorate?: string;
  deliveryNote?: string;
  paymentMethod?: 'instapay' | 'telda' | 'fawry' | 'cod';
  paymentStatus?: 'pending' | 'verified';
  screenshot?: string;
  transactionId?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'auto_verified';
  verificationNote?: string;
  verificationAttempts?: number;
  fawryReferenceCode?: string;
  status?: string;
  internalNotes?: string;
  trackingNumber?: string;
  shippedAt?: number;
  deliveredAt?: number;
  createdAt: number;
}

export interface Collection {
  id: string;
  title: string;
  photo: string;
  category: string;
  subtitle?: string;
}

export interface Review {
  id: string;
  photo: string;
  name: string;
  quote: string;
  rating: number;
  type: 'photo' | 'video';
}

export interface NewsletterEntry {
  email: string;
  subscribedAt: number;
}

export interface StaticPage {
  title: string;
  body: string;
}

export interface MarqueeConfig {
  enabled: boolean;
  text: string;
  bgColor: string;
  textColor: string;
  speed: number;
  textSize: string;
  fontFamily: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  phase: string;
  status: "planned" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  order: number;
}

export interface CustomerAddress {
  id: string;
  label: string;
  address: string;
  governorate: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  addresses: CustomerAddress[];
  wishlist: string[];
  loyaltyPoints: number;
  createdAt: number;
  resetCode?: string;
  resetCodeExpiry?: number;
  failedPaymentAttempts?: number;
  lockedUntil?: number;
  blacklisted?: boolean;
  viewedProducts?: { productId: string; count: number }[];
  browsedCategories?: { category: string; count: number }[];
  lifetimeSpend?: number;
  orderCount?: number;
  lastActiveAt?: number;
  referredBy?: string;
  birthdayMonth?: number;
  firstOrderDone?: boolean;
}

export interface TransactionRecord {
  id: string;
  transactionId: string;
  orderId: string;
  amount: number;
  method: 'instapay' | 'telda' | 'fawry' | 'cod';
  status: 'verified' | 'rejected' | 'pending';
  checkedAt?: number;
  customerPhone: string;
  customerId?: string;
}

export interface FlaggedAccount {
  id: string;
  phone: string;
  customerId?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: number;
  blocked: boolean;
  unblockedAt?: number;
  reviewedBy?: string;
}

export interface FraudEvent {
  id: string;
  type: 'duplicate_transaction' | 'failed_verification' | 'too_many_unconfirmed' | 'tampered_screenshot' | 'account_blocked' | 'account_unblocked';
  phone: string;
  customerId?: string;
  orderId?: string;
  details: string;
  createdAt: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed' | 'free_delivery';
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: number;
  assignedTo: string[];
  active: boolean;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  active: boolean;
  order: number;
  bgPosition: string;
}

export const MARQUEE_FONTS = [
  { label: 'Audiowide', value: 'Audiowide' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Anton', value: 'Anton' },
  { label: 'Rajdhani', value: 'Rajdhani' },
  { label: 'Orbitron', value: 'Orbitron' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Exo 2', value: 'Exo 2' },
  { label: 'Kanit', value: 'Kanit' },
  { label: 'Prompt', value: 'Prompt' },
];

export interface SiteData {
  _updatedAt?: number;
  brand: { name: string; logo: string; tagline: string };
  colors: SiteColors;
  hero: { title: string; subtitle: string; backgroundImage: string };
  products: Product[];
  lookbook: LookbookItem[];
  collections: Collection[];
  reviews: Review[];
  pages: {
    sizing: StaticPage;
    refund: StaticPage;
    care: StaticPage;
    shipping: StaticPage;
  };
  marquee: MarqueeConfig;
  about: { title: string; text: string; images: string[] };
  contact: { email: string; instagram: string; tiktok: string; youtube: string; whatsapp: string; phone: string; additional: string; instapay: string; telda: string; fawry: string; codEnabled: boolean; deliveryFee: number; freeDeliveryMinimum: number; whatsappApiKey: string; whatsappProvider: string; whatsappPhoneNumberId: string };
  tasks: Task[];
  banners: Banner[];
  chats: Chat[];
  orders: Order[];
  customers: Customer[];
  coupons: Coupon[];
  transactions: TransactionRecord[];
  flaggedAccounts: FlaggedAccount[];
  fraudEvents: FraudEvent[];
  newsletter: NewsletterEntry[];
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
  collections: [],
  reviews: [],
  pages: {
    sizing: { title: "Sizing Chart", body: "<h3>Tops</h3><table><thead><tr><th>Size</th><th>Chest (cm)</th><th>Chest (in)</th><th>Length (cm)</th><th>Length (in)</th></tr></thead><tbody><tr><td>XS</td><td>86</td><td>34</td><td>66</td><td>26</td></tr><tr><td>S</td><td>91</td><td>36</td><td>69</td><td>27</td></tr><tr><td>M</td><td>96</td><td>38</td><td>71</td><td>28</td></tr><tr><td>L</td><td>102</td><td>40</td><td>74</td><td>29</td></tr><tr><td>XL</td><td>107</td><td>42</td><td>76</td><td>30</td></tr><tr><td>XXL</td><td>112</td><td>44</td><td>79</td><td>31</td></tr></tbody></table><h3>Bottoms</h3><table><thead><tr><th>Size</th><th>Waist (cm)</th><th>Waist (in)</th><th>Inseam (cm)</th><th>Inseam (in)</th></tr></thead><tbody><tr><td>XS</td><td>71</td><td>28</td><td>76</td><td>30</td></tr><tr><td>S</td><td>76</td><td>30</td><td>79</td><td>31</td></tr><tr><td>M</td><td>81</td><td>32</td><td>81</td><td>32</td></tr><tr><td>L</td><td>86</td><td>34</td><td>84</td><td>33</td></tr><tr><td>XL</td><td>91</td><td>36</td><td>86</td><td>34</td></tr><tr><td>XXL</td><td>97</td><td>38</td><td>89</td><td>35</td></tr></tbody></table>" },
    refund: { title: "Refund & Exchange", body: "<p>We want you to love your purchase. If something isn't right, here's how we can help.</p><h3>Exchange Policy</h3><p>You can exchange any unworn item within 14 days of delivery. Items must be in original condition with tags attached.</p><h3>Return Policy</h3><p>We accept returns on full-price items within 7 days of delivery. Return shipping is the customer's responsibility. Refunds are processed within 5–7 business days after we receive the item.</p><h3>How to Start a Return</h3><p>Contact us via WhatsApp or email with your order number and the item you'd like to return. We'll guide you through the process.</p><h3>Contact for Returns</h3><p>WhatsApp: [your number]<br/>Email: [your email]</p>" },
    care: { title: "Care Guide", body: "<p>Keep your streetwear looking fresh with these care tips.</p><h3>Washing</h3><p>Turn garments inside out before washing. Use cold water (max 30°C) to preserve colors and prevent shrinkage. Avoid fabric softeners — they break down fibers over time.</p><h3>Drying</h3><p>Air dry only. Do not tumble dry — high heat damages prints and elastic. Hang or lay flat away from direct sunlight.</p><h3>Ironing</h3><p>Iron on low heat inside out. Never iron directly over prints or embroidery — use a pressing cloth.</p><h3>General Tips</h3><p>Wash dark colors separately for the first few washes. Do not bleach or dry clean. Store folded rather than hung to maintain shape for knits and heavy cottons.</p>" },
    shipping: { title: "Shipping & Delivery", body: "<p>We ship across Egypt with fast and reliable delivery.</p><h3>Delivery Timeframes</h3><p><strong>Cairo & Alexandria:</strong> 1–3 business days<br/><strong>Other cities:</strong> 3–7 business days<br/><strong>Remote areas:</strong> 5–10 business days</p><h3>Shipping Rates</h3><p>Free shipping on orders over 1000 EGP. Flat rate 50 EGP for orders under 1000 EGP.</p><h3>Order Tracking</h3><p>Once your order ships, you'll receive a tracking link via WhatsApp or email.</p><h3>Coverage Areas</h3><p>We deliver to all governorates in Egypt including Cairo, Alexandria, Giza, Delta cities, Upper Egypt, and coastal cities. Contact us if you're unsure about your area.</p>" },
  },
  marquee: {
    enabled: true,
    text: 'TRIO FASHION — SS 2026 — DEFINE YOUR STYLE — NEW COLLECTION — STREET HIGH QUALITY —',
    bgColor: '#000000',
    textColor: '#ffffff',
    speed: 5,
    textSize: 'medium',
    fontFamily: 'Audiowide',
  },
  about: { title: "OUR STORY", text: "Born from the streets, crafted for the bold.", images: [] },
  contact: { email: "hello@brand.com", instagram: "@brand", tiktok: "@brand", youtube: "@brand", whatsapp: "", phone: "", additional: "Based in New York City", instapay: "", telda: "", fawry: "", codEnabled: true, deliveryFee: 80, freeDeliveryMinimum: 2000, whatsappApiKey: "", whatsappProvider: "wa_me", whatsappPhoneNumberId: "" },
  tasks: [],
  banners: [],
  chats: [],
  orders: [],
  customers: [],
  coupons: [],
  newsletter: [],
  transactions: [],
  flaggedAccounts: [],
  fraudEvents: [],
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
