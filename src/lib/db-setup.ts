import { getSupabase } from "./supabase";

export async function ensureTables(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await (supabase.rpc as any)("exec_sql", {
      sql: `CREATE TABLE IF NOT EXISTS site_data (
        id TEXT PRIMARY KEY DEFAULT 'default',
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
      );
      ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN CREATE POLICY "anon_all" ON site_data FOR ALL USING (true) WITH CHECK (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
    });
  } catch {
    const tbl = supabase.from("site_data") as any;
    await tbl.select("id").limit(1).maybeSingle();
  }
}
