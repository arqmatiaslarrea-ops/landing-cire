# Sistema de Carga de Gastos vía WhatsApp — CIRE Holding

Implementación ejecutada a partir de `Prompt_Claude_Code.md`, siguiendo
`docs/Guia_Implementacion_Sistema_Gastos_WhatsApp.docx`.

## Qué se hizo en esta pasada

1. **Se comparó Whapi.Cloud vs Wassenger vs Evolution API** en costo, setup y formato real
   del payload del webhook → `docs/gateway-comparativa.md`.
2. **Se eligió Whapi.Cloud** (confirmado con el usuario).
3. **Se ajustó el código del nodo "2. Extraer datos del mensaje"** en
   `n8n/n8n_workflow_gastos_whatsapp.json` para matchear exactamente el payload real de
   Whapi.Cloud, incluyendo filtros que no estaban (mensajes eco del propio bot, webhooks
   que no son de tipo mensaje). Copia comentada en `n8n/nodo2_extraer_datos.js`.
4. **Se corrigieron 2 bugs reales** encontrados al testear el nodo "5. Parsear gasto" contra
   casos de prueba (montos sin separador de miles se truncaban; falsos positivos de categoría
   por substring, ej. "gasté" matcheaba la palabra clave "gas"). Corregido en el JSON del
   workflow y en `test/parseGasto.js`.
5. **Se corrigió el nombre de campo y la URL en los nodos de respuesta** (5b, 9a, 9b): Whapi
   espera `body`, el workflow original mandaba `message`.
6. **Se armó un harness de test local** (`test/`) que simula el pipeline completo sin n8n ni
   WhatsApp real — ver abajo cómo correrlo.
7. **Se documentaron los pasos automatizables por CLI/API** → `docs/pasos-automatizables.md`,
   y los que requieren login manual tuyo (marcados explícitamente, sin asumir que ya están hechos).
8. **Checklist de verificación end-to-end** → `docs/checklist-verificacion.md`.

## Cómo correr los tests locales

```bash
cd sistema-gastos-whatsapp
npm test              # tests unitarios del parser (9 casos)
npm run server         # levanta un servidor local en :3333 que simula n8n + Sheets + Whapi
# en otra terminal:
bash test/curl_examples.sh   # 7 casos simulando mensajes reales de Whapi.Cloud
```

## Estructura

```
sistema-gastos-whatsapp/
├── n8n/
│   ├── n8n_workflow_gastos_whatsapp.json   # workflow listo para importar (ya ajustado)
│   └── nodo2_extraer_datos.js              # código del nodo 2, comentado, fuente de verdad
├── planilla/
│   └── Sistema_Gastos_WhatsApp.xlsx        # sin cambios, la original
├── docs/
│   ├── Guia_Implementacion_Sistema_Gastos_WhatsApp.docx  # sin cambios, la original
│   ├── gateway-comparativa.md
│   ├── pasos-automatizables.md
│   └── checklist-verificacion.md
└── test/
    ├── extractMessage.js       # misma lógica que nodo2, en función pura testeable
    ├── parseGasto.js           # misma lógica que el nodo 5, con los bugs corregidos
    ├── test_parser.js          # 9 casos de test
    ├── config_proyectos.js     # copia local de la hoja Config_Proyectos para simular
    ├── server.js               # simula el pipeline completo (webhook -> Sheets -> Whapi)
    └── curl_examples.sh        # 7 payloads reales de Whapi para probar contra server.js
```

## Qué falta (pasos manuales tuyos)

Ver el detalle completo en `docs/checklist-verificacion.md`, sección B. En resumen: crear
cuenta en Whapi.Cloud, vincular el número por QR, crear cuenta de n8n, subir la planilla a
Google Drive, conectar la credencial de Google en n8n, y pegar el token de Whapi. Ninguno de
esos pasos se asumió como hecho — avisame cuando los completes y seguimos.
