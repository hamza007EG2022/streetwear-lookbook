"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePublicData } from "./DataContext";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function Nav() {
  const ctx = usePublicData();
  const [brand, setBrand] = useState(ctx?.brand || { name: "", logo: "", tagline: "" });
  const [colors, setColors] = useState<any>(ctx?.colors || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ctx) {
      setBrand(ctx.brand);
      setColors(ctx.colors);
    }
  }, [ctx]);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) { setSearchQuery(""); return; }
    inputRef.current?.focus();
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    setTimeout(() => document.addEventListener("mousedown", handle), 0);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  if (pathname.startsWith("/admin")) return null;

  const navBg = colors?.navbar || "var(--brand-navbar)";
  const navText = colors?.text || "var(--brand-text)";

  const links = [
    { href: "/", label: "Home" },
    { href: "/?category=ss26", label: "SS26" },
    { href: "/collections", label: "Collections" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const products = ctx?.products || [];
  const searchResults = searchQuery.trim()
    ? products.filter((p: any) => {
        const q = searchQuery.toLowerCase();
        return (p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
      }).slice(0, 8)
    : [];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-black/10 shadow-sm"
      style={{ backgroundColor: navBg, color: navText }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          className="flex flex-col gap-1 p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className="block w-5 h-px" style={{ backgroundColor: navText }} />
          <span className="block w-5 h-px" style={{ backgroundColor: navText }} />
          <span className="block w-5 h-px" style={{ backgroundColor: navText }} />
        </button>

        <Link href="/" className="text-xl font-bold tracking-[0.2em] uppercase absolute left-1/2 -translate-x-1/2" style={{ color: navText }}>
          {brand.name || "TRIO"}
        </Link>

        <button onClick={() => setSearchOpen(true)} aria-label="Search"
          className="transition-opacity hover:opacity-60">
          <SearchIcon />
        </button>
      </div>

      {/* Dropdown menu - below navbar */}
      {menuOpen && (
        <div ref={menuRef} className="border-t border-black/5 shadow-md" style={{ backgroundColor: navBg }}>
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm tracking-widest uppercase transition-opacity hover:opacity-60 ${
                  pathname === l.href ? "opacity-100" : "opacity-50"
                }`}
                style={{ color: navText }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="border-t border-black/5" style={{ backgroundColor: navBg }} ref={searchRef}>
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/40 transition-colors font-serif tracking-wider"
                style={{ color: "#111" }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-40 hover:opacity-100"
                  style={{ color: "#111" }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {searchResults.length > 0 && (
            <div className="max-w-3xl mx-auto px-6 pb-4">
              <div className="border border-black/5 bg-white divide-y divide-black/5 max-h-96 overflow-y-auto">
                {searchResults.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors"
                    style={{ color: "#111" }}
                  >
                    <div className="w-12 h-16 bg-zinc-100 flex-shrink-0 overflow-hidden">
                      <img src={p.photos?.[0] || ""} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs opacity-50 mt-0.5">{p.category || ""}</p>
                    </div>
                    <p className="text-sm font-medium flex-shrink-0">
                      {p.discountPrice || p.price}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {searchQuery.trim() && searchResults.length === 0 && (
            <div className="max-w-3xl mx-auto px-6 pb-4">
              <p className="text-xs opacity-30 italic px-4 py-3 bg-white border border-black/5">No products found.</p>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
