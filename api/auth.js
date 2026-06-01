// api/auth.js  —  Inicia el flujo OAuth de Shopify
export default async function handler(req, res) {
  const { shop } = req.query;

  if (!shop || !shop.includes('.myshopify.com')) {
    return res.status(400).send('Parámetro shop inválido');
  }

  const clientId = process.env.SHOPIFY_API_KEY;
  const scopes = 'read_orders,read_products';
  const redirectUri = `${process.env.APP_URL}/api/callback`;
  const nonce = Math.random().toString(36).substring(2);

  // Guarda nonce en cookie para verificarlo en callback
  res.setHeader('Set-Cookie', `shopify_nonce=${nonce}; HttpOnly; Secure; SameSite=None; Path=/`);

  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${nonce}`;

  res.redirect(authUrl);
}
