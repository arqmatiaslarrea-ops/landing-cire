import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EMBUDOS, UNIDADES, fecha, supabase, type Unidad } from "../config";

type Rel = { unidad: Unidad; embudo: string; etapa: string; estado: string; created_at: string; proximo_paso: string | null; contact_id: string; origen: string | null; responsable: string | null; primer_contacto_at: string | null };
type Oferta = { fecha: string; monto_usd: number; cuenta_plan_260: boolean; etapa_loacc: string };
const minutos = (m: number | null) => (m == null ? "—" : m < 60 ? `${Math.round(m)} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`);

// Meta del anotador 260: rampa 3/4/5 ofertas por día hábil desde el 5/10/2026 hasta el 18/12/2026
export function metaPlan260(hasta = new Date()) {
  let d = new Date(2026, 9, 5), dia = 0, meta = 0;
  const fin = new Date(2026, 11, 18);
  while (d <= hasta && d <= fin) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) { dia++; meta += dia <= 5 ? 3 : dia <= 10 ? 4 : 5; }
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  }
  return Math.min(meta, 260);
}

export default function Inicio() {
  const [rels, setRels] = useState<Rel[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [recientes, setRecientes] = useState<any[]>([]);
  const [acts, setActs] = useState<{ autor: string; contact_id: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ clave: string; nombre: string }[]>([]);

  useEffect(() => {
    supabase.from("crm_relations").select("unidad,embudo,etapa,estado,created_at,proximo_paso,contact_id,origen,responsable,primer_contacto_at").limit(10000).then(({ data }) => setRels((data as Rel[]) || []));
    supabase.from("crm_ofertas").select("fecha,monto_usd,cuenta_plan_260,etapa_loacc").then(({ data }) => setOfertas((data as Oferta[]) || []));
    supabase.from("crm_activities").select("created_at,tipo,unidad,detalle,contact_id,crm_contacts(nombre)").in("tipo", ["formulario_web", "sin_accion_post_formulario"]).order("created_at", { ascending: false }).limit(8).then(({ data }) => setRecientes(data || []));
    supabase.from("crm_activities").select("autor,contact_id").gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()).not("autor", "in", "(sistema,fathom)").limit(5000).then(({ data }) => setActs(data || []));
    supabase.from("crm_usuarios").select("clave,nombre").then(({ data }) => setUsuarios(data || []));
  }, []);

  const hace = (dias: number) => Date.now() - dias * 864e5;
  const plan = ofertas.filter((o) => o.cuenta_plan_260).length;
  const meta = metaPlan260();
  const r30 = rels.filter((x) => new Date(x.created_at).getTime() > hace(30));
  const resp = r30.filter((x) => x.primer_contacto_at).map((x) => (+new Date(x.primer_contacto_at!) - +new Date(x.created_at)) / 6e4).sort((a, b) => a - b);
  const mediana = resp.length ? resp[Math.floor(resp.length / 2)] : null;
  const sinTocar = r30.filter((x) => !x.primer_contacto_at && x.estado !== "descartado").length;
  const origenes = Object.entries(r30.reduce<Record<string, number>>((m, x) => { const k = x.origen || "Sin dato"; m[k] = (m[k] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const LOACC_ORDEN = ["L", "O", "A", "C1", "C2"];

  return (
    <>
      <h1>Tablero</h1>
      <p className="sub">Lectura comercial del holding. Los leads de las landings entran solos y al instante.</p>

      <div className="grilla">
        <div className="tarjeta kpi">
          <div className="titulo">Plan 260 · ofertas con número</div>
          <div className="valor">{plan} <small>/ 260</small></div>
          <div className="barra"><i style={{ width: `${(plan / 260) * 100}%` }} /></div>
          <small>A la fecha el anotador pedía {meta}. {plan < meta ? <span className="alerta">Faltan {meta - plan}.</span> : "Al día."}</small>
        </div>
        {(Object.keys(UNIDADES) as Unidad[]).map((u) => {
          const r = rels.filter((x) => x.unidad === u);
          const activos = r.filter((x) => x.estado !== "descartado");
          return (
            <div className="tarjeta kpi" key={u}>
              <div className="titulo">{UNIDADES[u]}</div>
              <div className="valor">{activos.length}</div>
              <small>activos · {r.filter((x) => new Date(x.created_at).getTime() > hace(7)).length} nuevos en 7 días · {r.filter((x) => new Date(x.created_at).getTime() > hace(30)).length} en 30 días</small>
            </div>
          );
        })}
      </div>

      <div className="grilla" style={{ marginTop: 16 }}>
        <div className="tarjeta kpi">
          <div className="titulo">Velocidad de primera respuesta (30 días)</div>
          <div className="valor">{minutos(mediana)}</div>
          <small>Mediana entre que entra el lead y el primer contacto. {sinTocar > 0 && <span className="alerta">{sinTocar} leads todavía sin tocar.</span>}</small>
        </div>
        <div className="tarjeta kpi">
          <div className="titulo">De dónde vienen (30 días)</div>
          {origenes.length ? origenes.map(([o, n]) => (
            <div key={o} className="fila" style={{ justifyContent: "space-between", fontSize: 13 }}><span>{o}</span><b>{n}</b></div>
          )) : <small className="sub">Sin leads nuevos en 30 días.</small>}
        </div>
        <div className="tarjeta kpi">
          <div className="titulo">Actividad del equipo (7 días)</div>
          {usuarios.map((u) => {
            const a = acts.filter((x) => x.autor === u.clave);
            return a.length ? <div key={u.clave} className="fila" style={{ justifyContent: "space-between", fontSize: 13 }}><span>{u.nombre}</span><span>{a.length} gestiones · {new Set(a.map((x) => x.contact_id)).size} contactos</span></div> : null;
          })}
          {!acts.length && <small className="sub">Nadie registró gestiones esta semana.</small>}
        </div>
        <div className="tarjeta kpi">
          <div className="titulo">Embudo de ofertas (LOACC)</div>
          {LOACC_ORDEN.map((k, i) => {
            const n = ofertas.filter((o) => LOACC_ORDEN.indexOf(o.etapa_loacc) >= i).length;
            return <div key={k} className="fila" style={{ justifyContent: "space-between", fontSize: 13 }}><span>{({ L: "Leads", O: "Ofertadas", A: "Visitadas", C1: "Reserva", C2: "Cerradas" } as Record<string, string>)[k]}</span><b>{n}</b></div>;
          })}
        </div>
      </div>

      {EMBUDOS.map((e) => {
        const r = rels.filter((x) => x.embudo === e.id && x.estado !== "descartado");
        if (!r.length) return null;
        return (
          <div key={e.id} className="tarjeta panel" style={{ marginTop: 16 }}>
            <h2 style={{ marginTop: 0 }}>{e.nombre} <small className="sub">· {UNIDADES[e.unidad]} · {r.length} activos</small></h2>
            {e.etapas.map((et, i) => {
              const n = r.filter((x) => x.etapa === et.id).length;
              const llegaron = r.filter((x) => e.etapas.findIndex((y) => y.id === x.etapa) >= i).length;
              return (
                <div key={et.id} style={{ display: "grid", gridTemplateColumns: "minmax(110px,180px) 1fr auto", gap: 10, alignItems: "center", fontSize: 13, margin: "4px 0" }}>
                  <span>{et.nombre}</span>
                  <div className="barra" style={{ margin: 0 }}><i style={{ width: `${(llegaron / r.length) * 100}%` }} /></div>
                  <span><b>{n}</b> <span className="sub">· {Math.round((llegaron / r.length) * 100)}% llegó</span></span>
                </div>
              );
            })}
          </div>
        );
      })}

      <h2>Últimos movimientos de las landings</h2>
      <div className="tabla-scroll"><table>
        <thead><tr><th>Fecha</th><th>Contacto</th><th>Qué pasó</th><th>Unidad</th></tr></thead>
        <tbody>
          {recientes.map((a, i) => (
            <tr key={i}>
              <td>{fecha(a.created_at)}</td>
              <td><Link to={`/contactos/${a.contact_id}`}>{a.crm_contacts?.nombre}</Link></td>
              <td>{a.tipo === "formulario_web" ? `Formulario en ${a.detalle?.landing}` : <span className="alerta">No abrió WhatsApp: llamar</span>}</td>
              <td>{a.unidad ? UNIDADES[a.unidad as Unidad] : "—"}</td>
            </tr>
          ))}
          {!recientes.length && <tr><td colSpan={4} className="sub">Todavía no entraron leads nuevos desde las landings migradas.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
