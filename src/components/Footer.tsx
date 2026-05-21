"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { usePublicData } from "./DataContext";

export default function Footer() {
  const ctx = usePublicData();
  const [brand, setBrand] = useState(ctx?.brand || { name: "" });
  const [contact, setContact] = useState(ctx?.contact || { email: "", instagram: "", tiktok: "", whatsapp: "", phone: "" });
  const [colors, setColors] = useState<any>(ctx?.colors || null);
  const pathname = usePathname();

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (ctx) {
      setBrand(ctx.brand);
      setContact(ctx.contact);
      setColors(ctx.colors);
    }
  }, [ctx]);

  if (pathname.startsWith("/admin")) return null;

  const footerBg = colors?.footer || "var(--brand-footer)";
  const footerText = colors?.text || "var(--brand-text)";

  return (
    <footer
      className="border-t mt-16"
      style={{
        backgroundColor: footerBg,
        color: footerText,
        borderColor: `${footerText}1A`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="text-lg font-bold tracking-[0.15em] uppercase" style={{ color: footerText }}>
              {brand.name || "TRIO"}
            </Link>
            <p className="text-xs tracking-widest uppercase mt-3" style={{ color: footerText, opacity: 0.3 }}>
              Urban Streetwear
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[10px] tracking-[0.3em] uppercase font-bold mb-1" style={{ color: footerText, opacity: 0.4 }}>Navigation</p>
            <Link href="/lookbook" className="text-sm transition-colors hover:opacity-60" style={{ color: footerText, opacity: 0.5 }}>Lookbook</Link>
            <Link href="/roadmap" className="text-sm transition-colors hover:opacity-60" style={{ color: footerText, opacity: 0.5 }}>Roadmap</Link>
            <Link href="/about" className="text-sm transition-colors hover:opacity-60" style={{ color: footerText, opacity: 0.5 }}>About</Link>
            <Link href="/contact" className="text-sm transition-colors hover:opacity-60" style={{ color: footerText, opacity: 0.5 }}>Contact</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[10px] tracking-[0.3em] uppercase font-bold mb-1" style={{ color: footerText, opacity: 0.4 }}>Get Help</p>
            <Link href="/sizing" className="text-sm transition-colors hover:opacity-60" style={{ color: footerText, opacity: 0.5 }}>Sizing Chart</Link>
            <Link href="/refund" className="text-sm transition-colors hover:opacity-60" style={{ color: footerText, opacity: 0.5 }}>Refund &amp; Exchange</Link>
            <Link href="/care" className="text-sm transition-colors hover:opacity-60" style={{ color: footerText, opacity: 0.5 }}>Care Guide</Link>
            <Link href="/shipping" className="text-sm transition-colors hover:opacity-60" style={{ color: footerText, opacity: 0.5 }}>Shipping &amp; Delivery</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[10px] tracking-[0.3em] uppercase font-bold mb-1" style={{ color: footerText, opacity: 0.4 }}>Connect</p>
            {contact.email && (
              <a href={`mailto:${contact.email}`}
                className="text-sm transition-colors hover:opacity-60 flex items-center gap-2" style={{ color: footerText, opacity: 0.5 }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                {contact.email}
              </a>
            )}
          </div>
        </div>

        <div className="border-t mt-12 pt-10" style={{ borderColor: `${footerText}1A` }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full md:w-auto">
              <h3 className="text-sm tracking-[0.2em] uppercase font-bold mb-1">Exclusive Benefits</h3>
              <p className="text-xs tracking-wider" style={{ color: footerText, opacity: 0.4 }}>Subscribe for early access & exclusive deals</p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) return;
              setNewsletterStatus("loading");
              try {
                const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newsletterEmail }) });
                if (res.ok) { setNewsletterStatus("success"); setNewsletterEmail(""); }
                else setNewsletterStatus("error");
              } catch { setNewsletterStatus("error"); }
            }} className="flex gap-2 w-full md:w-auto">
              <input type="email" placeholder="Enter email here" value={newsletterEmail}
                onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterStatus("idle"); }}
                style={{ borderColor: `${footerText}33`, color: footerText }}
                className="flex-1 md:w-64 bg-transparent border px-4 py-2.5 text-sm outline-none focus:border-opacity-100 transition-colors placeholder:text-inherit placeholder:opacity-30" />
              <button type="submit" disabled={newsletterStatus === "loading"}
                style={{ backgroundColor: footerText, color: footerBg }}
                className="px-6 py-2.5 text-xs tracking-[0.2em] uppercase font-bold transition-all hover:scale-105 disabled:opacity-50 flex-shrink-0">
                {newsletterStatus === "loading" ? "..." : "Subscribe"}
              </button>
            </form>
            {newsletterStatus === "success" && <p className="text-xs" style={{ color: footerText, opacity: 0.5 }}>Thanks for subscribing!</p>}
            {newsletterStatus === "error" && <p className="text-xs text-red-400">Something went wrong.</p>}
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: `${footerText}1A` }}>
          <p className="text-[10px] tracking-widest uppercase" style={{ color: footerText, opacity: 0.3 }}>
            &copy; {new Date().getFullYear()} {brand.name || "TRIO"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
