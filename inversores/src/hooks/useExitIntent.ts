import { useEffect, useState } from "react";

const STORAGE_KEY = "cire_exit_intent_shown";

/** Exit intent stays suppressed for a while after the user opens an external
 * destination on purpose (WhatsApp, YouTube, Calendly, PDF...) */
let suppressUntil = 0;
const SUPPRESS_MS = 60_000;

export const suppressExitIntent = (ms: number = SUPPRESS_MS) => {
  suppressUntil = Math.max(suppressUntil, Date.now() + ms);
};

const isSuppressed = () => Date.now() < suppressUntil;

/** True when the user is interacting with something that should never be
 * interrupted: an open dialog, an embedded iframe (YouTube), etc. */
const isBusy = () => {
  if (document.querySelector('[role="dialog"][data-state="open"]')) return true;
  const active = document.activeElement;
  if (active && active.tagName === "IFRAME") return true;
  return false;
};

/**
 * Triggers exit intent on:
 * - Desktop: mouse leaving viewport top (never over iframes/dialogs)
 * - Mobile: rapid scroll-up gesture after engagement
 *
 * Never hijacks the back button and never fires while the user is
 * heading to WhatsApp / YouTube / an open modal. Only once per session.
 */
export function useExitIntent(enabled: boolean = true) {
  const [show, setShow] = useState(false);

  const wasShown = () => sessionStorage.getItem(STORAGE_KEY) === "1";
  const markShown = () => sessionStorage.setItem(STORAGE_KEY, "1");

  const showNow = () => {
    if (wasShown() || isSuppressed() || isBusy()) return;
    markShown();
    setShow(true);
  };

  const close = () => setShow(false);

  useEffect(() => {
    if (!enabled || wasShown()) return;

    const isMobile = window.innerWidth < 768;
    let lastScrollY = window.scrollY;
    let scrollUpStartTime = 0;
    const startTime = Date.now();

    // Any click on an external / new-tab destination suppresses the popup
    const handleClickCapture = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(
        'a[href], button, [role="button"]'
      ) as HTMLAnchorElement | null;
      if (!el) return;
      const href = (el as HTMLAnchorElement).href || "";
      const external =
        el.getAttribute?.("target") === "_blank" ||
        /wa\.me|whatsapp|youtu|calendar\.app\.google|calendly|\.pdf/i.test(href);
      if (external) suppressExitIntent();
    };

    // Clicking inside a YouTube iframe blurs the window: never treat as exit
    const handleBlur = () => {
      if (document.activeElement?.tagName === "IFRAME") suppressExitIntent(10_000);
    };

    // Desktop: mouse leaves viewport from top
    const handleMouseOut = (e: MouseEvent) => {
      if (Date.now() - startTime < 8000) return;
      if (e.clientY > 0 || e.relatedTarget) return;
      showNow();
    };

    // Mobile: rapid scroll-up after engagement
    const handleScroll = () => {
      if (Date.now() - startTime < 15000) {
        lastScrollY = window.scrollY;
        return;
      }
      const currentY = window.scrollY;
      if (currentY < lastScrollY - 80 && currentY > 200) {
        if (!scrollUpStartTime) scrollUpStartTime = Date.now();
        else if (Date.now() - scrollUpStartTime < 800) {
          showNow();
        }
      } else {
        scrollUpStartTime = 0;
      }
      lastScrollY = currentY;
    };

    document.addEventListener("click", handleClickCapture, true);
    window.addEventListener("blur", handleBlur);

    if (!isMobile) {
      document.addEventListener("mouseout", handleMouseOut);
    } else {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener("click", handleClickCapture, true);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [enabled]);

  return { show, showNow, close };
}
