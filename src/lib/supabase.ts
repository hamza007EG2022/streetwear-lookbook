import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!client && url && key) {
    client = createClient(url, key);
  }
  return client;
}

export function useSupabase(): boolean {
  return !!url && !!key;
}
