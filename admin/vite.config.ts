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
    } catch {}
  };
  const handler = (req: any, res: any, next: any) => {
    if (req.url && req.url.startsWith('/media/')) {
      const mediaRel = req.url.replace(/^\/media\//, '').split('?')[0];
      const mediaFile = path.resolve(import.meta.dirname, '../backend/media', mediaRel);
      if (fs.existsSync(mediaFile)) {
        const ext = path.extname(mediaFile).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.pdf': 'application/pdf',
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(fs.readFileSync(mediaFile));
        return;
      }
    }

    // Receipt upload endpoint
    if (req.url && req.url.startsWith('/api/v1/payments/upload-receipt')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }
      if (req.method === 'POST') {
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const buf = Buffer.concat(chunks);
            const contentType = req.headers['content-type'] || '';
            const receiptsDir = path.resolve(import.meta.dirname, '../backend/media/receipts');
            fs.mkdirSync(receiptsDir, { recursive: true });

            let filename = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
            let fileBuffer: Buffer | null = null;

            if (contentType.includes('multipart/form-data')) {
              const boundaryMatch = contentType.match(/boundary=([^;]+)/);
              if (boundaryMatch) {
                const boundary = boundaryMatch[1].trim().replace(/^"/, '').replace(/"$/, '');
                const boundaryBuf = Buffer.from('--' + boundary);
                const start = buf.indexOf(boundaryBuf);
                if (start !== -1) {
                  const next = buf.indexOf(boundaryBuf, start + boundaryBuf.length);
                  if (next !== -1) {
                    const sub = buf.slice(start + boundaryBuf.length, next);
                    const hEnd = sub.indexOf(Buffer.from('\r\n\r\n'));
                    if (hEnd !== -1) {
                      const hStr = sub.slice(0, hEnd).toString();
                      const fMatch = hStr.match(/filename="([^"]+)"/);
                      if (fMatch) {
                        const origExt = path.extname(fMatch[1]) || '.jpg';
                        filename = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${origExt}`;
                      }
                      fileBuffer = sub.slice(hEnd + 4, sub.length - 2);
                    }
                  }
                }
              }
            } else if (contentType.includes('application/json')) {
              const body = JSON.parse(buf.toString() || '{}');
              const b64 = body.file_base64 || body.payment_proof_url;
              if (b64 && b64.includes(';base64,')) {
                const parts = b64.split(';base64,');
                const ext = parts[0].includes('png') ? '.png' : parts[0].includes('webp') ? '.webp' : '.jpg';
                filename = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
                fileBuffer = Buffer.from(parts[1], 'base64');
              }
            }

            if (fileBuffer) {
              const targetPath = path.join(receiptsDir, filename);
              fs.writeFileSync(targetPath, fileBuffer);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 201;
              res.end(JSON.stringify({
                success: true,
                receipt_url: `/media/receipts/${filename}`,
                filename,
              }));
              return;
            }
          } catch (err: any) {
            console.error('Error in upload-receipt handler:', err);
          }
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Failed to process receipt upload' }));
        });
        return;
      }
    }

    // Payment evidence detail endpoint
    if (req.url && (req.url.startsWith('/api/v1/payments/evidence/') || req.url.startsWith('/api/v1/payments/evidence?'))) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }
      if (req.method === 'GET') {
        const urlObj = new URL(req.url, 'http://localhost');
        const refParam = (urlObj.searchParams.get('order_reference') || urlObj.searchParams.get('ref') || '').toUpperCase();
        const store = readStore();
        const payments = store.payments || [];
        const match = payments.find((p: any) =>
          (p.order_reference && p.order_reference.toUpperCase() === refParam) ||
          (p.reference && p.reference.toUpperCase() === refParam) ||
          (p.id && String(p.id).toUpperCase() === refParam)
        );
        res.setHeader('Content-Type', 'application/json');
        if (match) {
          res.end(JSON.stringify(match));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Payment evidence not found' }));
        }
        return;
      }
    }

    // Payment evidence submission endpoint
    if (req.url && req.url.startsWith('/api/v1/payments/submit-evidence')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }
      if (req.method === 'POST') {
        let bodyStr = '';
        req.on('data', (c: any) => { bodyStr += c; });
        req.on('end', () => {
          try {
            const data = JSON.parse(bodyStr || '{}');
            const store = readStore();
            const orderRef = (data.order_reference || '').toUpperCase();
            const nowIso = new Date().toISOString();

            // Find matching order if any
            const ords = store.orders || [];
            const targetOrd = ords.find((o: any) => {
              const k = (o.reference || o.reference_code || o.id || '').toUpperCase();
              return k === orderRef;
            });

            if (targetOrd) {
              targetOrd.payment_status = 'PENDING_VERIFICATION';
              if (targetOrd.status === 'PENDING_PAYMENT' || targetOrd.status === 'PENDING') {
                targetOrd.status = 'ORDER_PLACED';
              }
              targetOrd.sender_bank = data.sender_bank;
              targetOrd.sender_account_name = data.sender_account_name;
              targetOrd.transaction_reference = data.transaction_reference;
              targetOrd.payment_proof_url = data.payment_proof_url;
            }

            const paymentRecord = {
              id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              reference: `PAY-${orderRef}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              order_reference: orderRef,
              provider: 'BANK_TRANSFER',
              status: 'PENDING_VERIFICATION',
              amount: String(data.amount || targetOrd?.total || targetOrd?.total_amount || '0'),
              currency: data.currency || 'NGN',
              sender_bank: data.sender_bank,
              sender_account_name: data.sender_account_name,
              payment_proof_url: data.payment_proof_url,
              transaction_reference: data.transaction_reference,
              notes: data.notes,
              customer_name: targetOrd?.customer_name || targetOrd?.buyer || targetOrd?.shipping_recipient_name || '',
              customer_email: targetOrd?.customer_email || targetOrd?.buyer_email || '',
              created_at: nowIso,
              verified_at: null,
              verified_by: null,
              rejection_reason: null,
            };

            const payments = (store.payments || []).filter((p: any) => p.order_reference !== orderRef);
            payments.unshift(paymentRecord);
            store.payments = payments;
            store.orders = ords;
            writeStore(store);

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 201;
            res.end(JSON.stringify(paymentRecord));
            return;
          } catch (err: any) {
            console.error('Error submitting payment evidence:', err);
          }
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Failed to submit payment evidence' }));
        });
        return;
      }
    }

    // Admin payment verification and rejection endpoints
    const adminActionMatch = req.url && req.url.match(/\/api\/v1\/admin\/payments\/([^/]+)\/(verify|reject)\//);
    if (adminActionMatch && req.method === 'POST') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      const targetPaymentRef = decodeURIComponent(adminActionMatch[1]).toUpperCase();
      const action = adminActionMatch[2]; // 'verify' or 'reject'
      let actionBody = '';
      req.on('data', (c: any) => { actionBody += c; });
      req.on('end', () => {
        try {
          const body = JSON.parse(actionBody || '{}');
          const store = readStore();
          const payments = store.payments || [];
          const nowIso = new Date().toISOString();

          const p = payments.find((x: any) =>
            (x.id && String(x.id).toUpperCase() === targetPaymentRef) ||
            (x.reference && x.reference.toUpperCase() === targetPaymentRef) ||
            (x.order_reference && x.order_reference.toUpperCase() === targetPaymentRef)
          );

          const ordRef = p ? p.order_reference : targetPaymentRef;
          const ords = store.orders || [];
          const ord = ords.find((o: any) => {
            const k = (o.reference || o.reference_code || o.id || '').toUpperCase();
            return k === (ordRef || '').toUpperCase();
          });

          if (action === 'verify') {
            if (p) {
              p.status = 'VERIFIED';
              p.verified_at = nowIso;
              p.verified_by = 'Administrator';
              if (body.notes) p.notes = body.notes;
            }
            if (ord) {
              ord.payment_status = 'PAID';
              ord.status = 'PROCESSING';
              ord.verified_at = nowIso;
              ord.verified_by = 'Administrator';
            }
          } else {
            if (p) {
              p.status = 'REJECTED';
              p.verified_at = nowIso;
              p.rejection_reason = body.rejection_reason || 'Declined by Administrator';
            }
            if (ord) {
              ord.payment_status = 'REJECTED';
            }
          }

          writeStore(store);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, payment: p, order: ord }));
          return;
        } catch (err: any) {
          console.error('Error handling admin payment action:', err);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Failed to process admin action' }));
      });
      return;
    }
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
        minimumOrderSettings: s.minimumOrderSettings || {
          enabled: true,
          minimum_amount: 10000,
          updated_at: '2026-11-21T00:00:00Z',
          updated_by: 'Administrator',
        },
        paymentSessions: s.paymentSessions || [],
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

          let mergedSessions = current.paymentSessions || [];
          if (Array.isArray(incoming.paymentSessions)) {
            const sessMap = new Map();
            for (const s of mergedSessions) {
              const k = s.id || s.order_reference;
              if (k) sessMap.set(k, s);
            }
            for (const s of incoming.paymentSessions) {
              const k = s.id || s.order_reference;
              if (k) {
                const prev = sessMap.get(k) || {};
                sessMap.set(k, { ...prev, ...s });
              }
            }
            mergedSessions = Array.from(sessMap.values());
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
            paymentSessions: mergedSessions,
            minimumOrderSettings: incoming.minimumOrderSettings !== undefined
              ? incoming.minimumOrderSettings
              : (current.minimumOrderSettings || { enabled: true, minimum_amount: 10000 }),
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
