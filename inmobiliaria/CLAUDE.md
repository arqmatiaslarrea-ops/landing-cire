# Migración de CIRE a Claude Code + Supabase propio + Vercel

## 1. Código
1. Subí esta carpeta a un repo nuevo de GitHub (o conectá GitHub desde Lovable).
2. En Vercel: New Project → importar repo. Framework: Vite. Build: `npm run build`, Output: `dist`.
3. Agregar las variables de `.env.example` en Vercel.
4. Agregar el dominio cireinmobiliaria.com en Vercel y actualizar DNS (registros A/CNAME que indica Vercel).

## 2. Backend (Supabase propio, gratis)
1. Crear proyecto en supabase.com. Copiar URL y anon key → variables de Vercel.
2. Instalar CLI: `npm i -g supabase` → `supabase login` → `supabase link --project-ref TU-PROYECTO`.
3. Secretos:
   `supabase secrets set GOOGLE_SHEETS_WEBHOOK_URL=... RESEND_API_KEY=...`
   - Webhook: la URL /exec de tu Apps Script (Implementar → Administrar implementaciones).
   - Resend: generar una nueva clave en resend.com.
4. Desplegar funciones:
   `supabase functions deploy save-to-sheets --no-verify-jwt`
   `supabase functions deploy send-followup-alert --no-verify-jwt`
   (create-hubspot-contact ya no se usa; podés borrarla.)
5. No hay tablas de base de datos: los leads van a Google Sheets.

## 3. Verificar
- Enviar un lead de prueba → fila nueva en Sheets, WhatsApp abre con el mensaje, email de alerta a los 5 min.
- GTM: eventos `lead_form_start` y `lead_form_submit` siguen en el código.

## 4. Trabajar con Claude Code
- `npm install` → `npm run dev` (http://localhost:8080).
- Pedirle cambios a Claude dentro de la carpeta; `git push` publica en Vercel automáticamente.
- Archivos clave: `src/components/LeadForm.tsx` (formulario), `src/pages/` (páginas),
  `src/index.css` + `tailwind.config.ts` (colores), `supabase/functions/` (backend), `index.html` (SEO).

## Datos del negocio
- WhatsApp: +54 9 11 5495 0446 · Calendar/alertas: arqmatiaslarrea@gmail.com
- Colores: fondo #3c4960, principal #f79d3f, acento #f35a3b
- Pendiente: columna O "Consent WhatsApp" (data.consent_whatsapp) en el Apps Script.
