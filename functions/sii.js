// HUNO® Arca — Proxy SimpleAPI v4
// Lee la ruta desde querystring: /.netlify/functions/sii?path=/rut/76096773-0
// Esto evita todos los problemas de redirect de Netlify

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

const j  = (s, d) => ({ statusCode: s, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(d) });
const e  = (s, m) => j(s, { error: m });
const ok = (d)    => j(200, d);

function cleanRut(r = "") { return r.replace(/\./g, ""); }
function pfxBlob()        { return new Blob([Buffer.from(PFX_B64, "base64")], { type: "application/x-pkcs12" }); }
function xmlBlob(str)     { return new Blob([str], { type: "application/xml" }); }

async function siJson(path, method = "GET", body = null) {
  const opts = { method, headers: { Authorization: API_KEY } };
  if (body) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
  const res  = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

async function siForm(path, inputObj, files = []) {
  const fd = new FormData();
  fd.append("input", JSON.stringify(inputObj));
  for (const f of files) fd.append("files", f.blob, f.name);
  const res  = await fetch(`${BASE}${path}`, { method: "POST", headers: { Authorization: API_KEY }, body: fd });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  // Leer ruta desde querystring ?path=/rut/123
  // Esto es 100% confiable sin importar cómo Netlify maneje los redirects
  const qs    = event.queryStringParameters || {};
  const route = (qs.path || "").replace(/\/$/, "") || "/";
  const method = event.httpMethod;
  let body = null;
  try { body = event.body ? JSON.parse(event.body) : null; } catch {}

  console.log(`[SII v4] ${method} route="${route}" qs=${JSON.stringify(qs)}`);

  try {

    if (route === "/" || route === "") {
      return ok({ status:"online", version:"4.0", proxy:"HUNO® Arca — SimpleAPI Proxy",
        rutCert: RUT_CERT, hint:"Pasar ruta en ?path=/rut/76096773-0" });
    }

    if (route.startsWith("/rut/")) {
      const rut = route.slice(5).trim();
      if (!rut) return e(400, "RUT requerido");
      const { status, data } = await siJson(`/rut/${encodeURIComponent(rut)}`);
      return j(status, data);
    }

    if (route === "/auth/token") {
      const { status, data } = await siJson("/auth/token");
      return j(status, data);
    }

    if (route.startsWith("/rcv/ventas/")) {
      const { status, data } = await siJson(`/rcv/ventas/${route.slice(12)}`);
      return j(status, data);
    }

    if (route.startsWith("/rcv/compras/resumen/")) {
      const { status, data } = await siJson(`/rcv/compras/resumen/${route.slice(21)}`);
      return j(status, data);
    }

    if (route.startsWith("/rcv/compras/")) {
      const { status, data } = await siJson(`/rcv/compras/${route.slice(13)}`);
      return j(status, data);
    }

    if (route === "/rcv/resumen") {
      const { rut, periodo } = body || {};
      if (!rut || !periodo) return e(400, "rut y periodo requeridos");
      const rutL = cleanRut(rut);
      const [rv, rc] = await Promise.all([
        siJson(`/rcv/ventas/${rutL}/${periodo}`).catch(() => ({ data:[] })),
        siJson(`/rcv/compras/${rutL}/${periodo}`).catch(() => ({ data:[] })),
      ]);
      const ventas  = Array.isArray(rv.data) ? rv.data : (rv.data?.Documentos||[]);
      const compras = Array.isArray(rc.data) ? rc.data : (rc.data?.Documentos||[]);
      const sum = (arr, ...keys) => arr.reduce((s,r) => { for (const k of keys) if (r[k]!=null) return s+Number(r[k]); return s; }, 0);
      const ivaV = sum(ventas,"MontoIVA","montoIva","IVA","iva");
      const ivaC = sum(compras,"MontoIVA","montoIva","IVA","iva");
      return ok({ periodo, cantidadVentas:ventas.length, cantidadCompras:compras.length,
        montoVentas:sum(ventas,"MontoTotal","montoTotal","MntTotal"),
        montoCompras:sum(compras,"MontoTotal","montoTotal","MntTotal"),
        ivaVentas:ivaV, ivaCompras:ivaC, ivaAPagar:ivaV-ivaC });
    }

    if (route.startsWith("/folios/") && !route.includes("/solicitar")) {
      const { status, data } = await siJson(`/folios/consultar/${route.slice(8)}`);
      return j(status, data);
    }

    if (route === "/folios/solicitar") {
      const { rut, tipo, cantidad=100 } = body || {};
      if (!rut || !tipo) return e(400, "rut y tipo requeridos");
      const { status, data } = await siForm("/folios/solicitar",
        { RutEmpresa:cleanRut(rut), Tipo:Number(tipo), Cantidad:cantidad,
          Certificado:{ Rut:RUT_CERT, Password:PFX_PASS } },
        [{ name:"Certificado.pfx", blob:pfxBlob() }]
      );
      return j(status, data);
    }

    if (route === "/dte/generar") {
      const { emisor, receptor, tipoDte=39, folio=0, fecha, detalles=[], descuentoGlobal, referencias=[] } = body || {};
      if (!emisor?.rut || !detalles.length) return e(400, "emisor.rut y detalles requeridos");
      const sumItems = detalles.reduce((s,d) => s + Math.round((d.precio||0)*(d.cantidad||1)) - (d.descuento?Math.round((d.precio||0)*(d.cantidad||1)*d.descuento/100):0), 0);
      const neto=sumItems-(descuentoGlobal?.valor||0), iva=Math.round(neto*0.19), total=neto+iva;
      const { status, data } = await siJson("/dte/generar","POST",{
        Documento:{
          Encabezado:{
            IdDoc:{ TipoDTE:tipoDte, Folio:folio, FchEmis:fecha||new Date().toISOString().slice(0,10) },
            Emisor:{ Rut:cleanRut(emisor.rut), RazonSocial:emisor.razonSocial||"", Giro:emisor.giro||"",
              ActividadEconomica:Array.isArray(emisor.acteco)?emisor.acteco:[Number(emisor.acteco)||620000],
              DireccionOrigen:emisor.direccion||"", CmnaOrigen:emisor.comuna||"" },
            Receptor:{ Rut:cleanRut(receptor?.rut||"66666666-6"), RazonSocial:receptor?.razonSocial||"-",
              Giro:receptor?.giro||"-", Direccion:receptor?.direccion||"-", CmnaRecep:receptor?.comuna||"-" },
            Totales:{ MntNeto:neto, TasaIVA:19, IVA:iva, MntTotal:total },
          },
          Detalle:detalles.map((d,i)=>({ NroLinDet:i+1, NmbItem:d.nombre, DscItem:d.descripcion||"",
            QtyItem:d.cantidad||1, UnmdItem:d.unidad||"un", PrcItem:d.precio,
            MontoItem:Math.round((d.precio*(d.cantidad||1))*(1-(d.descuento||0)/100)) })),
          DscRcgGlobal:descuentoGlobal?[{ NroLinDR:1, TpoMov:"D", GlosaDR:descuentoGlobal.descripcion||"Descuento",
            TpoValor:descuentoGlobal.tipo==="%"?"%":"$", ValorDR:descuentoGlobal.valor }]:[],
          Referencia:referencias,
        },
        Certificado:{ Rut:RUT_CERT, Password:PFX_PASS },
      });
      return j(status, data);
    }

    if (route === "/dte/generar/xml") {
      const { dteXml, cafXml } = body || {};
      if (!dteXml||!cafXml) return e(400,"dteXml y cafXml requeridos");
      const { status, data } = await siForm("/dte/generar/xml",
        { Certificado:{ Rut:RUT_CERT, Password:PFX_PASS } },
        [{ name:"DTE_SINTIMBRE.xml",blob:xmlBlob(dteXml) },
         { name:"Certificado.pfx",  blob:pfxBlob() },
         { name:"CAF.xml",          blob:xmlBlob(cafXml) }]
      );
      return j(status, data);
    }

    if (route === "/dte/consultar") {
      const { rutEmisor, rutReceptor="66666666-6", folio, total, fecha, tipoDte=39, ambiente=1 } = body || {};
      if (!rutEmisor||!folio||!total) return e(400,"rutEmisor, folio y total requeridos");
      const { status, data } = await siForm("/consulta/dte",
        { RutEmisor:cleanRut(rutEmisor), RutReceptor:cleanRut(rutReceptor),
          Folio:Number(folio), Total:Number(total),
          FechaDTE:fecha||new Date().toISOString().slice(0,10),
          Tipo:Number(tipoDte), Ambiente:ambiente },
        [{ name:"Certificado.pfx", blob:pfxBlob() }]
      );
      return j(status, data);
    }

    if (route === "/envio/generar") {
      const { dteXmlFirmado, rutEmisor } = body || {};
      if (!dteXmlFirmado||!rutEmisor) return e(400,"dteXmlFirmado y rutEmisor requeridos");
      const { status, data } = await siForm("/envio/generar",
        { RutEmisor:cleanRut(rutEmisor), RutEnvia:RUT_CERT, Password:PFX_PASS },
        [{ name:"DTE_FIRMADO.xml", blob:xmlBlob(dteXmlFirmado) },
         { name:"Certificado.pfx", blob:pfxBlob() }]
      );
      return j(status, data);
    }

    if (route === "/envio/enviar") {
      const { sobreXml, rutEmisor, ambiente=1 } = body || {};
      if (!sobreXml||!rutEmisor) return e(400,"sobreXml y rutEmisor requeridos");
      const { status, data } = await siForm("/envio/enviar",
        { RutEmisor:cleanRut(rutEmisor), Ambiente:Number(ambiente) },
        [{ name:"SobreEnvio.xml", blob:xmlBlob(sobreXml) }]
      );
      return j(status, data);
    }

    if (route === "/dte/pdf") {
      const { xml, template="Termica80mm" } = body || {};
      if (!xml) return e(400,"xml requerido");
      const { status, data } = await siJson("/dte/pdf","POST",{ Xml:xml, Template:template });
      const pdfB64 = data?.Pdf||data?.pdf||data?.Base64||data?.base64;
      if (pdfB64) return { statusCode:200, headers:{...CORS,"Content-Type":"application/pdf"}, body:pdfB64, isBase64Encoded:true };
      return j(status, data);
    }

    if (route === "/bhe/emitir") {
      const { rutEmisor, claveSII, receptor, detalles=[], retencion=true } = body || {};
      if (!rutEmisor||!claveSII||!detalles.length) return e(400,"rutEmisor, claveSII y detalles requeridos");
      const { status, data } = await siJson("/boleta/honorarios/emitir","POST",
        { RutEmisor:cleanRut(rutEmisor), PasswordSII:claveSII,
          Receptor:{ Rut:cleanRut(receptor?.rut||""), RazonSocial:receptor?.razonSocial||"" },
          Detalles:detalles.map(d=>({ Glosa:d.glosa||d.descripcion, Valor:d.valor||d.monto })),
          Retencion:retencion });
      return j(status, data);
    }

    if (route === "/bhe/anular") {
      const { rutEmisor, claveSII, folio, motivo="Error en emisión" } = body || {};
      if (!rutEmisor||!claveSII||!folio) return e(400,"rutEmisor, claveSII y folio requeridos");
      const { status, data } = await siJson("/boleta/honorarios/anular","POST",
        { RutEmisor:cleanRut(rutEmisor), PasswordSII:claveSII, Folio:Number(folio), Motivo:motivo });
      return j(status, data);
    }

    if (route === "/mapas/geocodificar") {
      const { direccion } = body || {};
      if (!direccion) return e(400,"direccion requerida");
      const { status, data } = await siJson("/mapas/geocodificar","POST",{ Direccion:direccion });
      return j(status, data);
    }

    return e(404, `Ruta no encontrada: "${route}"`);

  } catch (err) {
    console.error("[SII]", err.message);
    return e(500, err.message);
  }
};
