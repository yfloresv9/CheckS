# 📦 Verificador de Órdenes UPC — Shopify App

App web para verificar órdenes de Shopify escaneando códigos UPC con la cámara del celular.

---

## ✅ Requisitos

- Cuenta en [Vercel](https://vercel.com) (gratis)
- Cuenta en [Shopify Partners](https://partners.shopify.com) (gratis)
- Cuenta en [GitHub](https://github.com) (gratis)

---

## 🚀 Instalación paso a paso

### PASO 1 — Subir el código a GitHub

1. Ve a [github.com](https://github.com) → **New repository**
2. Nómbralo `shopify-upc-scanner` → **Create repository**
3. Sube todos los archivos de esta carpeta (arrastra y suelta en la interfaz web de GitHub)

---

### PASO 2 — Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Importa el repositorio `shopify-upc-scanner` de GitHub
3. Haz clic en **Deploy** (sin cambiar nada más)
4. Copia la URL que te da Vercel, ejemplo: `https://shopify-upc-scanner.vercel.app`

---

### PASO 3 — Crear la App en Shopify Partners

1. Ve a [partners.shopify.com](https://partners.shopify.com) → **Apps** → **Create app**
2. Selecciona **Create app manually**
3. Ponle nombre: `Verificador UPC`
4. En **App URL** pon: `https://TU-URL.vercel.app/api/app`
5. En **Allowed redirection URLs** pon: `https://TU-URL.vercel.app/api/callback`
6. Guarda y copia el **API key** y **API secret key**

---

### PASO 4 — Configurar variables de entorno en Vercel

1. En Vercel → tu proyecto → **Settings** → **Environment Variables**
2. Agrega estas 3 variables:

| Variable            | Valor                                      |
|---------------------|--------------------------------------------|
| `SHOPIFY_API_KEY`   | El API key de Shopify Partners             |
| `SHOPIFY_API_SECRET`| El API secret de Shopify Partners          |
| `APP_URL`           | `https://TU-URL.vercel.app`                |

3. Haz clic en **Redeploy** para que tomen efecto

---

### PASO 5 — Instalar la app en tu tienda

1. En Shopify Partners → tu app → **Test on development store** (o tienda real)
2. O accede directamente:
   ```
   https://TU-URL.vercel.app/api/auth?shop=TU-TIENDA.myshopify.com
   ```
3. Shopify te pedirá autorizar la app → **Instalar**
4. ¡Listo! Ya puedes usar el verificador desde tu celular

---

## 📱 Cómo usar la app

1. Abre la app desde tu celular
2. Verás todas tus órdenes abiertas/sin cumplir
3. Toca una orden para ver sus artículos
4. Presiona **📷 Escanear** y apunta la cámara al código de barras
5. La app verifica automáticamente si el artículo pertenece a esa orden
6. Cuando todos los artículos estén verificados, la orden se marca como completa

---

## ⚠️ Importante: Barcodes en Shopify

Para que el escaneo funcione, tus productos deben tener el **barcode (UPC)** configurado:

1. En Shopify Admin → **Productos** → elige un producto
2. En cada variante → campo **Código de barras (ISBN, UPC, GTIN)**
3. Ingresa el número UPC/EAN del producto

Si el producto no tiene barcode, la app usará el **SKU** como alternativa.

---

## 🛠️ Estructura del proyecto

```
shopify-upc-scanner/
├── api/
│   ├── auth.js       # Inicia OAuth con Shopify
│   ├── callback.js   # Recibe token de acceso
│   ├── app.js        # Sirve la interfaz principal
│   └── orders.js     # API: obtiene órdenes de Shopify
├── vercel.json       # Configuración de Vercel
├── package.json
└── README.md
```

---

## 🆘 Solución de problemas

**"No autenticado"** → Reinstala la app visitando `/api/auth?shop=TU-TIENDA.myshopify.com`

**"Error cargando órdenes"** → Verifica que las variables de entorno estén correctas en Vercel

**"Cámara no disponible"** → La cámara requiere HTTPS (Vercel ya lo provee). En desarrollo local usa `localhost` (también funciona)

**No detecta el barcode** → Usa el campo manual para escribir el UPC. Asegúrate de que el producto tenga barcode en Shopify
