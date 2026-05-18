"use client";

import { useEffect, useState } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setColors(d.colors);
        const el = document.documentElement;
        if (d.colors) {
          el.style.setProperty("--brand-primary", d.colors.primary);
          el.style.setProperty("--brand-secondary", d.colors.secondary);
          el.style.setProperty("--brand-background", d.colors.background);
          el.style.setProperty("--brand-text", d.colors.text);
          el.style.setProperty("--brand-button", d.colors.button);
          el.style.setProperty("--brand-accent", d.colors.accent);
          el.style.setProperty("--brand-navbar", d.colors.navbar);
          el.style.setProperty("--brand-footer", d.colors.footer);
        }
      })
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
