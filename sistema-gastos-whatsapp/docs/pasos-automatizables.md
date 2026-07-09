# Pasos que se pueden automatizar por línea de comando / API

Todo lo de acá asume que ya hiciste las partes que sí o sí requieren login manual (ver
`checklist-verificacion.md` y el aviso al final de este documento). Una vez que tengas
los tokens/API keys a mano, esto se puede correr por terminal en vez de clickear en una web.

## 1. Probar que el canal de Whapi.Cloud está vivo (antes de tocar n8n)

Reemplazá `TU_TOKEN` por el token del canal (Paso 1 de la guía) y `TU_GRUPO_ID` por el
`chat_id` de un grupo donde ya agregaste el número del bot:

```bash
curl -X POST https://gate.whapi.cloud/messages/text \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "TU_GRUPO_ID@g.us",
    "body": "Prueba desde curl - si ves esto, el canal de Whapi funciona"
  }'
```

Si el mensaje llega al grupo, el canal está bien vinculado y el token es válido — confirmás
esto antes de gastar tiempo configurando n8n.

## 2. Webhook de Whapi.Cloud → n8n

Esto **sí lo recomiendo hacer por el panel de Whapi** (sección "Webhooks" del canal, Paso 7
de la guía): es un solo campo de texto (pegar la Production URL de n8n) y un botón "Save".
No encontré en la documentación pública un endpoint de API confirmado para setear esto por
curl sin margen de error — si querés automatizarlo igual, buscá "Update Channel Settings" en
https://whapi.readme.io/reference una vez que tengas tu token, y probá contra el sandbox
gratuito antes de tocar el canal real.

## 3. Importar y activar el workflow en n8n por API (opcional, alternativa al click de "Import from File")

n8n expone una API REST (`/api/v1/...`) si generás una API Key desde
**Settings → n8n API** en la interfaz (eso sí es un paso manual, una sola vez). Con esa key:

```bash
# Variables
N8N_URL="https://TU-INSTANCIA.app.n8n.cloud"   # o tu URL de self-host
N8N_API_KEY="TU_API_KEY"

# Importar el workflow ya ajustado para Whapi.Cloud
curl -X POST "$N8N_URL/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @n8n/n8n_workflow_gastos_whatsapp.json

# La respuesta trae el "id" del workflow creado. Con ese id, activarlo:
WORKFLOW_ID="pegar_id_de_la_respuesta_anterior"
curl -X POST "$N8N_URL/api/v1/workflows/$WORKFLOW_ID/activate" \
  -H "X-N8N-API-KEY: $N8N_API_KEY"
```

Ojo: aunque importes por API, las credenciales de Google Sheets y del Header Auth de Whapi
las tenés que crear una vez por la interfaz (login OAuth de Google, y el token no se puede
pegar por API por seguridad en la mayoría de los planes de n8n) — eso queda como paso manual.

## Lo que NO se puede automatizar (requiere que hagas login vos)

Marcado explícitamente porque el prompt original pidió que no asuma que esto ya está hecho:

1. **Escanear el QR de WhatsApp** con el celular del número secundario del bot (Paso 1 de la guía).
2. **Crear cuenta en Whapi.Cloud y en n8n** (login con tu email).
3. **Subir la planilla a tu Google Drive y convertirla a Google Sheets** (Paso 3).
4. **Conectar la credencial de Google Sheets en n8n** — requiere loguearte con tu cuenta de
   Google y dar permiso OAuth (Paso 5). No hay forma de hacer esto por API sin exponer tus
   credenciales de Google, así que no lo automatizo.
5. **Generar el API Key de n8n** (si querés usar la sección 3 de este documento).
6. **Agregar el número del bot a cada grupo de WhatsApp** de proyecto (Paso 8).

Avisame cuando hayas hecho estos pasos (o pasame los tokens que te vayan quedando) y seguimos
con lo que sigue.
