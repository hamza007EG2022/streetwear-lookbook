import { getSupabase } from './src/lib/supabase';

async function main() {
  const sb = getSupabase();
  if (!sb) { console.log('No Supabase'); return; }
  const { data, error } = await (sb.from('site_data') as any).select('data').eq('id', 'default').maybeSingle();
  if (error) { console.log('Error:', error.message); return; }
  if (!data) { console.log('No data'); return; }
  const d = data.data;
  console.log('Has adminPassword:', !!d.adminPassword);
  console.log('Has brand:', !!d.brand);
  console.log('Has products:', d.products?.length || 0);
  console.log('Keys:', Object.keys(d).join(', '));
}
main();
