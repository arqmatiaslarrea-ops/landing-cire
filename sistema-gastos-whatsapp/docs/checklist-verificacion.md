# Checklist de verificación end-to-end

Usalo en orden. Cada ✅ te dice qué mirar exactamente para confirmar que ese pedazo funciona
antes de pasar al siguiente.

## A. Antes de conectar nada real (ya hecho en este repo)

- [x] El parser de gastos tiene tests automáticos y pasan: `cd sistema-gastos-whatsapp && npm test`
- [x] Hay un servidor local que simula el pipeline completo sin n8n ni WhatsApp:
      `npm run server` en una terminal, `bash test/curl_examples.sh` en otra.
- [x] El nodo "2. Extraer datos del mensaje" está reescrito para el payload real de Whapi.Cloud.
- [x] Los 3 nodos que responden en el grupo (5b, 9a, 9b) tienen la URL y el nombre de campo
      correctos (`body`, no `message`) para la API de envío de Whapi.

## B. Pasos manuales tuyos (avisame cuando los hagas)

- [ ] Cuenta en Whapi.Cloud creada, número secundario vinculado por QR.
- [ ] Token/API Key del canal copiado.
- [ ] Cuenta de n8n creada (Cloud o self-host).
- [ ] Planilla subida a Google Drive y convertida a Google Sheets; ID de la hoja copiado.
- [ ] Workflow importado en n8n (`n8n/n8n_workflow_gastos_whatsapp.json`, el que ya está
      ajustado — no uses el original si lo tenías guardado aparte).
- [ ] Credencial de Google Sheets conectada en n8n (OAuth con tu cuenta de Google).
- [ ] Los 3 placeholders reemplazados: ID del Sheet (3 nodos), y credencial Header Auth con
      `Authorization: Bearer TU_TOKEN` asignada en los nodos 5b/9a/9b (la URL ya quedó precargada).
- [ ] Production URL del webhook de n8n pegada en el panel de Whapi (sección Webhooks).
- [ ] Número del bot agregado a un grupo de prueba, y `ID_Grupo_WhatsApp` completado en
      `Config_Proyectos` para ese grupo (Paso 8 de la guía — se consigue mandando un mensaje
      de prueba y mirando la pestaña "Executions" de n8n).

## C. Prueba real de punta a punta

1. En n8n, activá el toggle **Active** del workflow.
2. Mandá en el grupo de prueba: `GASTO / Materiales / 1000 / Prueba del sistema`
3. **Verificá en n8n** (pestaña Executions): ¿la ejecución llegó hasta el final sin nodos en rojo?
4. **Verificá en Google Sheets**, hoja `Gastos`: ¿apareció una fila nueva con
   `Categoría=Materiales`, `Monto=1000`, `Descripción=Prueba del sistema`, y el
   `ID_Proyecto`/`Proyecto` correctos?
5. **Verificá en el grupo de WhatsApp**: ¿llegó la respuesta `✅ Cargado: $1.000 - Materiales - Prueba del sistema`?
6. Si algo falló, mirá en qué nodo se cortó la ejecución en n8n — el nombre del nodo (ej.
   "3. Buscar proyecto") te dice exactamente en qué paso de la guía revisar la configuración.
7. Probá también el camino de error: mandá un mensaje de texto libre ambiguo (ej. "gasté
   unos mangos en nose que") y confirmá que llega el mensaje 🟡 pidiendo revisión, no un error.
8. **Borrá la fila de prueba** de la hoja `Gastos` una vez que confirmaste que todo funciona
   (Paso 10 de la guía).

## D. Mantenimiento continuo (revisar cada tanto, no es parte del setup inicial)

- Hoja `Mapeo_Grupos_Log`: mensajes de grupos que todavía no configuraste caen ahí.
- Columna `Estado` en `Gastos`: filas marcadas `Revisar` necesitan que confirmes el monto o
  la categoría a mano.
- `Dashboard`: se actualiza solo, no requiere carga manual.
