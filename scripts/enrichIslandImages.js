const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Island = require('../src/models/Island');

const PEXELS_KEY = process.env.PEXELS_API_KEY;

// Curated verified fallback pool — only real Indian island / Andaman / Lakshadweep
// photos from Pexels (stable CDN URLs). Used ONLY when Pexels search returns nothing.
const curatedFallback = [
  'https://images.pexels.com/photos/2549018/pexels-photo-2549018.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1802183/pexels-photo-1802183.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/635279/pexels-photo-635279.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

async function pexelsSearch(query) {
  if (!PEXELS_KEY) return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
    if (!res.ok) {
      console.warn(`   Pexels ${res.status} for "${query}"`);
      return null;
    }
    const data = await res.json();
    if (!data.photos || data.photos.length === 0) return null;
    // prefer the first photo's large2x, fall back to large
    const p = data.photos[0];
    return p.src.large2x || p.src.large || p.src.original;
  } catch (err) {
    console.warn(`   Pexels error for "${query}":`, err.message);
    return null;
  }
}

async function findImageForIsland(island) {
  const group = island.location?.group || '';
  const isIndianGroup = ['Andaman', 'Nicobar', 'Lakshadweep'].includes(group);

  // Query ladder — most specific first. Stop as soon as one returns a hit.
  const queries = [];
  if (isIndianGroup) {
    queries.push(`${island.name} ${group}`);
    queries.push(`${island.name} island India`);
  } else {
    queries.push(`${island.name} island ${group}`);
    queries.push(`${island.name} India`);
  }
  // Group-level fallback — still India-specific, no generic "tropical".
  queries.push(`${group} India beach`);

  for (const q of queries) {
    const hit = await pexelsSearch(q);
    if (hit) return { url: hit, query: q };
    await new Promise(r => setTimeout(r, 250)); // polite pacing between sub-queries
  }
  return null;
}

async function enrichImages() {
  if (!PEXELS_KEY) {
    console.error('❌ PEXELS_API_KEY missing in .env — aborting.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected.\n');

  const islands = await Island.find({});
  console.log(`Found ${islands.length} islands.\n`);

  let pexelsHits = 0;
  let fallbackUsed = 0;

  for (let i = 0; i < islands.length; i++) {
    const island = islands[i];
    process.stdout.write(`[${i + 1}/${islands.length}] ${island.name} ... `);

    const found = await findImageForIsland(island);

    let url, caption;
    if (found) {
      url = found.url;
      caption = `${island.name} — via Pexels (${found.query})`;
      pexelsHits++;
      console.log(`✅ ${found.query}`);
    } else {
      url = curatedFallback[i % curatedFallback.length];
      caption = `${island.name} — curated Indian island photo`;
      fallbackUsed++;
      console.log('🌊 fallback');
    }

    if (!island.images || island.images.length === 0) {
      island.images = [{ url, caption }];
    } else {
      island.images[0] = { url, caption };
    }
    await island.save();

    // Pexels free tier: 200 req/hr. Pace at ~500ms between islands.
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Done. Pexels hits: ${pexelsHits}, curated fallback: ${fallbackUsed}`);
  await mongoose.connection.close();
  process.exit(0);
}

enrichImages().catch(err => {
  console.error('Enrichment failed:', err);
  process.exit(1);
});
