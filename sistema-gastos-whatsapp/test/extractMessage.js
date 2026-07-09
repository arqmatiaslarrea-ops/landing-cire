// Misma lógica que n8n/nodo2_extraer_datos.js, extraída como función pura para poder
// testearla localmente. Si tocás una, tocá la otra (o generá esta a partir de esa).

function extraerDatos(body) {
  const msg = body.messages?.[0];

  if (!msg) return null;
  if (msg.from_me) return null;
  if (msg.type !== 'text') return null;

  const grupoId = msg.chat_id || '';
  const remitente = msg.from_name || msg.from || 'Desconocido';
  const texto = msg.text?.body || '';
  const mensajeId = msg.id || '';
  const timestampRaw = msg.timestamp || Math.floor(Date.now() / 1000);
  const fecha = new Date(Number(timestampRaw) * 1000);

  return {
    grupo_id: grupoId,
    remitente,
    mensaje_texto: texto,
    mensaje_id: mensajeId,
    fecha: fecha.toISOString().slice(0, 10),
    hora: fecha.toTimeString().slice(0, 5)
  };
}

module.exports = { extraerDatos };
