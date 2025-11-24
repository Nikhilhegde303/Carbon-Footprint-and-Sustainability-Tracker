// server/controllers/newsController.js
import pool from '../config/database.js'; // not used directly, but keeps pattern consistent
// Node 18+ has global fetch; your Node is 24.x, so we're good.

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache = {
  ts: 0,
  payload: null
};

export const getSustainabilityNews = async (req, res) => {
  try {
    const apiKey = process.env.GUARDIAN_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Missing GUARDIAN_API_KEY in server environment.'
      });
    }

    // Simple cache
    const now = Date.now();
    if (cache.payload && now - cache.ts < CACHE_TTL_MS) {
      return res.json({ success: true, data: cache.payload, cached: true });
    }

    // Build Guardian API URL
    const params = new URLSearchParams({
      'section': 'environment',
      'q': 'climate|sustainability|pollution|energy|wildlife|recycling|emissions',
      'show-fields': 'thumbnail,trailText,byline',
      'order-by': 'newest',
      'page-size': '18',
      'api-key': apiKey
    });

    const url = `https://content.guardianapis.com/search?${params.toString()}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Guardian API error: ${resp.status} ${text}`);
    }
    const json = await resp.json();

    // Normalize
    const results = (json?.response?.results || []).map(item => ({
      id: item.id,
      webTitle: item.webTitle,
      webUrl: item.webUrl,
      sectionName: item.sectionName,
      pillarName: item.pillarName,
      publishedAt: item.webPublicationDate,
      fields: {
        thumbnail: item.fields?.thumbnail || null,
        trailText: item.fields?.trailText || '',
        byline: item.fields?.byline || ''
      }
    }));

    cache = { ts: now, payload: results };
    return res.json({ success: true, data: results, cached: false });
  } catch (err) {
    console.error('❌ News fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
};
