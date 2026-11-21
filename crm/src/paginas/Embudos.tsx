import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EMBUDOS, UNIDADES, fecha, supabase } from "../config";
import { puedeOperar, useYo } from "../main";

export default function Embudos() {
  const yo = useYo();
  const nav = useNavigate();
  const inicial = EMBUDOS.find((e) => puedeOperar(yo, e.unidad))?.id || EMBUDOS[0].id;
  const [embudoId, setEmbudoId] = useState(inicial);
  const [verCerradas, setVerCerradas] = useState(false);
  const [rels, setRels] = useState<any[]>([]);
  const emb = EMBUDOS.find((e) => e.id === embudoId)!;
  const puede = puedeOperar(yo, emb.unidad);

  const cargar = () =>
    supabase.from("crm_relations").select("id,etapa,estado,responsable,proximo_paso,proximo_paso_fecha,updated_at,contact_id,unidad,crm_contacts(nombre,telefono,barrio)")
      .eq("embudo", embudoId).order("updated_at", { ascending: false }).limit(3000).then(({ data }) => setRels(data || []));
  useEffect(() => { cargar(); }, [embudoId]);

  const mover = async (r: any, etapa: string) => {
    const { error } = await supabase.from("crm_relations").update({ etapa, estado: etapa === "descartado" || etapa === "perdido" ? "descartado" : "prospecto", updated_at: new Date().toISOString() }).eq("id", r.id);
    if (error) return alert("No tenés permiso para operar esta unidad.");
    await supabase.from("crm_activities").insert({ contact_id: r.contact_id, unidad: r.unidad, tipo: "cambio_etapa", autor: yo.clave, detalle: { de: r.etapa, a: etapa, embudo: embudoId } });
    cargar();
  };

  const etapas = emb.etapas.filter((e) => verCerradas || !e.cierre);
  const estancado = (r: any) => Date.now() - new Date(r.updated_at).getTime() > 7 * 864e5;

  return (
    <>
      <h1>Embudos</h1>
      <p className="sub">{puede ? "Mové cada contacto de etapa desde su tarjeta." : "Solo lectura: no operás esta unidad."} En rojo, los que llevan más de 7 días sin movimiento.</p>
      <div className="filtros">
        <select value={embudoId} onChange={(e) => setEmbudoId(e.target.value)}>
          {EMBUDOS.map((e) => <option key={e.id} value={e.id}>{UNIDADES[e.unidad]} · {e.nombre}</option>)}
        </select>
        <label className="fila"><input type="checkbox" checked={verCerradas} onChange={(e) => setVerCerradas(e.target.checked)} /> Ver etapas de cierre</label>
      </div>
      <div className="kanban">
        {etapas.map((et) => {
          const cartas = rels.filter((r) => r.etapa === et.id);
          return (
            <div className="columna" key={et.id}>
              <h3>{et.nombre} <span>{cartas.length}</span></h3>
              {cartas.slice(0, 80).map((r) => (
                <div className="carta" key={r.id}>
                  <strong onClick={() => nav(`/contactos/${r.contact_id}`)} className={estancado(r) && !et.cierre ? "alerta" : ""}>{r.crm_contacts?.nombre}</strong>
                  <small className="sub">{r.crm_contacts?.barrio || ""} · {r.responsable || "sin responsable"}</small>
                  {r.proximo_paso && <div>→ {r.proximo_paso} {r.proximo_paso_fecha && <small>({fecha(r.proximo_paso_fecha)})</small>}</div>}
                  {puede && (
                    <select value={r.etapa} onChange={(e) => mover(r, e.target.value)}>
                      {emb.etapas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                    </select>
                  )}
                </div>
              ))}
              {cartas.length > 80 && <small className="sub">+{cartas.length - 80} más (usá Contactos para filtrar)</small>}
            </div>
          );
        })}
      </div>
    </>
  );
}
