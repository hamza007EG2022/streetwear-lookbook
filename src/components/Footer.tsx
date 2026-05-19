"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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

  const footerBg = colors?.footer || "var(--brand-footer)";
  const footerText = colors?.text || "var(--brand-text)";

  return (
    <footer
      className="border-t py-12 px-6 mt-24"
      style={{
        backgroundColor: footerBg,
        color: footerText,
        borderColor: `${footerText}1A`,
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs tracking-widest uppercase opacity-40" style={{ color: footerText }}>
          &copy; {new Date().getFullYear()} {brand.name}
        </p>
        <p className="text-xs tracking-widest uppercase opacity-40" style={{ color: footerText }}>
          All rights reserved
        </p>
      </div>
    </footer>
  );
}
