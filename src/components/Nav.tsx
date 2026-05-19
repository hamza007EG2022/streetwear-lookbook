"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [brand, setBrand] = useState({ name: "BRAND", logo: "", tagline: "" });
  const [colors, setColors] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setBrand(d.brand);
        setColors(d.colors);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/10">
        <Link href="/" className="text-2xl font-black tracking-[0.15em] uppercase text-white">
          {brand.name}
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-xs font-bold tracking-[0.25em] uppercase transition-all duration-300 hover:text-white/60 ${
                pathname === l.href ? "text-white" : "text-white/40"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          className="md:hidden flex flex-col gap-1.5"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`block w-7 h-0.5 bg-white transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-7 h-0.5 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-7 h-0.5 bg-white transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10">
          <div className="px-6 py-6 flex flex-col gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-bold tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors"
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
