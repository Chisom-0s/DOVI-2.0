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
    } catch { }
    return {
      routes: [],
      rateHistory: [],
      productAttributes: {},
      orderShipments: {},
      manualQuoteOrders: {},
      categories: null,
      productCategoryAssignments: {},
      homepagePlacements: {},
      save2ownGoals: [],
      save2ownParticipants: [],
      save2ownContributions: [],
      save2ownRefunds: [],
      payments: [],
      orders: [],
    };
  };
  const writeStore = (data: unknown) => {
    try {
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch { }
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
      const s = readStore();
      const payload = {
        ...s,
        rate_history: s.rate_history || s.rateHistory || [],
        rateHistory: s.rateHistory || s.rate_history || [],
        product_delivery_attributes: s.product_delivery_attributes || s.productAttributes || {},
        productAttributes: s.productAttributes || s.product_delivery_attributes || {},
        order_shipments: s.order_shipments || s.orderShipments || {},
        orderShipments: s.orderShipments || s.order_shipments || {},
        homepagePlacements: s.homepagePlacements || {},
        homepageSections: s.homepageSections || [],
        save2ownGoals: s.save2ownGoals || [],
        save2ownParticipants: s.save2ownParticipants || [],
        save2ownContributions: s.save2ownContributions || [],
        save2ownRefunds: s.save2ownRefunds || [],
        payments: s.payments || [],
        orders: s.orders || [],
      };
      res.end(JSON.stringify(payload));
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
          const rHist = incoming.rateHistory !== undefined ? incoming.rateHistory : (incoming.rate_history !== undefined ? incoming.rate_history : current.rateHistory || []);
          const pAttrs = (incoming.productAttributes || incoming.product_delivery_attributes) !== undefined
            ? { ...(current.productAttributes || current.product_delivery_attributes || {}), ...(incoming.productAttributes || incoming.product_delivery_attributes) }
            : (current.productAttributes || current.product_delivery_attributes || {});
          const oShip = (incoming.orderShipments || incoming.order_shipments) !== undefined
            ? { ...(current.orderShipments || current.order_shipments || {}), ...(incoming.orderShipments || incoming.order_shipments) }
            : (current.orderShipments || current.order_shipments || {});

          let mergedOrders = current.orders || [];
          if (Array.isArray(incoming.orders)) {
            const ordMap = new Map();
            for (const o of mergedOrders) {
              const k = o.reference || o.reference_code || o.id;
              if (k) ordMap.set(k, o);
            }
            for (const o of incoming.orders) {
              const k = o.reference || o.reference_code || o.id;
              if (k) {
                const prev = ordMap.get(k) || {};
                ordMap.set(k, { ...prev, ...o });
              }
            }
            mergedOrders = Array.from(ordMap.values());
          }

          let mergedPayments = current.payments || [];
          if (Array.isArray(incoming.payments)) {
            const payMap = new Map();
            for (const p of mergedPayments) {
              const k = p.order_reference || p.reference || p.id;
              if (k) payMap.set(k, p);
            }
            for (const p of incoming.payments) {
              const k = p.order_reference || p.reference || p.id;
              if (k) {
                const prev = payMap.get(k) || {};
                payMap.set(k, { ...prev, ...p });
              }
            }
            mergedPayments = Array.from(payMap.values());
          }

          const merged = {
            routes: incoming.routes !== undefined ? incoming.routes : current.routes,
            rateHistory: rHist,
            rate_history: rHist,
            productAttributes: pAttrs,
            product_delivery_attributes: pAttrs,
            orderShipments: oShip,
            order_shipments: oShip,
            manualQuoteOrders: incoming.manualQuoteOrders !== undefined
              ? { ...current.manualQuoteOrders, ...incoming.manualQuoteOrders }
              : current.manualQuoteOrders,
            categories: incoming.categories !== undefined ? incoming.categories : current.categories,
            productCategoryAssignments: incoming.productCategoryAssignments !== undefined
              ? { ...current.productCategoryAssignments, ...incoming.productCategoryAssignments }
              : current.productCategoryAssignments,
            homepagePlacements: incoming.homepagePlacements !== undefined
              ? { ...(current.homepagePlacements || {}), ...incoming.homepagePlacements }
              : (current.homepagePlacements || {}),
            homepageSections: incoming.homepageSections !== undefined
              ? incoming.homepageSections
              : (current.homepageSections || []),
            save2ownGoals: incoming.save2ownGoals !== undefined ? incoming.save2ownGoals : (current.save2ownGoals || []),
            save2ownParticipants: incoming.save2ownParticipants !== undefined ? incoming.save2ownParticipants : (current.save2ownParticipants || []),
            save2ownContributions: incoming.save2ownContributions !== undefined ? incoming.save2ownContributions : (current.save2ownContributions || []),
            save2ownRefunds: incoming.save2ownRefunds !== undefined ? incoming.save2ownRefunds : (current.save2ownRefunds || []),
            payments: mergedPayments,
            orders: mergedOrders,
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
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/v1': {
        target: 'https://dovi-2-0-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://dovi-2-0-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
