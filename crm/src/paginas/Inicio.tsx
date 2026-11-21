import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EMBUDOS, UNIDADES, fecha, supabase, type Unidad } from "../config";

type Rel = { unidad: Unidad; embudo: string; etapa: string; estado: string; created_at: string; proximo_paso: string | null; contact_id: string };
type Oferta = { fecha: string; monto_usd: number; cuenta_plan_260: boolean };

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

  useEffect(() => {
    supabase.from("crm_relations").select("unidad,embudo,etapa,estado,created_at,proximo_paso,contact_id").limit(10000).then(({ data }) => setRels((data as Rel[]) || []));
    supabase.from("crm_ofertas").select("fecha,monto_usd,cuenta_plan_260").then(({ data }) => setOfertas((data as Oferta[]) || []));
    supabase.from("crm_activities").select("created_at,tipo,unidad,detalle,contact_id,crm_contacts(nombre)").in("tipo", ["formulario_web", "sin_accion_post_formulario"]).order("created_at", { ascending: false }).limit(8).then(({ data }) => setRecientes(data || []));
  }, []);

  const hace = (dias: number) => Date.now() - dias * 864e5;
  const plan = ofertas.filter((o) => o.cuenta_plan_260).length;
  const meta = metaPlan260();

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

      {EMBUDOS.map((e) => {
        const r = rels.filter((x) => x.embudo === e.id);
        if (!r.length) return null;
        return (
          <div key={e.id}>
            <h2>{e.nombre} <small className="sub">· {UNIDADES[e.unidad]}</small></h2>
            <div className="fila">
              {e.etapas.map((et) => {
                const n = r.filter((x) => x.etapa === et.id).length;
                return <span key={et.id} className={`chip ${et.id}`}>{et.nombre}: <b>{n}</b></span>;
              })}
            </div>
          </div>
        );
      })}

      <h2>Últimos movimientos de las landings</h2>
      <table>
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
      </table>
    </>
  );
}
