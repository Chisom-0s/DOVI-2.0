import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function doviSharedDeliveryDbPlugin() {
  const storePath = path.resolve(import.meta.dirname, '../backend/delivery_store.json');
  const readStore = () => {
    try {
      if (fs.existsSync(storePath)) {
        return JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      }
    } catch {}
    return { routes: [], rateHistory: [], productAttributes: {}, orderShipments: {}, manualQuoteOrders: {} };
  };
  const writeStore = (data: unknown) => {
    try {
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
  };
  const handler = (req: any, res: any, next: any) => {
    if (!req.url || !req.url.startsWith('/__dovi_delivery_db__')) return next();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(readStore()));
      return;
    }
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const incoming = JSON.parse(body || '{}');
          const current = readStore();
          const merged = {
            routes: incoming.routes !== undefined ? incoming.routes : current.routes,
            rateHistory: incoming.rateHistory !== undefined ? incoming.rateHistory : current.rateHistory,
            productAttributes: incoming.productAttributes !== undefined
              ? { ...current.productAttributes, ...incoming.productAttributes }
              : current.productAttributes,
            orderShipments: incoming.orderShipments !== undefined
              ? { ...current.orderShipments, ...incoming.orderShipments }
              : current.orderShipments,
            manualQuoteOrders: incoming.manualQuoteOrders !== undefined
              ? { ...current.manualQuoteOrders, ...incoming.manualQuoteOrders }
              : current.manualQuoteOrders,
          };
          writeStore(merged);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(merged));
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }
    next();
  };
  return {
    name: 'dovi-shared-delivery-db',
    configureServer(server: any) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), doviSharedDeliveryDbPlugin()],
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
      '@/api': `${import.meta.dirname}/src/api`,
      '@/components': `${import.meta.dirname}/src/components`,
      '@/contexts': `${import.meta.dirname}/src/contexts`,
      '@/hooks': `${import.meta.dirname}/src/hooks`,
      '@/pages': `${import.meta.dirname}/src/pages`,
      '@/types': `${import.meta.dirname}/src/types`,
      '@/utils': `${import.meta.dirname}/src/utils`,
    },
  },
  server: {
    port: 5174,
    open: true,
  },
});
