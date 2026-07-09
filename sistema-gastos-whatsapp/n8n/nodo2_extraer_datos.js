// Nodo "2. Extraer datos del mensaje" — adaptado específicamente al payload real de Whapi.Cloud.
//
// Formato confirmado en la documentación oficial de Whapi.Cloud (Incoming Webhooks > Incoming
// message / Groups): https://support.whapi.cloud/help-desk/receiving/webhooks/incoming-webhooks-format
//
// {
//   "messages": [{
//     "id": "...", "from_me": false, "type": "text", "chat_id": "1203xxxx@g.us",
//     "timestamp": 1713791337, "source": "mobile",
//     "text": { "body": "..." }, "from": "5491122334455", "from_name": "Juan"
//   }],
//   "event": { "type": "messages", "event": "post" },
//   "channel_id": "MANTIS-M72HC"
// }
//
// Corre en modo "Run Once for Each Item": devolver null descarta el item sin
// pasarlo al resto del workflow (así no llega a pegarle a Google Sheets por nada).

const body = $input.item.json.body || $input.item.json;
const msg = body.messages?.[0];

// Whapi también manda webhooks de otro tipo por la misma URL (acuses de recibo "statuses",
// eventos de canal, etc.) que no traen "messages". Los descartamos acá.
if (!msg) {
  return null;
}

// "from_me: true" es un eco de un mensaje que mandó el propio bot (ej. la confirmación
// "✅ Cargado: ..."). Sin este filtro el workflow terminaría reprocesando sus propias
// respuestas como si fueran gastos nuevos.
if (msg.from_me) {
  return null;
}

// Por ahora solo procesamos texto. Fotos de comprobantes quedan para una futura
// extensión con OCR (ver guía, sección "Próximos pasos posibles").
if (msg.type !== 'text') {
  return null;
}

const grupoId = msg.chat_id || '';
const remitente = msg.from_name || msg.from || 'Desconocido';
const texto = msg.text?.body || '';
const mensajeId = msg.id || '';
// Whapi manda el timestamp en segundos (epoch Unix, 10 dígitos).
const timestampRaw = msg.timestamp || Math.floor(Date.now() / 1000);
const fecha = new Date(Number(timestampRaw) * 1000);

return {
  json: {
    grupo_id: grupoId,
    remitente,
    mensaje_texto: texto,
    mensaje_id: mensajeId,
    fecha: fecha.toISOString().slice(0, 10),
    hora: fecha.toTimeString().slice(0, 5)
  }
};
