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
const API_KEY        = "4419-N190-6394-5658-5230";
const PFX_B64_HARDCODED = "MIIOWQIBAzCCDhIGCSqGSIb3DQEHAaCCDgMEgg3/MIIN+zCCBZcGCSqGSIb3DQEHAaCCBYgEggWEMIIFgDCCBXwGCyqGSIb3DQEMCgECoIIE+zCCBPcwKQYKKoZIhvcNAQwBAzAbBBRnr2hNdcf+ljTz7v0+ODgMwkKeLwIDAMNQBIIEyBLm5VO1F3SUvwKSZMG1KDN9RY2gsW21JuCLJ8zJXpIHhwhTs3xjJdsTQM2kIiNAvGgt8t0qUWZ2LyjC7rRTjY+RipxSHzhYGuqSrgtFT8LN5+n3k6zZIOeF2MX0hYZTkfJuVGqWo/+GrLioUBQkVfs1HpAPTQCTVmwas2XNwMsUmJLUuVyMygwHdIK2zYC0rRTPEFDzGrAPty37yzfdDF/g25J3gpmpK0nCrVrKYne7t501alEFI4PGPXrjctNl8qeid34Voest5n24rrDK42i+MEgH7+bB/QrxajbPF5qxhuXPfCPsYtJREgvWXbpOujgOph87dhse/F6T0z7zVexyCfXfkXKUXV8RxkMH/mIPqZA2cfGVTnqMV+c5ZeHBNtlDjeMqL3sBlz+Gz9iI1vTEUbkGo6uamq5QXs+qKqnApf4LhSy4dgKmMJNb27PBDBVN2Rc88hUZ8BoX563H5+xqdLE/LqfWknwaU08lY6FC+029IUtHl+AhN2nHPFdz8878jsL37M4n+0SQJ4aGKswdY3+d5zTC2MxhTcCqpCtMSAMSiLH4RJGJ1wY2UXLFoY2pa33YCOIFGN881JWBU6nMU3bNH8UfmJBGT9bSgstXsCK7pGLOuDC6EDIxyBVnLo1q2+BZL980tP8cCgpKCULxensB+LWhUSN0CZC9AH66t97JVBzj+1K6NxuAXGb3ESXSsG8opg44iNKem2GHMFZ4Ctz54lOnoCTupl+rW4S41+jYyW45K7e0+ELkDqw2d/XJ9sr/EGN7VXuhoHSU+eXBk89Bj5ZH4Kbi1g1rpCVamzxWVz4+IL9tOAXwGq6I/1wrQ0PbsgC55sjxndUi5VbRZyOvNnUzEpMvMcYVikXDvNfnaZdfCB8qRnReTBmE9GEFNbomSOnWon0IjnbnBaExx/s/2GCBnS3mMqj7Xi6Xg5h+caSsirhNoXyG1TuB6qKFHgTCFxe/BpXmVbUo9NzSIdK2tT9AtUlOkDA1yD3Nhyod/MW/CCDbbt9/mgt7SoY+2xFJCfMp67JcshEcyRBj0/JN4UQWO4+0duURurCZIz+ub1TvNkqbzVDMuFzdoZe7lTKrfoKV5imPjn/jFaE/1voKuYdkcAcaJcE+nxqonMg0PG1Jtzt/Owysa+Tc+oss773FSDLMqvu/2zC7YAR2niPs7fEwmjsrZNa9U57BpqlqZZE5wmeTPHCNyiTPO3QDxP4y0qStj84LmW54sI/wcvlYOK7zdLe66mEi20trwV3T1DHorYSYE5fdRi0uQlb6Z/gvXsdGsMpVW6faHck8RPtiklV+xlJ9fvBpJscVsGVLtsHqabw8xhGR3j86f8VeYw1m34q7dTHXbAlSO2bUs7URgKf6MVlWKGXQqO6K00PLOsRnbGlyqlSHJi861ek+bnyGUA4a/oF30DEjsKQ+0/m+YPh7B2n0TclZykA5dqqdQWuiYMVHPBoBKB+hwSmK5Bn+aXwpoZf/NvPWlBSWjDXUjy2QB4j148nMiHKLbdBZb8L3JRQ/BPsUqJUvviHuO7/g890lgtc7MLjy4kPjolB4wDBp7B3HHmQFGiBI90eSxuZ5lwRiGPVF4S8u9zelgWfm+Dz6CA4tJWG5lcD6lHmdnPEb7zFuMEkGCSqGSIb3DQEJFDE8HjoAYgBhAHMAdABpAGEAbgAgAGEAZABvAGwAZgBvACAAbQBhAHIAcgDpACAAYgBvAHIAZABvAG4AZQBzMCEGCSqGSIb3DQEJFTEUBBJUaW1lIDE3NjIzNDg5NzgxMzcwgghcBgkqhkiG9w0BBwaggghNMIIISQIBADCCCEIGCSqGSIb3DQEHATApBgoqhkiG9w0BDAEGMBsEFEzQc+SOLr7szRAK2Iu55C9xDRnHAgMAw1CAgggIgj1ZcPH/1NWmE7AFq7KtV8PNQ3AAedkiCwJl8swawyIMmM4QrdFN2WIbh8UtChcBPd6z3KN/i0mZlnZzwOW3b1SMH3PexHLFKlYIFm8UVnX0jcLzqf2N+p5pTX4vUrJDmQrDYVsi+E4MCoC1g+3Ae7VLaFa5wAolZqAv7Rh9UzgGBF8Gve+TJCef37I8A0c9jxccYqjIMsSh8eMMZirrezqoPCfgmpAwBPYHbngykkrVl/vBo4Yqg2RTUp+enZf5OfJbXqe9xRfXLDLM+q3Fjb9PHu5OjgczGKmSdGsj3Z3P9+NEBhQWe/KqYe0OwYnpANYgih970XXVOR00i8E2XcXgScdjRhUo0jRLSbw/5jMhPdCGko6tVa3UzNY9PmMaEcv+0WAkFiB041yyhCe5qgCNzp+zIPGEUGc5fFfC6WsovKCFGL781IAw9N48E5qL0t3gUI9mUyY4SAfw3fPJ/SQMrsRTg9ABafCA8SFyqPf8HCXPd3Vvgf2vi+kHRRt23qibQfdNw+xMln74BepfJ3Fy2k2xRnfmiIohxj5z2TRNT+vyCwt0qpSCzGRjItbyn6EYvv9Angg66/8R8Xd55LDgQxid5V1c1Khg0y+NxUYt/fhYtf677tZ3vgq8HFY1saSm+l3GSCq4uOE3N1Bvv7lGHj3tuIG/yi+NqaQI8K8gT6E3OfNk8cuLnfJPN0j3/Y+QnKd1lPoI9vForlBE6381c6R4bCoPSJCaxcap9iOfWyuFtvJeKv+/BOiE2OtAiLn4g2cQ70PdeZOrlYw9jYqBSshP5JKyUQ8HPiBBgynIh8r9j/X2Dd30NqGW1lyWpIhCWD7j090WjuKpqH0ZoXMp+/ovfMj6nCoRczU5QGw2n8XtD5yBP+lsM4ac9CsaKsGi564ehnUj/ez/qAgZYWm/wlkNKrKdpoFUrL+P2+71rIcTgV9FkJaqx7/qaLGp6+NRofQxhm+X5EEIfNjPAqWNMgsQV2nnJH1ty4tBoTWnXw9s1bh9X7nMdFrohW9ppFDe8ZuXnR3635NYWWPfLd62SCAuItHhbtmhl3H5JeeqtclXaUl6rKV23bM8k7JgOr8C5Vxf5WfiOkMi2M+jct3eZFdcTdzAg9MdD+IFLfjyPHbxmaqZy/l0iVn9VYVLgmMmPGdCgm1QHHhAD9usS3sdgJyBSP0H+sAg6scSh3zf911O8GfhtoVIhHu9guYBZA2pHWEf/73q8TgEx/bwyhUOBj0BPtNYrGi9CYgK7yS55DI+cyEyd3Tze8bFETFx//wRA/k5xCAF3BQH+4yYo3aju/40NhEwD/usCl2dgapyytp1GiEq0H85H1xs/pow9Dnh+FRPUI+aKTsgVz2fmx/t3x11z8qs7Bo5SZUCUmIM+MCigYwW0QCYDbWdyRVAcTI2fNKMqGHd3uc8wikVtG9bjXmr6UUGlrmZAaZdhSBOqmuIhkh9O8ZBI0zDdTbFCiGpQWVmCeoaD7N2CJAcepI4OURva92f5vhBb/CBQCgK7nD7thxq+TSeq5xPv9a/DZnDshKaAVFqeQlIAVXmh42IoPmis646JuFJjK7q+1k50k/ztgB2B9Iwyp4LWZY+bI0L+oAaNcs3LPM9MIe7cyn+Z7JbnT3Scgnikn74K7XJidzFZG/mQ7B8eu0gJYbeJtBRZkALAr3QC+O0kO1XsViyue9sHYh1m9bqbvaqVd0ow8qx88DggBIxfflKFwJ4xJqEC8GdvujmBplR85GUpr0jtp8Jjr3GgYPa6MK9Ak377Mh5McRB/v4au0hv+i3VgEL2pJCQ71Ts7nMfW4DNrbCnAOn/Z9KO3vnFEl+Zl5V3i3Z/9lhzyDzwUVoO/XilVECpXJZqnkgpJYM2PurxuITp/BBO3EIg9hduNK2wcSSPdQu+sQbTcn1+an8RbdzcDIXEzKQcmJWf7jqZkVAHMKDe5iENdor2mW6tmEUAfmDIf1eHWYQDRP9eDsyJJypPIt6Jq7uZCuYlhcF8vIuJz3Gs08b4vD7ZCV0xNca8tOyJ5XmZ4gtc01R38HM08ppTQR6PU+9Rdb0sVphpLdJUSnQALDjPr/fsCityHy4oKZTXI7WlAUmfbMwKY93kmDPWFYuN6mY+uiGVS0M9DrG74tuOTQacZmS+Uhmn99VWdfsaPxQaJG2LDFP6I+DtOibgB0T4E5vqO/3+VfDf4AjSG+a/KSHiEu3nVDqv+GWFbdA0ZPLsZj2IwrNZ1V8wHwsMCda4j5EwuTnA/1002psII5Oae4AEmncAUxO5bDFMihhbtnyAVublJVyEf2wb3Apl5+FT+wW32OADXeTnm/hfuBJ2xD/ZIO3DOe3nml3i+TTtuwakECVnnvDjbOwUFo/A9QhoajgftWhg9P34pxGuf0R19unLtibuo4y8cjwyFdaqKLgK5i/Fp1CyCoEMnQthwNStIwJI0HP3PSQ3QmQv0fMQ3BinWf2oxr6ZlXrzCTAumI8TeKNY4kCXCoHQwNCUzl2nSzioqNv5CrsItc3DFo1pX26rY7JvjxMoEsMxUxje3IeqPBBNVh0/lo6J78RDbjJ/yhsMErNK/LoDqL4oqAQTTxJeqQPdrQyelMRwcJq/ZbtzPsiZoiimgMTLxWQssashfzwPrWltnDSJ+T5///OJdZfgqvaJBpzPmS9WNnGQqcaejsMmdeTflrWD4A8h4jnlpcd7YSJFzoi8CNYXJBWCa/HXaRKb93flORGkTlevm9ZKMEbPWjA+MCEwCQYFKw4DAhoFAAQU6jSnIHHuL50pX5cwbV3oHcR9Q1QEFHOCDu3+KnMFdhVeOpp4HwHMNHgNAgMBhqA=";
const PFX_PASS_HARDCODED = "0201";

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
      const pfxB64    = PFX_B64_HARDCODED;
      const pfxPass   = PFX_PASS_HARDCODED;

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
