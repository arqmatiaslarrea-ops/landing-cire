import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config";
import { soloRanka, useYo } from "../main";

// Campana de notificaciones: alertas de desvío (Cerebro), recordatorios de seguimiento y resumen semanal.
const ICONO: Record<string, string> = { alerta: "⚠", recordatorio: "⏰", cerebro: "◉", logro: "✓", aviso: "•" };

export default function Notificaciones() {
  const nav = useNavigate();
  const [lista, setLista] = useState<any[]>([]);
  const [abierto, setAbierto] = useState(false);

  const yo = useYo();
  // Cada uno ve lo suyo y lo general; quien trabaja sólo en Ranka no recibe las alertas de las unidades de CIRE
  const CIRE = /^\/(compradores|tanda|ofertas|embudos|propiedades|$)/;
  const mia = (n: any) => (n.para === yo.clave || n.para === "todos") && !(soloRanka(yo) && n.para === "todos" && CIRE.test(n.link || "/"));
  const cargar = () => supabase.from("crm_notificaciones").select("*").gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()).order("created_at", { ascending: false }).limit(60).then(({ data }) => setLista((data || []).filter(mia)));
  useEffect(() => { cargar(); const t = setInterval(cargar, 120000); return () => clearInterval(t); }, []);

  const sinLeer = lista.filter((n) => !n.leida).length;
  const abrir = async (n: any) => {
    if (!n.leida) { await supabase.from("crm_notificaciones").update({ leida: true }).eq("id", n.id); setLista((l) => l.map((x) => (x.id === n.id ? { ...x, leida: true } : x))); }
    setAbierto(false); if (n.link) nav(n.link);
  };
  const todasLeidas = async () => {
    const ids = lista.filter((n) => !n.leida).map((n) => n.id);
    if (ids.length) await supabase.from("crm_notificaciones").update({ leida: true }).in("id", ids);
    cargar();
  };

  return (
    <div className="notif">
      <button className="notif-boton" onClick={() => setAbierto(!abierto)} aria-label={`Notificaciones, ${sinLeer} sin leer`}>
        Notificaciones {sinLeer > 0 && <span className="notif-cuenta">{sinLeer}</span>}
      </button>
      {abierto && (
        <div className="notif-panel">
          <div className="fila" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <strong>Esta semana</strong>
            {sinLeer > 0 && <button className="link chico" onClick={todasLeidas}>Marcar todo como leído</button>}
          </div>
          {!lista.length && <p className="sub chico">Sin novedades esta semana.</p>}
          {lista.map((n) => (
            <button key={n.id} className={`notif-item ${n.tipo} ${n.leida ? "leida" : ""}`} onClick={() => abrir(n)}>
              <span className="notif-icono" aria-hidden>{ICONO[n.tipo] || "•"}</span>
              <span><b>{n.titulo}</b>{n.detalle && <small>{n.detalle}</small>}<small className="sub">{new Date(n.created_at).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
