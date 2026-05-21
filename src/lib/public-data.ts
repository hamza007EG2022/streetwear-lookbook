export interface PublicSiteData {
  _updatedAt?: number;
  brand: { name: string; logo: string; tagline: string };
  colors: {
    primary: string; secondary: string; background: string; text: string;
    button: string; accent: string; navbar: string; footer: string;
  };
  hero: { title: string; subtitle: string; backgroundImage: string };
  products: any[];
  lookbook: any[];
  collections: any[];
  reviews: any[];
  pages: any;
  marquee: any;
  about: { title: string; text: string; images: string[] };
  contact: { email: string; instagram: string; tiktok: string; youtube: string; whatsapp: string; phone: string; additional: string };
  tasks: any[];
  banners: any[];
}

export function stripSensitiveData(data: any): PublicSiteData {
  const { adminPassword, adminToken, chats, orders, encryptionKey, newsletter, ...rest } = data;
  return rest as PublicSiteData;
}
