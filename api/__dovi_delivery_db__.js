import fs from 'fs';
import path from 'path';

let inMemoryStore = null;

function getStorePath() {
  const possiblePaths = [
    path.join(process.cwd(), 'backend', 'delivery_store.json'),
    path.join(process.cwd(), 'frontend', 'public', 'delivery_store.json'),
    path.join(process.cwd(), 'delivery_store.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return possiblePaths[0];
}

function readStore() {
  if (inMemoryStore) return inMemoryStore;
  try {
    const p = getStorePath();
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      inMemoryStore = data;
      return data;
    }
  } catch {}
  return {
    routes: [],
    rate_history: [],
    product_delivery_attributes: {},
    order_shipments: {},
  };
}

function saveStore(store) {
  inMemoryStore = store;
  try {
    const p = getStorePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf8');
  } catch {}
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const store = readStore();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(store);
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const current = readStore();
      const updated = {
        ...current,
        ...body,
      };
      saveStore(updated);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
