import { useState } from "react";
import { UNIDADES, supabase, waLink, type Unidad } from "../config";
import { puedeOperar, useYo } from "../main";

// Registro rápido de una gestión. Obliga a dejar próximo paso (salvo que se cierre el caso).
export type ContextoRegistro = {
  contactId: string; nombre: string; telefono?: string | null;
  relaciones: { id: string; unidad: Unidad; embudo: string }[];
  tareaId?: string; tipoInicial?: string;
};

const RESULTADOS: Record<string, string[]> = {
  llamada: ["Atendió y conversamos", "No atendió", "Pidió que lo llame más tarde", "Número equivocado", "No le interesa"],
  whatsapp: ["Mensaje enviado", "Respondió", "Sin respuesta", "No le interesa"],
  visita: ["Visita hecha", "Reprogramada", "No se presentó"],
  reunion: ["Reunión hecha", "Reprogramada", "No se presentó"],
  nota: ["Dato registrado"],
};

const manana = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d; };
const aLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);

export default function Registro({ ctx, alCerrar }: { ctx: ContextoRegistro; alCerrar: (cambio: boolean) => void }) {
  const yo = useYo();
  const mias = ctx.relaciones.filter((r) => puedeOperar(yo, r.unidad));
  const [tipo, setTipo] = useState(ctx.tipoInicial || "llamada");
  const [resultado, setResultado] = useState("");
  const [nota, setNota] = useState("");
  const [relId, setRelId] = useState(mias[0]?.id || "");
  const [sinProximo, setSinProximo] = useState(false);
  const [prox, setProx] = useState({ titulo: "", tipo: "llamar", vence: aLocal(manana()) });
  const [guardando, setGuardando] = useState(false);
  const rel = mias.find((r) => r.id === relId);

  const atajos = [
    ["En 2 horas", 2 / 24], ["Mañana", 1], ["En 3 días", 3], ["En 1 semana", 7], ["En 2 semanas", 14],
  ] as const;
  const fijar = (dias: number) => {
    const d = dias < 1 ? new Date(Date.now() + dias * 864e5) : (() => { const x = new Date(); x.setDate(x.getDate() + dias); x.setHours(10, 0, 0, 0); return x; })();
    setProx({ ...prox, vence: aLocal(d) });
  };

  const guardar = async () => {
    if (!rel) return alert("No operás ninguna unidad de este contacto.");
    if (!resultado) return alert("Elegí el resultado.");
    if (!sinProximo && !prox.titulo.trim()) return alert("Definí el próximo paso (o marcá que el caso se cierra).");
    setGuardando(true);
    await supabase.from("crm_activities").insert({ contact_id: ctx.contactId, unidad: rel.unidad, tipo, autor: yo.clave, detalle: { resultado, texto: nota || undefined } });
    if (ctx.tareaId) await supabase.from("crm_tareas").update({ hecha: true, hecha_at: new Date().toISOString() }).eq("id", ctx.tareaId);
    if (!sinProximo) {
      await supabase.from("crm_tareas").insert({ contact_id: ctx.contactId, relation_id: rel.id, unidad: rel.unidad, tipo: prox.tipo, titulo: prox.titulo, vence: new Date(prox.vence).toISOString(), responsable: yo.clave });
      await supabase.from("crm_relations").update({ proximo_paso: prox.titulo, proximo_paso_fecha: new Date(prox.vence).toISOString() }).eq("id", rel.id);
    }
    // Primer contacto: si estaba "nuevo" y hubo conversación o mensaje, pasa a "contactado"
    if (["Atendió y conversamos", "Mensaje enviado", "Respondió"].includes(resultado)) {
      await supabase.from("crm_relations").update({ etapa: "contactado", updated_at: new Date().toISOString() }).eq("id", rel.id).eq("etapa", "nuevo");
    }
    setGuardando(false);
    alCerrar(true);
  };

  const wa = waLink(ctx.telefono || null, `Hola ${ctx.nombre.split(" ")[0]}, ¿cómo estás?`);

  return (
    <div className="modal-fondo" onClick={() => alCerrar(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cab">
          <div><small className="sub">Registrar gestión</small><h2>{ctx.nombre}</h2></div>
          <button className="icono" onClick={() => alCerrar(false)}>✕</button>
        </div>
        <div className="fila" style={{ marginBottom: 12 }}>
          {ctx.telefono && <a href={`tel:${ctx.telefono}`}><button>📞 Llamar</button></a>}
          {wa && <a href={wa} target="_blank" rel="noreferrer"><button>💬 Abrir WhatsApp</button></a>}
        </div>
        {mias.length > 1 && (
          <label className="campo">Unidad
            <select value={relId} onChange={(e) => setRelId(e.target.value)}>
              {mias.map((r) => <option key={r.id} value={r.id}>{UNIDADES[r.unidad]} · {r.embudo.replace(/_/g, " ")}</option>)}
            </select>
          </label>
        )}
        <div className="segmentos">
          {Object.keys(RESULTADOS).map((t) => <button key={t} className={tipo === t ? "activo" : ""} onClick={() => { setTipo(t); setResultado(""); }}>{t === "llamada" ? "Llamada" : t === "whatsapp" ? "WhatsApp" : t === "visita" ? "Visita" : t === "reunion" ? "Reunión" : "Nota"}</button>)}
        </div>
        <div className="opciones">
          {RESULTADOS[tipo].map((r) => <button key={r} className={resultado === r ? "activo" : ""} onClick={() => setResultado(r)}>{r}</button>)}
        </div>
        <label className="campo">Qué pasó (opcional)<textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Lo importante de la conversación" /></label>

        <div className="bloque-prox">
          <div className="fila" style={{ justifyContent: "space-between" }}>
            <strong>Próximo paso</strong>
            <label className="fila chico"><input type="checkbox" checked={sinProximo} onChange={(e) => setSinProximo(e.target.checked)} /> El caso se cierra, sin próximo paso</label>
          </div>
          {!sinProximo && (
            <>
              <div className="fila" style={{ marginTop: 8 }}>
                <select value={prox.tipo} onChange={(e) => setProx({ ...prox, tipo: e.target.value })}>
                  {["llamar", "whatsapp", "visita", "reunion", "enviar_oferta", "seguimiento"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
                <input style={{ flex: 1 }} placeholder="Ej.: llamar para coordinar visita" value={prox.titulo} onChange={(e) => setProx({ ...prox, titulo: e.target.value })} />
              </div>
              <div className="fila" style={{ marginTop: 8 }}>
                <input type="datetime-local" value={prox.vence} onChange={(e) => setProx({ ...prox, vence: e.target.value })} />
                {atajos.map(([t, d]) => <button key={t} className="chico" onClick={() => fijar(d)}>{t}</button>)}
              </div>
            </>
          )}
        </div>
        <div className="fila" style={{ justifyContent: "flex-end", marginTop: 14 }}>
          <button onClick={() => alCerrar(false)}>Cancelar</button>
          <button className="primario" disabled={guardando} onClick={guardar}>{guardando ? "Guardando…" : "Guardar gestión"}</button>
        </div>
      </div>
    </div>
  );
}
