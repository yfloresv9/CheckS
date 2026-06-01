// api/app.js  —  Sirve la app principal
import { parse } from 'cookie';

export default async function handler(req, res) {
  const { shop } = req.query;
  const cookies = parse(req.headers.cookie || '');

  // Si no tiene token, redirige a instalar
  if (!cookies.shopify_token) {
    if (!shop) return res.status(400).send('Parámetro shop requerido');
    return res.redirect(`/api/auth?shop=${shop}`);
  }

  res.setHeader('Content-Type', 'text/html');
  res.send(getAppHTML());
}

function getAppHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificador de Órdenes</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #f4f6f8; --surface: #ffffff; --border: #e1e3e5;
      --primary: #008060; --primary-dark: #006349;
      --text: #202223; --muted: #6d7175;
      --ok: #3b7c53; --ok-bg: #d4edda;
      --err: #c0392b; --err-bg: #fce4e4;
      --warn: #92610a; --warn-bg: #fff3cd;
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

    .screen { display: none; max-width: 480px; margin: 0 auto; padding: 16px; min-height: 100vh; }
    .screen.active { display: block; }

    .topbar { display: flex; align-items: center; gap: 10px; background: var(--surface); border-bottom: 1px solid var(--border); padding: 12px 16px; position: sticky; top: 0; z-index: 10; }
    .topbar h1 { font-size: 16px; font-weight: 600; }
    .topbar .back { background: none; border: none; font-size: 22px; cursor: pointer; color: var(--muted); padding: 0 4px; }
    .topbar .spacer { flex: 1; }

    .btn { padding: 10px 16px; border-radius: 8px; border: none; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
    .btn-full { width: 100%; justify-content: center; }

    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; cursor: pointer; transition: box-shadow 0.15s; }
    .card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .card-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .card-sub { font-size: 13px; color: var(--muted); margin-top: 3px; }

    .badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; }
    .badge-open { background: #e3f1ff; color: #083e91; }
    .badge-ok { background: var(--ok-bg); color: var(--ok); }
    .badge-partial { background: var(--warn-bg); color: var(--warn); }

    .progress { background: #e9ecef; border-radius: 99px; height: 5px; margin-top: 10px; overflow: hidden; }
    .progress-bar { height: 100%; background: var(--primary); border-radius: 99px; transition: width 0.4s; }

    .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 14px 0; }
    .stat { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px; text-align: center; }
    .stat-num { font-size: 24px; font-weight: 700; }
    .stat-lbl { font-size: 11px; color: var(--muted); margin-top: 2px; }

    .item { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--border); }
    .item:last-child { border-bottom: none; }
    .item-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .icon-ok { background: var(--ok-bg); color: var(--ok); }
    .icon-err { background: var(--err-bg); color: var(--err); }
    .icon-pend { background: #f0f0f0; color: var(--muted); }
    .item-info { flex: 1; min-width: 0; }
    .item-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-upc { font-size: 11px; color: var(--muted); font-family: monospace; margin-top: 2px; }
    .item-qty { font-size: 13px; color: var(--muted); white-space: nowrap; }

    /* Cámara */
    .cam-wrap { position: relative; background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
    #video { width: 100%; display: block; max-height: 260px; object-fit: cover; }
    .cam-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
    .cam-box { width: 65%; aspect-ratio: 2.5/1; border: 2px solid rgba(255,255,255,0.85); border-radius: 8px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.45); }
    .cam-line { position: absolute; width: 65%; height: 2px; background: rgba(255,255,255,0.9); animation: sweep 1.6s ease-in-out infinite; }
    @keyframes sweep { 0%,100% { top: 35%; opacity:.3; } 50% { top: 55%; opacity:1; } }

    .manual { display: flex; gap: 8px; margin-bottom: 14px; }
    .manual input { flex: 1; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; font-family: monospace; background: var(--surface); }
    .manual input:focus { outline: 2px solid var(--primary); border-color: transparent; }

    .result { padding: 12px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 14px; font-weight: 500; display: none; align-items: center; gap: 8px; }
    .result.ok { background: var(--ok-bg); color: var(--ok); display: flex; }
    .result.err { background: var(--err-bg); color: var(--err); display: flex; }

    .complete-screen { text-align: center; padding: 3rem 1rem; }
    .complete-screen .icon { font-size: 64px; margin-bottom: 1rem; }
    .complete-screen h2 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .complete-screen p { color: var(--muted); margin-bottom: 1.5rem; }

    .loading { text-align: center; padding: 3rem 1rem; color: var(--muted); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    #items-container { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 0 16px; }
    #scan-items-container { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 0 16px; }
  </style>
</head>
<body>

<!-- PANTALLA: Lista de Órdenes -->
<div id="s-orders" class="screen active">
  <div class="topbar">
    <h1>📦 Mis Órdenes</h1>
    <div class="spacer"></div>
    <button class="btn btn-outline" onclick="loadOrders()" style="padding:6px 12px;font-size:13px">↻ Recargar</button>
  </div>
  <div style="padding:14px 0" id="orders-list">
    <div class="loading"><div class="spinner"></div>Cargando órdenes…</div>
  </div>
</div>

<!-- PANTALLA: Detalle de Orden -->
<div id="s-detail" class="screen">
  <div class="topbar">
    <button class="back" onclick="show('s-orders')">‹</button>
    <h1 id="detail-title">Orden</h1>
    <div class="spacer"></div>
    <button class="btn btn-primary" onclick="show('s-scan');startCamera()" style="padding:7px 12px;font-size:13px">📷 Escanear</button>
  </div>
  <div style="padding:14px 0">
    <div class="stats">
      <div class="stat"><div class="stat-num" id="st-total">0</div><div class="stat-lbl">Artículos</div></div>
      <div class="stat"><div class="stat-num" id="st-ok" style="color:var(--ok)">0</div><div class="stat-lbl">Verificados</div></div>
      <div class="stat"><div class="stat-num" id="st-pend" style="color:var(--warn)">0</div><div class="stat-lbl">Pendientes</div></div>
    </div>
    <div class="progress"><div class="progress-bar" id="prog" style="width:0%"></div></div>
    <br>
    <div id="items-container"><div id="items-list"></div></div>
  </div>
</div>

<!-- PANTALLA: Escanear -->
<div id="s-scan" class="screen">
  <div class="topbar">
    <button class="back" onclick="stopCamera();show('s-detail')">‹</button>
    <h1>Escanear UPC</h1>
  </div>
  <div style="padding:14px 0">
    <div class="cam-wrap">
      <video id="video" autoplay playsinline muted></video>
      <div class="cam-overlay"><div class="cam-box"></div><div class="cam-line"></div></div>
    </div>
    <div id="result-msg" class="result"></div>
    <div class="manual">
      <input id="upc-in" type="tel" placeholder="Escribe UPC manualmente…" onkeydown="if(event.key==='Enter')manualCheck()">
      <button class="btn btn-outline" onclick="manualCheck()">✓</button>
    </div>
    <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:8px;letter-spacing:.04em">ARTÍCULOS DE ESTA ORDEN</div>
    <div id="scan-items-container"><div id="scan-items"></div></div>
  </div>
</div>

<!-- PANTALLA: Completado -->
<div id="s-done" class="screen">
  <div class="complete-screen">
    <div class="icon">✅</div>
    <h2>¡Orden verificada!</h2>
    <p id="done-msg"></p>
    <button class="btn btn-primary btn-full" onclick="show('s-orders')">Ver más órdenes</button>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js"></script>
<script>
  let orders = [], current = null, scanned = {}, camStream = null, quaggaRunning = false;
  let lastCode = '', lastTime = 0;

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ── Carga órdenes desde /api/orders ──────────────────────────────────
  async function loadOrders() {
    document.getElementById('orders-list').innerHTML = '<div class="loading"><div class="spinner"></div>Cargando órdenes…</div>';
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Error ' + res.status);
      orders = await res.json();
      renderOrders();
    } catch(e) {
      document.getElementById('orders-list').innerHTML =
        '<div class="loading" style="color:#c0392b">Error cargando órdenes.<br><small>' + e.message + '</small></div>';
    }
  }

  function renderOrders() {
    const el = document.getElementById('orders-list');
    if (!orders.length) { el.innerHTML = '<div class="loading">No hay órdenes abiertas 🎉</div>'; return; }
    el.innerHTML = orders.map(o => {
      const total = (o.line_items||[]).reduce((s,i)=>s+i.quantity,0);
      const ok = countOk(o.id);
      const pct = total ? Math.round(ok/total*100) : 0;
      const badgeCls = pct===100 ? 'badge-ok">Completa' : ok>0 ? 'badge-partial">Parcial' : 'badge-open">Pendiente';
      const d = new Date(o.created_at).toLocaleDateString('es-MX',{day:'2-digit',month:'short'});
      return \`<div class="card" onclick="openOrder('\${o.id}')">
        <div class="card-title">\${o.name} <span class="badge \${badgeCls}</span></div>
        <div class="card-sub">\${o.customer_name||'Sin nombre'} · \${d} · \${total} art.</div>
        \${ok>0 ? \`<div class="progress"><div class="progress-bar" style="width:\${pct}%"></div></div>\` : ''}
      </div>\`;
    }).join('');
  }

  function countOk(id) {
    return Object.values(scanned[id]||{}).filter(v=>v==='ok').length;
  }

  function openOrder(id) {
    current = orders.find(o=>o.id===id);
    if (!current) return;
    if (!scanned[id]) scanned[id] = {};
    renderDetail();
    renderScanItems();
    show('s-detail');
  }

  function renderDetail() {
    const items = current.line_items||[];
    const total = items.reduce((s,i)=>s+i.quantity,0);
    const ok = countOk(current.id);
    document.getElementById('detail-title').textContent = current.name;
    document.getElementById('st-total').textContent = total;
    document.getElementById('st-ok').textContent = ok;
    document.getElementById('st-pend').textContent = total-ok;
    document.getElementById('prog').style.width = total ? (ok/total*100)+'%' : '0%';
    document.getElementById('items-list').innerHTML = items.map((item,i) => {
      const key = item.barcode||item.sku||String(i);
      const st = (scanned[current.id]||{})[key];
      const [cls,icon] = st==='ok' ? ['icon-ok','✓'] : st==='err' ? ['icon-err','✗'] : ['icon-pend','·'];
      return \`<div class="item">
        <div class="item-icon \${cls}">\${icon}</div>
        <div class="item-info">
          <div class="item-name">\${item.title}</div>
          <div class="item-upc">\${item.barcode||item.sku||'Sin UPC'}</div>
        </div>
        <div class="item-qty">×\${item.quantity}</div>
      </div>\`;
    }).join('');
  }

  function renderScanItems() {
    const items = current.line_items||[];
    document.getElementById('scan-items').innerHTML = items.map((item,i) => {
      const key = item.barcode||item.sku||String(i);
      const st = (scanned[current.id]||{})[key];
      const [cls,icon] = st==='ok' ? ['icon-ok','✓'] : st==='err' ? ['icon-err','✗'] : ['icon-pend','·'];
      return \`<div class="item">
        <div class="item-icon \${cls}">\${icon}</div>
        <div class="item-info">
          <div class="item-name">\${item.title}</div>
          <div class="item-upc">\${item.barcode||item.sku||'Sin UPC'}</div>
        </div>
        <div class="item-qty">×\${item.quantity}</div>
      </div>\`;
    }).join('');
  }

  // ── Lógica de verificación ────────────────────────────────────────────
  function matchUPC(upc) {
    const norm = upc.replace(/\\D/g,'');
    const items = current.line_items||[];
    for (let i=0; i<items.length; i++) {
      const item = items[i];
      const bc = (item.barcode||'').replace(/\\D/g,'');
      const sk = (item.sku||'').replace(/\\D/g,'');
      if ((bc && (bc===norm || norm.endsWith(bc) || bc.endsWith(norm))) ||
          (sk && sk===norm)) {
        return { item, key: item.barcode||item.sku||String(i) };
      }
    }
    return null;
  }

  function registerScan(upc) {
    const match = matchUPC(upc);
    const banner = document.getElementById('result-msg');
    if (match) {
      scanned[current.id][match.key] = 'ok';
      banner.className = 'result ok';
      banner.textContent = '✓ ' + match.item.title + ' (×' + match.item.quantity + ')';
      navigator.vibrate && navigator.vibrate(80);
    } else {
      banner.className = 'result err';
      banner.textContent = '✗ UPC ' + upc + ' no está en esta orden';
      navigator.vibrate && navigator.vibrate([80,40,80]);
    }
    banner.style.display = 'flex';
    setTimeout(()=>{ banner.style.display='none'; }, 2500);
    renderScanItems();
    renderDetail();
    checkComplete();
  }

  function checkComplete() {
    const items = current.line_items||[];
    const total = items.reduce((s,i)=>s+i.quantity,0);
    if (countOk(current.id) >= total) {
      setTimeout(()=>{
        stopCamera();
        document.getElementById('done-msg').textContent =
          current.name + ' — ' + total + ' artículo' + (total!==1?'s':'') + ' verificado' + (total!==1?'s':'') + ' correctamente.';
        show('s-done');
        renderOrders();
      }, 900);
    }
  }

  function manualCheck() {
    const inp = document.getElementById('upc-in');
    const v = inp.value.trim();
    if (!v) return;
    registerScan(v);
    inp.value = '';
  }

  // ── Cámara + Quagga ───────────────────────────────────────────────────
  async function startCamera() {
    stopCamera();
    try {
      camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width:{ideal:1280}, height:{ideal:720} }
      });
      document.getElementById('video').srcObject = camStream;
      startQuagga();
    } catch(e) {
      document.querySelector('.cam-wrap').innerHTML =
        '<div style="padding:2rem;text-align:center;color:#fff;font-size:13px">📵 Cámara no disponible.<br>Usa el campo manual.</div>';
    }
  }

  function stopCamera() {
    if (camStream) { camStream.getTracks().forEach(t=>t.stop()); camStream=null; }
    if (quaggaRunning) { try { Quagga.stop(); } catch(e){} quaggaRunning=false; }
  }

  function startQuagga() {
    if (typeof Quagga === 'undefined') return;
    Quagga.init({
      inputStream: { name:'Live', type:'LiveStream', target: document.getElementById('video'),
        constraints: { facingMode:'environment' } },
      decoder: { readers:['ean_reader','ean_8_reader','upc_reader','upc_e_reader','code_128_reader','code_39_reader'] },
      locate: true
    }, err => { if (!err) { Quagga.start(); quaggaRunning=true; } });

    Quagga.onDetected(r => {
      const code = r.codeResult.code;
      const now = Date.now();
      if (code===lastCode && now-lastTime < 2200) return;
      lastCode=code; lastTime=now;
      registerScan(code);
    });
  }

  loadOrders();
</script>
</body>
</html>`;
}
