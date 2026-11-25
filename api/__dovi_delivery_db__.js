export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.setHeader('Content-Type', 'application/json');
  return res.status(403).json({
    error: 'ENDPOINT_DECOMMISSIONED',
    message: 'Direct datastore access via /__dovi_delivery_db__ is permanently decommissioned for financial and data security. All orders, payments, and catalog actions must use authoritative backend API endpoints.'
  });
}
