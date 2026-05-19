import { head, list } from '@vercel/blob';
process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_TH8mtgd77eYf2Y5r_gjSYYKkjfa0QllaLns7rgAttogZH4u';

async function main() {
  try {
    const info = await head('store.json');
    console.log('Found:', JSON.stringify(info));
  } catch(e) {
    console.error('Head error:', e.message);
  }
  try {
    const result = await list();
    console.log('Store blobs:', result.blobs.length);
    result.blobs.forEach(b => console.log(' -', b.pathname, b.size, b.url));
  } catch(e) {
    console.error('List error:', e.message);
  }
}
main();
