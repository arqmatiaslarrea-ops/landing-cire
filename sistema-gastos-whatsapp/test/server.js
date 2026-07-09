// Servidor local que simula TODO el pipeline del workflow n8n (nodos 1 a 9), sin n8n ni
// WhatsApp real. Sirve para probar el parser con curl antes de depender de infraestructura
// real. Correr con: node test/server.js  (o npm run server)
//
// Simula:
//  - Nodo 1 (webhook): recibe el POST en /gastos-whatsapp, igual que el webhook real de n8n.
//  - Nodo 2 (extraer datos): usa extractMessage.js (misma lógica que n8n/nodo2_extraer_datos.js).
//  - Nodo 3/4 (buscar proyecto + activo): busca contra config_proyectos.js (copia de la hoja real).
//  - Nodo 5 (parsear gasto): usa parseGasto.js (misma lógica que el nodo 5 real).
//  - Nodo 6/7/8 (ignorar / guardar / estado): en vez de Google Sheets, escribe en gastos_guardados.json.
//  - Nodo 9a/9b/5b: en vez de pegarle a la API de Whapi, imprime en consola el mensaje que se
//    mandaría de vuelta al grupo.

const http = require('http');
const fs = require('fs');
const path = require('path');

const { extraerDatos } = require('./extractMessage');
const { parsearGasto } = require('./parseGasto');
const proyectos = require('./config_proyectos');

const PORT = process.env.PORT || 3333;
const GASTOS_FILE = path.join(__dirname, 'gastos_guardados.json');
const LOG_FILE = path.join(__dirname, 'mapeo_log.json');

function leerJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}
function guardarJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function buscarProyecto(grupoId) {
  return proyectos.find(p => p.ID_Grupo_WhatsApp === grupoId);
}

function formatearMoneda(monto) {
  return monto.toLocaleString('es-AR');
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/gastos-whatsapp') {
    res.writeHead(404);
    return res.end('not found');
  }

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(body || '{}');
    } catch {
      res.writeHead(400);
      return res.end('invalid json');
    }

    console.log('\n──────────────────────────────────────────');
    console.log('📩 Webhook recibido');

    // Nodo 2
    const datos = extraerDatos(payload);
    if (!datos) {
      console.log('⏭️  Nodo 2: descartado (no es texto entrante nuevo — from_me, status u otro tipo)');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, accion: 'descartado_nodo2' }));
    }
    console.log('✅ Nodo 2: extraído ->', datos);

    // Nodo 3/4
    const proyecto = buscarProyecto(datos.grupo_id);
    if (!proyecto || proyecto.Activo !== 'Sí') {
      console.log('⚠️  Nodo 4: grupo no configurado o inactivo ->', datos.grupo_id);
      const log = leerJSON(LOG_FILE);
      log.push({
        Fecha: datos.fecha,
        Hora: datos.hora,
        ID_Grupo_WhatsApp: datos.grupo_id,
        Remitente: datos.remitente,
        Mensaje_Original: datos.mensaje_texto,
        Motivo: 'Grupo no configurado o inactivo en Config_Proyectos'
      });
      guardarJSON(LOG_FILE, log);
      console.log('📤 5b. Mensaje que se mandaría al grupo:',
        '⚠️ Este grupo todavía no está vinculado a ningún proyecto. Avisale a Mati para que lo configure en la hoja Config_Proyectos.');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, accion: 'grupo_no_configurado' }));
    }
    console.log('✅ Nodo 3/4: proyecto encontrado ->', proyecto.ID_Proyecto, proyecto.Nombre_Proyecto);

    // Nodo 5
    const parseado = parsearGasto({ ...datos, ID_Proyecto: proyecto.ID_Proyecto });

    // Nodo 6
    if (parseado.ignorar) {
      console.log('⏭️  Nodo 6: mensaje ignorado (no parece un gasto, ej. charla del grupo)');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, accion: 'ignorado' }));
    }

    // Nodo 7
    const gasto = {
      ID_Gasto: 'G' + Date.now(),
      Fecha: parseado.fecha,
      Hora: parseado.hora,
      ID_Proyecto: parseado.ID_Proyecto,
      Categoría: parseado.categoria,
      Monto: parseado.monto,
      Descripción: parseado.descripcion,
      Remitente: parseado.remitente,
      Grupo_Origen: parseado.grupo_id,
      Mensaje_Original: parseado.mensaje_texto,
      Estado: parseado.estado,
      Revisar: parseado.motivo_revision
    };
    const gastos = leerJSON(GASTOS_FILE);
    gastos.push(gasto);
    guardarJSON(GASTOS_FILE, gastos);
    console.log('💾 Nodo 7: gasto guardado ->', gasto);

    // Nodo 8/9
    let mensajeRespuesta;
    if (parseado.estado === 'OK') {
      mensajeRespuesta = `✅ Cargado: $${formatearMoneda(parseado.monto)} - ${parseado.categoria} - ${parseado.descripcion}`;
    } else {
      mensajeRespuesta = `🟡 Cargué esto pero no estoy seguro: $${formatearMoneda(parseado.monto)} - ${parseado.categoria} - ${parseado.descripcion}. Motivo: ${parseado.motivo_revision}. Si está mal, corregilo directo en la hoja Gastos.`;
    }
    console.log(`📤 Nodo ${parseado.estado === 'OK' ? '9a' : '9b'}. Mensaje que se mandaría al grupo:`, mensajeRespuesta);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, accion: 'gasto_guardado', gasto, mensajeRespuesta }));
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de prueba escuchando en http://localhost:${PORT}/gastos-whatsapp`);
  console.log(`Grupos configurados: ${proyectos.filter(p => p.Activo === 'Sí').map(p => p.ID_Grupo_WhatsApp).join(', ')}`);
  console.log('Probalo con: bash test/curl_examples.sh\n');
});
