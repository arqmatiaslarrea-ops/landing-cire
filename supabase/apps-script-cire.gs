/**
 * Script de Google de CIRE: conecta la agenda y las ofertas de Drive con el CRM.
 * Instalación (una sola vez, 5 minutos), con la cuenta arqmatiaslarrea@gmail.com:
 * 1. https://script.google.com → "Nuevo proyecto". Borrá lo que aparece, pegá este archivo y completá TOKEN. Guardá.
 * 2. Elegí la función "instalar" y tocá "Ejecutar". Aceptá los permisos (agenda, Drive y planillas).
 *    Desde ahí, cada 10 minutos manda al CRM las reuniones con invitados externos y los leads nuevos de Meta.
 * 3. "Implementar" → "Nueva implementación" → tipo "Aplicación web".
 *    Ejecutar como: Yo. Quién tiene acceso: Cualquier usuario. → "Implementar".
 *    Copiá la URL que termina en /exec y pasásela a Claude: con eso el botón "Generar oferta" del CRM arma el documento.
 */
const URL_CRM = "https://dhbyfrjkeecuvlkqlbne.supabase.co/functions/v1/crm-agenda";
const TOKEN = "PEGAR_TOKEN"; // te lo pasa Claude por chat; no lo subas a ningún repositorio
const PLANTILLA_OFERTA = "1EjkWPgxlH8iV1EzK0wiJXZLtKp2tCXHPXT1TvG90Aeg";
const CARPETA_OFERTAS = "1k-ufFplHLOBMDrXdQbBbCEDWBVQ-7xSd";
const URL_META = "https://dhbyfrjkeecuvlkqlbne.supabase.co/functions/v1/crm-lead-meta";
const PLANILLA_META = "1mvZZGLSO2ml6fgieDDoqB9LqjNzLG9ku9yPqfU83Wpg"; // Leads CIRE Inmobiliaria - Meta
const PESTANAS_META = { "Amenabar - Meta": "amenabar", "Mitre - Meta": "mitre", "Bogotá - Meta": "bogota", "Acoyte - Meta": "acoyte", "Honorio - Meta": "honorio", "Gaona - Meta": "gaona" };

// Lee la planilla de leads de Meta y manda al CRM los de los últimos 3 días (el CRM ignora los que ya tiene).
// Si se suma un inmueble nuevo, agregá su pestaña a PESTANAS_META y avisale a Claude para darlo de alta en el CRM.
function sincronizarMeta() {
  const desde = Date.now() - 3 * 864e5;
  const leads = [];
  const libro = SpreadsheetApp.openById(PLANILLA_META);
  Object.keys(PESTANAS_META).forEach((nombre) => {
    const hoja = libro.getSheetByName(nombre);
    if (!hoja) return;
    hoja.getDataRange().getValues().forEach((fila) => {
      fila.forEach((celda, i) => {
        if (typeof celda !== "string" || !/^l:\d+$/.test(celda.trim())) return;
        const f = fila.slice(i + 1, i + 20);
        const creado = String(f[0] || "");
        if (!/^\d{4}-\d\d-\d\dT/.test(creado) || new Date(creado).getTime() < desde) return;
        const larga = String(f[1] || "").indexOf("ag:") === 0;
        const v = larga
          ? { anuncio: f[2], conjunto: f[4], campana: f[6], formulario: f[8], organico: String(f[9]) === "true", plataforma: f[10], etapa: f[11], capital: f[12], visita: f[13], nombre: f[14], email: f[15], tel: f[16] }
          : { etapa: f[1], capital: f[2], visita: f[3], nombre: f[4], email: f[5], tel: f[6] };
        const limpio = (x) => (x ? String(x).replace(/_/g, " ").replace(/\.$/, "").trim() : null);
        leads.push({ lead_id: celda.trim(), creado, inmueble: PESTANAS_META[nombre], campana: v.campana || null, conjunto: v.conjunto || null, anuncio: v.anuncio || null,
          formulario: v.formulario || null, plataforma: v.plataforma || null, organico: v.organico === undefined ? null : v.organico,
          nombre: v.nombre ? String(v.nombre).trim() : null, email: v.email ? String(v.email).trim() : null, telefono: v.tel ? String(v.tel).replace("p:", "").trim() : null,
          etapa_compra: limpio(v.etapa), capital: limpio(v.capital), interes_visita: limpio(v.visita) });
      });
    });
  });
  if (!leads.length) return;
  UrlFetchApp.fetch(URL_META, { method: "post", contentType: "application/json", muteHttpExceptions: true, headers: { "x-agenda-token": TOKEN }, payload: JSON.stringify({ leads }) });
}

function sincronizar() {
  const desde = new Date(Date.now() - 24 * 3600e3);
  const hasta = new Date(Date.now() + 30 * 24 * 3600e3);
  const eventos = CalendarApp.getDefaultCalendar().getEvents(desde, hasta).map((e) => ({
    id: e.getId(),
    inicio: e.getStartTime().toISOString(),
    fin: e.getEndTime().toISOString(),
    titulo: e.getTitle(),
    descripcion: (e.getDescription() || "").slice(0, 2000),
    link: (e.getDescription() || "").match(/https:\/\/meet\.google\.com\/[a-z-]+/)?.[0] || "",
    invitados: e.getGuestList().map((g) => ({ email: g.getEmail(), nombre: g.getName() || "" })),
    cancelado: false,
  })).filter((e) => e.invitados.length);
  if (!eventos.length) return;
  UrlFetchApp.fetch(URL_CRM, {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { "x-agenda-token": TOKEN }, payload: JSON.stringify({ eventos }),
  });
}

// Recibe pedidos del CRM: copia la plantilla de oferta, reemplaza los campos y la guarda en la carpeta de ofertas.
function doPost(e) {
  const b = JSON.parse(e.postData.contents || "{}");
  const salida = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  if (b.token !== TOKEN) return salida({ error: "no autorizado" });
  if (b.accion !== "oferta") return salida({ error: "acción desconocida" });
  const copia = DriveApp.getFileById(PLANTILLA_OFERTA).makeCopy(b.titulo || "Oferta de compra", DriveApp.getFolderById(CARPETA_OFERTAS));
  const doc = DocumentApp.openById(copia.getId());
  const cuerpo = doc.getBody();
  Object.keys(b.campos || {}).forEach((k) => cuerpo.replaceText("\\{\\{" + k + "\\}\\}", String(b.campos[k])));
  doc.saveAndClose();
  return salida({ id: copia.getId(), url: copia.getUrl() });
}

function instalar() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sincronizar").timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger("sincronizarMeta").timeBased().everyMinutes(10).create();
  DriveApp.getFileById(PLANTILLA_OFERTA); // pide el permiso de Drive en la misma instalación
  sincronizar();
  sincronizarMeta();
}
