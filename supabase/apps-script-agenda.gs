/**
 * Sincroniza la agenda de Google con el CRM de CIRE.
 * Cómo instalarlo (una sola vez, 3 minutos):
 * 1. Entrá a https://script.google.com con la cuenta arqmatiaslarrea@gmail.com → "Nuevo proyecto".
 * 2. Borrá lo que aparece y pegá este archivo entero. Guardá.
 * 3. Arriba elegí la función "instalar" y tocá "Ejecutar". Aceptá los permisos que pide Google.
 * Listo: cada 10 minutos manda al CRM las reuniones con invitados externos de los próximos 30 días.
 */
const URL_CRM = "https://dhbyfrjkeecuvlkqlbne.supabase.co/functions/v1/crm-agenda";
const TOKEN = "PEGAR_TOKEN_AGENDA"; // lo completa Claude al entregarte el script

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

function instalar() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sincronizar").timeBased().everyMinutes(10).create();
  sincronizar();
}
