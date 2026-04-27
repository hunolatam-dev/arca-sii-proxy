// ─── HUNO® Arca — Proxy SimpleAPI ────────────────────────────────────────────
// dulcet-kataifi-b052b8.netlify.app
// Node 18+ — fetch y FormData nativos, sin dependencias
//
// ENDPOINTS:
//   GET  /api/sii/auth/token
//   GET  /api/sii/rut/{rut}
//   GET  /api/sii/rcv/ventas/{rut}/{periodo}
//   GET  /api/sii/rcv/compras/{rut}/{periodo}
//   GET  /api/sii/rcv/compras/resumen/{rut}/{periodo}
//   GET  /api/sii/folios/{rut}/{tipoDte}
//   POST /api/sii/folios/solicitar
//   POST /api/sii/dte/generar          ← JSON puro (no multipart)
//   POST /api/sii/dte/generar/xml      ← multipart
//   POST /api/sii/dte/consultar        ← multipart con PFX
//   POST /api/sii/envio/generar        ← multipart
//   POST /api/sii/envio/enviar         ← multipart
//   POST /api/sii/dte/pdf              ← JSON
//   POST /api/sii/bhe/emitir           ← JSON
//   POST /api/sii/bhe/anular           ← JSON
//   POST /api/sii/mapas/geocodificar   ← JSON

const BASE    = "https://api.simpleapi.cl/api/v1";
const API_KEY = process.env.SIMPLEAPI_KEY || "4419-N190-6394-5658-5230";
const PFX_B64  = "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";
const PFX_PASS = "0201";
const RUT_CERT = "18711008-4";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── helpers ───────────────────────────────────────────────────────────────────
const j  = (s, d) => ({ statusCode: s, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(d) });
const e  = (s, m) => j(s, { error: m });
const ok = (d)    => j(200, d);

function cleanRut(r = "") { return r.replace(/\./g, ""); }

function pfxBlob() {
  return new Blob([Buffer.from(PFX_B64, "base64")], { type: "application/x-pkcs12" });
}
function xmlBlob(str) {
  return new Blob([str], { type: "application/xml" });
}

// GET o POST JSON a SimpleAPI
async function siJson(path, method = "GET", body = null) {
  const opts = { method, headers: { Authorization: API_KEY } };
  if (body) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
  const res  = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

// POST multipart/form-data a SimpleAPI
// inputObj = objeto JS → campo "input" como JSON string
// files    = [{ name, blob }]
async function siForm(path, inputObj, files = []) {
  const fd = new FormData();
  fd.append("input", JSON.stringify(inputObj));
  for (const f of files) fd.append("files", f.blob, f.name);
  const res  = await fetch(`${BASE}${path}`, { method: "POST", headers: { Authorization: API_KEY }, body: fd });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  const rawPath = event.rawUrl ? new URL(event.rawUrl).pathname : (event.path || "/");
  const route   = rawPath.replace(/^\/.netlify\/functions\/sii/, "").replace(/^\/api\/sii/, "") || "/";
  const method  = event.httpMethod;
  let body = null;
  try { body = event.body ? JSON.parse(event.body) : null; } catch {}

  console.log(`[SII] ${method} ${route}`);

  try {

    // ══════════════════════════════════════════════════════════════════════════
    // AUTH — GET /auth/token
    // Devuelve token Bearer válido 24h para autenticarse en SII
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/auth/token") {
      const { status, data } = await siJson("/auth/token");
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RUT — GET /rut/{rut}
    // Datos del contribuyente desde el SII (razón social, giro, dirección, actividades)
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/rut/")) {
      const rut = route.slice(5).trim();
      if (!rut) return e(400, "RUT requerido");
      const { status, data } = await siJson(`/rut/${encodeURIComponent(rut)}`);
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RCV VENTAS — GET /rcv/ventas/{rut}/{periodo}
    // Listado de ventas del período (AAAAMM) desde el SII
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/rcv/ventas/") && !route.includes("/resumen")) {
      // Formato: /rcv/ventas/{rut}/{periodo}
      // SimpleAPI GET — no requiere clave SII, usa la API Key
      const seg = route.slice(12); // rut/periodo
      const { status, data } = await siJson(`/rcv/ventas/${seg}`);
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RCV COMPRAS — GET /rcv/compras/{rut}/{periodo}
    // Listado de compras del período
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/rcv/compras/") && !route.includes("/resumen")) {
      const seg = route.slice(13); // rut/periodo
      const { status, data } = await siJson(`/rcv/compras/${seg}`);
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RCV RESUMEN COMPRAS — GET /rcv/compras/resumen/{rut}/{periodo}
    // Resumen mensual de compras recibidas
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/rcv/compras/resumen/")) {
      const seg = route.slice(21); // rut/periodo
      const { status, data } = await siJson(`/rcv/compras/resumen/${seg}`, "GET",
        body || { Tipo: "Recibidas" });
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RCV RESUMEN CALCULADO — POST /rcv/resumen
    // Calcula totales combinando ventas + compras en paralelo
    // Body: { rut, periodo }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/rcv/resumen") {
      const { rut, periodo } = body || {};
      if (!rut || !periodo) return e(400, "rut y periodo requeridos");
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
      const ivaV = sum(ventas,  "MontoIVA","montoIva","IVA","iva","MntIVA");
      const ivaC = sum(compras, "MontoIVA","montoIva","IVA","iva","MntIVA");
      return ok({
        periodo,
        cantidadVentas:  ventas.length,
        cantidadCompras: compras.length,
        montoVentas:     sum(ventas,  "MontoTotal","montoTotal","MntTotal"),
        montoCompras:    sum(compras, "MontoTotal","montoTotal","MntTotal"),
        ivaVentas:  ivaV,
        ivaCompras: ivaC,
        ivaAPagar:  ivaV - ivaC,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FOLIOS DISPONIBLES — GET /folios/{rut}/{tipoDte}
    // Consulta folios CAF disponibles en SimpleAPI para este RUT y tipo DTE
    // ══════════════════════════════════════════════════════════════════════════
    if (route.startsWith("/folios/") && !route.includes("/solicitar")) {
      const seg = route.slice(8); // rut/tipoDte
      const { status, data } = await siJson(`/folios/consultar/${seg}`);
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SOLICITAR FOLIOS — POST /folios/solicitar
    // Solicita nuevos folios al SII (requiere clave SII)
    // Body: { rut, tipo, cantidad, clave }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/folios/solicitar") {
      // El certificado del representante legal (Bastian 18711008-4) ya está
      // embebido en el proxy. Solo necesitamos el RUT de la empresa y el tipo DTE.
      // La clave del PFX (0201) es la credencial — no se necesita clave SII externa.
      const { rut, tipo, cantidad = 100 } = body || {};
      if (!rut || !tipo) return e(400, "rut y tipo son requeridos");
      const { status, data } = await siJson("/folios/solicitar", "POST", {
        RutEmpresa:  cleanRut(rut),
        Tipo:        Number(tipo),
        Cantidad:    cantidad,
        Certificado: { Rut: RUT_CERT, Password: PFX_PASS },
      });
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DTE GENERAR — POST /dte/generar
    // Genera boleta, factura, nota crédito/débito, guía de despacho
    // Body desde Arca: { emisor, receptor, tipoDte, folio?, fecha, detalles,
    //                    descuentoGlobal?, referencias? }
    // IMPORTANTE: SimpleAPI recibe JSON puro (no multipart) en este endpoint
    // El certificado va dentro del JSON como { Certificado: { Rut, Password } }
    // El PFX NO va aquí — va almacenado en SimpleAPI previamente
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/generar") {
      const {
        emisor, receptor, tipoDte = 39, folio = 0,
        fecha, detalles = [], descuentoGlobal, referencias = [],
      } = body || {};
      if (!emisor?.rut || !detalles.length) return e(400, "emisor.rut y detalles son requeridos");

      // Calcular totales
      const sumItems = detalles.reduce((s, d) => {
        const base = Math.round((d.precio || 0) * (d.cantidad || 1));
        const desc = d.descuento ? Math.round(base * d.descuento / 100) : 0;
        return s + base - desc;
      }, 0);
      const descG   = descuentoGlobal?.valor || 0;
      const neto    = sumItems - descG;
      const iva     = Math.round(neto * 0.19);
      const total   = neto + iva;

      const payload = {
        Documento: {
          Encabezado: {
            IdDoc: {
              TipoDTE:  tipoDte,
              Folio:    folio,
              FchEmis:  fecha || new Date().toISOString().slice(0, 10),
            },
            Emisor: {
              Rut:              cleanRut(emisor.rut),
              RazonSocial:      emisor.razonSocial || "",
              Giro:             emisor.giro || "",
              ActividadEconomica: Array.isArray(emisor.acteco)
                ? emisor.acteco : [Number(emisor.acteco) || 620000],
              DireccionOrigen:  emisor.direccion || "",
              CmnaOrigen:       emisor.comuna || "",
            },
            Receptor: {
              Rut:         cleanRut(receptor?.rut || "66666666-6"),
              RazonSocial: receptor?.razonSocial || "-",
              Giro:        receptor?.giro || "-",
              Direccion:   receptor?.direccion || "-",
              CmnaRecep:   receptor?.comuna || "-",
              Contacto:    receptor?.contacto || "",
            },
            Totales: { MntNeto: neto, TasaIVA: 19, IVA: iva, MntTotal: total },
          },
          Detalle: detalles.map((d, i) => ({
            NroLinDet: i + 1,
            NmbItem:   d.nombre,
            DscItem:   d.descripcion || "",
            QtyItem:   d.cantidad || 1,
            UnmdItem:  d.unidad || "un",
            PrcItem:   d.precio,
            MontoItem: Math.round((d.precio * (d.cantidad||1)) * (1 - (d.descuento||0)/100)),
          })),
          DscRcgGlobal: descuentoGlobal ? [{
            NroLinDR: 1,
            TpoMov:   "D",
            GlosaDR:  descuentoGlobal.descripcion || "Descuento global",
            TpoValor: descuentoGlobal.tipo === "%" ? "%" : "$",
            ValorDR:  descuentoGlobal.valor,
          }] : [],
          Referencia: referencias,
        },
        Certificado: { Rut: RUT_CERT, Password: PFX_PASS },
      };

      const { status, data } = await siJson("/dte/generar", "POST", payload);
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DTE GENERAR XML — POST /dte/generar/xml
    // Firma y timbra un XML DTE ya construido
    // Body: { dteXml, cafXml }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/generar/xml") {
      const { dteXml, cafXml } = body || {};
      if (!dteXml || !cafXml) return e(400, "dteXml y cafXml son requeridos");
      const input = { Certificado: { Rut: RUT_CERT, Password: PFX_PASS } };
      const { status, data } = await siForm("/dte/generar/xml", input, [
        { name: "DTE_SINTIMBRE.xml", blob: xmlBlob(dteXml) },
        { name: "Certificado.pfx",   blob: pfxBlob()       },
        { name: "CAF.xml",           blob: xmlBlob(cafXml) },
      ]);
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DTE CONSULTAR ESTADO — POST /dte/consultar
    // Verifica estado de un DTE en los servidores del SII
    // Body: { rutEmisor, rutReceptor, folio, total, fecha, tipoDte, ambiente? }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/consultar") {
      const { rutEmisor, rutReceptor = "66666666-6", folio, total, fecha, tipoDte = 39, ambiente = 1 } = body || {};
      if (!rutEmisor || !folio || !total) return e(400, "rutEmisor, folio y total son requeridos");
      const input = {
        RutEmisor:   cleanRut(rutEmisor),
        RutReceptor: cleanRut(rutReceptor),
        Folio:       Number(folio),
        Total:       Number(total),
        FechaDTE:    fecha || new Date().toISOString().slice(0, 10),
        Tipo:        Number(tipoDte),
        Ambiente:    ambiente,
      };
      const { status, data } = await siForm("/consulta/dte", input, [
        { name: "Certificado.pfx", blob: pfxBlob() },
      ]);
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SOBRE GENERAR — POST /envio/generar
    // Genera el EnvioDTE/EnvioBoleta para enviar al SII
    // Body: { dteXmlFirmado, rutEmisor }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/envio/generar") {
      const { dteXmlFirmado, rutEmisor } = body || {};
      if (!dteXmlFirmado || !rutEmisor) return e(400, "dteXmlFirmado y rutEmisor son requeridos");
      const input = { RutEmisor: cleanRut(rutEmisor), RutEnvia: RUT_CERT, Password: PFX_PASS };
      const { status, data } = await siForm("/envio/generar", input, [
        { name: "DTE_FIRMADO.xml",  blob: xmlBlob(dteXmlFirmado) },
        { name: "Certificado.pfx",  blob: pfxBlob()              },
      ]);
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SOBRE ENVIAR — POST /envio/enviar
    // Envía el sobre EnvioDTE al SII (ambiente 0=cert, 1=producción)
    // Body: { sobreXml, rutEmisor, ambiente? }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/envio/enviar") {
      const { sobreXml, rutEmisor, ambiente = 1 } = body || {};
      if (!sobreXml || !rutEmisor) return e(400, "sobreXml y rutEmisor son requeridos");
      const input = { RutEmisor: cleanRut(rutEmisor), Ambiente: Number(ambiente) };
      const { status, data } = await siForm("/envio/enviar", input, [
        { name: "SobreEnvio.xml", blob: xmlBlob(sobreXml) },
      ]);
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DTE PDF — POST /dte/pdf
    // Genera PDF del DTE desde XML firmado
    // Body: { xml, template? }  template: "Termica80mm"|"Carta"|"A4"
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/dte/pdf") {
      const { xml, template = "Termica80mm" } = body || {};
      if (!xml) return e(400, "xml es requerido");
      const { status, data } = await siJson("/dte/pdf", "POST", { Xml: xml, Template: template });
      // Si devuelve PDF en base64
      const pdfB64 = data?.Pdf || data?.pdf || data?.Base64 || data?.base64;
      if (pdfB64) {
        return {
          statusCode: 200,
          headers: { ...CORS, "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=dte.pdf" },
          body: pdfB64,
          isBase64Encoded: true,
        };
      }
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BHE EMITIR — POST /bhe/emitir
    // Emite Boleta de Honorarios Electrónica
    // Body: { rutEmisor, claveSII, receptor:{ rut, razonSocial },
    //         detalles:[{ glosa, valor }], retencion? }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/bhe/emitir") {
      const { rutEmisor, claveSII, receptor, detalles = [], retencion = true } = body || {};
      if (!rutEmisor || !claveSII || !detalles.length) return e(400, "rutEmisor, claveSII y detalles son requeridos");
      const { status, data } = await siJson("/boleta/honorarios/emitir", "POST", {
        RutEmisor:   cleanRut(rutEmisor),
        PasswordSII: claveSII,
        Receptor: {
          Rut:         cleanRut(receptor?.rut || ""),
          RazonSocial: receptor?.razonSocial || "",
        },
        Detalles: detalles.map(d => ({ Glosa: d.glosa || d.descripcion, Valor: d.valor || d.monto })),
        Retencion: retencion,
      });
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BHE ANULAR — POST /bhe/anular
    // Anula una Boleta de Honorarios Electrónica
    // Body: { rutEmisor, claveSII, folio, motivo? }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/bhe/anular") {
      const { rutEmisor, claveSII, folio, motivo = "Error en emisión" } = body || {};
      if (!rutEmisor || !claveSII || !folio) return e(400, "rutEmisor, claveSII y folio son requeridos");
      const { status, data } = await siJson("/boleta/honorarios/anular", "POST", {
        RutEmisor:   cleanRut(rutEmisor),
        PasswordSII: claveSII,
        Folio:       Number(folio),
        Motivo:      motivo,
      });
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MAPAS GEOCODIFICAR — POST /mapas/geocodificar
    // Geocodifica una dirección → coordenadas lat/lng
    // Body: { direccion }
    // ══════════════════════════════════════════════════════════════════════════
    if (route === "/mapas/geocodificar") {
      const { direccion } = body || {};
      if (!direccion) return e(400, "direccion es requerida");
      const { status, data } = await siJson("/mapas/geocodificar", "POST", { Direccion: direccion });
      return j(status, data);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 404
    // ══════════════════════════════════════════════════════════════════════════
    return e(404, `Ruta no encontrada: ${route}`);

  } catch (err) {
    console.error("[SII Proxy]", err.message);
    return e(500, err.message);
  }
};
