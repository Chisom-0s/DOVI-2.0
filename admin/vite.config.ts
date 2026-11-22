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

    // --- AUTHORITATIVE REST API ENDPOINTS ---
    if (req.url && (req.url.startsWith('/api/v1/orders') || req.url.startsWith('/api/v1/admin/orders'))) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const orders = store.orders || [];
      const urlObj = new URL(req.url, 'http://localhost');
      const pathname = urlObj.pathname.replace(/\/+$/, '');
      const parts = pathname.split('/');
      const lastPart = parts[parts.length - 1];
      const isCollection = lastPart === 'orders';

      if (isCollection) {
        if (req.method === 'GET') {
          let list = [...orders];
          const status = urlObj.searchParams.get('status');
          const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('search');
          const buyerEmail = urlObj.searchParams.get('buyer_email');
          const customerId = urlObj.searchParams.get('customer_id');

          if (status && status !== 'ALL') {
            list = list.filter((o) => (o.status || '').toUpperCase() === status.toUpperCase() || (o.payment_status || '').toUpperCase() === status.toUpperCase());
          }
          if (buyerEmail) {
            list = list.filter((o) => (o.buyer_email || '').toLowerCase() === buyerEmail.toLowerCase());
          }
          if (customerId) {
            list = list.filter((o) => o.customer_id === customerId || o.buyer_id === customerId);
          }
          if (q) {
            const query = q.toLowerCase();
            list = list.filter((o) =>
              (o.reference || '').toLowerCase().includes(query) ||
              (o.id || '').toLowerCase().includes(query) ||
              (o.buyer_name || '').toLowerCase().includes(query) ||
              (o.buyer_email || '').toLowerCase().includes(query)
            );
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            count: list.length,
            next: null,
            previous: null,
            results: list,
          }));
          return;
        }

        if (req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (c: any) => { bodyStr += c; });
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const nowIso = new Date().toISOString();
              const newOrder = {
                ...body,
                id: body.id || `ORD-${Date.now()}`,
                reference: body.reference || body.reference_code || `ORD-${Date.now()}`,
                reference_code: body.reference_code || body.reference || `ORD-${Date.now()}`,
                created_at: body.created_at || nowIso,
                status: body.status || 'ORDER_PLACED',
                payment_status: body.payment_status || 'AWAITING_PAYMENT',
                fulfillment_status: body.fulfillment_status || 'AWAITING_DELIVERY',
              };

              const existingIdx = orders.findIndex((o: any) => o.reference === newOrder.reference || o.id === newOrder.id);
              if (existingIdx !== -1) {
                orders[existingIdx] = newOrder;
              } else {
                orders.unshift(newOrder);
              }
              store.orders = orders;
              writeStore(store);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 201;
              res.end(JSON.stringify(newOrder));
              return;
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Failed to create order' }));
            }
          });
          return;
        }
      } else {
        // Individual order: /api/v1/orders/:ref
        const refParam = decodeURIComponent(lastPart).toUpperCase();
        const targetOrder = orders.find((o: any) =>
          (o.reference || '').toUpperCase() === refParam ||
          (o.reference_code || '').toUpperCase() === refParam ||
          (o.id || '').toUpperCase() === refParam
        );

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          if (targetOrder) {
            res.end(JSON.stringify(targetOrder));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ detail: 'Order not found' }));
          }
          return;
        }

        if (req.method === 'PATCH' || req.method === 'PUT') {
          let bodyStr = '';
          req.on('data', (c: any) => { bodyStr += c; });
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              if (targetOrder) {
                Object.assign(targetOrder, body);
                store.orders = orders;
                writeStore(store);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(targetOrder));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ detail: 'Order not found' }));
              }
              return;
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid update body' }));
            }
          });
          return;
        }
      }
    }

    // --- USERS ENDPOINT ---
    if (req.url && req.url.startsWith('/api/v1/admin/users')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const users = store.users || [
        {
          id: 'usr_admin_1',
          email: 'admin@dovi.com',
          first_name: 'Super',
          last_name: 'Admin',
          role: 'ADMIN',
          is_active: true,
          is_staff: true,
          created_at: '2026-01-01T00:00:00Z',
        }
      ];
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        count: users.length,
        next: null,
        previous: null,
        results: users,
      }));
      return;
    }

    // --- PRODUCTS ENDPOINT ---
    if (req.url && (req.url.startsWith('/api/v1/products') || req.url.startsWith('/api/v1/admin/products'))) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      let catalog = [];
      const catPath = path.resolve(import.meta.dirname, '../backend/products_catalog.json');
      try {
        if (fs.existsSync(catPath)) {
          catalog = JSON.parse(fs.readFileSync(catPath, 'utf8'));
        }
      } catch {}

      const urlObj = new URL(req.url, 'http://localhost');
      const parts = urlObj.pathname.replace(/\/+$/, '').split('/');
      const last = parts[parts.length - 1];

      if (last !== 'products') {
        const prod = catalog.find((p: any) => p.id === last || p.slug === last);
        res.setHeader('Content-Type', 'application/json');
        if (prod) {
          res.end(JSON.stringify(prod));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ detail: 'Product not found' }));
        }
        return;
      }

      let filteredCatalog = [...catalog];
      const categoryParam = urlObj.searchParams.get('category');
      const searchParam = urlObj.searchParams.get('search') || urlObj.searchParams.get('q');
      const pageParam = parseInt(urlObj.searchParams.get('page') || '1', 10);
      const pageSizeParam = urlObj.searchParams.get('page_size');
      const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 0;

      if (categoryParam) {
        filteredCatalog = filteredCatalog.filter((p: any) =>
          p.category === categoryParam ||
          (p.category_slug && p.category_slug.toLowerCase() === categoryParam.toLowerCase()) ||
          (p.category_name && p.category_name.toLowerCase().includes(categoryParam.toLowerCase())) ||
          (p.description && p.description.includes(categoryParam))
        );
      }
      if (searchParam) {
        const query = searchParam.toLowerCase();
        filteredCatalog = filteredCatalog.filter((p: any) =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
      }

      const totalCount = filteredCatalog.length;
      let paginated = filteredCatalog;
      let nextUrl: string | null = null;
      let prevUrl: string | null = null;

      if (pageSize > 0) {
        const start = (pageParam - 1) * pageSize;
        paginated = filteredCatalog.slice(start, start + pageSize);
        if (start + pageSize < totalCount) {
          nextUrl = `?page=${pageParam + 1}&page_size=${pageSize}`;
        }
        if (pageParam > 1) {
          prevUrl = `?page=${pageParam - 1}&page_size=${pageSize}`;
        }
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        count: totalCount,
        next: nextUrl,
        previous: prevUrl,
        results: paginated,
      }));
      return;
    }

    // --- VENDORS ENDPOINT ---
    if (req.url && (req.url.startsWith('/api/v1/admin/vendors') || req.url.startsWith('/api/v1/vendors'))) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const vendors = [
        {
          id: 'ca901bff-43ad-40c7-a59e-7a8b6fbd7934',
          name: 'Dovi Official Store',
          email: 'admin@dovi.com',
          status: 'ACTIVE',
          is_verified: true,
          phone: '+2347067402413',
        }
      ];
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        count: vendors.length,
        next: null,
        previous: null,
        results: vendors,
      }));
      return;
    }

    // --- REFUNDS ENDPOINT ---
    if (req.url && req.url.startsWith('/api/v1/refunds')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const refunds = store.save2ownRefunds || [];
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        count: refunds.length,
        next: null,
        previous: null,
        results: refunds,
      }));
      return;
    }

    // --- SAVE2OWN GOALS & CONTRIBUTIONS ENDPOINTS ---
    if (req.url && (req.url.startsWith('/api/v1/admin/save2own/goals') || req.url.startsWith('/api/v1/save2own/goals'))) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const goals = store.save2ownGoals || [];
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        count: goals.length,
        next: null,
        previous: null,
        results: goals,
      }));
      return;
    }

    if (req.url && req.url.startsWith('/api/v1/admin/save2own/contributions')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const contribs = store.save2ownContributions || [];
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        count: contribs.length,
        next: null,
        previous: null,
        results: contribs,
      }));
      return;
    }

    if (req.url && req.url.startsWith('/api/v1/admin/save2own/participants')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const parts = store.save2ownParticipants || [];
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        count: parts.length,
        next: null,
        previous: null,
        results: parts,
      }));
      return;
    }

    if (req.url && req.url.startsWith('/api/v1/admin/save2own/dashboard')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const goals = store.save2ownGoals || [];
      const contribs = store.save2ownContributions || [];
      const parts = store.save2ownParticipants || [];
      const activeGoals = goals.filter((g: any) => g.status === 'ACTIVE').length;
      const cancelledGoals = goals.filter((g: any) => g.status === 'CANCELLED').length;
      const confirmedContribs = contribs.filter((c: any) => (c.status || '').toUpperCase() === 'CONFIRMED' || c.payment_status === 'SUCCESSFUL');
      const confirmedTotal = confirmedContribs.reduce((acc: number, c: any) => acc + (parseFloat(c.amount) || 0), 0);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        total_participants: parts.length,
        active_goals: activeGoals,
        completed_goals: 0,
        cancelled_goals: cancelledGoals,
        paused_goals: 0,
        pending_contributions: 0,
        confirmed_contributions: confirmedContribs.length,
        total_confirmed_funds: String(confirmedTotal),
        pending_verification_amount: '0.00',
        refund_amount: '0.00',
      }));
      return;
    }

    // --- DELIVERIES ENDPOINT ---
    if (req.url && (req.url.startsWith('/api/v1/delivery') || req.url.startsWith('/api/v1/admin/delivery'))) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(store.routes || []));
      return;
    }

    // --- ADMIN PAYMENTS LIST ENDPOINT ---
    if (req.url && req.url.startsWith('/api/v1/admin/payments') && !req.url.includes('/verify') && !req.url.includes('/reject')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const payments = store.payments || [];
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        count: payments.length,
        next: null,
        previous: null,
        results: payments,
      }));
      return;
    }

    // --- PAYMENT ACCOUNTS ENDPOINTS ---
    if (req.url && (req.url.startsWith('/api/v1/payment-accounts') || req.url.startsWith('/api/v1/admin/payment-accounts') || req.url.startsWith('/api/v1/payments/accounts'))) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const accounts = store.paymentAccounts || [];
      if (req.url.includes('/active')) {
        const urlObj = new URL(req.url, 'http://localhost');
        const reqType = (urlObj.searchParams.get('type') || urlObj.searchParams.get('account_type') || 'marketplace').toLowerCase();
        const active = accounts.find((a: any) => (a.account_type || '').toLowerCase() === reqType && a.is_active !== false) ||
                       accounts.find((a: any) => (a.account_type || '').toLowerCase() === reqType) ||
                       accounts[0];
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(active || null));
        return;
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        count: accounts.length,
        next: null,
        previous: null,
        results: accounts,
      }));
      return;
    }

    // --- ADMIN OVERVIEW ENDPOINT ---
    if (req.url && req.url.startsWith('/api/v1/admin/analytics/overview')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

      const store = readStore();
      const ords = store.orders || [];
      const revenue = ords
        .filter((o: any) => o.payment_status === 'PAID' || o.payment_status === 'VERIFIED')
        .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        total_orders: ords.length,
        total_users: (store.users || []).length,
        total_revenue: revenue,
        pending_verifications: (store.payments || []).filter((p: any) => p.status === 'PENDING_VERIFICATION').length,
      }));
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
            launchGiveaway: incoming.launchGiveaway !== undefined
              ? incoming.launchGiveaway
              : (current.launchGiveaway !== undefined ? current.launchGiveaway : undefined),
            promotionalCampaigns: incoming.promotionalCampaigns !== undefined
              ? incoming.promotionalCampaigns
              : (current.promotionalCampaigns || undefined),
            campaignAuditLogs: incoming.campaignAuditLogs !== undefined
              ? incoming.campaignAuditLogs
              : (current.campaignAuditLogs || undefined),
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

    // Promotions API endpoints
    if (req.url && req.url.startsWith('/api/v1/promotions/campaigns')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const store = readStore();
      const campaigns = store.promotionalCampaigns || [
        {
          id: 'promo-launch-giveaway',
          name: 'DOVI Launch Giveaway',
          headline: 'SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!',
          description: 'Unlock a complimentary high-definition DOVI Wireless EarPod with charging case on qualifying marketplace orders of ₦30,000 or more.',
          badge_text: 'Launch Giveaway',
          cta_text: 'Shop & Claim Gift',
          cta_url: '/products',
          secondary_text: 'Limited gifts available · Offer ends 20 Dec 2026',
          image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
          theme: {
            primary_bg: '#ff7a00',
            secondary_bg: '#059669',
            bg_style: 'gradient',
            text_color: '#ffffff',
            button_bg: '#ffffff',
            button_text_color: '#ea580c',
            badge_bg: 'rgba(255, 255, 255, 0.22)',
            badge_text_color: '#ffffff',
            image_position: 'right',
            layout_variant: 'standard',
          },
          placements: { homepage_banner: true, recurring_popup: true },
          popup_frequency_seconds: 20,
          popup_frequency_label: 'Every 20 seconds',
          status: 'ACTIVE',
          start_date: '2026-11-22T00:00:00Z',
          end_date: '2026-12-20T23:59:59Z',
          priority: 1,
          is_giveaway: true,
          giveaway_config: store.launchGiveaway || {
            qualifying_subtotal: 30000,
            initial_stock: 20,
            total_stock: 20,
            max_allowed_stock: 50,
            available_stock: 20,
            reserved_stock: 0,
            confirmed_stock: 0,
            max_per_customer: 1,
          },
        }
      ];

      const now = new Date().toISOString();
      const activeOnly = campaigns.filter((c: any) => {
        if (c.status !== 'ACTIVE') return false;
        if (c.start_date && now < c.start_date) return false;
        if (c.end_date && now > c.end_date) return false;
        if (c.is_giveaway && c.giveaway_config && c.giveaway_config.available_stock <= 0) return false;
        return true;
      }).sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99));

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results: activeOnly }));
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
