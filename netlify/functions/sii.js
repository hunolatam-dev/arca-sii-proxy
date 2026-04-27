// ─── HUNO® Arca — Proxy SimpleAPI ─────────────────────────────────────────────
// Netlify Function — resuelve CORS entre Arca (browser) y servicios.simpleapi.cl
// Deploy: dulcet-kataifi-b052b8.netlify.app

const BASE = "https://servicios.simpleapi.cl/api";
const KEY  = process.env.SIMPLEAPI_KEY || "4419-N190-6394-5658-5230";
const PFX_B64  = "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";
const PFX_PASS = "0201";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── Fetch a SimpleAPI ─────────────────────────────────────────────────────────
async function si(path, method = "GET", body = null, extra = {}) {
  const opts = {
    method,
    headers: { "Authorization": KEY, "Content-Type": "application/json", ...extra },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

function ok(data)    { return { statusCode: 200, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) }; }
function err(s, msg) { return { statusCode: s,   headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: msg }) }; }

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  // Extraer ruta limpia — event.path viene como /api/sii/rut/123 desde el redirect
  const rawPath = event.rawUrl
    ? new URL(event.rawUrl).pathname
    : (event.path || "/");
  const route = rawPath.replace(/^\/.netlify\/functions\/sii/, "").replace(/^\/api\/sii/, "") || "/";
  const method = event.httpMethod;
  let body = null;
  try { body = event.body ? JSON.parse(event.body) : null; } catch {}

  console.log(`[PROXY] ${method} ${route}`);

  try {

    // ══════════════════════════════════════════════════════════════════════════
    // RUT — GET /rut/:rut
    // Endpoint SimpleAPI: GET /rut/ObtenerDatosV2/{rut}
    // Gratuito, solo API Key
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/rut/")) {
      const rut = route.replace("/rut/", "").trim();
      if (!rut) return err(400, "RUT requerido");
      const { status, data } = await si(`/rut/ObtenerDatosV2/${encodeURIComponent(rut)}`);
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SUSCRIPCIÓN / STATUS — GET /status
    // Verifica estado de la API key y quota disponible
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/status") {
      const { status, data } = await si("/suscripcion/Status");
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RCV VENTAS — POST /rcv/ventas
    // Endpoint SimpleAPI: GET /rcv/Ventas/{rut}/{periodo}/{tipo}
    // tipo: BOLETA | FACTURA | VALE
    // periodo: AAAAMM  ej: 202504
    // Requiere: clave SII en header "clave"
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/rcv/ventas") {
      const { rut, clave, periodo, tipo = "BOLETA" } = body || {};
      if (!rut || !clave || !periodo) return err(400, "rut, clave y periodo son requeridos");
      const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "");
      const { status, data } = await si(
        `/rcv/Ventas/${encodeURIComponent(rutLimpio)}/${periodo}/${tipo}`,
        "GET", null, { clave }
      );
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RCV COMPRAS — POST /rcv/compras
    // Endpoint SimpleAPI: GET /rcv/Compras/{rut}/{periodo}
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/rcv/compras") {
      const { rut, clave, periodo } = body || {};
      if (!rut || !clave || !periodo) return err(400, "rut, clave y periodo son requeridos");
      const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "");
      const { status, data } = await si(
        `/rcv/Compras/${encodeURIComponent(rutLimpio)}/${periodo}`,
        "GET", null, { clave }
      );
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RCV RESUMEN — POST /rcv/resumen
    // Endpoint SimpleAPI: GET /rcv/Resumen/{rut}/{periodo}  (si existe)
    // Alternativa: calcular desde ventas + compras
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/rcv/resumen") {
      const { rut, clave, periodo } = body || {};
      if (!rut || !clave || !periodo) return err(400, "rut, clave y periodo son requeridos");
      const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "");
      // Obtener ventas y compras en paralelo para calcular resumen
      const [rv, rc] = await Promise.all([
        si(`/rcv/Ventas/${encodeURIComponent(rutLimpio)}/${periodo}/BOLETA`, "GET", null, { clave }).catch(() => ({ data: [] })),
        si(`/rcv/Compras/${encodeURIComponent(rutLimpio)}/${periodo}`, "GET", null, { clave }).catch(() => ({ data: [] })),
      ]);
      const ventas   = Array.isArray(rv.data) ? rv.data : [];
      const compras  = Array.isArray(rc.data) ? rc.data : [];
      const sumField = (arr, ...fields) => arr.reduce((s, r) => {
        for (const f of fields) { if (r[f] != null) return s + Number(r[f]); }
        return s;
      }, 0);
      const resumen = {
        periodo,
        cantidadVentas:  ventas.length,
        cantidadCompras: compras.length,
        montoVentas:     sumField(ventas,  "MontoTotal","montoTotal","total"),
        montoCompras:    sumField(compras, "MontoTotal","montoTotal","total"),
        ivaVentas:       sumField(ventas,  "MontoIVA","montoIva","iva"),
        ivaCompras:      sumField(compras, "MontoIVA","montoIva","iva"),
      };
      resumen.ivaAPagar = resumen.ivaVentas - resumen.ivaCompras;
      return ok(resumen);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FOLIOS DISPONIBLES — POST /folios/disponibles
    // Endpoint SimpleAPI: GET /caf/ConsultaDisponibles/{rut}/{tipoDte}
    // Requiere: clave SII
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/folios/disponibles") {
      const { rut, clave, tipoDte } = body || {};
      if (!rut || !clave || !tipoDte) return err(400, "rut, clave y tipoDte son requeridos");
      const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "");
      const { status, data } = await si(
        `/caf/ConsultaDisponibles/${encodeURIComponent(rutLimpio)}/${tipoDte}`,
        "GET", null, { clave }
      );
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FOLIOS USO — POST /folios/uso
    // Endpoint SimpleAPI: GET /caf/ConsultaUso/{rut}/{tipoDte}
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/folios/uso") {
      const { rut, clave, tipoDte } = body || {};
      if (!rut || !clave || !tipoDte) return err(400, "rut, clave y tipoDte son requeridos");
      const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "");
      const { status, data } = await si(
        `/caf/ConsultaUso/${encodeURIComponent(rutLimpio)}/${tipoDte}`,
        "GET", null, { clave }
      );
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // OBTENER CAF — POST /folios/obtener
    // Endpoint SimpleAPI: POST /caf/GetFolios/{rut}/{tipoDte}/{cantidad}
    // Requiere: clave SII (para autenticarse en sii.cl y descargar CAF)
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/folios/obtener") {
      const { rut, clave, tipoDte, cantidad = 100 } = body || {};
      if (!rut || !clave || !tipoDte) return err(400, "rut, clave y tipoDte son requeridos");
      const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "");
      const { status, data } = await si(
        `/caf/GetFolios/${encodeURIComponent(rutLimpio)}/${tipoDte}/${cantidad}`,
        "POST", null, { clave }
      );
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ANULAR FOLIOS — POST /folios/anular
    // Endpoint SimpleAPI: POST /caf/Anulacion/{rut}/{tipoDte}/{folioDesde}/{folioHasta}
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/folios/anular") {
      const { rut, clave, tipoDte, folioDesde, folioHasta } = body || {};
      if (!rut || !clave || !tipoDte || !folioDesde || !folioHasta)
        return err(400, "rut, clave, tipoDte, folioDesde y folioHasta son requeridos");
      const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "");
      const { status, data } = await si(
        `/caf/Anulacion/${encodeURIComponent(rutLimpio)}/${tipoDte}/${folioDesde}/${folioHasta}`,
        "POST", null, { clave }
      );
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VERIFICAR DTE — POST /dte/verificar
    // Endpoint SimpleAPI: GET /dte/EstadoDte/{rutEmisor}/{tipoDte}/{folio}/{monto}/{rutReceptor}
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/verificar") {
      const { rutEmisor, tipoDte, folio, monto, rutReceptor = "66666666-6" } = body || {};
      if (!rutEmisor || !tipoDte || !folio || !monto)
        return err(400, "rutEmisor, tipoDte, folio y monto son requeridos");
      const rE = rutEmisor.replace(/\./g, "").replace(/-/g, "");
      const rR = rutReceptor.replace(/\./g, "").replace(/-/g, "");
      const { status, data } = await si(
        `/dte/EstadoDte/${encodeURIComponent(rE)}/${tipoDte}/${folio}/${monto}/${encodeURIComponent(rR)}`
      );
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // EMITIR DTE — POST /dte/emitir
    // Endpoint SimpleAPI: POST /dte/EmitirDte
    // El PFX va embebido (no en env var para evitar límite de 5000 chars de Netlify)
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/emitir") {
      const {
        rutEmisor, razonSocial, giro, direccion, ciudad, comuna, acteco,
        fechaResolucion, numResolucion,
        tipoDte = 39,
        cafXml,
        receptor,
        detalles,
        descuentoGlobal = 0,
        ambiente = "produccion",
      } = body || {};
      if (!rutEmisor || !cafXml || !detalles?.length)
        return err(400, "rutEmisor, cafXml y detalles son requeridos");

      const payload = {
        Ambiente:          ambiente === "certificacion" ? 0 : 1,
        CertificadoBase64: PFX_B64,
        ClaveCertificado:  PFX_PASS,
        CafXml:            cafXml,
        Emisor: {
          Rut:              rutEmisor.replace(/\./g, ""),
          RazonSocial:      razonSocial || "",
          Giro:             giro || "",
          Direccion:        direccion || "",
          Ciudad:           ciudad || "",
          Comuna:           comuna || "",
          ActividadEconomica: acteco || "620000",
          FechaResolucion:  fechaResolucion || "2014-08-22",
          NumeroResolucion: numResolucion || 0,
        },
        Receptor: receptor
          ? { ...receptor, Rut: (receptor.rut || receptor.Rut || "66666666-6").replace(/\./g, "") }
          : { Rut:"66666666-6", RazonSocial:"-", Giro:"-", Direccion:"-", Ciudad:"-", Comuna:"-" },
        TipoDte:         tipoDte,
        Detalles:        detalles.map((d, i) => ({
          NumeroLinea: i + 1,
          Nombre:      d.nombre || d.Nombre,
          Cantidad:    d.cantidad ?? 1,
          Precio:      d.precio || d.Precio,
          Descuento:   d.descuento || 0,
        })),
        DescuentoGlobal: descuentoGlobal,
      };

      const { status, data } = await si("/dte/EmitirDte", "POST", payload);
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ENVIAR SOBRE AL SII — POST /dte/enviar
    // Endpoint SimpleAPI: POST /dte/EnviarSobre
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/enviar") {
      const { xmlFirmado, rutEmisor, ambiente = "produccion" } = body || {};
      if (!xmlFirmado || !rutEmisor) return err(400, "xmlFirmado y rutEmisor son requeridos");
      const payload = {
        Ambiente:  ambiente === "certificacion" ? 0 : 1,
        RutEmisor: rutEmisor.replace(/\./g, ""),
        XmlFirmado: xmlFirmado,
      };
      const { status, data } = await si("/dte/EnviarSobre", "POST", payload);
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MAPAS — GET /mapas/comunas
    // Endpoint SimpleAPI: GET /mapas/ObtenerComunas
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/mapas/comunas") {
      const { status, data } = await si("/mapas/ObtenerComunas");
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MAPAS — POST /mapas/predio
    // Endpoint SimpleAPI: POST /mapas/ObtenerDatosPredio
    // Body: { "NombreComuna": "PUENTE ALTO", "Manzana": "360", "Predio": "15" }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/mapas/predio") {
      if (!body) return err(400, "Body requerido");
      const { status, data } = await si("/mapas/ObtenerDatosPredio", "POST", body);
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MAPAS — POST /mapas/rol
    // Endpoint SimpleAPI: POST /mapas/buscar/rol
    // Body: { "Comuna": "PUENTE ALTO", "Manzana": 360, "Predio": 15 }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/mapas/rol") {
      if (!body) return err(400, "Body requerido");
      const { status, data } = await si("/mapas/buscar/rol", "POST", body);
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MAPAS — POST /mapas/reavaluó
    // Endpoint SimpleAPI: GET /mapas/ObtenerDatosReavaluó/{idComuna}/{manzana}/{predio}
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/mapas/reavaluó" || route === "/mapas/reavaluao") {
      const { idComuna, manzana, predio } = body || {};
      if (!idComuna || !manzana || !predio) return err(400, "idComuna, manzana y predio son requeridos");
      const { status, data } = await si(`/mapas/ObtenerDatosReavaluó/${idComuna}/${manzana}/${predio}`);
      return { statusCode: status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 404
    // ══════════════════════════════════════════════════════════════════════════
    return err(404, `Ruta no encontrada: ${route}. Rutas disponibles: /rut/:rut, /rcv/ventas, /rcv/compras, /rcv/resumen, /folios/disponibles, /folios/uso, /folios/obtener, /folios/anular, /dte/verificar, /dte/emitir, /dte/enviar, /mapas/comunas, /mapas/predio, /mapas/rol, /status`);

  } catch (e) {
    console.error("[PROXY] Error:", e.message);
    return err(500, e.message);
  }
};
