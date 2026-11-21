/**
 * Script de Google de CIRE: conecta la agenda y las ofertas de Drive con el CRM.
 * Instalación (una sola vez, 5 minutos), con la cuenta arqmatiaslarrea@gmail.com:
 * 1. https://script.google.com → "Nuevo proyecto". Borrá lo que aparece, pegá este archivo y completá TOKEN. Guardá.
 * 2. Elegí la función "instalar" y tocá "Ejecutar". Aceptá los permisos (agenda y Drive).
 *    Desde ahí, cada 10 minutos manda al CRM las reuniones con invitados externos.
 * 3. "Implementar" → "Nueva implementación" → tipo "Aplicación web".
 *    Ejecutar como: Yo. Quién tiene acceso: Cualquier usuario. → "Implementar".
 *    Copiá la URL que termina en /exec y pasásela a Claude: con eso el botón "Generar oferta" del CRM arma el documento.
 */
const URL_CRM = "https://dhbyfrjkeecuvlkqlbne.supabase.co/functions/v1/crm-agenda";
const TOKEN = "PEGAR_TOKEN"; // te lo pasa Claude por chat; no lo subas a ningún repositorio
const PLANTILLA_OFERTA = "1EjkWPgxlH8iV1EzK0wiJXZLtKp2tCXHPXT1TvG90Aeg";
const CARPETA_OFERTAS = "1k-ufFplHLOBMDrXdQbBbCEDWBVQ-7xSd";

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
  DriveApp.getFileById(PLANTILLA_OFERTA); // pide el permiso de Drive en la misma instalación
  sincronizar();
}
