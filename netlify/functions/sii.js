// ─── HUNO® Arca — Proxy SimpleAPI ─────────────────────────────────────────────
// dulcet-kataifi-b052b8.netlify.app
// Node 18+ (fetch + FormData nativos — sin dependencias)
//
// RUTAS DISPONIBLES:
//   GET  /api/sii/rut/{rut}                    → datos contribuyente SII
//   GET  /api/sii/rcv/ventas/{rut}/{periodo}   → RCV ventas  (periodo: AAAAMM)
//   GET  /api/sii/rcv/compras/{rut}/{periodo}  → RCV compras
//   GET  /api/sii/folios/{rut}/{tipoDte}       → folios disponibles CAF
//   GET  /api/sii/dte/consultar/{rut}/{tipo}/{folio} → estado DTE en SII
//   GET  /api/sii/auth/token                   → token SII (24h)
//   POST /api/sii/dte/generar                  → emitir DTE (boleta/factura)
//   POST /api/sii/dte/generar/xml              → firmar XML existente
//   POST /api/sii/envio/generar                → generar sobre EnvioDTE
//   POST /api/sii/envio/enviar                 → enviar sobre al SII
//   POST /api/sii/dte/pdf                      → generar PDF del DTE
//   POST /api/sii/rcv/resumen                  → resumen calculado ventas+compras

const API_BASE = "https://api.simpleapi.cl/api/v1";
const API_KEY  = process.env.SIMPLEAPI_KEY || "4419-N190-6394-5658-5230";

// PFX embebido (base64) — evita el límite de 5000 chars de Netlify env vars
const PFX_B64  = "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";
const PFX_PASS = "0201";
const RUT_FIRMA = "18711008-4"; // RUT del certificado (Bastian Marré)

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── helpers ──────────────────────────────────────────────────────────────────
function cleanRut(r = "") { return r.replace(/\./g, "").replace(/-/g, ""); }

function jsonResp(statusCode, data) {
  return { statusCode, headers: { ...CORS, "Content-Type": "application/json" },
           body: JSON.stringify(data) };
}
function errResp(code, msg) { return jsonResp(code, { error: msg }); }

// Convierte base64 a Buffer compatible con FormData Blob
function b64ToBlob(b64, mime) {
  const bin = Buffer.from(b64, "base64");
  return new Blob([bin], { type: mime });
}

// Llama a SimpleAPI con JSON body
async function siJson(path, method = "GET", body = null) {
  const opts = { method, headers: { Authorization: API_KEY } };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res  = await fetch(`${API_BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

// Llama a SimpleAPI con multipart/form-data
// inputObj  = objeto JS que se serializa como campo "input"
// files     = [{ name, blob }]  archivos adicionales
async function siForm(path, inputObj, files = []) {
  const fd = new FormData();
  fd.append("input", JSON.stringify(inputObj));
  for (const f of files) fd.append("files", f.blob, f.name);
  const res  = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: API_KEY },
    body: fd,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

// ── Handler principal ─────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  // Extraer ruta limpia
  const rawPath = event.rawUrl
    ? new URL(event.rawUrl).pathname
    : (event.path || "/");
  const route = rawPath
    .replace(/^\/.netlify\/functions\/sii/, "")
    .replace(/^\/api\/sii/, "")
    || "/";

  const method = event.httpMethod;
  let body = null;
  try { body = event.body ? JSON.parse(event.body) : null; } catch {}

  console.log(`[SII] ${method} ${route}`);

  try {

    // ══════════════════════════════════════════════════════════════════════════
    // GET /rut/{rut}
    // → GET https://api.simpleapi.cl/api/v1/rut/{rut}
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/rut/")) {
      const rut = route.slice(5).trim();
      if (!rut) return errResp(400, "RUT requerido");
      const { status, data } = await siJson(`/rut/${encodeURIComponent(rut)}`);
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /auth/token
    // → GET https://api.simpleapi.cl/api/v1/auth/token
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/auth/token") {
      const { status, data } = await siJson("/auth/token");
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /rcv/ventas/{rut}/{periodo}
    // → GET https://api.simpleapi.cl/api/v1/rcv/ventas/{rut}/{periodo}
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/rcv/ventas/")) {
      const parts = route.slice(12).split("/"); // rut / periodo
      if (parts.length < 2) return errResp(400, "Formato: /rcv/ventas/{rut}/{periodo}");
      const [rut, periodo] = parts;
      const { status, data } = await siJson(`/rcv/ventas/${encodeURIComponent(rut)}/${periodo}`);
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /rcv/compras/{rut}/{periodo}
    // → GET https://api.simpleapi.cl/api/v1/rcv/compras/{rut}/{periodo}
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/rcv/compras/")) {
      const parts = route.slice(13).split("/");
      if (parts.length < 2) return errResp(400, "Formato: /rcv/compras/{rut}/{periodo}");
      const [rut, periodo] = parts;
      const { status, data } = await siJson(`/rcv/compras/${encodeURIComponent(rut)}/${periodo}`);
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /rcv/resumen  { rut, periodo }
    // Calcula resumen combinando ventas + compras en paralelo
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/rcv/resumen") {
      const { rut, periodo } = body || {};
      if (!rut || !periodo) return errResp(400, "rut y periodo requeridos");
      const rutL = cleanRut(rut);
      const [rv, rc] = await Promise.all([
        siJson(`/rcv/ventas/${rutL}/${periodo}`).catch(() => ({ data: [] })),
        siJson(`/rcv/compras/${rutL}/${periodo}`).catch(() => ({ data: [] })),
      ]);
      const ventas  = Array.isArray(rv.data) ? rv.data : (rv.data?.Documentos || []);
      const compras = Array.isArray(rc.data) ? rc.data : (rc.data?.Documentos || []);
      const sum = (arr, ...keys) => arr.reduce((s, r) => {
        for (const k of keys) if (r[k] != null) return s + Number(r[k]);
        return s;
      }, 0);
      return jsonResp(200, {
        periodo,
        cantidadVentas:  ventas.length,
        cantidadCompras: compras.length,
        montoVentas:     sum(ventas,  "MontoTotal","montoTotal","MntTotal","total"),
        montoCompras:    sum(compras, "MontoTotal","montoTotal","MntTotal","total"),
        ivaVentas:       sum(ventas,  "MontoIVA","montoIva","IVA","iva"),
        ivaCompras:      sum(compras, "MontoIVA","montoIva","IVA","iva"),
        ivaAPagar:       sum(ventas,"MontoIVA","montoIva","IVA","iva") - sum(compras,"MontoIVA","montoIva","IVA","iva"),
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /folios/{rut}/{tipoDte}
    // → GET https://api.simpleapi.cl/api/v1/folios/consultar/{rut}/{tipoDte}
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/folios/")) {
      const parts = route.slice(8).split("/"); // rut / tipoDte
      if (parts.length < 2) return errResp(400, "Formato: /folios/{rut}/{tipoDte}");
      const [rut, tipoDte] = parts;
      const { status, data } = await siJson(`/folios/consultar/${encodeURIComponent(rut)}/${tipoDte}`);
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /dte/consultar/{rut}/{tipo}/{folio}
    // → GET https://api.simpleapi.cl/api/v1/dte/consultar/{rut}/{tipo}/{folio}
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/dte/consultar/")) {
      const seg = route.slice(15); // rut/tipo/folio
      const { status, data } = await siJson(`/dte/consultar/${seg}`);
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /dte/generar
    // Emite un DTE (boleta afecta 39, factura afecta 33, etc.)
    // Body esperado desde Arca:
    // {
    //   emisor: { rut, razonSocial, giro, acteco, direccion, comuna, telefono? },
    //   receptor: { rut, razonSocial, giro, direccion, comuna, contacto? },
    //   tipoDte: 39,
    //   folio: 0,          ← 0 = SimpleAPI asigna automáticamente
    //   fecha: "2024-04-27",
    //   detalles: [{ nombre, descripcion?, cantidad, precio, descuento? }],
    //   descuentoGlobal?: { descripcion, tipo, valor },
    //   cafXml: "<CAF>...</CAF>",   ← XML del CAF como string
    //   ambiente: "produccion" | "certificacion"
    // }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/generar") {
      const {
        emisor, receptor, tipoDte = 39, folio = 0,
        fecha, detalles, descuentoGlobal,
        cafXml, ambiente = "produccion",
      } = body || {};

      if (!emisor?.rut || !detalles?.length || !cafXml) {
        return errResp(400, "emisor.rut, detalles y cafXml son requeridos");
      }

      // Calcular totales desde los detalles
      const neto = detalles.reduce((s, d) => {
        const base = (d.precio || 0) * (d.cantidad || 1);
        const desc = d.descuento ? base * d.descuento / 100 : 0;
        return s + Math.round(base - desc);
      }, 0);
      const descGlobal = descuentoGlobal?.valor || 0;
      const netoFinal  = neto - descGlobal;
      const iva        = Math.round(netoFinal * 0.19);
      const total      = netoFinal + iva;

      const input = {
        Documento: {
          Encabezado: {
            IdentificacionDTE: {
              TipoDTE:   tipoDte,
              Folio:     folio,
              FechaEmision: fecha || new Date().toISOString().slice(0, 10),
              FormaPago: 1,
            },
            Emisor: {
              Rut:                 cleanRut(emisor.rut),
              RazonSocial:         emisor.razonSocial || "",
              Giro:                emisor.giro || "",
              ActividadEconomica:  Array.isArray(emisor.acteco)
                                     ? emisor.acteco
                                     : [emisor.acteco || 620000],
              DireccionOrigen:     emisor.direccion || "",
              ComunaOrigen:        emisor.comuna || "",
              Telefono:            emisor.telefono ? [emisor.telefono] : [],
            },
            Receptor: {
              Rut:         cleanRut(receptor?.rut || "66666666-6"),
              RazonSocial: receptor?.razonSocial || "-",
              Giro:        receptor?.giro || "-",
              Direccion:   receptor?.direccion || "-",
              Comuna:      receptor?.comuna || "-",
              Contacto:    receptor?.contacto || "",
            },
            Totales: {
              MontoNeto: netoFinal,
              TasaIVA:   19,
              IVA:       iva,
              MontoTotal: total,
            },
          },
          Detalles: detalles.map((d, i) => ({
            NroLinDet:    i + 1,
            Nombre:       d.nombre,
            Descripcion:  d.descripcion || "",
            Cantidad:     d.cantidad || 1,
            UnidadMedida: d.unidad || "un",
            Precio:       d.precio,
            Descuento:    d.descuento || 0,
            MontoItem:    Math.round((d.precio * (d.cantidad||1)) * (1 - (d.descuento||0)/100)),
          })),
          Referencias: [],
          DescuentosRecargos: descuentoGlobal ? [{
            TipoMovimiento: "Descuento",
            Descripcion:    descuentoGlobal.descripcion || "Descuento global",
            TipoValor:      descuentoGlobal.tipo === "%" ? "Porcentaje" : "Pesos",
            Valor:          descuentoGlobal.valor,
          }] : [],
        },
        Certificado: {
          Rut:      RUT_FIRMA,
          Password: PFX_PASS,
        },
      };

      // Archivos: PFX + CAF
      const pfxBlob = b64ToBlob(PFX_B64, "application/x-pkcs12");
      const cafBlob = new Blob([cafXml], { type: "application/xml" });

      const { status, data } = await siForm("/dte/generar", input, [
        { name: "Certificado.pfx", blob: pfxBlob },
        { name: "CAF.xml",         blob: cafBlob  },
      ]);
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /dte/generar/xml
    // Firma y timbra un XML ya construido
    // Body: { dteXml: "<DTE>...</DTE>", cafXml: "<CAF>...</CAF>" }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/generar/xml") {
      const { dteXml, cafXml } = body || {};
      if (!dteXml || !cafXml) return errResp(400, "dteXml y cafXml requeridos");

      const input = { Certificado: { Rut: RUT_FIRMA, Password: PFX_PASS } };
      const pfxBlob = b64ToBlob(PFX_B64, "application/x-pkcs12");
      const dteBlob = new Blob([dteXml], { type: "application/xml" });
      const cafBlob = new Blob([cafXml], { type: "application/xml" });

      const { status, data } = await siForm("/dte/generar/xml", input, [
        { name: "DTE.xml",         blob: dteBlob },
        { name: "Certificado.pfx", blob: pfxBlob },
        { name: "CAF.xml",         blob: cafBlob },
      ]);
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /envio/generar
    // Genera el sobre EnvioDTE para enviar al SII
    // Body: { dteXmlFirmado: "<DTE>...</DTE>", rutEmisor }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/envio/generar") {
      const { dteXmlFirmado, rutEmisor } = body || {};
      if (!dteXmlFirmado || !rutEmisor) return errResp(400, "dteXmlFirmado y rutEmisor requeridos");

      const input = {
        RutEmisor: cleanRut(rutEmisor),
        RutEnvia:  RUT_FIRMA,
        Password:  PFX_PASS,
      };
      const pfxBlob = b64ToBlob(PFX_B64, "application/x-pkcs12");
      const dteBlob = new Blob([dteXmlFirmado], { type: "application/xml" });

      const { status, data } = await siForm("/envio/generar", input, [
        { name: "DTE.xml",         blob: dteBlob },
        { name: "Certificado.pfx", blob: pfxBlob },
      ]);
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /envio/enviar
    // Envía el sobre EnvioDTE al SII
    // Body: { sobreXml: "<EnvioDTE>...</EnvioDTE>", rutEmisor, ambiente }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/envio/enviar") {
      const { sobreXml, rutEmisor, ambiente = "produccion" } = body || {};
      if (!sobreXml || !rutEmisor) return errResp(400, "sobreXml y rutEmisor requeridos");

      const input = {
        RutEmisor: cleanRut(rutEmisor),
        Ambiente:  ambiente === "certificacion" ? 0 : 1,
      };
      const sobreBlob = new Blob([sobreXml], { type: "application/xml" });

      const { status, data } = await siForm("/envio/enviar", input, [
        { name: "SobreEnvio.xml", blob: sobreBlob },
      ]);
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /dte/pdf
    // Genera PDF del DTE
    // Body: { xml: "<DTE>...</DTE>", template?: "Termica80mm"|"Carta"|"A4" }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/pdf") {
      const { xml, template = "Termica80mm" } = body || {};
      if (!xml) return errResp(400, "xml requerido");

      const { status, data } = await siJson("/dte/pdf", "POST", {
        Xml:      xml,
        Template: template,
      });

      // Si la respuesta es base64 del PDF, devolverlo como tal
      if (data?.Pdf || data?.pdf || data?.base64) {
        const pdfB64 = data.Pdf || data.pdf || data.base64;
        return {
          statusCode: 200,
          headers: {
            ...CORS,
            "Content-Type":        "application/pdf",
            "Content-Disposition": "inline; filename=documento.pdf",
          },
          body:            pdfB64,
          isBase64Encoded: true,
        };
      }
      return jsonResp(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 404 — Ruta no encontrada
    // ══════════════════════════════════════════════════════════════════════════
    return errResp(404, {
      message: `Ruta no encontrada: ${route}`,
      rutasDisponibles: [
        "GET  /api/sii/rut/{rut}",
        "GET  /api/sii/auth/token",
        "GET  /api/sii/rcv/ventas/{rut}/{periodo}",
        "GET  /api/sii/rcv/compras/{rut}/{periodo}",
        "POST /api/sii/rcv/resumen  { rut, periodo }",
        "GET  /api/sii/folios/{rut}/{tipoDte}",
        "GET  /api/sii/dte/consultar/{rut}/{tipo}/{folio}",
        "POST /api/sii/dte/generar",
        "POST /api/sii/dte/generar/xml",
        "POST /api/sii/envio/generar",
        "POST /api/sii/envio/enviar",
        "POST /api/sii/dte/pdf",
      ],
    });

  } catch (e) {
    console.error("[SII Proxy Error]", e.message);
    return errResp(500, e.message);
  }
};
