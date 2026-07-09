# Comparativa de gateways de WhatsApp (para grupos)

Investigación hecha el 2026-07-09. WhatsApp no tiene API oficial para grupos (ver guía,
sección 2), así que las tres opciones son gateways no oficiales.

| | Whapi.Cloud | Wassenger | Evolution API (self-hosted) |
|---|---|---|---|
| Costo | ~USD 29-35/mes por número (trial 5 días + sandbox gratis) | ~€19,90-39,90/mes (fuentes públicas inconsistentes entre sí) | Software gratis + VPS propio (~€8-12/mes) |
| Infraestructura propia | No, 100% SaaS | No, 100% SaaS | Sí — Docker, Postgres, Redis, dominio con HTTPS |
| Vinculación del número | QR desde WhatsApp | QR desde WhatsApp | QR vía API o panel Manager |
| Certeza del payload de webhook para mensajes de grupo | Alta — confirmado contra documentación pública oficial | Baja — el evento general se confirmó, pero no los campos exactos de `chat`/`author` en un mensaje de grupo real | Alta — confirmado leyendo el código fuente oficial en GitHub |

**Elegido: Whapi.Cloud.** Es el que ya coincidía con el código del nodo "2. Extraer datos
del mensaje" tal como venía en el workflow, tiene el costo/complejidad más bajo para alguien
que no quiere mantener infraestructura, y es el único de los tres donde la investigación dio
certeza total del formato del payload sin necesidad de probarlo primero contra un número real.

## Detalle: Whapi.Cloud

**Payload real del webhook (mensaje de grupo, confirmado contra la doc oficial):**
```json
{
  "messages": [{
    "id": ".juaBlBX6cgpT8UKLNnVEw-kh8Bq53B6TdEoQ-E8JdK1c",
    "from_me": false,
    "type": "text",
    "chat_id": "120363271212442249@g.us",
    "timestamp": 1713791337,
    "source": "mobile",
    "text": { "body": "Hey, what's up" },
    "from": "919984351847",
    "from_name": "Gerald"
  }],
  "event": { "type": "messages", "event": "post" },
  "channel_id": "MANTIS-M72HC"
}
```
- `timestamp` viene en **segundos** (epoch Unix), no milisegundos.
- El mismo webhook también entrega otros tipos de eventos (acuses de recibo "statuses",
  eventos de canal) que no traen `messages` — hay que filtrarlos (ver `n8n/nodo2_extraer_datos.js`).
- Whapi también reenvía por el mismo webhook los mensajes que manda el propio bot
  (`from_me: true`) — sin filtrarlos, el workflow terminaría reprocesando sus propias
  confirmaciones como si fueran gastos nuevos.

**Endpoint para enviar mensajes:**
- `POST https://gate.whapi.cloud/messages/text`
- Header: `Authorization: Bearer TU_TOKEN`
- Body: `{ "to": "120363...@g.us", "body": "texto del mensaje" }`
- Nota: el campo se llama `body`, no `message` — el workflow original que venía en el JSON
  usaba `message`, lo corregí en los 3 nodos HTTP Request (5b, 9a, 9b).

Fuentes: https://support.whapi.cloud/help-desk/receiving/webhooks/incoming-webhooks-format ,
https://whapi.readme.io/reference/sendmessagetext , https://whapi.cloud/price

## Por qué no Wassenger ni Evolution API (por ahora)

- **Wassenger**: su documentación completa está detrás de login, así que no pude confirmar
  con certeza los campos exactos de `chat.id`/`author` en un mensaje de grupo real. Usarlo
  hoy implicaría prueba y error contra tu número real, algo que el prompt original pedía
  evitar ("probame localmente... antes de que dependa de WhatsApp real").
- **Evolution API**: el payload sí se pudo confirmar con certeza (código fuente oficial en
  GitHub), pero exige mantener un servidor propio (Docker + Postgres + Redis + HTTPS), lo
  cual no encaja con "soy arquitecto, no desarrollador" y con la prioridad de simplicidad.
  Queda como alternativa si en algún momento el costo mensual de Whapi se vuelve un problema.
