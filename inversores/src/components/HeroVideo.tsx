import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { Play, X, Maximize2 } from "lucide-react";
import { suppressExitIntent } from "@/hooks/useExitIntent";

const VIDEO_ID = "6FUt8RTYCeI";
const THUMBNAIL = `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

export const HeroVideo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [pipFired, setPipFired] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });

  const slotRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const floating = isPlaying && !isInView && !isDismissed;


  // Sync the portal position to the hero slot (inline) or to the corner (floating)
  useLayoutEffect(() => {
    const update = () => {
      const slot = slotRef.current;
      if (!slot) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (floating) {
        const isMobile = vw < 768;
        const w = isMobile ? 100 : 130;
        const h = (w * 19.5) / 9;
        const bottomOffset = isMobile ? 96 : 24; // 96px clears the mobile CTA bar
        setPortalStyle({
          position: "fixed",
          left: 16,
          top: vh - h - bottomOffset,
          width: w,
          height: h,
          zIndex: 40,
          transition: "all 0.5s ease-out",
          opacity: 1,
        });
      } else {
        const r = slot.getBoundingClientRect();
        setPortalStyle({
          position: "fixed",
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
          zIndex: 40,
          transition: "all 0.5s ease-out",
          opacity: 1,
        });
      }
    };

    update();
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [floating, isPlaying]);

  // IntersectionObserver: detect when the slot leaves the viewport
  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) setIsDismissed(false);
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Notify listeners (sticky CTA bar) when PiP state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("cire:pip", { detail: floating }));
  }, [floating]);

  // Fire GTM event once when entering PiP
  useEffect(() => {
    if (floating && !pipFired) {
      setPipFired(true);
      if (typeof window !== "undefined" && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "video_pip",
          event_category: "Engagement",
          event_label: "hero_video",
        });
      }
    }
  }, [floating, pipFired]);

  const handlePlay = () => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "video_play",
        event_category: "Engagement",
        event_label: "hero_video",
      });
    }
    setIsPlaying(true);
  };

  const handleBackToHero = useCallback(() => {
    slotRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Pausar el video para que no quede audio sonando sin video visible
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
      "*"
    );
    setIsDismissed(true);
  }, []);

  const handleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "video_fullscreen",
        event_category: "Engagement",
        event_label: "hero_video",
      });
    }
    const target: any = screenRef.current ?? iframeRef.current;
    if (!target) return;
    const request =
      target.requestFullscreen ||
      target.webkitRequestFullscreen ||
      target.webkitEnterFullscreen ||
      target.msRequestFullscreen;
    if (request) {
      request.call(target);
    } else {
      suppressExitIntent();
    window.open(`https://www.youtube.com/watch?v=${VIDEO_ID}`, "_blank");
    }
  }, []);


  return (
    <>
      {/* Invisible slot that preserves the hero layout */}
      <div
        ref={slotRef}
        className="w-full max-w-[200px] md:max-w-[230px] mx-auto"
        style={{ aspectRatio: "9 / 19.5", maxHeight: "75vh" }}
      />

      {/* Phone mockup rendered in a portal at document.body (no transformed ancestors) */}
      {mounted &&
        createPortal(
          <div
            className="group"
            style={portalStyle}
            onClick={floating ? handleBackToHero : undefined}
          >
            {/* Ambient backglow */}
            <div className="absolute -inset-8 bg-primary/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

            {/* ─── Smartphone mockup ─── */}
            <div
              className={`relative w-full h-full bg-cire-blue-darker rounded-[2.2rem] p-[6px] shadow-[0_0_0_1px_rgba(255,255,255,0.12),inset_0_0_0_1px_rgba(255,255,255,0.04),0_30px_60px_-12px_rgba(0,0,0,0.9)] ${
                floating ? "cursor-pointer" : ""
              }`}
            >
              {/* Botones laterales */}
              <div className="absolute -left-[2px] top-16 w-[3px] h-6 bg-gradient-to-b from-cire-blue to-cire-blue-deep rounded-l-sm" />
              <div className="absolute -left-[2px] top-24 w-[3px] h-10 bg-gradient-to-b from-cire-blue to-cire-blue-deep rounded-l-sm" />
              <div className="absolute -right-[2px] top-20 w-[3px] h-12 bg-gradient-to-b from-cire-blue to-cire-blue-deep rounded-r-sm" />

              {/* Pantalla */}
              <div
                ref={screenRef}
                className="relative w-full h-full rounded-[1.8rem] overflow-hidden bg-cire-blue-deep border border-white/5"
              >
                {isPlaying ? (
                  <>
                    <iframe
                      ref={iframeRef}
                      src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&fs=1&playsinline=1`}
                      title="CIRE Inversores — Video de presentación"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                    {!floating && (
                      <button
                        onClick={handleFullscreen}
                        aria-label="Ver el video en pantalla completa"
                        className="absolute top-2 right-2 z-40 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-primary hover:border-primary flex items-center justify-center transition-colors"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (

                  <button
                    onClick={handlePlay}
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    aria-label="Reproducir video de presentación"
                  >
                    <img
                      src={THUMBNAIL}
                      alt="Video de presentación de CIRE Inversores"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                    />

                    {/* Overlays cinematográficos */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                    <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,transparent_50%,rgba(255,255,255,0.02)_100%)]" />

                    {/* Dynamic Island */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-[18px] bg-black rounded-full z-30 shadow-inner" />

                    {/* Play central */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-16 h-16 bg-primary rounded-full animate-ping opacity-20" />
                        <div className="relative w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.4)] transition-all duration-500 group-hover:scale-110">
                          <Play className="w-5 h-5 text-primary-foreground fill-current translate-x-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Label flotante de vidrio */}
                    <div className="absolute bottom-6 left-0 right-0 px-3 z-30">
                      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl p-2.5 shadow-2xl transform transition-transform duration-700 group-hover:-translate-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 shrink-0 rounded-lg bg-gradient-to-br from-primary to-cire-orange-deep flex items-center justify-center shadow-lg">
                            <Play className="w-3 h-3 text-primary-foreground fill-current" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-[0.2em] text-primary font-bold mb-0.5">
                              En acción
                            </span>
                            <span className="font-display text-white text-[12px] font-semibold leading-tight">
                              Mirá cómo trabajamos
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Home indicator */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-[3px] bg-white/20 rounded-full pointer-events-none z-30" />
                  </button>
                )}
              </div>

              {/* Floating close (×) button — only in PiP mode */}
              {floating && (
                <button
                  onClick={handleDismiss}
                  aria-label="Cerrar mini-player"
                  className="absolute -top-2 -right-2 z-50 w-6 h-6 rounded-full bg-cire-blue-darker border border-white/20 text-white/80 hover:text-white hover:bg-primary hover:border-primary flex items-center justify-center shadow-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
