// api/callback.js  —  Intercambia el code por un access token
import { parse } from 'cookie';

export default async function handler(req, res) {
  const { shop, code, state, hmac } = req.query;
  const cookies = parse(req.headers.cookie || '');

  // Verifica nonce
  if (!state || state !== cookies.shopify_nonce) {
    return res.status(403).send('Nonce inválido');
  }

  // Intercambia code por token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code
    })
  });

  if (!tokenRes.ok) {
    return res.status(500).send('Error obteniendo token de acceso');
  }

  const { access_token } = await tokenRes.json();

  // En producción guarda el token en una base de datos.
  // Por simplicidad lo ponemos en una cookie segura.
  res.setHeader('Set-Cookie', [
    `shopify_token=${access_token}; HttpOnly; Secure; SameSite=None; Path=/`,
    `shopify_shop=${shop}; HttpOnly; Secure; SameSite=None; Path=/`
  ]);

  res.redirect(`/api/app?shop=${shop}`);
}
