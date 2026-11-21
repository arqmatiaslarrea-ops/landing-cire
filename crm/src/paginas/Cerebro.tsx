import { useEffect, useState } from "react";
import { supabase, UNIDADES, type Unidad } from "../config";

// El Cerebro dentro del CRM: objetivos con su avance real, principios, reglas y plan.
// Las secciones las sincroniza Claude desde los documentos del proyecto CIRE; el avance sale de los datos del CRM.
const NOMBRE_UNIDAD: Record<string, string> = { ...UNIDADES, wholesaling: "Wholesaling" } as Record<string, string>;

function Texto({ t }: { t: string }) {
  const lineas = t.split("\n");
  const esLista = lineas.every((l) => /^(- |\d+\. )/.test(l.trim()) || !l.trim());
  if (esLista) {
    const ordenada = /^\d+\. /.test(lineas[0].trim());
    const items = lineas.filter((l) => l.trim()).map((l, i) => <li key={i}>{l.replace(/^(- |\d+\. )/, "")}</li>);
    return ordenada ? <ol className="cerebro-lista">{items}</ol> : <ul className="cerebro-lista">{items}</ul>;
  }
  return <>{lineas.map((l, i) => <p key={i} style={{ margin: "0 0 8px" }}>{l}</p>)}</>;
}

export default function Cerebro() {
  const [obj, setObj] = useState<any[]>([]);
  const [secs, setSecs] = useState<any[]>([]);
  const [snaps, setSnaps] = useState<any[]>([]);

  useEffect(() => {
    supabase.rpc("crm_objetivos_avance").then(({ data }) => setObj(data || []));
    supabase.from("crm_cerebro").select("*").order("orden").then(({ data }) => setSecs(data || []));
    supabase.from("crm_snapshots").select("fecha,pulso").order("fecha", { ascending: false }).limit(8).then(({ data }) => setSnaps(data || []));
  }, []);

  const dias = (h: string) => Math.ceil((new Date(h + "T23:59").getTime() - Date.now()) / 864e5);
  const ultima = secs.reduce((m, s) => (s.actualizado > m ? s.actualizado : m), "");
  const s0 = snaps[0]?.pulso, s1 = snaps[1]?.pulso;
  const delta = (a?: number, b?: number) => (a == null || b == null ? "" : a - b > 0 ? ` (+${a - b})` : a - b < 0 ? ` (${a - b})` : " (=)");

  return (
    <>
      <div className="cabecera">
        <div>
          <h1>Cerebro</h1>
          <p className="sub">El plan y las reglas del holding, conectados a lo que pasa en el CRM. Los objetivos se miden solos con los datos de acá; las secciones las actualiza Claude desde el Cerebro del proyecto CIRE{ultima ? ` (última vez: ${new Date(ultima).toLocaleDateString("es-AR")})` : ""}.</p>
        </div>
      </div>

      <h2>Objetivos</h2>
      <div className="grilla">
        {obj.map((o) => {
          const pct = Math.min(100, (Number(o.actual) / Number(o.meta)) * 100);
          const d = o.horizonte ? dias(o.horizonte) : null;
          return (
            <div className="tarjeta kpi" key={o.clave}>
              <div className="titulo">{NOMBRE_UNIDAD[o.unidad as Unidad] || o.unidad}{!o.validado && " · propuesta a validar"}</div>
              <div style={{ fontWeight: 600, margin: "2px 0 6px" }}>{o.titulo}</div>
              <div className="valor">{Number(o.actual)} <small>/ {Number(o.meta)}</small></div>
              <div className="barra"><i style={{ width: `${pct}%` }} /></div>
              {d != null && <small className={d < 14 && pct < 100 ? "alerta" : "sub"}>{d >= 0 ? `Faltan ${d} días (${new Date(o.horizonte + "T12:00").toLocaleDateString("es-AR")})` : "Vencido"}</small>}
            </div>
          );
        })}
      </div>

      {s0 && (
        <>
          <h2>Pulso comercial <small className="sub">foto semanal{s1 ? ", contra la semana anterior" : ""}</small></h2>
          <div className="kpis">
            <div className="kpi-mini"><small>Leads nuevos (7 días)</small><b>{s0.leads?.nuevos_7d}{delta(s0.leads?.nuevos_7d, s1?.leads?.nuevos_7d)}</b></div>
            <div className="kpi-mini"><small>Sin contactar (30 días)</small><b className={s0.leads?.sin_contactar_30d ? "alerta" : ""}>{s0.leads?.sin_contactar_30d}{delta(s0.leads?.sin_contactar_30d, s1?.leads?.sin_contactar_30d)}</b></div>
            <div className="kpi-mini"><small>Calientes / tibios</small><b>{s0.temperatura?.calientes} / {s0.temperatura?.tibios}</b></div>
            <div className="kpi-mini"><small>Ofertas plan 260</small><b>{s0.plan_260?.ofertas_con_numero}{delta(s0.plan_260?.ofertas_con_numero, s1?.plan_260?.ofertas_con_numero)}</b></div>
            <div className="kpi-mini"><small>Inmobiliarias contactadas</small><b>{s0.red?.inmobiliarias_contactadas}{delta(s0.red?.inmobiliarias_contactadas, s1?.red?.inmobiliarias_contactadas)}</b></div>
            <div className="kpi-mini"><small>Tareas vencidas</small><b className="alerta">{Object.values(s0.tareas?.vencidas_por_persona || {}).reduce((a: number, b: any) => a + Number(b), 0)}</b></div>
          </div>
        </>
      )}

      <div className="cerebro-secciones">
        {secs.map((s) => (
          <div className="tarjeta" key={s.clave}>
            <h2 style={{ marginTop: 0 }}>{s.titulo}</h2>
            <Texto t={s.contenido} />
            {s.fuente && <p className="sub chico" style={{ marginBottom: 0 }}>Fuente: {s.fuente}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
