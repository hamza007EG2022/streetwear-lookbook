"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePublicData } from "./DataContext";

export default function Nav() {
  const ctx = usePublicData();
  const [brand, setBrand] = useState(ctx?.brand || { name: "", logo: "", tagline: "" });
  const [colors, setColors] = useState<any>(ctx?.colors || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (ctx) {
      setBrand(ctx.brand);
      setColors(ctx.colors);
    }
  }, [ctx]);

  if (pathname.startsWith("/admin")) return null;

  const navBg = colors?.navbar || "var(--brand-navbar)";
  const navText = colors?.text || "var(--brand-text)";

  const links = [
    { href: "/", label: "Home" },
    { href: "/lookbook", label: "Lookbook" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-black/10 shadow-sm"
      style={{ backgroundColor: navBg, color: navText }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-[0.2em] uppercase" style={{ color: navText }}>
          {brand.name || "TRIO"}
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm tracking-widest uppercase transition-opacity hover:opacity-60 ${
                pathname === l.href ? "opacity-100" : "opacity-50"
              }`}
              style={{ color: navText }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          className="md:hidden flex flex-col gap-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className="block w-6 h-px" style={{ backgroundColor: navText }} />
          <span className="block w-6 h-px" style={{ backgroundColor: navText }} />
          <span className="block w-6 h-px" style={{ backgroundColor: navText }} />
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t border-black/5" style={{ backgroundColor: navBg }}>
          <div className="px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm tracking-widest uppercase"
                style={{ color: navText }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
