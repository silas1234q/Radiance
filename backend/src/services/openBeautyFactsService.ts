import { Product } from '../../generated/prisma/client';
import prisma from '../config/db.config';

const OBF_BASE_URL = 'https://world.openbeautyfacts.org';
const OFF_BASE_URL = 'https://world.openfoodfacts.org';

const CATEGORY_MAP: Record<string, string[]> = {
  Cleanser: ['face wash', 'cleanser', 'cleansing'],
  Toner: ['toner', 'toning'],
  Serum: ['serum', 'essence'],
  Moisturizer: ['moisturizer', 'moisturiser', 'face cream', 'day cream', 'night cream'],
  Sunscreen: ['sunscreen', 'sun protection', 'spf'],
  'Eye Cream': ['eye cream', 'eye care'],
  Exfoliant: ['exfoliant', 'peeling', 'scrub'],
  Mask: ['face mask', 'mask'],
  Oil: ['face oil', 'facial oil'],
};

// Simple in-memory rate limiter
const rateLimiter = {
  search: { count: 0, resetAt: 0 },
  product: { count: 0, resetAt: 0 },
};

function checkRateLimit(type: 'search' | 'product'): boolean {
  const now = Date.now();
  const limit = type === 'search' ? 10 : 15;
  if (now > rateLimiter[type].resetAt) {
    rateLimiter[type] = { count: 0, resetAt: now + 60_000 };
  }
  if (rateLimiter[type].count >= limit) return false;
  rateLimiter[type].count++;
  return true;
}

function mapOBFCategory(categories: string): string {
  const lower = categories.toLowerCase();
  for (const [appCat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) return appCat;
  }
  return 'Other';
}

interface OBFProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  ingredients_text?: string;
}

async function fetchBarcodeFromAPI(baseUrl: string, barcode: string): Promise<OBFProduct | null> {
  const url = `${baseUrl}/api/v0/product/${barcode}.json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.product?.product_name) return null;
  return data.product;
}

async function fetchSearchFromAPI(baseUrl: string, query: string, limit: number): Promise<OBFProduct[]> {
  const url = `${baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.products || []).filter((p: OBFProduct) => p.product_name && p.ingredients_text);
}

export async function searchProducts(query: string, limit = 10): Promise<Product[]> {
  // Query ALL local products (seeded + cached), including brand field
  const cached = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
  });

  if (cached.length >= limit) return cached;

  if (!checkRateLimit('search')) {
    console.warn('[OBF] Rate limit reached for search, returning cached results');
    return cached;
  }

  try {
    // Query OBF and OFF in parallel
    const [obfResult, offResult] = await Promise.allSettled([
      fetchSearchFromAPI(OBF_BASE_URL, query, limit),
      fetchSearchFromAPI(OFF_BASE_URL, query, limit),
    ]);

    const obfProducts = obfResult.status === 'fulfilled' ? obfResult.value : [];
    const offProducts = offResult.status === 'fulfilled' ? offResult.value : [];

    // Merge: OBF first, then OFF, deduplicate by barcode/name
    const seen = new Set<string>();
    const merged: Array<OBFProduct & { _source: string; _baseUrl: string }> = [];
    for (const [products, source, baseUrl] of [
      [obfProducts, 'open_beauty_facts', OBF_BASE_URL],
      [offProducts, 'open_food_facts', OFF_BASE_URL],
    ] as const) {
      for (const p of products) {
        const key = p.code || p.product_name!;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({ ...p, _source: source, _baseUrl: baseUrl });
        }
      }
    }

    // Parallel upserts
    const results = await Promise.all(
      merged.slice(0, limit).map(p => {
        const ingredients = (p.ingredients_text || '')
          .split(',')
          .map((i: string) => i.trim())
          .filter(Boolean);

        return prisma.product.upsert({
          where: { barcode: p.code || `obf-${Date.now()}-${Math.random()}` },
          update: {
            name: p.product_name!,
            brand: p.brands || 'Unknown',
            category: mapOBFCategory(p.categories || ''),
            imageUrl: p.image_url || null,
            ingredients,
            sourceUrl: p.code ? `${p._baseUrl}/product/${p.code}` : null,
          },
          create: {
            name: p.product_name!,
            brand: p.brands || 'Unknown',
            category: mapOBFCategory(p.categories || ''),
            imageUrl: p.image_url || null,
            ingredients,
            barcode: p.code || null,
            sourceUrl: p.code ? `${p._baseUrl}/product/${p.code}` : null,
            source: p._source,
          },
        });
      })
    );

    // Merge: DB results first (more relevant), then API results, deduplicating by ID
    const seenIds = new Set(cached.map(p => p.id));
    const combined = [...cached];
    for (const p of results) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        combined.push(p);
      }
    }

    return combined.length > 0 ? combined.slice(0, limit) : fallbackProducts(query, limit);
  } catch (err) {
    console.error('[OBF/OFF] Search failed:', err);
    return cached.length > 0 ? cached : fallbackProducts(query, limit);
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const cached = await prisma.product.findUnique({ where: { barcode } });
  if (cached) return cached;

  if (!checkRateLimit('product')) {
    console.warn('[OBF] Rate limit reached for product lookup');
    return null;
  }

  try {
    // Query OBF and OFF in parallel, prefer OBF
    const [obfResult, offResult] = await Promise.allSettled([
      fetchBarcodeFromAPI(OBF_BASE_URL, barcode),
      fetchBarcodeFromAPI(OFF_BASE_URL, barcode),
    ]);

    const obfProduct = obfResult.status === 'fulfilled' ? obfResult.value : null;
    const offProduct = offResult.status === 'fulfilled' ? offResult.value : null;

    const p = obfProduct || offProduct;
    if (!p) return null;

    const source = obfProduct ? 'open_beauty_facts' : 'open_food_facts';
    const baseUrl = obfProduct ? OBF_BASE_URL : OFF_BASE_URL;

    const ingredients = (p.ingredients_text || '')
      .split(',')
      .map((i: string) => i.trim())
      .filter(Boolean);

    return prisma.product.create({
      data: {
        name: p.product_name!,
        brand: p.brands || 'Unknown',
        category: mapOBFCategory(p.categories || ''),
        imageUrl: p.image_url || null,
        ingredients,
        barcode,
        sourceUrl: `${baseUrl}/product/${barcode}`,
        source,
      },
    });
  } catch (err) {
    console.error('[OBF/OFF] Barcode lookup failed:', err);
    return null;
  }
}

async function fallbackProducts(query: string, limit: number) {
  return prisma.product.findMany({
    where: {
      source: 'seeded',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
  });
}
