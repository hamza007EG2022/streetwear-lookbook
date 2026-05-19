"use client";

import { createContext, useContext, ReactNode } from "react";
import type { PublicSiteData } from "@/lib/public-data";

const DataContext = createContext<PublicSiteData | null>(null);

export function DataProvider({ data, children }: { data: PublicSiteData; children: ReactNode }) {
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function usePublicData() {
  return useContext(DataContext);
}
