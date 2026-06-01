// api/orders.js  —  Obtiene órdenes abiertas de Shopify Admin API
import { parse } from 'cookie';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.shopify_token;
  const shop  = cookies.shopify_shop;

  if (!token || !shop) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    // Obtiene órdenes sin cumplir (unfulfilled + partial)
    const url = `https://${shop}/admin/api/2024-01/orders.json` +
      `?status=open&fulfillment_status=unfulfilled,partial&limit=50` +
      `&fields=id,name,created_at,fulfillment_status,customer,line_items`;

    const shopRes = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!shopRes.ok) {
      const err = await shopRes.text();
      return res.status(shopRes.status).json({ error: err });
    }

    const { orders } = await shopRes.json();

    // Normaliza la respuesta para el frontend
    const normalized = orders.map(o => ({
      id: String(o.id),
      name: o.name,
      created_at: o.created_at,
      status: o.fulfillment_status || 'open',
      customer_name: o.customer
        ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim()
        : 'Sin nombre',
      line_items: (o.line_items || []).map(li => ({
        id: String(li.id),
        title: li.title + (li.variant_title ? ` – ${li.variant_title}` : ''),
        sku: li.sku || '',
        barcode: li.barcode || '',
        quantity: li.quantity
      }))
    }));

    res.setHeader('Cache-Control', 'no-store');
    res.json(normalized);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
