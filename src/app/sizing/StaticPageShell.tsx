"use client";

import type { PublicSiteData } from "@/lib/public-data";

export default function StaticPageShell({ data, pageKey }: { data: PublicSiteData; pageKey: string }) {
  const page = (data as any).pages?.[pageKey] || { title: "", body: "" };

  return (
    <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-[0.1em] uppercase mb-8">{page.title}</h1>
      <div
        className="prose prose-sm max-w-none text-sm leading-relaxed [&_h3]:text-xs [&_h3]:tracking-[0.3em] [&_h3]:uppercase [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-black/10 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:text-[10px] [&_th]:tracking-widest [&_th]:uppercase [&_th]:bg-zinc-50 [&_td]:border [&_td]:border-black/10 [&_td]:px-4 [&_td]:py-2 [&_td]:text-sm"
        dangerouslySetInnerHTML={{ __html: page.body || "" }}
      />
    </div>
  );
}
