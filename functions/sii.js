// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://kptepufitplhkydfIkzu.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdGVwdWZpdHBsaGt5ZGZpa3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTYwNDMsImV4cCI6MjA5MjI3MjA0M30.Sbr8tdoXnFu3YWwBHZqsJoVZQyg-DknmZWubJmIIMtY";
const ADMIN_RUT  = "huno.admin";
const ADMIN_PASS = "Huno2025!";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
async function sb(path, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
    },
    method: opts.method || "GET",
    body: opts.body,
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || `HTTP ${r.status}`); }
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// ─── API ──────────────────────────────────────────────────────────────────────
const api = {
  login: async (rut, clave) => {
    const rows = await sb(`usuarios?rut=eq.${encodeURIComponent(rut.trim())}&clave=eq.${encodeURIComponent(clave.trim())}&activo=eq.true&select=id,nombre,apellido,rut,rol,empresa_id`);
    if (!rows?.length) throw new Error("RUT o clave incorrectos");
    const emp = await sb(`empresas?id=eq.${rows[0].empresa_id}&activa=eq.true`).then(r => r?.[0]);
    if (!emp) throw new Error("Empresa inactiva o no encontrada");
    return { usuario: rows[0], empresa: emp };
  },
  todasEmpresas:  ()      => sb("empresas?order=razon_social.asc"),
  todosUsuarios:  ()      => sb("usuarios?order=nombre.asc&select=id,nombre,apellido,rut,rol,activo,empresa_id,created_at"),
  createEmpresa:  (d)     => sb("empresas",  { method:"POST", body:JSON.stringify(d) }).then(r=>r?.[0]),
  updateEmpresa:  (id, d) => sb(`empresas?id=eq.${id}`,  { method:"PATCH", body:JSON.stringify(d), prefer:"return=minimal" }),
  createUsuario:  (d)     => sb("usuarios",  { method:"POST", body:JSON.stringify(d) }).then(r=>r?.[0]),
  updateUsuario:  (id, d) => sb(`usuarios?id=eq.${id}`,  { method:"PATCH", body:JSON.stringify(d), prefer:"return=minimal" }),
  deleteUsuario:  (id)    => sb(`usuarios?id=eq.${id}`,  { method:"DELETE", prefer:"return=minimal" }),
  productos:       (eid)     => sb(`productos?empresa_id=eq.${eid}&order=nombre.asc`),
  categorias:      (eid)     => sb(`categorias?empresa_id=eq.${eid}&order=nombre.asc`),
  marcas:          (eid)     => sb(`marcas?empresa_id=eq.${eid}&order=nombre.asc`),
  createProducto:  (d)       => sb("productos", { method:"POST", body:JSON.stringify(d) }).then(r=>r?.[0]),
  updateProducto:  (id, d)   => sb(`productos?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(d), prefer:"return=minimal" }),
  deleteProducto:  (id)      => sb(`productos?id=eq.${id}`, { method:"DELETE", prefer:"return=minimal" }),
  clientes:           (eid)     => sb(`clientes?empresa_id=eq.${eid}&order=nombre.asc`),
  createCliente:      (d)       => sb("clientes", { method:"POST", body:JSON.stringify(d) }).then(r=>r?.[0]),
  updateCliente:      (id, d)   => sb(`clientes?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(d), prefer:"return=minimal" }),
  deleteCliente:      (id)      => sb(`clientes?id=eq.${id}`, { method:"DELETE", prefer:"return=minimal" }),
  actividadCliente:   (cid)     => sb(`clientes_actividad?cliente_id=eq.${cid}&order=created_at.desc`),
  createActividad:    (d)       => sb("clientes_actividad", { method:"POST", body:JSON.stringify(d), prefer:"return=minimal" }),
  proveedores:      (eid)   => sb(`proveedores?empresa_id=eq.${eid}&order=nombre.asc`),
  createProveedor:  (d)     => sb("proveedores", { method:"POST", body:JSON.stringify(d) }).then(r=>r?.[0]),
  updateProveedor:  (id, d) => sb(`proveedores?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(d), prefer:"return=minimal" }),
  deleteProveedor:  (id)    => sb(`proveedores?id=eq.${id}`, { method:"DELETE", prefer:"return=minimal" }),
  documentos: (eid, desde, hasta, tipo) => {
    let q = `documentos?empresa_id=eq.${eid}&order=created_at.desc`;
    if (desde) q += `&fecha=gte.${desde}`;
    if (hasta) q += `&fecha=lte.${hasta}`;
    if (tipo)  q += `&tipo_documento=eq.${tipo}`;
    return sb(q);
  },
  documentoItems:   (did)   => sb(`documento_items?documento_id=eq.${did}`),
  documentoPagos:   (did)   => sb(`documento_pagos?documento_id=eq.${did}`),
  createDocumento: async (doc, items, pagos) => {
    const d = await sb("documentos", { method:"POST", body:JSON.stringify(doc) }).then(r=>r?.[0]);
    for (const item of items) {
      // Strip internal fields before inserting to documento_items
      const { _stock_nuevo, _stock_anterior, ...itemRow } = item;
      await sb("documento_items", { method:"POST", body:JSON.stringify({...itemRow, documento_id:d.id}), prefer:"return=minimal" });
      if (_stock_nuevo !== undefined)
        await sb(`productos?id=eq.${item.producto_id}`, { method:"PATCH", body:JSON.stringify({stock:_stock_nuevo}), prefer:"return=minimal" });
    }
    for (const pago of (pagos||[])) {
      await sb("documento_pagos", { method:"POST", body:JSON.stringify({...pago, documento_id:d.id}), prefer:"return=minimal" });
    }
    return d;
  },
  anularDocumento: (id) => sb(`documentos?id=eq.${id}`, { method:"PATCH", body:JSON.stringify({estado:"anulado"}), prefer:"return=minimal" }),
  gastos:           (eid, desde, hasta) => { let q=`gastos?empresa_id=eq.${eid}&order=fecha.desc`; if(desde)q+=`&fecha=gte.${desde}`; if(hasta)q+=`&fecha=lte.${hasta}`; return sb(q); },
  categoriasGasto:  (eid)   => sb(`categorias_gasto?empresa_id=eq.${eid}&order=nombre.asc`),
  createGasto:      (d)     => sb("gastos", { method:"POST", body:JSON.stringify(d) }).then(r=>r?.[0]),
  updateGasto:      (id, d) => sb(`gastos?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(d), prefer:"return=minimal" }),
  deleteGasto:      (id)    => sb(`gastos?id=eq.${id}`, { method:"DELETE", prefer:"return=minimal" }),
  cajas:          (eid)    => sb(`cajas?empresa_id=eq.${eid}`),
  sesionActiva:   (cajaid) => sb(`caja_sesiones?caja_id=eq.${cajaid}&estado=eq.abierta&limit=1`).then(r=>r?.[0]),
  abrirCaja:      (d)      => sb("caja_sesiones", { method:"POST", body:JSON.stringify(d) }).then(r=>r?.[0]),
  cerrarCaja:     (id, d)  => sb(`caja_sesiones?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(d), prefer:"return=minimal" }),
  movimientosCaja:(sid)    => sb(`caja_movimientos?sesion_id=eq.${sid}&order=created_at.asc`),
  createMovCaja:  (d)      => sb("caja_movimientos", { method:"POST", body:JSON.stringify(d), prefer:"return=minimal" }),
  movInventario:       (eid, limit) => sb(`movimientos_inventario?empresa_id=eq.${eid}&order=created_at.desc&limit=${limit||100}`),
  createMovInventario: (d)          => sb("movimientos_inventario", { method:"POST", body:JSON.stringify(d), prefer:"return=minimal" }),
  cuentasCobrar:    (eid)   => sb(`cuentas_cobrar?empresa_id=eq.${eid}&order=fecha_vencimiento.asc`),
  createCxC:        (d)     => sb("cuentas_cobrar", { method:"POST", body:JSON.stringify(d) }).then(r=>r?.[0]),
  updateCxC:        (id, d) => sb(`cuentas_cobrar?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(d), prefer:"return=minimal" }),
  pagosCxC:         (cid)   => sb(`cuentas_cobrar_pagos?cuenta_id=eq.${cid}&order=created_at.desc`),
  createPagoCxC:    (d)     => sb("cuentas_cobrar_pagos", { method:"POST", body:JSON.stringify(d) }).then(r=>r?.[0]),
  siguienteFolio: async (eid, tipo) => {
    const ex = await sb(`folios?empresa_id=eq.${eid}&tipo_documento=eq.${tipo}&sucursal_id=is.null`);
    if (ex?.length) {
      const n = ex[0].ultimo_folio + 1;
      await sb(`folios?id=eq.${ex[0].id}`, { method:"PATCH", body:JSON.stringify({ultimo_folio:n}), prefer:"return=minimal" });
      return n;
    }
    await sb("folios", { method:"POST", body:JSON.stringify({empresa_id:eid, tipo_documento:tipo, ultimo_folio:1}), prefer:"return=minimal" });
    return 1;
  },
  registrarAccion: (d) => sb("usuarios_log", { method:"POST", body:JSON.stringify(d), prefer:"return=minimal" }).catch(()=>null),
  logsEmpresa:     (eid) => sb(`usuarios_log?empresa_id=eq.${eid}&order=created_at.desc&limit=500`),
  logUsuario:      (eid, uid) => sb(`usuarios_log?empresa_id=eq.${eid}&usuario_id=eq.${uid}&order=created_at.desc&limit=200`),
};

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  navy:"#081f2c", navyMid:"#0d2e40", navyLight:"#1a3d52",
  blue:"#54b2e9", blueDark:"#3a8fc7",
  white:"#ffffff", offWhite:"#f5f7fa",
  gray50:"#f0f2f5", gray100:"#e4e8ec", gray200:"#c8d0d8",
  gray400:"#8a97a3", gray600:"#4a5a66",
  success:"#22c55e", warning:"#f59e0b", danger:"#ef4444",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Trispace:wght@300;400;500;600;700;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Trispace',-apple-system,sans-serif;background:#f0f2f6;color:#1a2332;-webkit-font-smoothing:antialiased;}
.app{display:flex;height:100vh;overflow:hidden;}
.sidebar{width:220px;min-width:220px;background:#fff;border-right:1px solid #e8ecf0;display:flex;flex-direction:column;}
.sidebar-logo{padding:20px 18px 16px;border-bottom:1px solid #e8ecf0;}
.sidebar-logo .brand{font-size:20px;font-weight:900;color:#54b2e9;letter-spacing:-0.5px;}
.sidebar-logo .sub{font-size:9px;color:#9aa5b0;letter-spacing:1.5px;text-transform:uppercase;margin-top:1px;}
.sidebar-logo .empresa{font-size:12px;color:#1a2332;margin-top:10px;font-weight:600;line-height:1.3;}
.sidebar-logo .rut{font-size:10px;color:#9aa5b0;margin-top:2px;}
.sidebar-nav{flex:1;padding:8px 0;overflow-y:auto;}
.nav-section{padding:14px 16px 4px;font-size:9px;font-weight:700;color:#b0bac4;letter-spacing:1.5px;text-transform:uppercase;}
.nav-item{display:flex;align-items:center;gap:8px;padding:7px 14px 7px 16px;cursor:pointer;color:#5a6a78;font-size:12.5px;font-weight:400;transition:all 0.12s;border-left:2px solid transparent;border-radius:0 8px 8px 0;margin-right:8px;}
.nav-item:hover{color:#1a2332;background:#f5f7fa;}
.nav-item.active{color:#54b2e9;background:#edf6fd;border-left-color:#54b2e9;font-weight:600;}
.nav-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;margin-left:2px;}
.nav-badge{margin-left:auto;background:#ef4444;color:white;font-size:9px;font-weight:700;border-radius:10px;padding:1px 6px;min-width:16px;text-align:center;}
.sidebar-footer{padding:12px 16px;border-top:1px solid #e8ecf0;}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.topbar{height:50px;background:#fff;border-bottom:1px solid #e8ecf0;display:flex;align-items:center;padding:0 22px;flex-shrink:0;}
.topbar-title{font-size:14px;font-weight:700;color:#1a2332;}
.topbar-actions{margin-left:auto;display:flex;gap:8px;align-items:center;}
.content{flex:1;overflow-y:auto;padding:20px;}
.card{background:#fff;border-radius:12px;border:1px solid #e8ecf0;padding:18px;}
.card-title{font-size:13px;font-weight:700;color:#1a2332;margin-bottom:14px;}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.grid-5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;}
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;font-size:12.5px;font-weight:500;cursor:pointer;border:none;transition:all 0.12s;font-family:'Trispace',sans-serif;white-space:nowrap;}
.btn-primary{background:#54b2e9;color:#fff;} .btn-primary:hover{background:#3a8fc7;}
.btn-ghost{background:transparent;color:#3a4a58;border:1px solid #d8e0e8;} .btn-ghost:hover{background:#f5f7fa;}
.btn-danger{background:#ef4444;color:#fff;} .btn-danger:hover{background:#dc2626;}
.btn-success{background:#22c55e;color:#fff;} .btn-success:hover{background:#16a34a;}
.btn-soft{background:#edf6fd;color:#3a8fc7;border:1px solid #c5e3f5;} .btn-soft:hover{background:#dbeefb;}
.btn-sm{padding:4px 10px;font-size:11.5px;border-radius:6px;}
.btn-lg{padding:10px 20px;font-size:13.5px;border-radius:9px;}
.btn:disabled{opacity:0.4;cursor:not-allowed;}
.input-group{display:flex;flex-direction:column;gap:4px;}
.input-label{font-size:10px;font-weight:600;color:#7a8a98;letter-spacing:0.5px;text-transform:uppercase;}
.input{padding:8px 11px;border-radius:7px;border:1px solid #d8e0e8;font-size:12.5px;font-family:'Trispace',sans-serif;color:#1a2332;background:#fff;outline:none;transition:border 0.12s;width:100%;}
.input:focus{border-color:#54b2e9;box-shadow:0 0 0 3px rgba(84,178,233,0.1);}
.input::placeholder{color:#b0bac4;}
.input:read-only{background:#f8f9fb;color:#7a8a98;}
select.input{cursor:pointer;}
textarea.input{resize:vertical;min-height:68px;}
.table-wrap{overflow-x:auto;border-radius:10px;border:1px solid #e8ecf0;}
table{width:100%;border-collapse:collapse;font-size:12.5px;}
thead th{padding:8px 12px;text-align:left;font-size:9.5px;font-weight:700;color:#7a8a98;text-transform:uppercase;letter-spacing:0.8px;background:#f8f9fb;border-bottom:1px solid #e8ecf0;}
tbody td{padding:9px 12px;border-bottom:1px solid #f0f2f6;vertical-align:middle;}
tbody tr:last-child td{border-bottom:none;}
tbody tr:hover td{background:#fafbfc;}
.badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:5px;font-size:10.5px;font-weight:500;}
.badge-success{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}
.badge-danger{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;}
.badge-warning{background:#fffbeb;color:#92400e;border:1px solid #fde68a;}
.badge-info{background:#eff8ff;color:#1e6fa8;border:1px solid #bae0f9;}
.badge-navy{background:#f5f7fa;color:#3a4a58;border:1px solid #d8e0e8;}
.badge-purple{background:#faf5ff;color:#6d28d9;border:1px solid #ddd6fe;}
.stat-card{background:#fff;border-radius:12px;border:1px solid #e8ecf0;padding:16px 18px;}
.stat-label{font-size:10px;font-weight:600;color:#9aa5b0;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:5px;}
.stat-value{font-size:22px;font-weight:700;letter-spacing:-0.3px;color:#1a2332;}
.stat-sub{font-size:10.5px;color:#9aa5b0;margin-top:3px;}
.modal-overlay{position:fixed;inset:0;background:rgba(26,35,50,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(3px);}
.modal{background:#fff;border-radius:16px;width:560px;max-width:96vw;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(26,35,50,0.18);animation:modalIn 0.18s ease;}
.modal-lg{width:760px;} .modal-xl{width:960px;}
@keyframes modalIn{from{opacity:0;transform:scale(0.97) translateY(6px)}to{opacity:1;transform:none}}
.modal-header{padding:18px 22px 12px;border-bottom:1px solid #e8ecf0;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:1;}
.modal-title{font-size:15px;font-weight:700;color:#1a2332;}
.modal-body{padding:18px 22px;}
.modal-footer{padding:12px 22px;border-top:1px solid #e8ecf0;display:flex;justify-content:flex-end;gap:8px;position:sticky;bottom:0;background:#fff;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.form-full{grid-column:1/-1;}
.divider{height:1px;background:#e8ecf0;margin:12px 0;}
.alert{padding:10px 13px;border-radius:8px;font-size:12.5px;display:flex;align-items:flex-start;gap:8px;}
.alert-warning{background:#fffbeb;color:#92400e;border:1px solid #fde68a;}
.alert-danger{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;}
.alert-success{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}
.alert-info{background:#eff8ff;color:#1e6fa8;border:1px solid #bae0f9;}
.tab-bar{display:flex;border-bottom:1px solid #e8ecf0;margin-bottom:18px;}
.tab-btn{padding:8px 16px;background:none;border:none;cursor:pointer;font-size:12.5px;font-family:'Trispace',sans-serif;color:#7a8a98;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.12s;font-weight:400;}
.tab-btn.active{color:#54b2e9;border-bottom-color:#54b2e9;font-weight:600;}
.tab-btn:hover:not(.active){color:#1a2332;}
.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(138px,1fr));gap:9px;}
.product-card{background:#fff;border-radius:10px;border:1px solid #e8ecf0;padding:12px;cursor:pointer;transition:all 0.12s;display:flex;flex-direction:column;gap:4px;user-select:none;}
.product-card:hover{border-color:#54b2e9;box-shadow:0 2px 10px rgba(84,178,233,0.1);transform:translateY(-1px);}
.product-card:active{transform:scale(0.98);}
.product-name{font-size:12px;font-weight:500;line-height:1.3;color:#1a2332;}
.product-sku{font-size:9.5px;color:#b0bac4;}
.product-price{font-size:13.5px;font-weight:700;color:#54b2e9;}
.product-stock{font-size:10.5px;color:#9aa5b0;}
.product-stock.low{color:#ef4444;font-weight:600;}
.pos-layout{height:calc(100vh - 50px);display:flex;overflow:hidden;}
.pos-products{flex:1;overflow:auto;padding:14px;background:#f0f2f6;}
.pos-cart{background:#fff;border-left:1px solid #e8ecf0;display:flex;flex-direction:column;width:360px;min-width:360px;}
.pos-cart-header{padding:13px 16px;border-bottom:1px solid #e8ecf0;}
.pos-cart-items{flex:1;overflow-y:auto;}
.pos-cart-footer{border-top:1px solid #e8ecf0;padding:13px 16px;}
.cart-item{padding:9px 16px;border-bottom:1px solid #f0f2f6;}
.cart-item-name{font-size:12.5px;font-weight:500;color:#1a2332;}
.cart-item-controls{display:flex;align-items:center;gap:6px;margin-top:5px;}
.qty-btn{width:22px;height:22px;border-radius:50%;border:1px solid #d8e0e8;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all 0.1s;flex-shrink:0;color:#3a4a58;}
.qty-btn:hover{background:#54b2e9;color:#fff;border-color:#54b2e9;}
.qty-display{font-size:12.5px;font-weight:600;min-width:22px;text-align:center;}
.cart-item-price{margin-left:auto;font-size:12.5px;font-weight:600;}
.caja-banner{padding:14px 18px;border-radius:10px;display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.caja-abierta{background:#f0fdf4;border:1px solid #bbf7d0;}
.caja-cerrada{background:#fef2f2;border:1px solid #fecaca;}
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#081f2c 0%,#0d3a5c 100%);}
.login-card{background:#fff;border-radius:18px;padding:36px;width:380px;max-width:95vw;box-shadow:0 32px 80px rgba(0,0,0,0.25);}
.login-logo{font-size:26px;font-weight:900;color:#54b2e9;letter-spacing:-1px;}
.login-sub{font-size:10px;color:#9aa5b0;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:26px;margin-top:3px;}
.login-error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:7px;padding:9px 12px;font-size:12.5px;margin-bottom:12px;}
.spinner{width:26px;height:26px;border:2.5px solid #e8ecf0;border-top-color:#54b2e9;border-radius:50%;animation:spin 0.7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.toast-container{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:7px;}
.toast{background:#1a2332;color:#fff;padding:10px 14px;border-radius:9px;font-size:12.5px;font-weight:500;min-width:210px;animation:toastIn 0.22s ease;display:flex;align-items:center;gap:8px;box-shadow:0 6px 24px rgba(26,35,50,0.22);}
.toast.success{background:#166534;} .toast.error{background:#991b1b;} .toast.warning{background:#92400e;}
@keyframes toastIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
.flex{display:flex;} .items-center{align-items:center;} .justify-between{justify-content:space-between;}
.gap-6{gap:6px;} .gap-8{gap:8px;} .gap-12{gap:12px;} .w-full{width:100%;}
.text-muted{color:#9aa5b0;font-size:11.5px;} .text-danger{color:#ef4444;}
.mt-8{margin-top:8px;} .mt-16{margin-top:16px;} .mb-8{margin-bottom:8px;} .mb-16{margin-bottom:16px;}
.empty-state{text-align:center;padding:44px 20px;color:#9aa5b0;}
.empty-icon{font-size:28px;margin-bottom:8px;opacity:0.5;}
.search-bar{position:relative;display:flex;align-items:center;}
.search-icon{position:absolute;left:9px;color:#9aa5b0;font-size:13px;pointer-events:none;}
.search-input{padding-left:30px !important;}
.section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.role-chip{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;border:1px solid;}
.role-supervisor{background:#eff8ff;color:#1e6fa8;border-color:#bae0f9;}
.role-operador{background:#f5f7fa;color:#3a4a58;border-color:#d8e0e8;}
.role-bodeguero{background:#fffbeb;color:#92400e;border-color:#fde68a;}
.role-contador{background:#faf5ff;color:#6d28d9;border-color:#ddd6fe;}
`;

const fmt = {
  clp:  n  => `$${Math.round(n||0).toLocaleString("es-CL")}`,
  date: d  => d ? new Date(d+"T12:00:00").toLocaleDateString("es-CL") : "—",
  time: t  => t?.slice(0,5)||"",
  pct:  n  => `${n||0}%`,
};

// ── Input numérico con formato de miles automático ─────────────────────────
function MontoInput({ value, onChange, style, className, ...rest }) {
  const toDisplay = (v) => {
    const n = Math.round(Number(v)||0);
    return n > 0 ? n.toLocaleString("es-CL") : (v===""||v==null||v===0) ? "" : "0";
  };
  const [display, setDisplay] = React.useState(() => toDisplay(value));
  React.useEffect(() => { setDisplay(toDisplay(value)); }, [value]);
  const handle = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g,"");
    const num = parseInt(raw)||0;
    setDisplay(num>0 ? num.toLocaleString("es-CL") : raw===""?"":"0");
    onChange(num);
  };
  return <input {...rest} type="text" inputMode="numeric" className={className||"input"} style={{...style,textAlign:"right"}} value={display} onChange={handle}/>;
}


// ─── ROLES Y PERMISOS ─────────────────────────────────────────────────────────
const PERMISOS = {
  supervisor: ["dashboard","pos","caja","ventas","inventario","clientes","proveedores","gastos","reportes","configuracion","sii","mi_cuenta"],
  operador:   ["dashboard","pos","caja","ventas","clientes","mi_cuenta"],
  bodeguero:  ["dashboard","inventario","proveedores","ventas","mi_cuenta"],
  contador:   ["dashboard","ventas","gastos","reportes","sii","mi_cuenta"],
};
function puedeVer(rol, modulo) { return (PERMISOS[rol]||PERMISOS.supervisor).includes(modulo); }


const estadoBadge = {
  emitido:"badge-success", anulado:"badge-danger", pagado:"badge-info",
  borrador:"badge-navy", enviada:"badge-info", aceptada:"badge-success",
  rechazada:"badge-danger", pendiente:"badge-warning", parcial:"badge-info",
  abierta:"badge-success", cerrada:"badge-navy", vencido:"badge-danger",
};

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type="info") => {
    const id = Date.now();
    setToasts(t => [...t, {id, msg, type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, toast };
}

function Modal({ title, onClose, size, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className={`modal ${size||""}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><div>{text}</div></div>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [rut, setRut] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setError(""); if (!rut||!clave){setError("Ingresa tu RUT y clave");return;}
    setLoading(true);
    if (rut.trim()===ADMIN_RUT&&clave===ADMIN_PASS){onLogin({rol:"admin",nombre:"Huno Admin"});setLoading(false);return;}
    try { const r = await api.login(rut,clave); onLogin({rol:"cliente",...r}); }
    catch(e){ setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">HUNO®</div>
        <div className="login-sub">Arca · Sistema de Gestión</div>
        {error && <div className="login-error">⚠ {error}</div>}
        <div className="input-group" style={{marginBottom:12}}>
          <label className="input-label">RUT</label>
          <input className="input" placeholder="76.123.456-7" value={rut} onChange={e=>setRut(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        <div className="input-group" style={{marginBottom:22}}>
          <label className="input-label">Clave</label>
          <input className="input" type="password" placeholder="••••••••" value={clave} onChange={e=>setClave(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        <button className="btn btn-primary btn-lg w-full" onClick={handle} disabled={loading}>
          {loading?"Verificando...":"Ingresar"}
        </button>
      </div>
    </div>
  );
}

// ─── LOGS ADMIN ───────────────────────────────────────────────────────────────
function LogsAdmin({ empresas, toast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empFiltro, setEmpFiltro] = useState("");

  const cargar = async () => {
    setLoading(true);
    try {
      const res = empFiltro
        ? await api.logsEmpresa(empFiltro).catch(()=>[])
        : await Promise.all(empresas.slice(0,10).map(e=>api.logsEmpresa(e.id).catch(()=>[])))
            .then(r=>r.flat().sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||"")));
      setLogs(res||[]);
    } catch(e){ toast(e.message,"error"); }
    setLoading(false);
  };

  useEffect(()=>{ if(empresas.length) cargar(); },[empFiltro, empresas.length]);

  const empNombre = id => empresas.find(e=>e.id===id)?.razon_social||"—";
  const accionColor = { emitir_documento:"badge-success", login:"badge-info", ajuste_stock:"badge-warning", anular:"badge-danger", crear:"badge-navy", editar:"badge-navy" };

  const sqlHint = `CREATE TABLE IF NOT EXISTS usuarios_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid REFERENCES empresas(id),
  usuario_id uuid,
  accion text,
  modulo text,
  detalle text,
  ip text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE usuarios_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon full" ON usuarios_log FOR ALL TO anon USING (true) WITH CHECK (true);`;

  return (
    <div>
      <div className="section-header">
        <select className="input" style={{width:240}} value={empFiltro} onChange={e=>{setEmpFiltro(e.target.value);}}>
          <option value="">Todas las empresas</option>
          {empresas.map(e=><option key={e.id} value={e.id}>{e.razon_social}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={cargar}>🔄 Actualizar</button>
      </div>
      {!loading&&!logs.length&&(
        <div className="alert alert-info" style={{marginBottom:14,flexDirection:"column",alignItems:"flex-start",gap:8}}>
          <div>📋 Sin registros de actividad aún. Si la tabla no existe, ejecútala en Supabase SQL Editor:</div>
          <pre style={{fontSize:10,background:"rgba(0,0,0,0.05)",padding:10,borderRadius:6,whiteSpace:"pre-wrap",overflowX:"auto",width:"100%"}}>{sqlHint}</pre>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Fecha/Hora</th><th>Empresa</th><th>Módulo</th><th>Acción</th><th>Detalle</th></tr></thead>
          <tbody>{logs.map((l,i)=>(
            <tr key={l.id||i}>
              <td style={{fontSize:11,color:"#9aa5b0",whiteSpace:"nowrap"}}>{l.created_at?new Date(l.created_at).toLocaleString("es-CL"):"—"}</td>
              <td style={{fontSize:12}}>{empNombre(l.empresa_id)}</td>
              <td><span className="badge badge-navy" style={{fontSize:10}}>{l.modulo||"—"}</span></td>
              <td><span className={`badge ${accionColor[l.accion]||"badge-navy"}`} style={{fontSize:10}}>{l.accion||"—"}</span></td>
              <td style={{fontSize:12,color:"#5a6a78",maxWidth:320}}>{l.detalle||"—"}</td>
            </tr>
          ))}</tbody>
        </table>
        {loading&&<div style={{padding:30,textAlign:"center"}}><div className="spinner" style={{margin:"0 auto"}}/></div>}
        {!loading&&logs.length===0&&<EmptyState icon="📋" text="Sin actividad registrada"/>}
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ toast }) {
  const [tab, setTab] = useState("empresas");
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const cargar = async () => {
    setLoading(true);
    try { const [e,u] = await Promise.all([api.todasEmpresas(), api.todosUsuarios()]); setEmpresas(e||[]); setUsuarios(u||[]); }
    catch(e){toast(e.message,"error");}
    setLoading(false);
  };
  useEffect(()=>{cargar();},[]);

  const guardarEmpresa = async () => {
    if(!form.razon_social||!form.rut){toast("Razón social y RUT requeridos","error");return;}
    setSaving(true);
    try {
      if(form.id) await api.updateEmpresa(form.id, form);
      else await api.createEmpresa({...form, config_impresora:form.config_impresora||"termica", config_ancho_papel:form.config_ancho_papel||80, stock_critico_global:5, activa:true});
      await cargar(); setModal(null); toast(form.id?"Empresa actualizada":"Empresa creada","success");
    } catch(e){toast(e.message,"error");} setSaving(false);
  };

  const guardarUsuario = async () => {
    if(!form.nombre||!form.rut||!form.clave||!form.empresa_id){toast("Todos los campos son requeridos","error");return;}
    setSaving(true);
    try {
      if(form.id) await api.updateUsuario(form.id, form);
      else await api.createUsuario({...form, rol:form.rol||"operador", activo:true});
      await cargar(); setModal(null); toast(form.id?"Usuario actualizado":"Usuario creado","success");
    } catch(e){toast(e.message,"error");} setSaving(false);
  };

  const empNombre = id => empresas.find(e=>e.id===id)?.razon_social||"—";

  return (
    <div style={{padding:24}}>
      <div style={{background:"#081f2c",borderRadius:14,padding:"18px 22px",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:30}}>🏢</div>
        <div>
          <div style={{fontWeight:700,fontSize:15,color:"#fff"}}>Panel Administrador — HUNO® Arca</div>
          <div style={{fontSize:11,color:"#9aa5b0",marginTop:2}}>{empresas.length} empresas · {usuarios.length} usuarios</div>
        </div>
      </div>
      <div className="tab-bar">
        {[["empresas","🏢 Empresas"],["usuarios","👤 Usuarios y Claves"],["logs","📋 Actividad"]].map(([k,l])=>(
          <button key={k} className={`tab-btn ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="empresas" && <>
        <div className="section-header">
          <div className="text-muted">{empresas.length} empresas</div>
          <button className="btn btn-primary" onClick={()=>{setForm({config_impresora:"termica",config_ancho_papel:80});setModal("empresa");}}>＋ Nueva empresa</button>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>Razón Social</th><th>RUT</th><th>Giro</th><th>Usuarios</th><th>Estado</th><th></th></tr></thead>
          <tbody>{empresas.map(e=>(
            <tr key={e.id}>
              <td style={{fontWeight:600}}>{e.razon_social}</td>
              <td style={{color:"#9aa5b0",fontSize:12}}>{e.rut}</td>
              <td style={{color:"#9aa5b0",fontSize:12}}>{e.giro||"—"}</td>
              <td style={{color:"#9aa5b0"}}>{usuarios.filter(u=>u.empresa_id===e.id).length}</td>
              <td><span className={`badge ${e.activa?"badge-success":"badge-danger"}`}>{e.activa?"Activa":"Inactiva"}</span></td>
              <td><button className="btn btn-ghost btn-sm" onClick={()=>{setForm({...e});setModal("empresa");}}>Editar</button></td>
            </tr>
          ))}</tbody>
        </table>
        {loading&&<div style={{padding:30,textAlign:"center"}}><div className="spinner" style={{margin:"0 auto"}}/></div>}
        {!loading&&!empresas.length&&<EmptyState icon="🏢" text="Sin empresas"/>}
        </div>
      </>}

      {tab==="usuarios" && <>
        <div className="section-header">
          <div className="text-muted">{usuarios.length} usuarios</div>
          <button className="btn btn-primary" onClick={()=>{setForm({rol:"operador",activo:true});setModal("usuario");}}>＋ Nuevo usuario</button>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>Nombre</th><th>RUT</th><th>Empresa</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>{usuarios.map(u=>(
            <tr key={u.id}>
              <td style={{fontWeight:500}}>{u.nombre} {u.apellido||""}</td>
              <td style={{color:"#9aa5b0",fontSize:12}}>{u.rut}</td>
              <td style={{fontSize:12}}>{empNombre(u.empresa_id)}</td>
              <td><span className={`badge ${u.rol==="supervisor"?"badge-info":"badge-navy"}`}>{u.rol}</span></td>
              <td><span className={`badge ${u.activo?"badge-success":"badge-danger"}`}>{u.activo?"Activo":"Inactivo"}</span></td>
              <td><div className="flex gap-6" style={{gap:6}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>{setForm({...u});setModal("usuario");}}>Editar</button>
                <button className="btn btn-ghost btn-sm text-danger" onClick={async()=>{if(!confirm("¿Eliminar?"))return;try{await api.deleteUsuario(u.id);await cargar();toast("Eliminado");}catch(e){toast(e.message,"error");}}}>✕</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {loading&&<div style={{padding:30,textAlign:"center"}}><div className="spinner" style={{margin:"0 auto"}}/></div>}
        {!loading&&!usuarios.length&&<EmptyState icon="👤" text="Sin usuarios"/>}
        </div>
      </>}

      {tab==="logs" && <LogsAdmin empresas={empresas} toast={toast}/>}

            {modal==="empresa"&&<Modal title={form.id?"Editar empresa":"Nueva empresa"} onClose={()=>setModal(null)} size="modal-lg"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardarEmpresa} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></>}>
        <div className="form-grid">
          <div className="input-group form-full"><label className="input-label">Razón Social *</label><input className="input" value={form.razon_social||""} onChange={e=>F("razon_social",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">RUT *</label><input className="input" value={form.rut||""} onChange={e=>F("rut",e.target.value)} placeholder="76.123.456-7"/></div>
          <div className="input-group"><label className="input-label">Giro</label><input className="input" value={form.giro||""} onChange={e=>F("giro",e.target.value)}/></div>
          <div className="input-group form-full"><label className="input-label">Dirección</label><input className="input" value={form.direccion||""} onChange={e=>F("direccion",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Ciudad</label><input className="input" value={form.ciudad||""} onChange={e=>F("ciudad",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Teléfono</label><input className="input" value={form.telefono||""} onChange={e=>F("telefono",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Email</label><input className="input" value={form.email||""} onChange={e=>F("email",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Resolución SII</label><input className="input" value={form.resolucion_sii||""} onChange={e=>F("resolucion_sii",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Formato impresión</label>
            <select className="input" value={form.config_impresora||"termica"} onChange={e=>F("config_impresora",e.target.value)}>
              <option value="termica">Térmica</option><option value="carta">Carta</option><option value="oficio">Oficio</option><option value="a4">A4</option>
            </select></div>
          <div className="input-group"><label className="input-label">Ancho térmica (mm)</label>
            <select className="input" value={form.config_ancho_papel||80} onChange={e=>F("config_ancho_papel",parseInt(e.target.value))}>
              <option value={58}>58mm</option><option value={80}>80mm</option><option value={114}>114mm</option>
            </select></div>
          <div className="input-group form-full"><label className="input-label">Pie de documento</label><input className="input" value={form.config_pie_boleta||""} onChange={e=>F("config_pie_boleta",e.target.value)}/></div>
          {form.id&&<div className="input-group"><label className="input-label">Estado</label>
            <select className="input" value={form.activa?"si":"no"} onChange={e=>F("activa",e.target.value==="si")}>
              <option value="si">Activa</option><option value="no">Inactiva</option>
            </select></div>}
        </div>
      </Modal>}

      {modal==="usuario"&&<Modal title={form.id?"Editar usuario":"Nuevo usuario"} onClose={()=>setModal(null)}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardarUsuario} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></>}>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">Nombre *</label><input className="input" value={form.nombre||""} onChange={e=>F("nombre",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Apellido</label><input className="input" value={form.apellido||""} onChange={e=>F("apellido",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">RUT (login) *</label><input className="input" value={form.rut||""} onChange={e=>F("rut",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Clave *</label><input className="input" value={form.clave||""} onChange={e=>F("clave",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Empresa *</label>
            <select className="input" value={form.empresa_id||""} onChange={e=>F("empresa_id",e.target.value)}>
              <option value="">— Seleccionar —</option>
              {empresas.map(e=><option key={e.id} value={e.id}>{e.razon_social}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">Rol</label>
            <select className="input" value={form.rol||"operador"} onChange={e=>F("rol",e.target.value)}>
              <option value="operador">Operador</option><option value="supervisor">Supervisor</option>
              <option value="contador">Contador</option><option value="bodeguero">Bodeguero</option>
            </select></div>
          {form.id&&<div className="input-group"><label className="input-label">Estado</label>
            <select className="input" value={form.activo?"si":"no"} onChange={e=>F("activo",e.target.value==="si")}>
              <option value="si">Activo</option><option value="no">Inactivo</option>
            </select></div>}
        </div>
        <div className="alert alert-info" style={{marginTop:14}}>El usuario ingresa con RUT y clave definidos aquí.</div>
      </Modal>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ empresa, docs, productos, clientes, gastos }) {
  const hoy = new Date().toISOString().slice(0,10);
  const mes = hoy.slice(0,7);
  const docsHoy = docs.filter(d=>d.fecha===hoy&&d.estado!=="anulado");
  const docsMes = docs.filter(d=>d.fecha?.slice(0,7)===mes&&d.estado!=="anulado");
  const ventasHoy = docsHoy.reduce((s,d)=>s+d.total,0);
  const ventasMes = docsMes.reduce((s,d)=>s+d.total,0);
  const gastosMes = gastos.filter(g=>g.fecha?.slice(0,7)===mes).reduce((s,g)=>s+g.total,0);
  const utilidad = ventasMes - gastosMes;
  const criticos = productos.filter(p=>p.stock<=p.stock_critico&&p.activo);
  const agotados = productos.filter(p=>p.stock===0&&p.activo);

  return (
    <div>
      <div className="grid-4" style={{marginBottom:16}}>
        {[
          {label:"Ventas hoy",value:fmt.clp(ventasHoy),sub:`${docsHoy.length} documentos`,color:"#54b2e9"},
          {label:"Ventas del mes",value:fmt.clp(ventasMes),sub:`${docsMes.length} documentos`},
          {label:"Gastos del mes",value:fmt.clp(gastosMes),sub:"egresos registrados",color:"#ef4444"},
          {label:"Utilidad estimada",value:fmt.clp(utilidad),color:utilidad>=0?"#22c55e":"#ef4444"},
        ].map((s,i)=>(
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color:s.color||"#081f2c"}}>{s.value}</div>
            {s.sub&&<div className="stat-sub">{s.sub}</div>}
          </div>
        ))}
      </div>
      <div className="grid-5" style={{marginBottom:16}}>
        {[
          {label:"Productos",value:productos.filter(p=>p.activo).length,icon:"·"},
          {label:"Clientes",value:clientes.length,icon:"·"},
          {label:"Stock crítico",value:criticos.length,icon:"⚠️",color:criticos.length>0?"#f59e0b":undefined},
          {label:"Agotados",value:agotados.length,icon:"🚫",color:agotados.length>0?"#ef4444":undefined},
          {label:"Docs hoy",value:docsHoy.length,icon:"·"},
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{padding:"14px 16px"}}>
            <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:700,color:s.color||"#081f2c"}}>{s.value}</div>
            <div className="stat-sub">{s.label}</div>
          </div>
        ))}
      </div>

      {(criticos.length>0||agotados.length>0)&&(
        <div className="alert alert-warning" style={{marginBottom:16}}>
          ⚠️<div>
            {agotados.length>0&&<div><strong>Agotados:</strong> {agotados.map(p=>p.nombre).join(", ")}</div>}
            {criticos.filter(p=>p.stock>0).length>0&&<div><strong>Stock bajo:</strong> {criticos.filter(p=>p.stock>0).map(p=>`${p.nombre} (${p.stock})`).join(", ")}</div>}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Últimas ventas</div>
          {docs.filter(d=>d.estado!=="anulado").slice(0,8).map(d=>(
            <div key={d.id} className="flex justify-between items-center" style={{padding:"7px 0",borderBottom:"1px solid #f0f2f6"}}>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{d.tipo_documento==="boleta"?"Boleta":"Factura"} #{d.folio}</div>
                <div className="text-muted">{fmt.date(d.fecha)} · {d.cliente_nombre||"Sin cliente"}</div>
              </div>
              <div style={{fontWeight:700,color:"#54b2e9",fontSize:13}}>{fmt.clp(d.total)}</div>
            </div>
          ))}
          {!docs.length&&<EmptyState icon="📄" text="Sin ventas aún"/>}
        </div>
        <div className="card">
          <div className="card-title">Clientes recientes</div>
          {clientes.slice(0,8).map(c=>(
            <div key={c.id} className="flex justify-between items-center" style={{padding:"7px 0",borderBottom:"1px solid #f0f2f6"}}>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{c.nombre}{c.apellido?" "+c.apellido:""}</div>
                <div className="text-muted">{c.rut||"Sin RUT"}</div>
              </div>
              <span className={`badge ${c.categoria==="vip"?"badge-warning":c.categoria==="mayorista"?"badge-info":"badge-navy"}`}>{c.categoria||"normal"}</span>
            </div>
          ))}
          {!clientes.length&&<EmptyState icon="👥" text="Sin clientes"/>}
        </div>
      </div>
    </div>
  );
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
function Clientes({ empresa, clientes, onRefresh, toast }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [detalleId, setDetalleId] = useState(null);
  const [actividad, setActividad] = useState([]);
  const [actForm, setActForm] = useState({tipo:"nota",descripcion:""});
  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const filtered = clientes.filter(c=>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.rut?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase())
  );
  const detalle = clientes.find(c=>c.id===detalleId);

  const abrirDetalle = async (c) => {
    setDetalleId(c.id);
    setActividad(await api.actividadCliente(c.id).catch(()=>[]));
  };

  const guardar = async () => {
    if(!form.nombre){toast("El nombre es requerido","error");return;}
    setSaving(true);
    try {
      if(form.id) await api.updateCliente(form.id, form);
      else await api.createCliente({...form, empresa_id:empresa.id});
      await onRefresh(); setModal(null); toast(form.id?"Cliente actualizado":"Cliente creado","success");
    } catch(e){toast(e.message,"error");} setSaving(false);
  };

  const guardarActividad = async () => {
    if(!actForm.descripcion){toast("Ingresa una descripción","error");return;}
    try {
      await api.createActividad({...actForm, empresa_id:empresa.id, cliente_id:detalleId, fecha:new Date().toISOString().slice(0,10)});
      setActividad(await api.actividadCliente(detalleId).catch(()=>[]));
      setActForm({tipo:"nota",descripcion:""});
      toast("Actividad registrada","success");
    } catch(e){toast(e.message,"error");}
  };

  const eliminar = async (c) => {
    if(!confirm(`¿Eliminar cliente "${c.nombre}"?`))return;
    try{await api.deleteCliente(c.id);await onRefresh();toast("Eliminado");}catch(e){toast(e.message,"error");}
  };

  const tipoActIcon = {nota:"📝",llamada:"📞",email:"📧",visita:"🚗",compra:"🛒",pago:"💳",reclamo:"⚠️"};

  return (
    <div>
      <div className="section-header">
        <div className="search-bar" style={{flex:1,maxWidth:320}}>
          <span className="search-icon">🔍</span>
          <input className="input search-input" placeholder="Nombre, RUT o email..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <button className="btn btn-primary" onClick={()=>{setForm({tipo:"persona",categoria:"normal"});setModal("cliente");}}>＋ Nuevo cliente</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>RUT</th><th>Email</th><th>Teléfono</th><th>Ciudad</th><th>Categoría</th><th>Crédito</th><th></th></tr></thead>
          <tbody>{filtered.map(c=>(
            <tr key={c.id}>
              <td style={{fontWeight:500}}>{c.nombre}{c.apellido?" "+c.apellido:""}</td>
              <td style={{color:"#9aa5b0",fontSize:12}}>{c.rut||"—"}</td>
              <td style={{color:"#9aa5b0",fontSize:12}}>{c.email||"—"}</td>
              <td style={{color:"#9aa5b0",fontSize:12}}>{c.telefono||"—"}</td>
              <td style={{color:"#9aa5b0",fontSize:12}}>{c.ciudad||"—"}</td>
              <td><span className={`badge ${c.categoria==="vip"?"badge-warning":c.categoria==="mayorista"?"badge-info":"badge-navy"}`}>{c.categoria||"normal"}</span></td>
              <td style={{fontSize:12}}>{c.dias_credito>0?`${c.dias_credito} días`:"—"}</td>
              <td>
                <div className="flex gap-6" style={{gap:6}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>abrirDetalle(c)}>Ver</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setForm({...c});setModal("cliente");}}>✏</button>
                  <button className="btn btn-ghost btn-sm text-danger" onClick={()=>eliminar(c)}>✕</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {!filtered.length&&<EmptyState icon="👥" text="Sin clientes"/>}
      </div>

      {modal==="cliente"&&<Modal title={form.id?"Editar cliente":"Nuevo cliente"} onClose={()=>setModal(null)} size="modal-lg"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></>}>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">Nombre *</label><input className="input" value={form.nombre||""} onChange={e=>F("nombre",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Apellido</label><input className="input" value={form.apellido||""} onChange={e=>F("apellido",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">RUT</label><input className="input" value={form.rut||""} onChange={e=>F("rut",e.target.value)} placeholder="12.345.678-9"/></div>
          <div className="input-group"><label className="input-label">Tipo</label>
            <select className="input" value={form.tipo||"persona"} onChange={e=>F("tipo",e.target.value)}>
              <option value="persona">Persona natural</option><option value="empresa">Empresa</option>
            </select></div>
          {form.tipo==="empresa"&&<div className="input-group form-full"><label className="input-label">Razón social</label><input className="input" value={form.razon_social||""} onChange={e=>F("razon_social",e.target.value)}/></div>}
          <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email||""} onChange={e=>F("email",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Teléfono</label><input className="input" value={form.telefono||""} onChange={e=>F("telefono",e.target.value)}/></div>
          <div className="input-group form-full"><label className="input-label">Dirección</label><input className="input" value={form.direccion||""} onChange={e=>F("direccion",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Ciudad</label><input className="input" value={form.ciudad||""} onChange={e=>F("ciudad",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Giro</label><input className="input" value={form.giro||""} onChange={e=>F("giro",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Categoría</label>
            <select className="input" value={form.categoria||"normal"} onChange={e=>F("categoria",e.target.value)}>
              <option value="normal">Normal</option><option value="mayorista">Mayorista</option><option value="vip">VIP</option>
            </select></div>
          <div className="input-group"><label className="input-label">Descuento automático (%)</label><input className="input" type="number" min={0} max={100} value={form.descuento_auto||0} onChange={e=>F("descuento_auto",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Días de crédito</label><input className="input" type="number" min={0} value={form.dias_credito||0} onChange={e=>F("dias_credito",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Límite de crédito</label><input className="input" type="number" min={0} value={form.limite_credito||0} onChange={e=>F("limite_credito",e.target.value)}/></div>
          <div className="input-group form-full"><label className="input-label">Notas</label><textarea className="input" value={form.notas||""} onChange={e=>F("notas",e.target.value)}/></div>
        </div>
      </Modal>}

      {detalleId&&detalle&&<Modal title={`${detalle.nombre}${detalle.apellido?" "+detalle.apellido:""}`} onClose={()=>setDetalleId(null)} size="modal-xl"
        footer={<><button className="btn btn-ghost" onClick={()=>{setForm({...detalle});setModal("cliente");setDetalleId(null);}}>✏ Editar</button><button className="btn btn-ghost" onClick={()=>setDetalleId(null)}>Cerrar</button></>}>
        <div className="grid-2" style={{marginBottom:16}}>
          <div className="card" style={{padding:14}}>
            {[["RUT",detalle.rut],["Email",detalle.email],["Teléfono",detalle.telefono],["Dirección",detalle.direccion],["Ciudad",detalle.ciudad],["Giro",detalle.giro]].map(([l,v])=>v?(
              <div key={l} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid #f0f2f6",fontSize:13}}>
                <span style={{color:"#9aa5b0",minWidth:70}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
              </div>
            ):null)}
          </div>
          <div className="card" style={{padding:14}}>
            {[["Categoría",detalle.categoria||"normal"],["Desc. auto",fmt.pct(detalle.descuento_auto)],["Días crédito",detalle.dias_credito||0],["Límite crédito",fmt.clp(detalle.limite_credito)]].map(([l,v])=>(
              <div key={l} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid #f0f2f6",fontSize:13}}>
                <span style={{color:"#9aa5b0",minWidth:90}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
              </div>
            ))}
            {detalle.notas&&<div style={{marginTop:10,fontSize:12,color:"#5a6a78",background:"#f0f2f6",borderRadius:8,padding:10}}>{detalle.notas}</div>}
          </div>
        </div>

        <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Historial CRM</div>
        <div style={{display:"grid",gridTemplateColumns:"150px 1fr auto",gap:8,marginBottom:14,alignItems:"end"}}>
          <div className="input-group"><label className="input-label">Tipo</label>
            <select className="input" value={actForm.tipo} onChange={e=>setActForm(f=>({...f,tipo:e.target.value}))}>
              {["nota","llamada","email","visita","compra","pago","reclamo"].map(t=><option key={t} value={t}>{t}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">Descripción</label>
            <input className="input" value={actForm.descripcion} onChange={e=>setActForm(f=>({...f,descripcion:e.target.value}))} placeholder="Registrar actividad..."/></div>
          <button className="btn btn-primary btn-sm" onClick={guardarActividad}>＋</button>
        </div>
        <div style={{maxHeight:260,overflowY:"auto"}}>
          {actividad.map(a=>(
            <div key={a.id} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:"1px solid #f0f2f6",alignItems:"flex-start"}}>
              <span style={{fontSize:18}}>{tipoActIcon[a.tipo]||"📝"}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>{a.descripcion}</div>
                <div className="text-muted">{fmt.date(a.fecha)} · {a.tipo}</div>
              </div>
            </div>
          ))}
          {!actividad.length&&<div className="text-muted" style={{textAlign:"center",padding:20}}>Sin actividad registrada</div>}
        </div>
      </Modal>}
    </div>
  );
}

// ─── PROVEEDORES ──────────────────────────────────────────────────────────────
function Proveedores({ empresa, onRefresh, toast }) {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const cargar = async () => { setLoading(true); try{setProveedores(await api.proveedores(empresa.id)||[]);}catch(e){toast(e.message,"error");} setLoading(false); };
  useEffect(()=>{cargar();},[]);

  const guardar = async () => {
    if(!form.nombre){toast("El nombre es requerido","error");return;}
    setSaving(true);
    try {
      if(form.id) await api.updateProveedor(form.id,form);
      else await api.createProveedor({...form,empresa_id:empresa.id,activo:true});
      await cargar(); setModal(false); toast("Proveedor guardado","success");
    } catch(e){toast(e.message,"error");} setSaving(false);
  };

  return (
    <div>
      <div className="section-header">
        <div className="text-muted">{proveedores.length} proveedores</div>
        <button className="btn btn-primary" onClick={()=>{setForm({dias_pago:30});setModal(true);}}>＋ Nuevo proveedor</button>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Nombre</th><th>RUT</th><th>Contacto</th><th>Email</th><th>Teléfono</th><th>Días pago</th><th>Estado</th><th></th></tr></thead>
        <tbody>{proveedores.map(p=>(
          <tr key={p.id}>
            <td style={{fontWeight:500}}>{p.nombre}</td>
            <td style={{color:"#9aa5b0",fontSize:12}}>{p.rut||"—"}</td>
            <td style={{fontSize:12}}>{p.contacto||"—"}</td>
            <td style={{color:"#9aa5b0",fontSize:12}}>{p.email||"—"}</td>
            <td style={{color:"#9aa5b0",fontSize:12}}>{p.telefono||"—"}</td>
            <td style={{fontSize:12}}>{p.dias_pago} días</td>
            <td><span className={`badge ${p.activo?"badge-success":"badge-danger"}`}>{p.activo?"Activo":"Inactivo"}</span></td>
            <td><div className="flex gap-6" style={{gap:6}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setForm({...p});setModal(true);}}>Editar</button>
              <button className="btn btn-ghost btn-sm text-danger" onClick={async()=>{if(!confirm("¿Eliminar?"))return;try{await api.deleteProveedor(p.id);await cargar();toast("Eliminado");}catch(e){toast(e.message,"error");}}}>✕</button>
            </div></td>
          </tr>
        ))}</tbody>
      </table>
      {loading&&<div style={{padding:30,textAlign:"center"}}><div className="spinner" style={{margin:"0 auto"}}/></div>}
      {!loading&&!proveedores.length&&<EmptyState icon="·" text="Sin proveedores"/>}
      </div>

      {modal&&<Modal title={form.id?"Editar proveedor":"Nuevo proveedor"} onClose={()=>setModal(false)} size="modal-lg"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={guardar} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></>}>
        <div className="form-grid">
          <div className="input-group form-full"><label className="input-label">Nombre / Razón social *</label><input className="input" value={form.nombre||""} onChange={e=>F("nombre",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">RUT</label><input className="input" value={form.rut||""} onChange={e=>F("rut",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Giro</label><input className="input" value={form.giro||""} onChange={e=>F("giro",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Nombre contacto</label><input className="input" value={form.contacto||""} onChange={e=>F("contacto",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Email</label><input className="input" value={form.email||""} onChange={e=>F("email",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Teléfono</label><input className="input" value={form.telefono||""} onChange={e=>F("telefono",e.target.value)}/></div>
          <div className="input-group form-full"><label className="input-label">Dirección</label><input className="input" value={form.direccion||""} onChange={e=>F("direccion",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Ciudad</label><input className="input" value={form.ciudad||""} onChange={e=>F("ciudad",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Días de pago</label><input className="input" type="number" value={form.dias_pago||30} onChange={e=>F("dias_pago",parseInt(e.target.value))}/></div>
          <div className="input-group form-full"><label className="input-label">Notas</label><textarea className="input" value={form.notas||""} onChange={e=>F("notas",e.target.value)}/></div>
        </div>
      </Modal>}
    </div>
  );
}

// ─── INVENTARIO ───────────────────────────────────────────────────────────────
function Inventario({ empresa, productos, onRefresh, toast }) {
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [search, setSearch] = useState("");
  const [filtroCateg, setFiltroCateg] = useState("");
  const [modal, setModal] = useState(null);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tabMov, setTabMov] = useState(false);
  const [movs, setMovs] = useState([]);
  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(()=>{
    api.categorias(empresa.id).then(r=>setCategorias(r||[]));
    api.marcas(empresa.id).then(r=>setMarcas(r||[]));
  },[]);

  const filtered = productos.filter(p=>{
    const q=search.toLowerCase();
    const matchQ=!q||p.nombre?.toLowerCase().includes(q)||p.codigo?.toLowerCase().includes(q)||p.codigo_barra?.includes(q);
    const matchC=!filtroCateg||p.categoria_id===filtroCateg;
    return matchQ&&matchC;
  });

  const guardar = async () => {
    if(!form.nombre||!form.precio_venta){toast("Nombre y precio venta requeridos","error");return;}
    setSaving(true);
    try {
      const d={...form,empresa_id:empresa.id,
        precio_compra:parseFloat(form.precio_compra)||0,
        precio_venta:parseFloat(form.precio_venta),
        stock:parseInt(form.stock)||0,
        stock_critico:parseInt(form.stock_critico)||5,
        impuesto_adicional:parseFloat(form.impuesto_adicional)||0,
      };
      if(editando) await api.updateProducto(editando.id,d);
      else await api.createProducto(d);
      await onRefresh(); setModal(null); toast(editando?"Producto actualizado":"Producto creado","success");
    } catch(e){toast(e.message,"error");} setSaving(false);
  };

  const ajustarStock = async (p, delta) => {
    const nuevo = p.stock + delta;
    if(nuevo<0){toast("Stock no puede ser negativo","error");return;}
    try {
      await api.updateProducto(p.id,{stock:nuevo});
      await api.createMovInventario({empresa_id:empresa.id,producto_id:p.id,tipo:delta>0?"entrada":"salida",cantidad:delta,stock_anterior:p.stock,stock_nuevo:nuevo,nota:"Ajuste manual"});
      await onRefresh(); toast("Stock actualizado","success");
    } catch(e){toast(e.message,"error");}
  };

  const verMovimientos = async () => {
    setTabMov(true);
    setMovs(await api.movInventario(empresa.id,200).catch(()=>[]));
  };

  const prodNombre = id => productos.find(p=>p.id===id)?.nombre||"—";

  return (
    <div>
      <div className="tab-bar">
        <button className={`tab-btn ${!tabMov?"active":""}`} onClick={()=>setTabMov(false)}>📦 Productos</button>
        <button className={`tab-btn ${tabMov?"active":""}`} onClick={verMovimientos}>🔄 Movimientos</button>
      </div>

      {!tabMov&&<>
        <div className="section-header">
          <div className="flex gap-8" style={{gap:8,flex:1}}>
            <div className="search-bar" style={{flex:1,maxWidth:280}}>
              <span className="search-icon">🔍</span>
              <input className="input search-input" placeholder="Nombre, código, barra..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="input" style={{width:160}} value={filtroCateg} onChange={e=>setFiltroCateg(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={()=>{setEditando(null);setForm({tipo:"producto",unidad:"unidad",afecto_iva:true,activo:true,stock_critico:5,impuesto_adicional:0});setModal("producto");}}>＋ Nuevo</button>
        </div>

        <div className="table-wrap"><table>
          <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>P.Compra</th><th>P.Venta</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th></th></tr></thead>
          <tbody>{filtered.map(p=>{
            const crit=p.stock<=p.stock_critico;
            const catNom=categorias.find(c=>c.id===p.categoria_id)?.nombre||"—";
            return (
              <tr key={p.id}>
                <td style={{color:"#9aa5b0",fontSize:11}}>{p.codigo||p.codigo_barra||"—"}</td>
                <td style={{fontWeight:500}}>{p.nombre}</td>
                <td style={{fontSize:12,color:"#9aa5b0"}}>{catNom}</td>
                <td style={{fontSize:12}}>{fmt.clp(p.precio_compra)}</td>
                <td style={{fontWeight:600,color:"#54b2e9"}}>{fmt.clp(p.precio_venta)}</td>
                <td><span style={{fontWeight:700,color:p.stock===0?"#ef4444":crit?"#f59e0b":"#081f2c"}}>{p.stock}</span><span style={{fontSize:10,color:"#9aa5b0",marginLeft:3}}>{p.unidad}</span></td>
                <td style={{fontSize:12,color:"#9aa5b0"}}>{p.stock_critico}</td>
                <td>
                  {p.activo?<span className="badge badge-success">Activo</span>:<span className="badge badge-navy">Inactivo</span>}
                  {p.stock===0&&<span className="badge badge-danger" style={{marginLeft:3}}>Agotado</span>}
                  {crit&&p.stock>0&&<span className="badge badge-warning" style={{marginLeft:3}}>⚠</span>}
                </td>
                <td><div className="flex gap-6" style={{gap:4}}>
                  <button className="btn btn-ghost btn-sm" style={{padding:"3px 7px"}} title="Ajustar stock" onClick={()=>{const d=parseInt(prompt("Cantidad a ajustar (negativo=salida):","0")||"0");if(d!==0)ajustarStock(p,d);}}>±</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setEditando(p);setForm({...p});setModal("producto");}}>✏</button>
                  <button className="btn btn-ghost btn-sm text-danger" onClick={async()=>{if(!confirm(`¿Eliminar "${p.nombre}"?`))return;try{await api.deleteProducto(p.id);await onRefresh();toast("Eliminado");}catch(e){toast(e.message,"error");}}}>✕</button>
                </div></td>
              </tr>
            );
          })}</tbody>
        </table>
        {!filtered.length&&<EmptyState icon="📦" text="Sin productos"/>}
        </div>
      </>}

      {tabMov&&<>
        <div className="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Stock ant.</th><th>Stock nuevo</th><th>Nota</th></tr></thead>
          <tbody>{movs.map(m=>(
            <tr key={m.id}>
              <td style={{fontSize:11,color:"#9aa5b0"}}>{fmt.date(m.created_at?.slice(0,10))}</td>
              <td style={{fontWeight:500,fontSize:12}}>{prodNombre(m.producto_id)}</td>
              <td><span className={`badge ${m.tipo==="entrada"||m.tipo==="compra"?"badge-success":m.tipo==="venta"||m.tipo==="salida"?"badge-danger":"badge-navy"}`}>{m.tipo}</span></td>
              <td style={{fontWeight:600,color:m.cantidad>0?"#22c55e":"#ef4444"}}>{m.cantidad>0?"+":""}{m.cantidad}</td>
              <td style={{fontSize:12,color:"#9aa5b0"}}>{m.stock_anterior}</td>
              <td style={{fontSize:12,fontWeight:500}}>{m.stock_nuevo}</td>
              <td style={{fontSize:11,color:"#9aa5b0"}}>{m.nota||"—"}</td>
            </tr>
          ))}</tbody>
        </table>
        {!movs.length&&<EmptyState icon="🔄" text="Sin movimientos"/>}
        </div>
      </>}

      {modal==="producto"&&<Modal title={editando?"Editar producto":"Nuevo producto"} onClose={()=>setModal(null)} size="modal-xl"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={guardar} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></>}>
        <div className="form-grid">
          <div className="input-group form-full"><label className="input-label">Nombre *</label><input className="input" value={form.nombre||""} onChange={e=>F("nombre",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Código / SKU</label><input className="input" value={form.codigo||""} onChange={e=>F("codigo",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Código de barra</label><input className="input" value={form.codigo_barra||""} onChange={e=>F("codigo_barra",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Tipo</label>
            <select className="input" value={form.tipo||"producto"} onChange={e=>F("tipo",e.target.value)}>
              <option value="producto">Producto</option><option value="servicio">Servicio</option><option value="pack">Pack</option>
            </select></div>
          <div className="input-group"><label className="input-label">Unidad</label>
            <select className="input" value={form.unidad||"unidad"} onChange={e=>F("unidad",e.target.value)}>
              {["unidad","kg","g","l","ml","caja","paquete","bolsa","metro","par"].map(u=><option key={u} value={u}>{u}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">Categoría</label>
            <select className="input" value={form.categoria_id||""} onChange={e=>F("categoria_id",e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">Marca</label>
            <select className="input" value={form.marca_id||""} onChange={e=>F("marca_id",e.target.value)}>
              <option value="">Sin marca</option>
              {marcas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select></div>
          <div className="input-group form-full"><label className="input-label">Descripción</label><textarea className="input" style={{minHeight:56}} value={form.descripcion||""} onChange={e=>F("descripcion",e.target.value)}/></div>
          <div style={{gridColumn:"1/-1"}}><div className="divider"/><div style={{fontWeight:600,fontSize:11,color:"#5a6a78",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>Precios</div></div>
          <div className="input-group"><label className="input-label">Precio compra (neto)</label><input className="input" type="number" value={form.precio_compra||""} onChange={e=>F("precio_compra",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Precio venta (neto) *</label><input className="input" type="number" value={form.precio_venta||""} onChange={e=>F("precio_venta",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">IVA</label>
            <select className="input" value={form.afecto_iva?"si":"no"} onChange={e=>F("afecto_iva",e.target.value==="si")}>
              <option value="si">Afecto (19%)</option><option value="no">Exento</option>
            </select></div>
          <div className="input-group"><label className="input-label">Impuesto adicional (%)</label><input className="input" type="number" step="0.1" value={form.impuesto_adicional||0} onChange={e=>F("impuesto_adicional",e.target.value)}/></div>
          {form.precio_venta&&<div className="input-group form-full"><div className="alert alert-info">Con IVA: <strong>{fmt.clp(parseFloat(form.precio_venta||0)*1.19)}</strong>{form.precio_compra&&parseFloat(form.precio_compra)>0?` · Margen: ${Math.round((parseFloat(form.precio_venta)-parseFloat(form.precio_compra))/parseFloat(form.precio_venta)*100)}%`:""}</div></div>}
          <div style={{gridColumn:"1/-1"}}><div className="divider"/><div style={{fontWeight:600,fontSize:11,color:"#5a6a78",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>Inventario</div></div>
          <div className="input-group"><label className="input-label">Stock inicial</label><input className="input" type="number" value={form.stock||0} onChange={e=>F("stock",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Stock crítico (alerta)</label><input className="input" type="number" value={form.stock_critico||5} onChange={e=>F("stock_critico",e.target.value)}/></div>
          <div style={{gridColumn:"1/-1"}}><div className="divider"/></div>
          <div className="input-group"><label className="input-label">Estado</label>
            <select className="input" value={form.activo?"si":"no"} onChange={e=>F("activo",e.target.value==="si")}>
              <option value="si">Activo</option><option value="no">Inactivo</option>
            </select></div>
        </div>
      </Modal>}
    </div>
  );
}

// ─── POS ──────────────────────────────────────────────────────────────────────
function POS({ empresa, productos, clientes, sesionCaja, onRefresh, toast }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [tipoDoc, setTipoDoc] = useState("boleta");
  const [clienteId, setClienteId] = useState("");
  const [descGlobal, setDescGlobal] = useState(0);
  const [pagos, setPagos] = useState([{medio:"efectivo",monto:0}]);
  const [loading, setLoading] = useState(false);
  const [boucherDoc, setBoucherDoc] = useState(null);

  const filtered = productos.filter(p=>p.activo&&(!search||p.nombre?.toLowerCase().includes(search.toLowerCase())||p.codigo?.toLowerCase().includes(search.toLowerCase())||p.codigo_barra?.includes(search)));

  const addToCart = (p) => {
    setCart(c=>{
      const ex=c.find(i=>i.id===p.id);
      if(ex) return c.map(i=>i.id===p.id?{...i,cantidad:i.cantidad+1,total:(i.cantidad+1)*i.precio}:i);
      return [...c,{id:p.id,nombre:p.nombre,codigo:p.codigo,precio:p.precio_venta,cantidad:1,total:p.precio_venta,stock:p.stock,afecto_iva:p.afecto_iva,descuento_pct:0}];
    });
  };

  const updateQty = (id,delta) => setCart(c=>c.map(i=>{
    if(i.id!==id)return i;
    const nq=i.cantidad+delta;
    if(nq<=0)return null;
    const base=nq*i.precio;
    return{...i,cantidad:nq,total:base*(1-(i.descuento_pct||0)/100)};
  }).filter(Boolean));

  const setItemDesc = (id,pct) => setCart(c=>c.map(i=>{
    if(i.id!==id)return i;
    const base=i.cantidad*i.precio;
    return{...i,descuento_pct:pct,total:base*(1-pct/100)};
  }));

  const subtotalBruto = cart.reduce((s,i)=>s+i.cantidad*i.precio,0);
  const descItems = cart.reduce((s,i)=>s+(i.cantidad*i.precio*(i.descuento_pct||0)/100),0);
  const subtotalConDesc = subtotalBruto - descItems;
  const descGlobalMonto = subtotalConDesc * (descGlobal/100);
  const base = subtotalConDesc - descGlobalMonto;
  const iva = Math.round(base * 0.19);
  const total = base + iva;
  const totalPagos = pagos.reduce((s,p)=>s+parseFloat(p.monto||0),0);
  const vuelto = Math.max(0, totalPagos - total);
  const cliente = clientes.find(c=>c.id===clienteId);

  useEffect(()=>{ setPagos([{medio:"efectivo",monto:total}]); },[total]);

  const emitir = async () => {
    if(!cart.length){toast("Agrega productos","error");return;}
    if(!sesionCaja){toast("Debes abrir la caja primero","error");return;}
    setLoading(true);
    try {
      const folio = await api.siguienteFolio(empresa.id, tipoDoc);
      const doc = {
        empresa_id:empresa.id, caja_sesion_id:sesionCaja?.id,
        cliente_id:clienteId||null, tipo_documento:tipoDoc, folio,
        fecha:new Date().toISOString().slice(0,10),
        hora:new Date().toTimeString().slice(0,8),
        neto:base, iva, total,
        descuento_global:descGlobalMonto+descItems,
        descuento_pct:descGlobal,
        medio_pago:pagos[0]?.medio||"efectivo",
        monto_pagado:totalPagos, vuelto, estado:"emitido",
        cliente_rut:cliente?.rut, cliente_nombre:cliente?.nombre,
        cliente_direccion:cliente?.direccion, cliente_giro:cliente?.giro,
      };
      const items = cart.map(i=>({
        producto_id:i.id, nombre:i.nombre, codigo:i.codigo,
        cantidad:i.cantidad, precio_unitario:i.precio,
        descuento_pct:i.descuento_pct||0,
        descuento_monto:i.cantidad*i.precio*(i.descuento_pct||0)/100,
        neto:i.total, iva:Math.round(i.total*0.19), total:i.total,
        afecto_iva:i.afecto_iva, _stock_nuevo:i.stock-i.cantidad,
      }));
      const docCreado = await api.createDocumento(doc, items, pagos.map(p=>({medio_pago:p.medio,monto:parseFloat(p.monto||0)})));
      for(const item of items){
        const sa = item._stock_nuevo+item.cantidad;
        await api.createMovInventario({empresa_id:empresa.id,producto_id:item.producto_id,tipo:"venta",cantidad:-item.cantidad,stock_anterior:sa,stock_nuevo:item._stock_nuevo,referencia:`${tipoDoc} #${folio}`,documento_id:docCreado.id});
      }
      // Registrar CADA medio de pago como movimiento en caja
      for(const pago of pagos){
        const monto=parseFloat(pago.monto||0);
        if(monto>0) await api.createMovCaja({sesion_id:sesionCaja.id,empresa_id:empresa.id,tipo:"venta",concepto:`${tipoDoc==="boleta"?"Boleta":"Factura"} #${folio}`,monto,medio_pago:pago.medio,documento_id:docCreado.id});
      }
      if(tipoDoc==="factura"&&cliente&&cliente.dias_credito>0){
        const venc=new Date(); venc.setDate(venc.getDate()+cliente.dias_credito);
        await api.createCxC({empresa_id:empresa.id,cliente_id:clienteId,documento_id:docCreado.id,monto_total:total,monto_pagado:0,saldo:total,fecha_emision:doc.fecha,fecha_vencimiento:venc.toISOString().slice(0,10),estado:"pendiente"});
      }
      await onRefresh();

      // ── Emisión DTE al SII (si está configurado) ──────────────────────────
      let xmlFirmado = null;
      if (empresa.sii_emitir_al_sii) {
        const tipoDteNum = tipoDoc==="boleta"?39:tipoDoc==="factura"?33:39;
        const cafXml = empresa[`sii_caf_${tipoDteNum}`];
        const ambienteSII = empresa.sii_ambiente || "certificacion";

        if (!cafXml) {
          toast(`Sin CAF tipo ${tipoDteNum} — configura en SII / SimpleAPI antes de emitir al SII`,"error");
        } else {
          try {
            toast("Enviando al SII...","info");
            const dtePayload = {
              emisor: {
                rut:         empresa.rut,
                razonSocial: empresa.razon_social,
                giro:        empresa.giro || "Comercio",
                acteco:      [Number(empresa.sii_acteco) || 620000],
                direccion:   empresa.direccion || "Sin dirección",
                comuna:      empresa.ciudad || "Santiago",
              },
              receptor: cliente ? {
                rut:         cliente.rut || "66666666-6",
                razonSocial: cliente.nombre || "-",
                giro:        cliente.giro || "-",
                direccion:   cliente.direccion || "-",
                comuna:      cliente.ciudad || "Santiago",
                contacto:    cliente.telefono || "",
              } : { rut:"66666666-6", razonSocial:"-", giro:"-", direccion:"-", comuna:"Santiago" },
              tipoDte:  tipoDteNum,
              folio:    0,
              fecha:    doc.fecha,
              detalles: cart.map(i=>({
                nombre:      i.nombre,
                descripcion: i.descripcion || "",
                cantidad:    i.cantidad,
                precio:      i.precio,
                descuento:   i.descuento_pct || 0,
                unidad:      i.unidad || "un",
              })),
              descuentoGlobal: descGlobal>0 ? { descripcion:"Descuento global", tipo:"$", valor:Math.round(descGlobalMonto) } : null,
              cafXml,
              ambiente: ambienteSII,
            };

            const dte = await siiApi.emitirDte(dtePayload);
            xmlFirmado = dte?.Xml || dte?.xml || dte?.DTE || dte?.dte;

            if (xmlFirmado) {
              // Guardar XML en el documento
              await sb(`documentos?id=eq.${docCreado.id}`, {
                method:"PATCH",
                body: JSON.stringify({ xml_dte: xmlFirmado, estado_sii:"generado" }),
                prefer:"return=minimal"
              });

              // Generar sobre y enviar al SII
              const sobre = await siiApi.generarSobre(xmlFirmado, empresa.rut);
              const sobreXml = sobre?.Xml || sobre?.xml || sobre?.Sobre || sobre?.sobre;
              if (sobreXml) {
                const envio = await siiApi.enviarSII(sobreXml, empresa.rut, ambienteSII);
                const trackId = envio?.TrackId || envio?.trackId || envio?.track_id;
                if (trackId) {
                  await sb(`documentos?id=eq.${docCreado.id}`, {
                    method:"PATCH",
                    body: JSON.stringify({ track_id_sii: String(trackId), estado_sii:"enviado" }),
                    prefer:"return=minimal"
                  });
                  toast(`DTE enviado al SII ✓ — TrackID: ${trackId}`, "success");
                }
              }
            } else {
              console.warn("[SII] Sin XML en respuesta:", dte);
              toast("DTE generado pero sin XML en respuesta — revisa consola","warning");
            }
          } catch(esiierr) {
            console.error("[SII] Error emisión DTE:", esiierr);
            toast(`Error SII: ${esiierr.message} — Boleta guardada localmente`, "warning");
          }
        }
      }

      setBoucherDoc({...docCreado, items:cart, empresa, cliente, _autoPrint:true, xmlFirmado});
      setCart([]); setClienteId(""); setDescGlobal(0);
      toast(`${tipoDoc==="boleta"?"Boleta":"Factura"} #${folio} emitida ✓`,"success");
      api.registrarAccion({empresa_id:empresa.id,usuario_id:null,accion:"emitir_documento",modulo:"pos",detalle:`${tipoDoc} #${folio} · $${total.toLocaleString("es-CL")} · SII:${empresa.sii_emitir_al_sii?"si":"no"}`}).catch(()=>null);
    } catch(e){toast(e.message,"error");}
    setLoading(false);
  };

  return (
    <div className="pos-layout">
      <div className="pos-products">
        {!sesionCaja&&<div className="alert alert-warning" style={{marginBottom:12}}>⚠️ La caja está cerrada. Abre la caja desde el módulo Caja antes de vender.</div>}
        <div className="search-bar" style={{marginBottom:14}}>
          <span className="search-icon">🔍</span>
          <input className="input search-input w-full" placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="product-grid">
          {filtered.map(p=>(
            <div key={p.id} className="product-card" onClick={()=>addToCart(p)} style={{opacity:p.stock===0?0.45:1}}>
              <div className="product-sku">{p.codigo||""}</div>
              <div className="product-name">{p.nombre}</div>
              <div className="product-price">{fmt.clp(p.precio_venta)}</div>
              <div className={`product-stock ${p.stock<=p.stock_critico?"low":""}`}>{p.stock===0?"Sin stock":`${p.stock} en stock`}</div>
            </div>
          ))}
          {!filtered.length&&<EmptyState icon="📦" text="Sin productos"/>}
        </div>
      </div>
      <div className="pos-cart">
        <div className="pos-cart-header">
          <div className="flex justify-between items-center" style={{marginBottom:8}}>
            <span style={{fontWeight:700,fontSize:14}}>Venta</span>
            <select className="input" style={{width:"auto",padding:"4px 8px",fontSize:12}} value={tipoDoc} onChange={e=>setTipoDoc(e.target.value)}>
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
              <option value="nota_venta">Nota de venta</option>
            </select>
          </div>
          {tipoDoc==="factura"&&<select className="input w-full" style={{fontSize:12}} value={clienteId} onChange={e=>setClienteId(e.target.value)}>
            <option value="">— Seleccionar cliente —</option>
            {clientes.filter(c=>c.tipo==="empresa"||c.rut).map(c=><option key={c.id} value={c.id}>{c.nombre} ({c.rut})</option>)}
          </select>}
        </div>
        <div className="pos-cart-items">
          {!cart.length&&<EmptyState icon="🛒" text="Agrega productos"/>}
          {cart.map(item=>(
            <div key={item.id} className="cart-item">
              <div className="cart-item-name">{item.nombre}</div>
              <div className="cart-item-controls">
                <button className="qty-btn" onClick={()=>updateQty(item.id,-1)}>−</button>
                <span className="qty-display">{item.cantidad}</span>
                <button className="qty-btn" onClick={()=>updateQty(item.id,1)}>+</button>
                <input type="number" min={0} max={100} value={item.descuento_pct||0} onChange={e=>setItemDesc(item.id,parseFloat(e.target.value)||0)} style={{width:42,padding:"2px 4px",fontSize:11,border:"1px solid #d8e0e8",borderRadius:4,textAlign:"center"}} title="Descuento %"/>
                <span style={{fontSize:10,color:"#9aa5b0"}}>%</span>
                <span className="cart-item-price">{fmt.clp(item.total)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pos-cart-footer">
          <div className="flex justify-between" style={{marginBottom:4,fontSize:12}}><span style={{color:"#9aa5b0"}}>Subtotal</span><span>{fmt.clp(subtotalBruto)}</span></div>
          {descItems>0&&<div className="flex justify-between" style={{marginBottom:4,fontSize:12}}><span style={{color:"#9aa5b0"}}>Desc. líneas</span><span style={{color:"#ef4444"}}>-{fmt.clp(descItems)}</span></div>}
          <div className="flex justify-between items-center" style={{marginBottom:4,fontSize:12}}>
            <span style={{color:"#9aa5b0"}}>Desc. global %</span>
            <input type="number" className="input" style={{width:60,padding:"3px 6px",fontSize:12}} value={descGlobal} onChange={e=>setDescGlobal(parseFloat(e.target.value)||0)} min={0} max={100}/>
          </div>
          <div className="flex justify-between" style={{marginBottom:4,fontSize:12}}><span style={{color:"#9aa5b0"}}>IVA (19%)</span><span>{fmt.clp(iva)}</span></div>
          <div className="divider" style={{margin:"8px 0"}}/>
          <div className="flex justify-between" style={{marginBottom:10}}>
            <span style={{fontSize:15,fontWeight:700}}>TOTAL</span>
            <span style={{fontSize:19,fontWeight:700,color:"#54b2e9"}}>{fmt.clp(total)}</span>
          </div>
          {pagos.map((p,i)=>(
            <div key={i} className="flex gap-6" style={{gap:6,marginBottom:6}}>
              <select className="input" style={{flex:1,fontSize:12,padding:"6px 8px"}} value={p.medio} onChange={e=>setPagos(ps=>ps.map((x,j)=>j===i?{...x,medio:e.target.value}:x))}>
                <option value="efectivo">💵 Efectivo</option>
                <option value="debito">💳 Débito</option>
                <option value="credito">💳 Crédito</option>
                <option value="transferencia">🏦 Transferencia</option>
              </select>
              <MontoInput className="input" style={{width:110,fontSize:12,padding:"6px 8px"}} value={p.monto} onChange={n=>setPagos(ps=>ps.map((x,j)=>j===i?{...x,monto:n}:x))}/>
              {pagos.length>1&&<button className="btn btn-ghost btn-sm" onClick={()=>setPagos(ps=>ps.filter((_,j)=>j!==i))}>✕</button>}
            </div>
          ))}
          <button className="btn btn-ghost btn-sm w-full" style={{marginBottom:8,fontSize:11}} onClick={()=>setPagos(ps=>[...ps,{medio:"efectivo",monto:0}])}>+ Otro medio de pago</button>
          {total>0&&<div className="flex justify-between" style={{fontSize:12,marginBottom:8,color:vuelto>0?"#22c55e":totalPagos<total?"#ef4444":"#9aa5b0"}}>
            <span>{totalPagos<total?"Falta":"Vuelto"}</span>
            <span style={{fontWeight:600}}>{totalPagos<total?`-${fmt.clp(total-totalPagos)}`:fmt.clp(vuelto)}</span>
          </div>}
          <button className="btn btn-primary btn-lg w-full" onClick={emitir} disabled={loading||!cart.length||!sesionCaja}>
            {loading?"Procesando...":`Emitir ${tipoDoc==="boleta"?"Boleta":tipoDoc==="factura"?"Factura":"Nota de Venta"}`}
          </button>
        </div>
      </div>
      {boucherDoc&&<BoucherModal doc={boucherDoc} empresa={empresa} onClose={()=>setBoucherDoc(null)}/>}
    </div>
  );
}

// ─── BÓUCHER ──────────────────────────────────────────────────────────────────
function BoucherModal({ doc, empresa, onClose }) {
  const [formato, setFormato] = useState(empresa?.config_impresora||"termica");
  const [ancho, setAncho] = useState(empresa?.config_ancho_papel||80);

  // Construye el HTML del documento para imprimir
  function buildHtml(fmt, aw) {
    const mono = fmt==="termica";
    const w = fmt==="a4"?"210mm":"216mm";
    return `<html><head><title>Documento</title><style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:${mono?"'Courier New',monospace":"Arial,sans-serif"};font-size:${mono?"11px":"12px"};color:#000;background:#fff;}
.doc{width:${mono?aw+"mm":w};padding:${mono?"4mm":"18mm 15mm"};margin:auto;}
.center{text-align:center;}.right{text-align:right;}.bold{font-weight:bold;}
.divider{border-top:1px ${mono?"dashed":"solid"} #000;margin:5px 0;}
h1{font-size:${mono?"13px":"18px"};text-align:center;margin-bottom:6px;}
table{width:100%;border-collapse:collapse;margin:4px 0;font-size:${mono?"10px":"11px"};}
th{border-bottom:1px solid #000;padding:3px 4px;text-align:left;}
td{padding:${mono?"2px 4px":"4px"};}
@media print{body{margin:0;}.no-print{display:none;}}
</style></head><body><div class="doc">
<h1 class="bold">${empresa?.razon_social||""}</h1>
<p class="center" style="font-size:10px">RUT: ${empresa?.rut||""}</p>
${empresa?.giro?`<p class="center" style="font-size:10px">${empresa.giro}</p>`:""}
${empresa?.direccion?`<p class="center" style="font-size:10px">${empresa.direccion}</p>`:""}
<div class="divider"></div>
<p class="center bold" style="font-size:${mono?"13px":"15px"}">${doc.tipo_documento==="boleta"?"BOLETA":doc.tipo_documento==="factura"?"FACTURA":"NOTA DE VENTA"}</p>
<p class="center">N° ${doc.folio}</p>
<p class="center" style="font-size:10px">${doc.fecha||""} ${doc.hora?doc.hora.slice(0,5):""}</p>
${doc.cliente_nombre||doc.cliente?.nombre?`<div class="divider"></div><p style="font-size:10px"><b>Cliente:</b> ${doc.cliente_nombre||doc.cliente?.nombre||""}</p>${doc.cliente_rut||doc.cliente?.rut?`<p style="font-size:10px"><b>RUT:</b> ${doc.cliente_rut||doc.cliente?.rut}</p>`:""}`:""}
<div class="divider"></div>
<table><thead><tr><th>Producto</th><th class="right">Cant</th><th class="right">P.Unit</th><th class="right">Total</th></tr></thead>
<tbody>${(doc.items||[]).map(i=>`<tr><td>${i.nombre||i.NmbItem||""}</td><td class="right">${i.cantidad||i.QtyItem||1}</td><td class="right">$${Math.round(i.precio||i.precio_unitario||i.PrcItem||0).toLocaleString("es-CL")}</td><td class="right">$${Math.round(i.total||i.MontoItem||0).toLocaleString("es-CL")}</td></tr>`).join("")}</tbody></table>
<div class="divider"></div>
<table><tbody>
<tr><td>Neto</td><td class="right">$${Math.round(doc.neto||0).toLocaleString("es-CL")}</td></tr>
${(doc.descuento_global||0)>0?`<tr><td>Descuento</td><td class="right">-$${Math.round(doc.descuento_global).toLocaleString("es-CL")}</td></tr>`:""}
<tr><td>IVA 19%</td><td class="right">$${Math.round(doc.iva||0).toLocaleString("es-CL")}</td></tr>
<tr class="bold"><td><b>TOTAL</b></td><td class="right">$${Math.round(doc.total||0).toLocaleString("es-CL")}</td></tr>
${(doc.vuelto||0)>0?`<tr><td>Vuelto</td><td class="right">$${Math.round(doc.vuelto).toLocaleString("es-CL")}</td></tr>`:""}
</tbody></table>
<div class="divider"></div>
<p class="center" style="font-size:10px">Pago: ${(doc.medio_pago||"").toUpperCase()}</p>
${empresa?.config_pie_boleta?`<p class="center" style="font-size:9px;margin-top:8px">${empresa.config_pie_boleta}</p>`:""}
<p class="center" style="font-size:8px;margin-top:8px;color:#999">HUNO® Arca</p>
</div><script>window.onload=function(){window.print();setTimeout(function(){window.close();},800);}<\/script></body></html>`;
  }

  // Imprimir usando iframe oculto (no bloqueado por browsers como popup)
  function imprimir() {
    const html = buildHtml(formato, ancho);
    const ifr = document.createElement("iframe");
    ifr.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;";
    ifr.srcdoc = html;
    document.body.appendChild(ifr);
    ifr.onload = () => {
      try {
        ifr.contentWindow.focus();
        ifr.contentWindow.print();
      } catch(err) {
        // Fallback: nueva ventana
        const w = window.open("","_blank");
        if(w){ w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>{ w.print(); w.close(); },600); }
      }
      setTimeout(()=>{ try{document.body.removeChild(ifr);}catch{} }, 2000);
    };
  }

  // Auto-imprimir al abrir si viene de una venta nueva
  // imprimir está definida ANTES del useEffect — sin problema de hoisting
  useEffect(()=>{
    if(doc._autoPrint){
      const t = setTimeout(()=>imprimir(), 600);
      return ()=>clearTimeout(t);
    }
  },[]);

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header"><span className="modal-title">Documento emitido ✓</span><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="alert alert-success" style={{marginBottom:14}}>
            {doc.tipo_documento} N° {doc.folio} — {fmt.clp(doc.total)}
            {doc.vuelto>0&&<span> · Vuelto: {fmt.clp(doc.vuelto)}</span>}
          </div>
          <div className="form-grid" style={{marginBottom:14}}>
            <div className="input-group"><label className="input-label">Formato</label>
              <select className="input" value={formato} onChange={e=>setFormato(e.target.value)}>
                <option value="termica">Térmica</option><option value="carta">Carta</option><option value="oficio">Oficio</option><option value="a4">A4</option>
              </select></div>
            {formato==="termica"&&<div className="input-group"><label className="input-label">Ancho (mm)</label>
              <select className="input" value={ancho} onChange={e=>setAncho(parseInt(e.target.value))}>
                <option value={58}>58mm</option><option value={80}>80mm</option><option value={114}>114mm</option>
              </select></div>}
          </div>
          <div style={{background:"#f0f2f6",border:"1px solid #e8ecf0",borderRadius:10,padding:16,fontFamily:"monospace",fontSize:12,maxWidth:formato==="termica"?ancho*2.8+"px":"100%",margin:"0 auto"}}>
            <div style={{textAlign:"center",fontWeight:700}}>{empresa?.razon_social}</div>
            <div style={{textAlign:"center",borderTop:"1px dashed #999",padding:"4px 0",fontWeight:700,marginTop:4}}>{doc.tipo_documento?.toUpperCase()} N° {doc.folio}</div>
            <div style={{textAlign:"center",fontSize:10,color:"#5a6a78",marginBottom:6}}>{doc.fecha}</div>
            {(doc.items||[]).map((i,idx)=>(
              <div key={idx} style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                <span>{i.cantidad}x {i.nombre}</span><span>{fmt.clp(i.total)}</span>
              </div>
            ))}
            <div style={{borderTop:"1px dashed #999",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}>
              <span>TOTAL</span><span>{fmt.clp(doc.total)}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={imprimir}>🖨 Imprimir</button>
        </div>
      </div>
    </div>
  );
}

// ─── CAJA ─────────────────────────────────────────────────────────────────────
function Caja({ empresa, sesionCaja, onCambioSesion, toast }) {
  const [cajas, setCajas] = useState([]);
  const [cajaId, setCajaId] = useState(null);
  const [movs, setMovs] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(()=>{
    api.cajas(empresa.id).then(r=>{
      const cs=r||[]; setCajas(cs);
      if(cs.length) setCajaId(cs[0].id);
    });
  },[]);

  useEffect(()=>{
    if(sesionCaja) api.movimientosCaja(sesionCaja.id).then(r=>setMovs(r||[]));
    else setMovs([]);
  },[sesionCaja]);

  const abrir = async () => {
    if(!cajaId)return;
    try {
      const s = await api.abrirCaja({caja_id:cajaId,empresa_id:empresa.id,monto_apertura:parseFloat(form.monto)||0,estado:"abierta"});
      await api.createMovCaja({sesion_id:s.id,empresa_id:empresa.id,tipo:"apertura",concepto:"Apertura de caja",monto:parseFloat(form.monto)||0,medio_pago:"efectivo"});
      onCambioSesion(s); setModal(null); toast("Caja abierta","success");
    } catch(e){toast(e.message,"error");}
  };

  const cerrar = async () => {
    if(!sesionCaja)return;
    const ventasEfectivo = movs.filter(m=>m.tipo==="venta"&&m.medio_pago==="efectivo").reduce((s,m)=>s+m.monto,0);
    const esperado = (sesionCaja.monto_apertura||0) + ventasEfectivo;
    const real = parseFloat(form.monto_cierre||0);
    try {
      await api.cerrarCaja(sesionCaja.id,{fecha_cierre:new Date().toISOString(),monto_cierre_real:real,monto_cierre_esperado:esperado,diferencia:real-esperado,estado:"cerrada"});
      onCambioSesion(null); setModal(null); toast("Caja cerrada","success");
    } catch(e){toast(e.message,"error");}
  };

  const agregarMov = async () => {
    if(!sesionCaja||!form.concepto||!form.monto){toast("Completa todos los campos","error");return;}
    try {
      await api.createMovCaja({sesion_id:sesionCaja.id,empresa_id:empresa.id,tipo:form.tipo||"ingreso",concepto:form.concepto,monto:parseFloat(form.monto),medio_pago:form.medio||"efectivo"});
      setMovs(await api.movimientosCaja(sesionCaja.id).catch(()=>[]));
      setModal(null); toast("Movimiento registrado","success");
    } catch(e){toast(e.message,"error");}
  };

  const totalVentas = movs.filter(m=>m.tipo==="venta").reduce((s,m)=>s+m.monto,0);
  const totalIngresos = movs.filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+m.monto,0);
  const totalEgresos = movs.filter(m=>m.tipo==="egreso").reduce((s,m)=>s+m.monto,0);
  const saldo = (sesionCaja?.monto_apertura||0) + totalVentas + totalIngresos - totalEgresos;

  return (
    <div>
      <div className={`caja-banner ${sesionCaja?"caja-abierta":"caja-cerrada"}`}>
        <div style={{fontSize:28}}>{"●"}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:15,color:sesionCaja?"#15803d":"#b91c1c"}}>Caja {sesionCaja?"Abierta":"Cerrada"}</div>
          {sesionCaja&&<div style={{fontSize:12,color:"#5a6a78",marginTop:2}}>Apertura: {fmt.clp(sesionCaja.monto_apertura)} · {new Date(sesionCaja.fecha_apertura).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</div>}
        </div>
        {!sesionCaja&&<button className="btn btn-success" onClick={()=>{setForm({monto:0});setModal("abrir");}}>Abrir caja</button>}
        {sesionCaja&&<div className="flex gap-8" style={{gap:8}}>
          <button className="btn btn-ghost" onClick={()=>{setForm({tipo:"ingreso",medio:"efectivo"});setModal("movimiento");}}>+ Movimiento</button>
          <button className="btn btn-danger" onClick={()=>{setForm({monto_cierre:0});setModal("cerrar");}}>Cerrar caja</button>
        </div>}
      </div>

      {sesionCaja&&<>
        <div className="grid-4" style={{marginBottom:16}}>
          {[
            {label:"Apertura",value:fmt.clp(sesionCaja.monto_apertura||0)},
            {label:"Ventas",value:fmt.clp(totalVentas),color:"#54b2e9"},
            {label:"Egresos",value:fmt.clp(totalEgresos),color:"#ef4444"},
            {label:"Saldo estimado",value:fmt.clp(saldo)},
          ].map((s,i)=><div key={i} className="stat-card"><div className="stat-label">{s.label}</div><div className="stat-value" style={{fontSize:20,color:s.color||"#081f2c"}}>{s.value}</div></div>)}
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>Hora</th><th>Tipo</th><th>Concepto</th><th>Medio</th><th>Monto</th></tr></thead>
          <tbody>{movs.map(m=>(
            <tr key={m.id}>
              <td style={{fontSize:11,color:"#9aa5b0"}}>{new Date(m.created_at).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</td>
              <td><span className={`badge ${m.tipo==="venta"||m.tipo==="ingreso"?"badge-success":"badge-danger"}`}>{m.tipo}</span></td>
              <td>{m.concepto}</td>
              <td style={{fontSize:12,color:"#9aa5b0"}}>{m.medio_pago}</td>
              <td style={{fontWeight:600,color:m.tipo==="egreso"?"#ef4444":"#22c55e"}}>{m.tipo==="egreso"?"-":""}{fmt.clp(Math.abs(m.monto))}</td>
            </tr>
          ))}</tbody>
        </table>
        {!movs.length&&<EmptyState icon="·" text="Sin movimientos en esta sesión"/>}
        </div>
      </>}

      {modal==="abrir"&&<Modal title="Abrir caja" onClose={()=>setModal(null)}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-success" onClick={abrir}>Abrir caja</button></>}>
        <div className="input-group" style={{marginBottom:12}}><label className="input-label">Monto de apertura (efectivo)</label><input className="input" type="number" value={form.monto||0} onChange={e=>setForm(f=>({...f,monto:e.target.value}))}/></div>
      </Modal>}

      {modal==="cerrar"&&<Modal title="Cerrar caja" onClose={()=>setModal(null)}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-danger" onClick={cerrar}>Confirmar cierre</button></>}>
        <div className="alert alert-info" style={{marginBottom:14}}>Saldo esperado: <strong>{fmt.clp(saldo)}</strong></div>
        <div className="input-group"><label className="input-label">Monto real en caja</label><input className="input" type="number" value={form.monto_cierre||0} onChange={e=>setForm(f=>({...f,monto_cierre:e.target.value}))}/></div>
        {form.monto_cierre&&<div className={`alert ${parseFloat(form.monto_cierre)-saldo>=0?"alert-success":"alert-danger"}`} style={{marginTop:10}}>
          Diferencia: {fmt.clp(parseFloat(form.monto_cierre||0)-saldo)}
        </div>}
      </Modal>}

      {modal==="movimiento"&&<Modal title="Registrar movimiento" onClose={()=>setModal(null)}
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={agregarMov}>Registrar</button></>}>
        <div className="form-grid">
          <div className="input-group"><label className="input-label">Tipo</label>
            <select className="input" value={form.tipo||"ingreso"} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
              <option value="ingreso">Ingreso</option><option value="egreso">Egreso</option>
            </select></div>
          <div className="input-group"><label className="input-label">Medio</label>
            <select className="input" value={form.medio||"efectivo"} onChange={e=>setForm(f=>({...f,medio:e.target.value}))}>
              <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option>
            </select></div>
          <div className="input-group form-full"><label className="input-label">Concepto *</label><input className="input" value={form.concepto||""} onChange={e=>setForm(f=>({...f,concepto:e.target.value}))}/></div>
          <div className="input-group form-full"><label className="input-label">Monto *</label><input className="input" type="number" value={form.monto||""} onChange={e=>setForm(f=>({...f,monto:e.target.value}))}/></div>
        </div>
      </Modal>}
    </div>
  );
}

// ─── VENTAS ───────────────────────────────────────────────────────────────────
function Ventas({ empresa, clientes, toast }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(new Date().toISOString().slice(0,7)+"-01");
  const [hasta, setHasta] = useState(new Date().toISOString().slice(0,10));
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [detalleItems, setDetalleItems] = useState([]);
  const [detallePagos, setDetallePagos] = useState([]);

  const cargar = useCallback(async()=>{
    setLoading(true);
    try{setDocs(await api.documentos(empresa.id,desde,hasta,tipoFiltro||null)||[]);}
    catch(e){toast(e.message,"error");}
    setLoading(false);
  },[empresa.id,desde,hasta,tipoFiltro]);

  useEffect(()=>{cargar();},[cargar]);

  const verDetalle = async (doc) => {
    setDetalle(doc);
    const [items,pagos] = await Promise.all([api.documentoItems(doc.id).catch(()=>[]),api.documentoPagos(doc.id).catch(()=>[])]);
    setDetalleItems(items); setDetallePagos(pagos);
  };

  const anular = async (doc) => {
    if(!confirm(`¿Anular ${doc.tipo_documento} #${doc.folio}?`))return;
    try{await api.anularDocumento(doc.id);await cargar();setDetalle(null);toast("Documento anulado");}
    catch(e){toast(e.message,"error");}
  };

  const activos = docs.filter(d=>d.estado!=="anulado");
  const totalVentas = activos.reduce((s,d)=>s+d.total,0);

  return (
    <div>
      <div className="flex gap-8" style={{gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"flex-end"}}>
        <input type="date" className="input" style={{width:140}} value={desde} onChange={e=>setDesde(e.target.value)}/>
        <input type="date" className="input" style={{width:140}} value={hasta} onChange={e=>setHasta(e.target.value)}/>
        <select className="input" style={{width:150}} value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="boleta">Boletas</option>
          <option value="factura">Facturas</option>
          <option value="nota_venta">Notas de venta</option>
        </select>
        <button className="btn btn-ghost" onClick={cargar}>🔄</button>
        <div style={{marginLeft:"auto",fontWeight:700,fontSize:14}}>{activos.length} docs · {fmt.clp(totalVentas)}</div>
      </div>

      <div className="table-wrap"><table>
        <thead><tr><th>Folio</th><th>Tipo</th><th>Fecha</th><th>Cliente</th><th>Neto</th><th>IVA</th><th>Total</th><th>Pago</th><th>Estado</th><th></th></tr></thead>
        <tbody>{docs.map(d=>(
          <tr key={d.id} style={{opacity:d.estado==="anulado"?0.5:1}}>
            <td style={{fontWeight:600}}>#{d.folio}</td>
            <td><span className="badge badge-navy" style={{fontSize:10}}>{d.tipo_documento}</span></td>
            <td style={{fontSize:12}}>{fmt.date(d.fecha)}</td>
            <td style={{fontSize:12,color:"#9aa5b0"}}>{d.cliente_nombre||"—"}</td>
            <td style={{fontSize:12}}>{fmt.clp(d.neto||0)}</td>
            <td style={{fontSize:12}}>{fmt.clp(d.iva)}</td>
            <td style={{fontWeight:700,color:"#54b2e9"}}>{fmt.clp(d.total)}</td>
            <td><span className="badge badge-info" style={{fontSize:10}}>{d.medio_pago}</span></td>
            <td><span className={`badge ${estadoBadge[d.estado]||"badge-navy"}`}>{d.estado}</span></td>
            <td><button className="btn btn-ghost btn-sm" onClick={()=>verDetalle(d)}>Ver</button></td>
          </tr>
        ))}</tbody>
      </table>
      {loading&&<div style={{padding:30,textAlign:"center"}}><div className="spinner" style={{margin:"0 auto"}}/></div>}
      {!loading&&!docs.length&&<EmptyState icon="📄" text="Sin documentos en el período"/>}
      </div>

      {detalle&&<Modal title={`${detalle.tipo_documento} N° ${detalle.folio}`} onClose={()=>setDetalle(null)} size="modal-lg"
        footer={<>
          {detalle.estado!=="anulado"&&<button className="btn btn-danger btn-sm" onClick={()=>anular(detalle)}>Anular</button>}
          <button className="btn btn-ghost" onClick={()=>setDetalle(null)}>Cerrar</button>
        </>}>
        <div className="grid-2" style={{marginBottom:14,fontSize:13}}>
          <div><span style={{color:"#9aa5b0"}}>Fecha:</span> {fmt.date(detalle.fecha)}</div>
          <div><span className={`badge ${estadoBadge[detalle.estado]||"badge-navy"}`}>{detalle.estado}</span></div>
          {detalle.cliente_nombre&&<div><span style={{color:"#9aa5b0"}}>Cliente:</span> {detalle.cliente_nombre}</div>}
          {detalle.cliente_rut&&<div><span style={{color:"#9aa5b0"}}>RUT:</span> {detalle.cliente_rut}</div>}
        </div>
        <div className="table-wrap" style={{marginBottom:14}}><table>
          <thead><tr><th>Producto</th><th>Cant.</th><th>P.Unit</th><th>Desc.</th><th>Total</th></tr></thead>
          <tbody>{detalleItems.map(i=><tr key={i.id}>
            <td>{i.nombre}</td><td>{i.cantidad}</td>
            <td>{fmt.clp(i.precio_unitario)}</td>
            <td>{i.descuento_pct>0?`${i.descuento_pct}%`:"—"}</td>
            <td style={{fontWeight:600}}>{fmt.clp(i.total)}</td>
          </tr>)}</tbody>
        </table></div>
        <div style={{borderTop:`1px solid ${"#e8ecf0"}`,paddingTop:12}}>
          <div className="flex justify-between" style={{fontSize:13,marginBottom:4}}><span style={{color:"#9aa5b0"}}>Neto</span><span>{fmt.clp(detalle.neto||0)}</span></div>
          <div className="flex justify-between" style={{fontSize:13,marginBottom:4}}><span style={{color:"#9aa5b0"}}>IVA</span><span>{fmt.clp(detalle.iva)}</span></div>
          <div className="flex justify-between" style={{fontWeight:700,fontSize:15}}><span>Total</span><span style={{color:"#54b2e9"}}>{fmt.clp(detalle.total)}</span></div>
        </div>
      </Modal>}
    </div>
  );
}

// ─── GASTOS ───────────────────────────────────────────────────────────────────
function Gastos({ empresa, proveedores, toast }) {
  const [gastos, setGastos] = useState([]);
  const [categs, setCategs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(new Date().toISOString().slice(0,7)+"-01");
  const [hasta, setHasta] = useState(new Date().toISOString().slice(0,10));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const cargar = useCallback(async()=>{
    setLoading(true);
    try {
      const [g,c]=await Promise.all([api.gastos(empresa.id,desde,hasta),api.categoriasGasto(empresa.id)]);
      setGastos(g||[]); setCategs(c||[]);
    } catch(e){toast(e.message,"error");}
    setLoading(false);
  },[empresa.id,desde,hasta]);

  useEffect(()=>{cargar();},[cargar]);

  const guardar = async () => {
    if(!form.descripcion||!form.total){toast("Descripción y monto requeridos","error");return;}
    setSaving(true);
    try {
      const d={...form,empresa_id:empresa.id,monto_neto:parseFloat(form.monto_neto||0),iva:parseFloat(form.iva||0),total:parseFloat(form.total)};
      if(form.id) await api.updateGasto(form.id,d);
      else await api.createGasto(d);
      await cargar(); setModal(false); toast("Gasto guardado","success");
    } catch(e){toast(e.message,"error");} setSaving(false);
  };

  const totalGastos = gastos.reduce((s,g)=>s+g.total,0);
  const categNombre = id => categs.find(c=>c.id===id)?.nombre||"—";
  const provNombre = id => proveedores.find(p=>p.id===id)?.nombre||"—";

  return (
    <div>
      <div className="flex gap-8" style={{gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input type="date" className="input" style={{width:140}} value={desde} onChange={e=>setDesde(e.target.value)}/>
        <input type="date" className="input" style={{width:140}} value={hasta} onChange={e=>setHasta(e.target.value)}/>
        <button className="btn btn-ghost" onClick={cargar}>🔄</button>
        <div style={{fontWeight:700,color:"#ef4444",fontSize:14}}>{fmt.clp(totalGastos)}</div>
        <button className="btn btn-primary" style={{marginLeft:"auto"}} onClick={()=>{setForm({fecha:new Date().toISOString().slice(0,10),medio_pago:"efectivo"});setModal(true);}}>＋ Nuevo gasto</button>
      </div>

      <div className="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Proveedor</th><th>N° Doc</th><th>Neto</th><th>IVA</th><th>Total</th><th>Pago</th><th></th></tr></thead>
        <tbody>{gastos.map(g=>(
          <tr key={g.id}>
            <td style={{fontSize:12}}>{fmt.date(g.fecha)}</td>
            <td style={{fontWeight:500}}>{g.descripcion}</td>
            <td style={{fontSize:12,color:"#9aa5b0"}}>{categNombre(g.categoria_id)}</td>
            <td style={{fontSize:12,color:"#9aa5b0"}}>{g.proveedor_id?provNombre(g.proveedor_id):"—"}</td>
            <td style={{fontSize:12,color:"#9aa5b0"}}>{g.numero_doc||"—"}</td>
            <td style={{fontSize:12}}>{fmt.clp(g.monto_neto)}</td>
            <td style={{fontSize:12}}>{fmt.clp(g.iva)}</td>
            <td style={{fontWeight:600,color:"#ef4444"}}>{fmt.clp(g.total)}</td>
            <td><span className="badge badge-navy" style={{fontSize:10}}>{g.medio_pago}</span></td>
            <td><div className="flex gap-6" style={{gap:4}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setForm({...g});setModal(true);}}>✏</button>
              <button className="btn btn-ghost btn-sm text-danger" onClick={async()=>{if(!confirm("¿Eliminar?"))return;try{await api.deleteGasto(g.id);await cargar();toast("Eliminado");}catch(e){toast(e.message,"error");}}}>✕</button>
            </div></td>
          </tr>
        ))}</tbody>
      </table>
      {loading&&<div style={{padding:30,textAlign:"center"}}><div className="spinner" style={{margin:"0 auto"}}/></div>}
      {!loading&&!gastos.length&&<EmptyState icon="·" text="Sin gastos en el período"/>}
      </div>

      {modal&&<Modal title={form.id?"Editar gasto":"Nuevo gasto"} onClose={()=>setModal(false)} size="modal-lg"
        footer={<><button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={guardar} disabled={saving}>{saving?"Guardando...":"Guardar"}</button></>}>
        <div className="form-grid">
          <div className="input-group form-full"><label className="input-label">Descripción *</label><input className="input" value={form.descripcion||""} onChange={e=>F("descripcion",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Fecha</label><input type="date" className="input" value={form.fecha||""} onChange={e=>F("fecha",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Categoría</label>
            <select className="input" value={form.categoria_id||""} onChange={e=>F("categoria_id",e.target.value)}>
              <option value="">Sin categoría</option>
              {categs.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">Proveedor</label>
            <select className="input" value={form.proveedor_id||""} onChange={e=>F("proveedor_id",e.target.value)}>
              <option value="">Sin proveedor</option>
              {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select></div>
          <div className="input-group"><label className="input-label">N° documento</label><input className="input" value={form.numero_doc||""} onChange={e=>F("numero_doc",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Monto neto</label><input className="input" type="number" value={form.monto_neto||""} onChange={e=>{const n=parseFloat(e.target.value)||0;const iva=Math.round(n*0.19);setForm(f=>({...f,monto_neto:e.target.value,iva,total:n+iva}));}}/></div>
          <div className="input-group"><label className="input-label">IVA</label><input className="input" type="number" value={form.iva||0} onChange={e=>F("iva",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Total *</label><input className="input" type="number" value={form.total||""} onChange={e=>F("total",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Medio de pago</label>
            <select className="input" value={form.medio_pago||"efectivo"} onChange={e=>F("medio_pago",e.target.value)}>
              <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option>
              <option value="debito">Débito</option><option value="credito">Crédito</option>
            </select></div>
          <div className="input-group form-full"><label className="input-label">Notas</label><textarea className="input" style={{minHeight:56}} value={form.notas||""} onChange={e=>F("notas",e.target.value)}/></div>
        </div>
      </Modal>}
    </div>
  );
}

// ─── REPORTES ─────────────────────────────────────────────────────────────────
function Reportes({ empresa, productos, clientes, toast }) {
  const [docs, setDocs] = useState([]);
  const [items, setItems] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0,7));
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try {
        const [y,m]=periodo.split("-");
        const desde=`${y}-${m}-01`;
        const hasta=new Date(parseInt(y),parseInt(m),0).toISOString().slice(0,10);
        const [d,g]=await Promise.all([api.documentos(empresa.id,desde,hasta),api.gastos(empresa.id,desde,hasta)]);
        const docActivos=(d||[]).filter(x=>x.estado!=="anulado");
        setDocs(docActivos); setGastos(g||[]);
        const all=[];
        for(const doc of docActivos.slice(0,80)){
          const its=await api.documentoItems(doc.id).catch(()=>[]);
          all.push(...its);
        }
        setItems(all);
      } catch(e){toast(e.message,"error");}
      setLoading(false);
    })();
  },[periodo]);

  const totalVentas = docs.reduce((s,d)=>s+d.total,0);
  const totalNeto = docs.reduce((s,d)=>s+(d.neto||0),0);
  const totalIVA = docs.reduce((s,d)=>s+d.iva,0);
  const totalGastos = gastos.reduce((s,g)=>s+g.total,0);
  const utilidad = totalNeto - totalGastos;

  const topProductos = Object.entries(items.reduce((acc,i)=>{
    acc[i.nombre]=acc[i.nombre]||{total:0,cantidad:0};
    acc[i.nombre].total+=i.total; acc[i.nombre].cantidad+=parseFloat(i.cantidad);
    return acc;
  },{})).sort((a,b)=>b[1].total-a[1].total).slice(0,10);

  const ventasMedio = docs.reduce((acc,d)=>{ acc[d.medio_pago]=(acc[d.medio_pago]||0)+d.total; return acc; },{});
  const stockCritico = productos.filter(p=>p.stock<=p.stock_critico&&p.activo);

  return (
    <div>
      <div className="flex items-center gap-12" style={{gap:12,marginBottom:14}}>
        <input type="month" className="input" style={{width:160}} value={periodo} onChange={e=>setPeriodo(e.target.value)}/>
        {loading&&<div className="spinner"/>}
      </div>

      <div className="grid-4" style={{marginBottom:14}}>
        {[
          {label:"Ventas totales",value:fmt.clp(totalVentas),sub:`${docs.length} documentos`,color:"#54b2e9"},
          {label:"IVA débito",value:fmt.clp(totalIVA)},
          {label:"Gastos totales",value:fmt.clp(totalGastos),color:"#ef4444"},
          {label:"Utilidad estimada",value:fmt.clp(utilidad),color:utilidad>=0?"#22c55e":"#ef4444"},
        ].map((s,i)=><div key={i} className="stat-card"><div className="stat-label">{s.label}</div><div className="stat-value" style={{fontSize:22,color:s.color||"#081f2c"}}>{s.value}</div>{s.sub&&<div className="stat-sub">{s.sub}</div>}</div>)}
      </div>

      <div className="grid-2" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-title">Top 10 productos</div>
          {topProductos.map(([nombre,d],i)=>(
            <div key={nombre} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f0f2f6",alignItems:"center"}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,color:"#9aa5b0",minWidth:18}}>#{i+1}</span>
                <span style={{fontSize:12,fontWeight:500}}>{nombre}</span>
                <span className="badge badge-navy" style={{fontSize:9}}>{d.cantidad} ud.</span>
              </div>
              <span style={{fontWeight:600,color:"#54b2e9",fontSize:12}}>{fmt.clp(d.total)}</span>
            </div>
          ))}
          {!topProductos.length&&<EmptyState icon="📦" text="Sin datos"/>}
        </div>
        <div className="card">
          <div className="card-title">Ventas por medio de pago</div>
          {Object.entries(ventasMedio).map(([medio,total])=>{
            const pct=totalVentas?Math.round(total/totalVentas*100):0;
            return (
              <div key={medio} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                  <span style={{fontWeight:500,textTransform:"capitalize"}}>{medio}</span>
                  <span>{fmt.clp(total)} <span style={{color:"#9aa5b0"}}>({pct}%)</span></span>
                </div>
                <div style={{height:5,background:"#e8ecf0",borderRadius:3}}>
                  <div style={{height:"100%",width:pct+"%",background:"#54b2e9",borderRadius:3}}/>
                </div>
              </div>
            );
          })}
          {!Object.keys(ventasMedio).length&&<EmptyState icon="💳" text="Sin datos"/>}
        </div>
      </div>

      {stockCritico.length>0&&<div className="card">
        <div className="card-title" style={{color:"#ef4444"}}>⚠ Stock crítico ({stockCritico.length} productos)</div>
        <div className="table-wrap" style={{border:"none"}}><table>
          <thead><tr><th>Producto</th><th>Stock</th><th>Mínimo</th><th>P.Venta</th><th>Estado</th></tr></thead>
          <tbody>{stockCritico.map(p=>(
            <tr key={p.id}>
              <td style={{fontWeight:500}}>{p.nombre}</td>
              <td style={{fontWeight:700,color:p.stock===0?"#ef4444":"#f59e0b"}}>{p.stock}</td>
              <td>{p.stock_critico}</td>
              <td>{fmt.clp(p.precio_venta)}</td>
              <td><span className="badge badge-danger">{p.stock===0?"Agotado":"Bajo mínimo"}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>}
    </div>
  );
}


// ─── SII CONFIG TAB ───────────────────────────────────────────────────────────
function SIIConfigTab({ empresa, form, setForm, F, toast, onRefresh }) {
  const [obteniendo, setObteniendo] = useState(false);
  const [tipoCaf, setTipoCaf]       = useState("39");
  const [cantCaf, setCantCaf]       = useState(100);
  const [enviando, setEnviando]     = useState(false);

  const tiposDTE = [
    {v:"39",l:"Boleta afecta"},
    {v:"33",l:"Factura afecta"},
    {v:"41",l:"Boleta exenta"},
    {v:"34",l:"Factura exenta"},
    {v:"52",l:"Guía de despacho"},
    {v:"61",l:"Nota de crédito"},
    {v:"56",l:"Nota de débito"},
  ];

  const tieneCaf = (t) => !!(form[`sii_caf_${t}`] || empresa[`sii_caf_${t}`]);
  const ambiente = form.sii_ambiente || "certificacion";

  // ── Obtener CAF del SII vía proxy ─────────────────────────────────────────
  // El proxy usa el certificado de Bastian (18711008-4) embebido.
  // SimpleAPI hace scraping del SII autenticándose con ese certificado.
  // RutEmpresa = Zumma — el SII emitirá folios a nombre de Zumma.
  const obtenerCAF = async () => {
    setObteniendo(true);
    toast(`Solicitando CAF tipo ${tipoCaf} al SII — esto puede tardar unos segundos...`);
    try {
      const r = await siiApi.solicitarFolios(empresa.rut, tipoCaf, cantCaf);
      console.log("[CAF] Respuesta:", r);

      // SimpleAPI puede devolver el XML en distintos campos
      const cafXml = r?.CafXml || r?.cafXml || r?.Xml || r?.xml ||
                     r?.CAF    || r?.caf    || r?.Contenido || r?.contenido ||
                     (typeof r === "string" && r.includes("<") ? r : null);

      if (!cafXml) {
        const msg = r?.Mensaje || r?.mensaje || r?.Error || r?.error ||
                    r?.Message || JSON.stringify(r).slice(0, 200);
        throw new Error(`Sin CAF en respuesta: ${msg}`);
      }

      // Guardar en Supabase
      const campo = `sii_caf_${tipoCaf}`;
      await sb(`empresas?id=eq.${empresa.id}`, {
        method:  "PATCH",
        body:    JSON.stringify({ [campo]: cafXml }),
        prefer:  "return=minimal",
      });
      setForm(f => ({...f, [campo]: cafXml}));
      await onRefresh();
      toast(`CAF tipo ${tipoCaf} obtenido y guardado ✓`, "success");
    } catch(e) {
      console.error("[CAF]", e);
      toast(e.message, "error");
    }
    setObteniendo(false);
  };

  // ── Test: emitir boleta de prueba ─────────────────────────────────────────
  const emitirPrueba = async () => {
    const cafXml = form.sii_caf_39 || empresa.sii_caf_39;
    if (!cafXml) { toast("Primero obtén el CAF tipo 39","error"); return; }
    setEnviando(true);
    try {
      const payload = {
        emisor: {
          rut:         empresa.rut,
          razonSocial: empresa.razon_social,
          giro:        empresa.giro || "Comercio",
          acteco:      [Number(form.sii_acteco) || 620000],
          direccion:   empresa.direccion || "Sin dirección",
          comuna:      empresa.ciudad || "Santiago",
        },
        receptor: { rut:"66666666-6", razonSocial:"-", giro:"-", direccion:"-", comuna:"Santiago" },
        tipoDte:  39,
        folio:    0,
        fecha:    new Date().toISOString().slice(0,10),
        detalles: [{ nombre:"Producto de prueba", cantidad:1, precio:1000 }],
        cafXml,
        ambiente,
      };

      toast("1/3 Generando DTE...");
      const dte = await siiApi.emitirDte(payload);
      console.log("[DTE] emitir:", dte);
      const xmlFirmado = dte?.Xml||dte?.xml||dte?.DTE||dte?.dte||dte?.XmlDTE;
      if (!xmlFirmado) throw new Error("Sin XML firmado: " + JSON.stringify(dte).slice(0,150));

      toast("2/3 Generando sobre EnvioDTE...");
      const sobre = await siiApi.generarSobre(xmlFirmado, empresa.rut);
      console.log("[DTE] sobre:", sobre);
      const sobreXml = sobre?.Xml||sobre?.xml||sobre?.Sobre||sobre?.sobre||sobre?.XmlSobre;
      if (!sobreXml) throw new Error("Sin sobre XML: " + JSON.stringify(sobre).slice(0,150));

      toast("3/3 Enviando al SII de certificación...");
      const envio = await siiApi.enviarSII(sobreXml, empresa.rut, ambiente);
      console.log("[DTE] envío:", envio);
      const trackId = envio?.TrackId||envio?.trackId||envio?.track_id||envio?.TrackID;
      toast(`Boleta de prueba enviada al SII ✓${trackId?" — TrackID: "+trackId:""}`, "success");
    } catch(e) {
      console.error("[DTE prueba]", e);
      toast(e.message, "error");
    }
    setEnviando(false);
  };

  return (
    <div>
      {/* Banner ambiente */}
      <div className={`alert ${ambiente==="produccion"?"alert-success":"alert-info"}`} style={{marginBottom:16}}>
        <div>
          <strong>{ambiente==="produccion" ? "Producción" : "Certificación (Pruebas)"}</strong>
          <div style={{fontSize:11,marginTop:2,opacity:0.8}}>
            {ambiente==="certificacion"
              ? "Los DTE se envían al SII de pruebas — sin validez tributaria real."
              : "Los DTE se envían al SII real y tienen validez tributaria."}
          </div>
        </div>
      </div>

      {/* Configuración básica */}
      <div className="form-grid" style={{marginBottom:16}}>
        <div className="input-group">
          <label className="input-label">Ambiente</label>
          <select className="input" value={ambiente} onChange={e=>F("sii_ambiente",e.target.value)}>
            <option value="certificacion">Certificación (pruebas)</option>
            <option value="produccion">Producción</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Código actividad económica</label>
          <input className="input" value={form.sii_acteco||""} onChange={e=>F("sii_acteco",e.target.value)} placeholder="620000"/>
        </div>
        <div className="input-group">
          <label className="input-label">N° Resolución SII</label>
          <input className="input" value={form.resolucion_sii||""} onChange={e=>F("resolucion_sii",e.target.value)} placeholder="0"/>
        </div>
        <div className="input-group">
          <label className="input-label">Fecha resolución</label>
          <input type="date" className="input" value={form.fecha_resolucion||""} onChange={e=>F("fecha_resolucion",e.target.value)}/>
        </div>
        <div className="input-group">
          <label className="input-label">Emitir DTE automáticamente al SII</label>
          <select className="input" value={form.sii_emitir_al_sii?"si":"no"}
            onChange={e=>F("sii_emitir_al_sii",e.target.value==="si")}>
            <option value="no">No (solo guardar en Arca)</option>
            <option value="si">Sí (emitir al SII en cada venta)</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Certificado usado</label>
          <input className="input" value="18711008-4 — Bastian Marré (embebido en proxy)" readOnly/>
        </div>
      </div>

      {/* Obtener CAF */}
      <div style={{fontWeight:700,fontSize:11,color:"#1a2332",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>
        Folios CAF — Autorización de folios del SII
      </div>
      <div className="alert alert-info" style={{marginBottom:12}}>
        <div style={{fontSize:12,lineHeight:1.6}}>
          El proxy usa el certificado de <strong>Bastian Marré (18711008-4)</strong> para autenticarse
          en el SII y descargar el CAF a nombre de <strong>{empresa?.razon_social}</strong>.
          No se requiere clave SII adicional.
        </div>
      </div>

      <div style={{display:"flex",gap:10,alignItems:"flex-end",marginBottom:14}}>
        <div className="input-group">
          <label className="input-label">Tipo DTE</label>
          <select className="input" style={{width:220}} value={tipoCaf} onChange={e=>setTipoCaf(e.target.value)}>
            {tiposDTE.map(t=><option key={t.v} value={t.v}>{t.v} — {t.l}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Cantidad folios</label>
          <input type="number" className="input" style={{width:100}} value={cantCaf}
            onChange={e=>setCantCaf(parseInt(e.target.value)||100)} min={1} max={500}/>
        </div>
        <button className="btn btn-primary" onClick={obtenerCAF} disabled={obteniendo}>
          {obteniendo ? "Obteniendo del SII..." : "Obtener CAF del SII"}
        </button>
      </div>

      <div className="table-wrap" style={{marginBottom:16}}>
        <table>
          <thead><tr><th>Tipo DTE</th><th>Estado CAF</th><th></th></tr></thead>
          <tbody>{tiposDTE.map(t=>(
            <tr key={t.v}>
              <td style={{fontWeight:500}}>{t.v} — {t.l}</td>
              <td>{tieneCaf(t.v)
                ? <span className="badge badge-success">CAF disponible</span>
                : <span className="badge badge-navy">Sin CAF</span>}
              </td>
              <td>{tieneCaf(t.v) && (
                <button className="btn btn-ghost btn-sm" style={{color:"#ef4444"}}
                  onClick={async()=>{
                    if(!confirm(`¿Borrar CAF tipo ${t.v}?`))return;
                    F(`sii_caf_${t.v}`,"");
                    await sb(`empresas?id=eq.${empresa.id}`,{method:"PATCH",
                      body:JSON.stringify({[`sii_caf_${t.v}`]:null}),prefer:"return=minimal"});
                    toast(`CAF ${t.v} eliminado`);
                  }}>Borrar</button>
              )}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Test */}
      {tieneCaf("39") && (
        <div className="card" style={{marginBottom:16}}>
          <div className="card-title">Probar ciclo completo DTE</div>
          <p style={{fontSize:12,color:"#9aa5b0",marginBottom:12}}>
            Emite, timbra y envía una boleta de $1.000 al SII de <strong>{ambiente}</strong>.
            Revisa la consola del navegador (F12) para ver los detalles de cada paso.
          </p>
          <button className="btn btn-primary" onClick={emitirPrueba} disabled={enviando}>
            {enviando ? "Enviando..." : `Emitir boleta de prueba (${ambiente})`}
          </button>
        </div>
      )}

      <div className="alert alert-info">
        <div style={{fontSize:12,lineHeight:1.7}}>
          <strong>Flujo completo:</strong><br/>
          1. Guarda la configuración.<br/>
          2. Selecciona el tipo DTE y haz clic en "Obtener CAF del SII".<br/>
          3. Prueba con "Emitir boleta de prueba".<br/>
          4. Cuando funcione, activa "Emitir DTE automáticamente" → cada venta del POS va al SII.
        </div>
      </div>
    </div>
  );
}


// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
function Configuracion({ empresa, onRefresh, toast }) {
  const [form, setForm] = useState({...empresa});
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("empresa");
  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const guardar = async () => {
    setLoading(true);
    try{await api.updateEmpresa(empresa.id,form);await onRefresh();toast("Configuración guardada","success");}
    catch(e){toast(e.message,"error");}
    setLoading(false);
  };

  return (
    <div>
      <div className="tab-bar">
        {[["empresa","🏢 Empresa"],["documentos","📄 Documentos"],["impresion","🖨 Impresión"],["inventario","📦 Inventario"],["sii","🏛 SII"]].map(([k,l])=>(
          <button key={k} className={`tab-btn ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="card" style={{maxWidth:680}}>
        {tab==="empresa"&&<div className="form-grid">
          <div className="input-group form-full"><label className="input-label">Razón social</label><input className="input" value={form.razon_social||""} onChange={e=>F("razon_social",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">RUT</label><input className="input" value={form.rut||""} readOnly/></div>
          <div className="input-group"><label className="input-label">Giro</label><input className="input" value={form.giro||""} onChange={e=>F("giro",e.target.value)}/></div>
          <div className="input-group form-full"><label className="input-label">Dirección</label><input className="input" value={form.direccion||""} onChange={e=>F("direccion",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Ciudad</label><input className="input" value={form.ciudad||""} onChange={e=>F("ciudad",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Teléfono</label><input className="input" value={form.telefono||""} onChange={e=>F("telefono",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Email</label><input className="input" value={form.email||""} onChange={e=>F("email",e.target.value)}/></div>
          <div className="input-group"><label className="input-label">Sitio web</label><input className="input" value={form.sitio_web||""} onChange={e=>F("sitio_web",e.target.value)}/></div>
        </div>}
        {tab==="documentos"&&<div className="form-grid">
          <div className="input-group form-full"><label className="input-label">Pie de documento</label><input className="input" value={form.config_pie_boleta||""} onChange={e=>F("config_pie_boleta",e.target.value)} placeholder="Ej: Gracias por su preferencia"/></div>
          <div className="input-group"><label className="input-label">Ventas sin stock</label>
            <select className="input" value={form.ventas_sin_stock?"si":"no"} onChange={e=>F("ventas_sin_stock",e.target.value==="si")}>
              <option value="no">No permitir</option><option value="si">Permitir</option>
            </select></div>
        </div>}
        {tab==="impresion"&&<div className="form-grid">
          <div className="input-group"><label className="input-label">Formato</label>
            <select className="input" value={form.config_impresora||"termica"} onChange={e=>F("config_impresora",e.target.value)}>
              <option value="termica">Térmica</option><option value="carta">Carta</option><option value="oficio">Oficio</option><option value="a4">A4</option>
            </select></div>
          <div className="input-group"><label className="input-label">Ancho térmica (mm)</label>
            <select className="input" value={form.config_ancho_papel||80} onChange={e=>F("config_ancho_papel",parseInt(e.target.value))}>
              <option value={58}>58mm</option><option value={80}>80mm</option><option value={114}>114mm</option>
            </select></div>
        </div>}
        {tab==="inventario"&&<div className="form-grid">
          <div className="input-group"><label className="input-label">Stock crítico global</label><input className="input" type="number" value={form.stock_critico_global||5} onChange={e=>F("stock_critico_global",parseInt(e.target.value))}/></div>
        </div>}
        {tab==="sii"&&<SIIConfigTab empresa={empresa} form={form} setForm={setForm} F={F} toast={toast} onRefresh={onRefresh}/>}
        <div style={{marginTop:20}}>
          <button className="btn btn-primary btn-lg" onClick={guardar} disabled={loading}>{loading?"Guardando...":"Guardar cambios"}</button>
        </div>
      </div>
    </div>
  );
}



// ─── SIMPLEAPI CONFIG ─────────────────────────────────────────────────────────

// ─── SQL NUEVAS COLUMNAS EMPRESAS (ejecutar en Supabase SQL Editor) ──────────
// ALTER TABLE empresas
//   ADD COLUMN IF NOT EXISTS sii_ambiente       text DEFAULT 'certificacion',
//   ADD COLUMN IF NOT EXISTS sii_acteco          text,
//   ADD COLUMN IF NOT EXISTS sii_clave_sii       text,
//   ADD COLUMN IF NOT EXISTS sii_emitir_al_sii   boolean DEFAULT false,
//   ADD COLUMN IF NOT EXISTS sii_caf_39          text,
//   ADD COLUMN IF NOT EXISTS sii_caf_33          text,
//   ADD COLUMN IF NOT EXISTS sii_caf_41          text,
//   ADD COLUMN IF NOT EXISTS sii_caf_34          text,
//   ADD COLUMN IF NOT EXISTS sii_caf_52          text,
//   ADD COLUMN IF NOT EXISTS sii_caf_56          text,
//   ADD COLUMN IF NOT EXISTS sii_caf_61          text;
// ALTER TABLE documentos
//   ADD COLUMN IF NOT EXISTS xml_dte        text,
//   ADD COLUMN IF NOT EXISTS estado_sii     text DEFAULT 'local',
//   ADD COLUMN IF NOT EXISTS track_id_sii   text;

// ── SimpleAPI — todas las llamadas van al proxy Netlify (resuelve CORS) ────────
// Proxy SimpleAPI — llama directo a la Netlify Function con ?path= para evitar
// problemas de redirect. URL base: /.netlify/functions/sii?path=/rut/123
const SII_FN = "https://dulcet-kataifi-b052b8.netlify.app/.netlify/functions/sii";

async function sapi(path, opts = {}) {
  // Pasar la ruta como query param — 100% confiable sin depender de redirects
  const url = `${SII_FN}?path=${encodeURIComponent(path)}`;
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers||{}) },
    method: opts.method || "GET",
    body: opts.body,
  });
  const txt = await r.text().catch(() => "{}");
  let data; try { data = JSON.parse(txt); } catch { data = { raw: txt }; }
  if (!r.ok) throw new Error(data?.error || data?.message || `Error ${r.status}: ${txt.slice(0,120)}`);
  return data;
}

function cleanRutUI(r="") { return r.replace(/\./g,""); }

const siiApi = {
  // Auth
  token:         ()                              => sapi("/auth/token"),
  // RUT
  contribuyente: (rut)                           => sapi(`/rut/${encodeURIComponent(rut)}`),
  // RCV
  rcvVentas:     (rut, periodo)                  => sapi(`/rcv/ventas/${cleanRutUI(rut)}/${periodo}`),
  rcvCompras:    (rut, periodo)                  => sapi(`/rcv/compras/${cleanRutUI(rut)}/${periodo}`),
  rcvResumenCompras: (rut, periodo)              => sapi(`/rcv/compras/resumen/${cleanRutUI(rut)}/${periodo}`),
  rcvResumen:    (rut, periodo)                  => sapi("/rcv/resumen", { method:"POST", body: JSON.stringify({ rut: cleanRutUI(rut), periodo }) }),
  // Folios
  folios:        (rut, tipoDte)                  => sapi(`/folios/${cleanRutUI(rut)}/${tipoDte}`),
  solicitarFolios: (rut, tipo, cantidad)          => sapi("/folios/solicitar", { method:"POST", body: JSON.stringify({ rut, tipo, cantidad }) }),
  // DTE
  emitirDte:     (payload)                       => sapi("/dte/generar",     { method:"POST", body: JSON.stringify(payload) }),
  firmarXml:     (dteXml, cafXml)                => sapi("/dte/generar/xml", { method:"POST", body: JSON.stringify({ dteXml, cafXml }) }),
  consultarDte:  (rutEmisor, tipoDte, folio, total, fecha, ambiente) =>
    sapi("/dte/consultar", { method:"POST", body: JSON.stringify({ rutEmisor, tipoDte, folio, total, fecha, ambiente }) }),
  // Sobre
  generarSobre:  (dteXmlFirmado, rutEmisor)      => sapi("/envio/generar", { method:"POST", body: JSON.stringify({ dteXmlFirmado, rutEmisor }) }),
  enviarSII:     (sobreXml, rutEmisor, ambiente)  => sapi("/envio/enviar",  { method:"POST", body: JSON.stringify({ sobreXml, rutEmisor, ambiente }) }),
  // PDF
  generarPdf:    (xml, template)                 => sapi("/dte/pdf",       { method:"POST", body: JSON.stringify({ xml, template: template||"Termica80mm" }) }),
  // BHE
  emitirBHE:     (rutEmisor, claveSII, receptor, detalles, retencion) =>
    sapi("/bhe/emitir", { method:"POST", body: JSON.stringify({ rutEmisor, claveSII, receptor, detalles, retencion }) }),
  anularBHE:     (rutEmisor, claveSII, folio, motivo) =>
    sapi("/bhe/anular", { method:"POST", body: JSON.stringify({ rutEmisor, claveSII, folio, motivo }) }),
  // Mapas
  geocodificar:  (direccion)                     => sapi("/mapas/geocodificar", { method:"POST", body: JSON.stringify({ direccion }) }),
};


// ─── MÓDULO SII ───────────────────────────────────────────────────────────────
function ModuloSII({ empresa, session, onRefresh, toast }) {
  const [tab, setTab] = useState("rut");

  // RUT
  const [rutQ, setRutQ] = useState("");
  const [contrib, setContrib] = useState(null);
  const [loadRut, setLoadRut] = useState(false);

  // RCV
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0,7).replace("-",""));
  const [rcvVentas, setRcvVentas] = useState([]);
  const [rcvCompras, setRcvCompras] = useState([]);
  const [rcvResumen, setRcvResumen] = useState(null);
  const [loadRCV, setLoadRCV] = useState(false);

  // Folios
  const [tipoDteF, setTipoDteF] = useState("39");
  const [foliosData, setFoliosData] = useState(null);
  const [loadFolios, setLoadFolios] = useState(false);

  // DTE consultar
  const [dteRut, setDteRut]     = useState(empresa?.rut||"");
  const [dteTipo, setDteTipo]   = useState("39");
  const [dteFolio, setDteFolio] = useState("");
  const [dteData, setDteData]   = useState(null);
  const [loadDte, setLoadDte]   = useState(false);

  const tiposDTE = [
    {v:"33",l:"Factura afecta"},   {v:"34",l:"Factura exenta"},
    {v:"39",l:"Boleta afecta"},    {v:"41",l:"Boleta exenta"},
    {v:"52",l:"Guía de despacho"}, {v:"56",l:"Nota de débito"},
    {v:"61",l:"Nota de crédito"},
  ];

  // ── RUT ────────────────────────────────────────────────────────────────────
  const buscarRut = async () => {
    if (!rutQ) { toast("Ingresa un RUT","error"); return; }
    setLoadRut(true); setContrib(null);
    try {
      const d = await siiApi.contribuyente(rutQ.trim());
      setContrib(d);
      toast("Datos obtenidos del SII","success");
    } catch(e) { toast(e.message,"error"); }
    setLoadRut(false);
  };

  // Autocompletar cliente/proveedor desde resultado RUT
  const copiarDatos = () => {
    if (!contrib) return;
    const txt = JSON.stringify({
      nombre:    contrib.RazonSocial || contrib.razonSocial || "",
      rut:       contrib.Rut || contrib.rut || "",
      giro:      contrib.GiroEmpresa || contrib.giro || "",
      direccion: contrib.Direccion || contrib.direccion || "",
      ciudad:    contrib.Ciudad || contrib.ciudad || "",
      email:     contrib.Email || contrib.email || "",
    }, null, 2);
    navigator.clipboard?.writeText(txt).catch(()=>{});
    toast("Datos copiados","success");
  };

  // ── RCV ────────────────────────────────────────────────────────────────────
  const consultarRCV = async () => {
    // Período debe ser AAAAMM — aceptar tanto "2025-04" como "202504"
    const periodoLimpio = periodo.replace("-","").replace("/","").trim();
    if (!periodoLimpio||periodoLimpio.length!==6||!/^\d{6}$/.test(periodoLimpio)) {
      toast("Período inválido — usa formato AAAAMM (ej: 202504)","error"); return;
    }
    const rutLimpio = empresa.rut.replace(/\./g,"").replace(/-/g,"") + "-" + empresa.rut.split("-").pop();
    // SimpleAPI espera el RUT sin puntos pero CON guión: 76096773-0
    const rutParaApi = empresa.rut.replace(/\./g,"");
    setLoadRCV(true); setRcvVentas([]); setRcvCompras([]); setRcvResumen(null);
    toast(`Consultando RCV ${rutParaApi} período ${periodoLimpio}...`,"info");
    try {
      const [v, co, res] = await Promise.all([
        siiApi.rcvVentas(rutParaApi, periodoLimpio).catch(e=>{console.warn("RCV ventas:",e.message);return [];}),
        siiApi.rcvCompras(rutParaApi, periodoLimpio).catch(e=>{console.warn("RCV compras:",e.message);return [];}),
        siiApi.rcvResumen(rutParaApi, periodoLimpio).catch(e=>{console.warn("RCV resumen:",e.message);return null;}),
      ]);
      const vs  = Array.isArray(v)  ? v  : (v?.Documentos||v?.documentos||[]);
      const cos = Array.isArray(co) ? co : (co?.Documentos||co?.documentos||[]);
      setRcvVentas(vs); setRcvCompras(cos); setRcvResumen(res);
      if(!vs.length&&!cos.length) toast(`Sin documentos en ${periodoLimpio} — verifica el período`,"warning");
      else toast(`RCV cargado: ${vs.length} ventas, ${cos.length} compras`,"success");
    } catch(e) { toast(e.message,"error"); }
    setLoadRCV(false);
  };

  // ── Folios ─────────────────────────────────────────────────────────────────
  const consultarFolios = async () => {
    setLoadFolios(true); setFoliosData(null);
    try {
      const d = await siiApi.folios(empresa.rut, tipoDteF);
      setFoliosData(d);
    } catch(e) { toast(e.message,"error"); }
    setLoadFolios(false);
  };

  // ── DTE consultar ──────────────────────────────────────────────────────────
  const consultarDte = async () => {
    if (!dteRut||!dteFolio) { toast("RUT y folio requeridos","error"); return; }
    setLoadDte(true); setDteData(null);
    try {
      const d = await siiApi.consultarDte(dteRut, dteTipo, dteFolio);
      setDteData(d);
    } catch(e) { toast(e.message,"error"); }
    setLoadDte(false);
  };

  const TABS = [
    ["rut","Consulta RUT"],
    ["rcv","Compras y Ventas"],
    ["folios","Folios CAF"],
    ["dte","Verificar DTE"],
  ];

  return (
    <div>
      {/* Banner */}
      <div style={{background:"#f8f9fb",border:"1px solid #e8ecf0",borderRadius:12,padding:"13px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:38,height:38,borderRadius:9,background:"#edf6fd",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:900,fontSize:14,color:"#54b2e9"}}>SII</div>
        <div>
          <div style={{fontWeight:700,fontSize:13}}>Integración SII — SimpleAPI</div>
          <div style={{fontSize:11,color:"#9aa5b0",marginTop:1}}>{empresa?.razon_social} · {empresa?.rut} · Proxy v4: dulcet-kataifi-b052b8.netlify.app</div>
        </div>
        <span className="badge badge-success" style={{marginLeft:"auto"}}>Conectado</span>
      </div>

      <div className="tab-bar">
        {TABS.map(([k,l])=>(
          <button key={k} className={`tab-btn ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── TAB RUT ─────────────────────────────────────────────────────────── */}
      {tab==="rut" && (
        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-title">Datos de contribuyente</div>
            <p style={{fontSize:12,color:"#9aa5b0",marginBottom:12}}>
              Obtiene razón social, giro, dirección y actividades económicas directamente del SII.
              Sirve para autocompletar clientes y proveedores en Arca.
            </p>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <div className="input-group" style={{flex:1}}>
                <label className="input-label">RUT a consultar</label>
                <input className="input" value={rutQ} onChange={e=>setRutQ(e.target.value)}
                  placeholder="76.096.773-0" onKeyDown={e=>e.key==="Enter"&&buscarRut()}/>
              </div>
              <button className="btn btn-primary" onClick={buscarRut} disabled={loadRut}>
                {loadRut?"Consultando...":"Consultar SII"}
              </button>
            </div>
          </div>

          {contrib && (
            <div className="card">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div className="card-title" style={{marginBottom:0}}>Resultado</div>
                <button className="btn btn-soft btn-sm" onClick={copiarDatos}>Copiar datos</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {[
                  ["Razón social", contrib.RazonSocial||contrib.razonSocial],
                  ["RUT",          contrib.Rut||contrib.rut],
                  ["Giro",         contrib.GiroEmpresa||contrib.Giro||contrib.giro],
                  ["Dirección",    contrib.Direccion||contrib.direccion],
                  ["Ciudad",       contrib.Ciudad||contrib.ciudad],
                  ["Comuna",       contrib.Comuna||contrib.comuna],
                  ["Email",        contrib.Email||contrib.email||contrib.CorreoIntercambio],
                  ["Estado",       contrib.Estado||contrib.estado],
                ].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{padding:"9px 12px",background:"#f8f9fb",borderRadius:8}}>
                    <div style={{fontSize:9.5,color:"#9aa5b0",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{l}</div>
                    <div style={{fontWeight:500,fontSize:13}}>{v}</div>
                  </div>
                ))}
              </div>
              {(contrib.Actividades||contrib.actividades||[]).length>0&&(
                <div style={{marginTop:14}}>
                  <div style={{fontSize:9.5,color:"#9aa5b0",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Actividades económicas</div>
                  {(contrib.Actividades||contrib.actividades).map((a,i)=>(
                    <div key={i} style={{fontSize:12,padding:"5px 0",borderBottom:"1px solid #f0f2f6",display:"flex",gap:10}}>
                      <span style={{color:"#9aa5b0",minWidth:50}}>{a.Codigo||a.codigo}</span>
                      <span>{a.Descripcion||a.descripcion||a.Glosa||a.glosa}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB RCV ─────────────────────────────────────────────────────────── */}
      {tab==="rcv" && (
        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-title">Registro de Compras y Ventas</div>
            <div className="alert alert-info" style={{marginBottom:12}}>
              Consulta directamente el RCV del SII de {empresa?.razon_social}.
              Los datos no se almacenan.
            </div>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <div className="input-group">
                <label className="input-label">Período (AAAAMM)</label>
                <input type="month" className="input" style={{width:150}}
                  value={periodo.length===6?periodo.slice(0,4)+"-"+periodo.slice(4):periodo}
                  onChange={e=>setPeriodo(e.target.value.replace("-",""))}/>
              </div>
              <button className="btn btn-primary" onClick={consultarRCV} disabled={loadRCV}>
                {loadRCV?"Cargando RCV...":"Consultar RCV"}
              </button>
              {loadRCV&&<div className="spinner"/>}
            </div>
          </div>

          {rcvResumen && (
            <div className="grid-4" style={{marginBottom:14}}>
              {[
                {l:"Ventas",   v:fmt.clp(rcvResumen.montoVentas||0),  s:`${rcvResumen.cantidadVentas||0} docs`, c:"#54b2e9"},
                {l:"IVA ventas", v:fmt.clp(rcvResumen.ivaVentas||0)},
                {l:"Compras",  v:fmt.clp(rcvResumen.montoCompras||0), s:`${rcvResumen.cantidadCompras||0} docs`, c:"#ef4444"},
                {l:"IVA a pagar", v:fmt.clp(rcvResumen.ivaAPagar||0), c:(rcvResumen.ivaAPagar||0)>=0?"#ef4444":"#22c55e"},
              ].map((s,i)=>(
                <div key={i} className="stat-card">
                  <div className="stat-label">{s.l}</div>
                  <div className="stat-value" style={{fontSize:18,color:s.c||"#1a2332"}}>{s.v}</div>
                  {s.s&&<div className="stat-sub">{s.s}</div>}
                </div>
              ))}
            </div>
          )}

          {rcvVentas.length>0&&(
            <div className="card" style={{marginBottom:14}}>
              <div className="card-title">Ventas ({rcvVentas.length})</div>
              <div className="table-wrap"><table>
                <thead><tr><th>Tipo</th><th>Folio</th><th>Fecha</th><th>Receptor</th><th>Neto</th><th>IVA</th><th>Total</th><th>Estado</th></tr></thead>
                <tbody>{rcvVentas.slice(0,100).map((v,i)=>{
                  const tipo   = v.TipoDTE||v.tipoDte||v.Tipo||"—";
                  const folio  = v.Folio||v.folio||"—";
                  const fecha  = v.FechaEmision||v.fechaEmision||v.Fecha||"—";
                  const recep  = v.RutReceptor||v.rutReceptor||"—";
                  const neto   = v.MontoNeto||v.montoNeto||v.MntNeto||0;
                  const iva    = v.MontoIVA||v.montoIva||v.IVA||0;
                  const total  = v.MontoTotal||v.montoTotal||v.MntTotal||0;
                  const estado = v.Estado||v.estado||"—";
                  return (
                    <tr key={i}>
                      <td><span className="badge badge-navy" style={{fontSize:9}}>{tipo}</span></td>
                      <td style={{fontWeight:600}}>#{folio}</td>
                      <td style={{fontSize:11,color:"#9aa5b0"}}>{fecha}</td>
                      <td style={{fontSize:11}}>{recep}</td>
                      <td style={{fontSize:12}}>{fmt.clp(neto)}</td>
                      <td style={{fontSize:12}}>{fmt.clp(iva)}</td>
                      <td style={{fontWeight:600,color:"#54b2e9"}}>{fmt.clp(total)}</td>
                      <td><span className={`badge ${estado==="ACEP"||estado==="DOK"?"badge-success":"badge-navy"}`} style={{fontSize:9}}>{estado}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            </div>
          )}

          {rcvCompras.length>0&&(
            <div className="card">
              <div className="card-title">Compras ({rcvCompras.length})</div>
              <div className="table-wrap"><table>
                <thead><tr><th>Tipo</th><th>Folio</th><th>Fecha</th><th>Emisor</th><th>Neto</th><th>IVA</th><th>Total</th></tr></thead>
                <tbody>{rcvCompras.slice(0,100).map((v,i)=>{
                  const tipo  = v.TipoDTE||v.tipoDte||v.Tipo||"—";
                  const folio = v.Folio||v.folio||"—";
                  const fecha = v.FechaEmision||v.fechaEmision||"—";
                  const emis  = v.RutEmisor||v.rutEmisor||"—";
                  const total = v.MontoTotal||v.montoTotal||v.MntTotal||0;
                  const iva   = v.MontoIVA||v.montoIva||v.IVA||0;
                  const neto  = v.MontoNeto||v.montoNeto||v.MntNeto||0;
                  return (
                    <tr key={i}>
                      <td><span className="badge badge-navy" style={{fontSize:9}}>{tipo}</span></td>
                      <td style={{fontWeight:600}}>#{folio}</td>
                      <td style={{fontSize:11,color:"#9aa5b0"}}>{fecha}</td>
                      <td style={{fontSize:11}}>{emis}</td>
                      <td style={{fontSize:12}}>{fmt.clp(neto)}</td>
                      <td style={{fontSize:12}}>{fmt.clp(iva)}</td>
                      <td style={{fontWeight:600,color:"#ef4444"}}>{fmt.clp(total)}</td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            </div>
          )}

          {!loadRCV&&!rcvVentas.length&&!rcvCompras.length&&(
            <EmptyState icon="" text="Ingresa un período y consulta el RCV"/>
          )}
        </div>
      )}

      {/* ── TAB FOLIOS ──────────────────────────────────────────────────────── */}
      {tab==="folios" && (
        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-title">Folios CAF disponibles</div>
            <p style={{fontSize:12,color:"#9aa5b0",marginBottom:12}}>
              Consulta los folios autorizados por el SII para cada tipo de documento.
              Los folios son necesarios para emitir DTE.
            </p>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <div className="input-group">
                <label className="input-label">Tipo de documento</label>
                <select className="input" style={{width:220}} value={tipoDteF} onChange={e=>setTipoDteF(e.target.value)}>
                  {tiposDTE.map(t=><option key={t.v} value={t.v}>{t.v} — {t.l}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={consultarFolios} disabled={loadFolios}>
                {loadFolios?"Consultando...":"Consultar folios"}
              </button>
              <button className="btn btn-soft" onClick={async()=>{
                const r=await siiApi.token().catch(e=>{toast(e.message,"error");return null;});
                if(r){toast("Token SII obtenido — revisa consola","success");console.log("Token SII:",r);}
              }}>Obtener Token SII</button>
            </div>
          </div>

          {foliosData && (
            <div className="card">
              <div className="card-title">Folios tipo {tipoDteF} — {tiposDTE.find(t=>t.v===tipoDteF)?.l}</div>
              <div className="grid-3" style={{marginBottom:14}}>
                {[
                  {l:"Disponibles",v:foliosData.Disponibles??foliosData.disponibles??0,c:"#22c55e"},
                  {l:"Utilizados", v:foliosData.Utilizados??foliosData.utilizados??0},
                  {l:"Anulados",   v:foliosData.Anulados??foliosData.anulados??0, c:"#ef4444"},
                ].map((s,i)=>(
                  <div key={i} className="stat-card">
                    <div className="stat-label">{s.l}</div>
                    <div className="stat-value" style={{fontSize:22,color:s.c||"#1a2332"}}>{s.v}</div>
                  </div>
                ))}
              </div>
              {/* Raw data en caso de campos distintos */}
              <div style={{background:"#f8f9fb",borderRadius:8,padding:12,fontSize:11,fontFamily:"monospace",color:"#5a6a78",overflowX:"auto"}}>
                <pre>{JSON.stringify(foliosData,null,2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB DTE ─────────────────────────────────────────────────────────── */}
      {tab==="dte" && (
        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-title">Verificar estado de DTE en SII</div>
            <p style={{fontSize:12,color:"#9aa5b0",marginBottom:12}}>
              Consulta si un documento tributario electrónico fue recibido y aceptado por el SII.
            </p>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">RUT Emisor</label>
                <input className="input" value={dteRut} onChange={e=>setDteRut(e.target.value)} placeholder="76.096.773-0"/>
              </div>
              <div className="input-group">
                <label className="input-label">Tipo DTE</label>
                <select className="input" value={dteTipo} onChange={e=>setDteTipo(e.target.value)}>
                  {tiposDTE.map(t=><option key={t.v} value={t.v}>{t.v} — {t.l}</option>)}
                </select>
              </div>
              <div className="input-group form-full">
                <label className="input-label">Folio</label>
                <input className="input" type="number" value={dteFolio}
                  onChange={e=>setDteFolio(e.target.value)} placeholder="101"/>
              </div>
            </div>
            <button className="btn btn-primary" style={{marginTop:14}} onClick={consultarDte} disabled={loadDte}>
              {loadDte?"Consultando SII...":"Verificar DTE"}
            </button>
          </div>

          {dteData && (
            <div className="card">
              <div className="card-title">Resultado SII</div>
              {(() => {
                const est  = dteData.Estado||dteData.estado||dteData.CodEstado||"";
                const glos = dteData.Glosa||dteData.glosa||dteData.GlosaEstado||"";
                const ok   = ["DOK","DPR","DOK"].includes(est)||glos.toLowerCase().includes("acepta");
                return (
                  <div className={`alert ${ok?"alert-success":"alert-danger"}`} style={{marginBottom:14}}>
                    <strong>{est}</strong> — {glos}
                  </div>
                );
              })()}
              <div style={{background:"#f8f9fb",borderRadius:8,padding:12,fontSize:11,fontFamily:"monospace",color:"#5a6a78"}}>
                <pre>{JSON.stringify(dteData,null,2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MI CUENTA ────────────────────────────────────────────────────────────────
function MiCuenta({ session, empresa, toast }) {
  const [form, setForm] = useState({ clave_nueva:"", clave_confirmar:"" });
  const [saving, setSaving] = useState(false);
  const u = session?.usuario;
  const rol = u?.rol || "operador";
  const F = (k,v) => setForm(f=>({...f,[k]:v}));

  const roleDesc = {
    supervisor: { label:"Supervisor", desc:"Acceso total al sistema. Puede ver y operar todos los módulos, configurar la empresa y administrar usuarios.", color:"role-supervisor" },
    operador:   { label:"Operador",   desc:"Acceso a Punto de Venta, Caja, Ventas y Clientes. No tiene acceso a Gastos, Reportes ni Configuración.", color:"role-operador" },
    bodeguero:  { label:"Bodeguero",  desc:"Acceso a Inventario y Proveedores. Puede ver Ventas pero no operar el POS ni acceder a datos financieros.", color:"role-bodeguero" },
    contador:   { label:"Contador",   desc:"Acceso a Ventas, Gastos, Reportes y Clientes en modo lectura. No puede operar el POS ni modificar inventario.", color:"role-contador" },
  };
  const rd = roleDesc[rol] || roleDesc.supervisor;

  const cambiarClave = async () => {
    if(!form.clave_nueva||form.clave_nueva.length<4){toast("La clave debe tener al menos 4 caracteres","error");return;}
    if(form.clave_nueva!==form.clave_confirmar){toast("Las claves no coinciden","error");return;}
    setSaving(true);
    try {
      await sb(`usuarios?id=eq.${u.id}`, { method:"PATCH", body:JSON.stringify({clave:form.clave_nueva}), prefer:"return=minimal" });
      setForm({clave_nueva:"",clave_confirmar:""});
      toast("Clave actualizada correctamente","success");
    } catch(e){toast(e.message,"error");}
    setSaving(false);
  };

  const modulos = {
    supervisor: ["Punto de Venta","Caja","Ventas","Inventario","Clientes","Proveedores","Gastos","Reportes","Configuración"],
    operador:   ["Punto de Venta","Caja","Ventas","Clientes"],
    bodeguero:  ["Inventario","Proveedores","Ventas (lectura)"],
    contador:   ["Ventas","Gastos","Reportes","Clientes (lectura)"],
  };

  return (
    <div style={{maxWidth:620}}>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">Información de sesión</div>
        <div style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:"8px 0",fontSize:13}}>
          {[
            ["Nombre", `${u?.nombre||""} ${u?.apellido||""}`],
            ["RUT de acceso", u?.rut||"—"],
            ["Empresa", empresa?.razon_social||"—"],
            ["RUT empresa", empresa?.rut||"—"],
          ].map(([l,v])=>(
            <React.Fragment key={l}>
              <span style={{color:"#9aa5b0",fontWeight:600,fontSize:10.5,textTransform:"uppercase",letterSpacing:"0.5px",paddingTop:2}}>{l}</span>
              <span style={{fontWeight:500,paddingTop:2}}>{v}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">Rol y permisos</div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <span className={`role-chip ${rd.color}`} style={{fontSize:12,padding:"4px 12px"}}>{rd.label}</span>
        </div>
        <p style={{fontSize:12.5,color:"#5a6a78",lineHeight:1.6,marginBottom:14}}>{rd.desc}</p>
        <div style={{fontWeight:600,fontSize:10,color:"#9aa5b0",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Módulos habilitados</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {(modulos[rol]||modulos.supervisor).map(m=>(
            <span key={m} className="badge badge-info" style={{fontSize:11}}>{m}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Cambiar clave de acceso</div>
        <div className="form-grid" style={{marginBottom:14}}>
          <div className="input-group">
            <label className="input-label">Nueva clave</label>
            <input type="password" className="input" value={form.clave_nueva} onChange={e=>F("clave_nueva",e.target.value)} placeholder="Mínimo 4 caracteres"/>
          </div>
          <div className="input-group">
            <label className="input-label">Confirmar clave</label>
            <input type="password" className="input" value={form.clave_confirmar} onChange={e=>F("clave_confirmar",e.target.value)} placeholder="Repetir clave"/>
          </div>
        </div>
        {form.clave_nueva&&form.clave_confirmar&&form.clave_nueva!==form.clave_confirmar&&(
          <div className="alert alert-danger" style={{marginBottom:12}}>Las claves no coinciden</div>
        )}
        <button className="btn btn-primary" onClick={cambiarClave} disabled={saving||!form.clave_nueva}>
          {saving?"Guardando...":"Actualizar clave"}
        </button>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
window.HunoPOS = function HunoPOS() {
  const [session, setSession] = useState(()=>{ try{return JSON.parse(sessionStorage.getItem("huno_arca_v2"));}catch{return null;} });
  const [view, setView] = useState("dashboard");
  const [empresa, setEmpresa] = useState(null);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [docs, setDocs] = useState([]);
  const [sesionCaja, setSesionCaja] = useState(null);
  const [appLoading, setAppLoading] = useState(false);
  const { toasts, toast } = useToast();

  const onLogin = useCallback((sess)=>{
    sessionStorage.setItem("huno_arca_v2",JSON.stringify(sess));
    setSession(sess);
  },[]);

  const onLogout = ()=>{
    sessionStorage.removeItem("huno_arca_v2");
    setSession(null);setEmpresa(null);setProductos([]);setClientes([]);setProveedores([]);setDocs([]);setGastos([]);setSesionCaja(null);setView("dashboard");
  };

  const cargarDatos = useCallback(async()=>{
    if(!session||session.rol==="admin")return;
    setAppLoading(true);
    try {
      const emp=session.empresa; setEmpresa(emp);
      const hoy=new Date().toISOString().slice(0,10);
      const mesDesde=hoy.slice(0,7)+"-01";
      const [prods,cls,provs,docList,gastList]=await Promise.all([
        api.productos(emp.id),api.clientes(emp.id),api.proveedores(emp.id),
        api.documentos(emp.id,mesDesde,hoy),api.gastos(emp.id,mesDesde,hoy),
      ]);
      setProductos(prods||[]); setClientes(cls||[]); setProveedores(provs||[]);
      setDocs(docList||[]); setGastos(gastList||[]);
      const cajas=await api.cajas(emp.id);
      if(cajas?.length){ const ses=await api.sesionActiva(cajas[0].id); setSesionCaja(ses||null); }
    } catch(e){toast(e.message,"error");}
    setAppLoading(false);
  },[session]);

  useEffect(()=>{cargarDatos();},[cargarDatos]);

  const Toasts = () => (
    <div className="toast-container">
      {toasts.map(t=><div key={t.id} className={`toast ${t.type}`}>{t.type==="success"?"✓":t.type==="error"?"✕":"·"} {t.msg}</div>)}
    </div>
  );

  if(!session) return <><style>{CSS}</style><Login onLogin={onLogin}/><Toasts/></>;

  if(session.rol==="admin") return (
    <><style>{CSS}</style>
    <div style={{minHeight:"100vh",background:"#f0f2f6"}}>
      <div style={{background:"#081f2c",padding:"14px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontWeight:900,fontSize:20,color:"#54b2e9"}}>HUNO® <span style={{fontWeight:300,fontSize:12,color:"#9aa5b0"}}>Arca Admin</span></div>
        <button className="btn btn-ghost" style={{color:"#9aa5b0",borderColor:"#1a3d52",fontSize:12}} onClick={onLogout}>Cerrar sesión</button>
      </div>
      <AdminPanel toast={toast}/>
    </div>
    <Toasts/></>
  );

  if(appLoading) return (
    <><style>{CSS}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f0f2f6",flexDirection:"column",gap:14}}>
      <div className="spinner" style={{width:36,height:36}}/>
      <div style={{color:"#9aa5b0",fontSize:13}}>Cargando datos...</div>
    </div></>
  );

  const emp = empresa || session.empresa;
  const critCount = productos.filter(p=>p.stock<=p.stock_critico&&p.activo).length;

  const NAV = [
    {id:"dashboard",   icon:"·",  label:"Dashboard",     section:"Principal"},
    {id:"pos",         icon:"·",  label:"Punto de Venta", section:"Operaciones"},
    {id:"caja",        icon:"💵", label:"Caja",           section:"Operaciones", badge:!sesionCaja?"!":null},
    {id:"ventas",      icon:"📄", label:"Ventas",         section:"Operaciones"},
    {id:"inventario",  icon:"📦", label:"Inventario",     section:"Operaciones", badge:critCount>0?critCount:null},
    {id:"clientes",    icon:"👥", label:"Clientes",       section:"Comercial"},
    {id:"proveedores", icon:"🏭", label:"Proveedores",    section:"Comercial"},
    {id:"gastos",      icon:"💸", label:"Gastos",         section:"Finanzas"},
    {id:"reportes",    icon:"·", label:"Reportes",       section:"Finanzas"},
    {id:"configuracion",icon:"·",label:"Configuración",  section:"Sistema"},
    {id:"sii",         icon:"·",label:"SII / SimpleAPI",   section:"Sistema"},
    {id:"mi_cuenta",   icon:"·",label:"Mi cuenta",        section:"Sistema"},
  ];
  const sections = [...new Set(NAV.map(n=>n.section))];
  const labels = Object.fromEntries(NAV.map(n=>[n.id,n.label]));

  return (
    <><style>{CSS}</style>
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="brand">HUNO®</div>
          <div className="sub">Arca · Sistema de Gestión</div>
          <div className="empresa">{emp?.razon_social}</div>
          <div className="rut">{emp?.rut}</div>
        </div>
        <div className="sidebar-nav">
          {sections.map(sec=>{
            const secItems=NAV.filter(n=>n.section===sec&&puedeVer(session.usuario?.rol,n.id));
            if(!secItems.length)return null;
            return(
              <div key={sec}>
                <div className="nav-section">{sec}</div>
                {secItems.map(n=>(
                  <div key={n.id} className={`nav-item ${view===n.id?"active":""}`} onClick={()=>setView(n.id)}>
                    <span className="nav-dot"/>{n.label}
                    {n.badge&&<span className="nav-badge">{n.badge}</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="sidebar-footer">
          <div style={{fontSize:12,color:"#fff",fontWeight:500,marginBottom:2}}>{session.usuario?.nombre}</div>
          <div style={{marginBottom:10,marginTop:3}}><span className={`role-chip role-${session.usuario?.rol||"operador"}`}>{session.usuario?.rol}</span></div>
          <button className="btn btn-ghost btn-sm w-full" style={{color:"#9aa5b0",borderColor:"#1a3d52",fontSize:11}} onClick={onLogout}>Cerrar sesión</button>
        </div>
      </nav>
      <main className="main">
        {view!=="pos"&&<div className="topbar">
          <div className="topbar-title">{labels[view]}</div>
          <div className="topbar-actions">
            {sesionCaja?<span className="badge badge-success" style={{fontSize:11}}>🟢 Caja abierta</span>:<span className="badge badge-danger" style={{fontSize:11}}>🔴 Caja cerrada</span>}
            <div style={{fontSize:11,color:"#9aa5b0"}}>{new Date().toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"})}</div>
          </div>
        </div>}
        {view==="pos"
          ? <POS empresa={emp} productos={productos} clientes={clientes} sesionCaja={sesionCaja} onRefresh={cargarDatos} toast={toast}/>
          : <div className="content">
              {view==="dashboard"    && <Dashboard empresa={emp} docs={docs} productos={productos} clientes={clientes} gastos={gastos}/>}
              {view==="caja"         && <Caja empresa={emp} sesionCaja={sesionCaja} onCambioSesion={s=>{setSesionCaja(s);}} toast={toast}/>}
              {view==="ventas"       && <Ventas empresa={emp} clientes={clientes} toast={toast}/>}
              {view==="inventario"   && <Inventario empresa={emp} productos={productos} onRefresh={cargarDatos} toast={toast}/>}
              {view==="clientes"     && <Clientes empresa={emp} clientes={clientes} onRefresh={cargarDatos} toast={toast}/>}
              {view==="proveedores"  && <Proveedores empresa={emp} onRefresh={cargarDatos} toast={toast}/>}
              {view==="gastos"       && <Gastos empresa={emp} proveedores={proveedores} toast={toast}/>}
              {view==="reportes"     && <Reportes empresa={emp} productos={productos} clientes={clientes} toast={toast}/>}
              {view==="configuracion"&& <Configuracion empresa={emp} onRefresh={cargarDatos} toast={toast}/>}
              {view==="sii"          && <ModuloSII empresa={emp} session={session} onRefresh={cargarDatos} toast={toast}/>}
              {view==="mi_cuenta"     && <MiCuenta session={session} empresa={emp} toast={toast}/>}
            </div>
        }
      </main>
    </div>
    <Toasts/></>
  );
}
