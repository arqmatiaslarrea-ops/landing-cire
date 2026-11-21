import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "cire_visit_tracked";

export function useTrackVisit() {
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    sessionStorage.setItem(SESSION_KEY, "1");

    const sessionId =
      sessionStorage.getItem("cire_session_id") ||
      (() => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem("cire_session_id", id);
        return id;
      })();

    supabase.functions
      .invoke("inv-track-visit", {
        body: {
          session_id: sessionId,
          referrer: document.referrer || "direct",
          path: window.location.pathname,
        },
      })
      .catch((err) => console.error("track-visit error:", err));
  }, []);
}
