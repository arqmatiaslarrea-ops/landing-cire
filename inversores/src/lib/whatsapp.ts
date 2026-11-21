/**
 * Abre WhatsApp siempre vía wa.me: es el único endpoint que no bloquea la
 * apertura desde otra pestaña (api.whatsapp.com y web.whatsapp.com responden
 * ERR_BLOCKED_BY_RESPONSE en desktop). wa.me redirige solo a la app o a
 * WhatsApp Web según el dispositivo.
 */
export const buildWhatsAppUrl = (phone: string, message: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

export const openWhatsApp = (
  phone: string,
  message: string,
  preOpenedTab?: Window | null,
) => {
  const url = buildWhatsAppUrl(phone, message);

  // Si el caller abrió una pestaña en blanco dentro del click (para esquivar
  // el popup blocker mientras guarda el lead), la reutilizamos.
  if (preOpenedTab && !preOpenedTab.closed) {
    preOpenedTab.location.href = url;
    return;
  }

  const opened = window.open(url, "_blank");
  if (!opened || opened.closed) window.location.assign(url);
};
