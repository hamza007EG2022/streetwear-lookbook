"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const [brand, setBrand] = useState({ name: "BRAND" });
  const [colors, setColors] = useState<any>(null);
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

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-white/10 py-16 px-6 mt-32 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <p className="text-2xl font-black tracking-[0.15em] uppercase text-white">
            {brand.name}
          </p>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/20">
            Since 2025
          </p>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/lookbook" className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30 hover:text-white transition-colors">
            Lookbook
          </Link>
          <Link href="/about" className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30 hover:text-white transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30 hover:text-white transition-colors">
            Contact
          </Link>
        </div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-white/20">
          &copy; {new Date().getFullYear()} {brand.name}
        </p>
      </div>
    </footer>
  );
}
