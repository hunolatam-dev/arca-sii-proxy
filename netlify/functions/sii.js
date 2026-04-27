// ─── HUNO® Arca — Proxy SimpleAPI ─────────────────────────────────────────────
// Netlify Function que actúa de intermediario entre Arca (browser) y SimpleAPI
// Resuelve el problema de CORS ya que SimpleAPI no permite llamadas desde browser
//
// Deploy: hunolatam-dev.netlify.app/api/sii/...
// Env vars requeridas (Netlify UI → Site → Environment variables):
//   SIMPLEAPI_KEY    = 4419-N190-6394-5658-5230
//   PFX_BASE64       = (base64 del archivo .pfx)
//   PFX_PASSWORD     = 0201

const SIMPLEAPI_BASE = "https://servicios.simpleapi.cl/api";
const API_KEY        = process.env.SIMPLEAPI_KEY || "4419-N190-6394-5658-5230";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── Construye headers para SimpleAPI ─────────────────────────────────────────
function siHeaders(extra = {}) {
  return {
    "Authorization":  API_KEY,
    "Content-Type":   "application/json",
    ...extra,
  };
}

// ── Helper fetch a SimpleAPI ──────────────────────────────────────────────────
async function callSimpleApi(path, method = "GET", body = null, extraHeaders = {}) {
  const opts = {
    method,
    headers: siHeaders(extraHeaders),
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${SIMPLEAPI_BASE}${path}`, opts);
  const text = await res.text();

  let data;
  try   { data = JSON.parse(text); }
  catch { data = { raw: text };    }

  return { status: res.status, data };
}

// ── Enrutador principal ───────────────────────────────────────────────────────
exports.handler = async (event) => {
  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  const path   = event.path.replace(/^\/.netlify\/functions\/sii/, "").replace(/^\/api\/sii/, "") || "/";
  const method = event.httpMethod;
  const body   = event.body ? JSON.parse(event.body) : null;
  const params = event.queryStringParameters || {};

  console.log(`[SII Proxy] ${method} ${path}`);

  try {
    // ── 1. GET /rut/:rut — Datos contribuyente ──────────────────────────────
    if (path.startsWith("/rut/") || path.startsWith("/Rut/")) {
      const rut = path.split("/").pop();
      const { status, data } = await callSimpleApi(`/Rut/ObtenerDatosV2/${encodeURIComponent(rut)}`);
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ── 2. POST /rcv/ventas — RCV Ventas ────────────────────────────────────
    if (path === "/rcv/ventas") {
      const { rut, clave, periodo, tipo = "BOLETA" } = body || {};
      if (!rut || !clave || !periodo) return err400("rut, clave y periodo requeridos");
      const { status, data } = await callSimpleApi(
        `/Rcv/ObtenerVentas/${encodeURIComponent(rut)}/${periodo}/${tipo}`,
        "GET", null, { clave }
      );
      return json(status, data);
    }

    // ── 3. POST /rcv/compras — RCV Compras ──────────────────────────────────
    if (path === "/rcv/compras") {
      const { rut, clave, periodo } = body || {};
      if (!rut || !clave || !periodo) return err400("rut, clave y periodo requeridos");
      const { status, data } = await callSimpleApi(
        `/Rcv/ObtenerCompras/${encodeURIComponent(rut)}/${periodo}`,
        "GET", null, { clave }
      );
      return json(status, data);
    }

    // ── 4. POST /rcv/resumen — RCV Resumen ──────────────────────────────────
    if (path === "/rcv/resumen") {
      const { rut, clave, periodo } = body || {};
      if (!rut || !clave || !periodo) return err400("rut, clave y periodo requeridos");
      const { status, data } = await callSimpleApi(
        `/Rcv/ObtenerResumen/${encodeURIComponent(rut)}/${periodo}`,
        "GET", null, { clave }
      );
      return json(status, data);
    }

    // ── 5. POST /folios/disponibles — Folios disponibles ────────────────────
    if (path === "/folios/disponibles") {
      const { rut, clave, tipoDte } = body || {};
      if (!rut || !clave || !tipoDte) return err400("rut, clave y tipoDte requeridos");
      const { status, data } = await callSimpleApi(
        `/Caf/ConsultaDisponibles/${encodeURIComponent(rut)}/${tipoDte}`,
        "GET", null, { clave }
      );
      return json(status, data);
    }

    // ── 6. POST /folios/obtener — Solicitar CAF ──────────────────────────────
    if (path === "/folios/obtener") {
      const { rut, clave, tipoDte, cantidad = 100 } = body || {};
      if (!rut || !clave || !tipoDte) return err400("rut, clave y tipoDte requeridos");
      const { status, data } = await callSimpleApi(
        `/Caf/GetFolios/${encodeURIComponent(rut)}/${tipoDte}/${cantidad}`,
        "POST", null, { clave }
      );
      return json(status, data);
    }

    // ── 7. POST /dte/verificar — Estado de un DTE ───────────────────────────
    if (path === "/dte/verificar") {
      const { rutEmisor, tipoDte, folio, monto, rutReceptor = "66666666-6" } = body || {};
      if (!rutEmisor || !tipoDte || !folio || !monto) return err400("rutEmisor, tipoDte, folio y monto requeridos");
      const { status, data } = await callSimpleApi(
        `/Dte/EstadoDte/${encodeURIComponent(rutEmisor)}/${tipoDte}/${folio}/${monto}/${encodeURIComponent(rutReceptor)}`
      );
      return json(status, data);
    }

    // ── 8. POST /dte/emitir — Emitir DTE real ───────────────────────────────
    // Requiere PFX_BASE64 y PFX_PASSWORD en env vars
    if (path === "/dte/emitir") {
      const pfxB64    = process.env.PFX_BASE64;
      const pfxPass   = process.env.PFX_PASSWORD || "0201";
      if (!pfxB64) return err400("PFX_BASE64 no configurado en variables de entorno");

      const {
        rutEmisor, razonSocial, giro, direccion, ciudad, comuna, acteco,
        fechaResolucion, numResolucion,
        tipoDte = 39,
        cafXml,
        receptor,   // { rut, razonSocial, giro, direccion, comuna, ciudad }
        detalles,   // [{ nombre, cantidad, precio, descuento? }]
        descuentoGlobal = 0,
        ambiente = "produccion", // "certificacion" | "produccion"
      } = body || {};

      if (!rutEmisor || !cafXml || !detalles?.length) {
        return err400("rutEmisor, cafXml y detalles son requeridos");
      }

      // Construir payload para SimpleAPI DTE
      const payload = {
        Ambiente:         ambiente === "certificacion" ? 0 : 1,
        CertificadoBase64: pfxB64,
        ClaveCertificado: pfxPass,
        CafXml:           cafXml,
        Emisor: {
          Rut:            rutEmisor,
          RazonSocial:    razonSocial,
          Giro:           giro,
          Direccion:      direccion,
          Ciudad:         ciudad,
          Comuna:         comuna,
          ActividadEconomica: acteco || "620000",
          FechaResolucion: fechaResolucion || "2014-08-22",
          NumeroResolucion: numResolucion || 0,
        },
        Receptor: receptor || {
          Rut:         "66666666-6",
          RazonSocial: "Sin nombre",
          Giro:        "Sin giro",
          Direccion:   "Sin direccion",
          Ciudad:      "Sin ciudad",
          Comuna:      "Sin comuna",
        },
        TipoDte: tipoDte,
        Detalles: detalles.map((d, i) => ({
          NumeroLinea: i + 1,
          Nombre:     d.nombre,
          Cantidad:   d.cantidad || 1,
          Precio:     d.precio,
          Descuento:  d.descuento || 0,
        })),
        DescuentoGlobal: descuentoGlobal,
      };

      const { status, data } = await callSimpleApi("/Dte/EmitirDte", "POST", payload);
      return json(status, data);
    }

    // ── 9. POST /dte/enviar — Enviar sobre al SII ────────────────────────────
    if (path === "/dte/enviar") {
      const { xmlFirmado, rutEmisor, ambiente = "produccion" } = body || {};
      if (!xmlFirmado || !rutEmisor) return err400("xmlFirmado y rutEmisor requeridos");

      const payload = {
        Ambiente:  ambiente === "certificacion" ? 0 : 1,
        RutEmisor: rutEmisor,
        XmlFirmado: xmlFirmado,
      };
      const { status, data } = await callSimpleApi("/Dte/EnviarSobre", "POST", payload);
      return json(status, data);
    }

    // ── 10. GET /mapas/comunas — Lista comunas ───────────────────────────────
    if (path === "/mapas/comunas") {
      const { status, data } = await callSimpleApi("/Mapas/ObtenerComunas");
      return json(status, data);
    }

    // ── 11. POST /mapas/predio — Buscar predio ───────────────────────────────
    if (path === "/mapas/predio") {
      const { status, data } = await callSimpleApi("/Mapas/BuscarRol", "POST", body);
      return json(status, data);
    }

    // ── 404 ──────────────────────────────────────────────────────────────────
    return json(404, { error: `Ruta no encontrada: ${path}` });

  } catch (err) {
    console.error("[SII Proxy] Error:", err.message);
    return json(500, { error: err.message });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function json(status, data) {
  return {
    statusCode: status,
    headers: { ...CORS, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
function err400(msg) {
  return json(400, { error: msg });
}
