#!/usr/bin/env bash
# Simula mensajes entrantes reales de Whapi.Cloud contra el servidor de prueba local.
# Antes de correr esto: en otra terminal, node test/server.js  (o npm run server)
set -e
URL="http://localhost:3333/gastos-whatsapp"

echo "== 1) Gasto en formato estructurado (caso feliz) =="
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{
  "messages": [{
    "id": "wamid.001",
    "from_me": false,
    "type": "text",
    "chat_id": "120363111111111111@g.us",
    "timestamp": 1752000000,
    "source": "mobile",
    "text": { "body": "GASTO / Materiales / 45000 / Cemento y arena" },
    "from": "5491122334455",
    "from_name": "Juan"
  }],
  "event": { "type": "messages", "event": "post" },
  "channel_id": "TEST-CHANNEL"
}' | python3 -m json.tool
echo

echo "== 2) Texto libre con jerga (\"lucas\"), va a Revisar/OK según detección =="
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{
  "messages": [{
    "id": "wamid.002", "from_me": false, "type": "text",
    "chat_id": "120363111111111111@g.us", "timestamp": 1752000100,
    "text": { "body": "gaste como 8 lucas en flete" },
    "from": "5491122334455", "from_name": "Nico"
  }]
}' | python3 -m json.tool
echo

echo "== 3) Categoría no reconocida -> Estado Revisar =="
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{
  "messages": [{
    "id": "wamid.003", "from_me": false, "type": "text",
    "chat_id": "120363111111111111@g.us", "timestamp": 1752000200,
    "text": { "body": "GASTO / Combustible / 15000 / Nafta camioneta" },
    "from": "5491122334455", "from_name": "Mati"
  }]
}' | python3 -m json.tool
echo

echo "== 4) Charla normal del grupo -> se ignora =="
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{
  "messages": [{
    "id": "wamid.004", "from_me": false, "type": "text",
    "chat_id": "120363111111111111@g.us", "timestamp": 1752000300,
    "text": { "body": "buenas, alguien vio a Juan hoy?" },
    "from": "5491122334455", "from_name": "Nico"
  }]
}' | python3 -m json.tool
echo

echo "== 5) Grupo no configurado en Config_Proyectos =="
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{
  "messages": [{
    "id": "wamid.005", "from_me": false, "type": "text",
    "chat_id": "120363999999999999@g.us", "timestamp": 1752000400,
    "text": { "body": "GASTO / Materiales / 1000 / prueba" },
    "from": "5491100000000", "from_name": "Alguien"
  }]
}' | python3 -m json.tool
echo

echo "== 6) Eco del propio bot (from_me: true) -> se descarta antes de llegar a Sheets =="
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{
  "messages": [{
    "id": "wamid.006", "from_me": true, "type": "text",
    "chat_id": "120363111111111111@g.us", "timestamp": 1752000500,
    "text": { "body": "✅ Cargado: $45.000 - Materiales - Cemento y arena" },
    "from": "5491100000001", "from_name": "Bot"
  }]
}' | python3 -m json.tool
echo

echo "== 7) Webhook de otro tipo (ej. status/acuse de recibo, sin \"messages\") -> se descarta =="
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{
  "statuses": [{ "id": "wamid.001", "status": "delivered" }]
}' | python3 -m json.tool
echo

echo "Listo. Revisá test/gastos_guardados.json y test/mapeo_log.json para ver qué se guardó."
