import { useMemo, useState } from "react";
import { supabase } from "../config";
import { useYo } from "../main";

// Guion de llamada a vendedores en distress (documento "Guion de llamada — Captación de vendedores").
type P = { id: string; texto: string; tipo?: "si_no" | "escala" | "opciones"; opciones?: string[] };
const BLOQUES: { titulo: string; nota?: string; preguntas: P[] }[] = [
  { titulo: "Apertura y motivo", nota: "“Somos compradores directos, no una inmobiliaria.” Dejá que cuente su historia sin cortar.",
    preguntas: [
      { id: "motivo", texto: "¿Qué te llevó a pensar en vender esta propiedad?" },
      { id: "hace_cuanto", texto: "¿Hace cuánto le estás dando vueltas a esto?" },
    ] },
  { titulo: "A · Urgencia real", nota: "El bloque más importante. 8-10 + intento fallido previo = candidato fuerte.",
    preguntas: [
      { id: "fecha_limite", texto: "¿Hay alguna fecha límite (deuda que vence, sucesión, remate, mudanza)?" },
      { id: "urgencia", texto: "Del 1 al 10, ¿qué tan urgente es resolver esto?", tipo: "escala" },
      { id: "intento_previo", texto: "¿Ya intentó venderla? ¿Con quién y por qué no se dio?", tipo: "opciones", opciones: ["No", "Sí, con inmobiliaria", "Sí, como particular"] },
    ] },
  { titulo: "B · Estado físico",
    preguntas: [
      { id: "ocupacion_hoy", texto: "¿Está habitada o vacía hoy?", tipo: "opciones", opciones: ["Vacía", "La habita el dueño o la familia", "Inquilino", "Otro ocupante"] },
      { id: "estado", texto: "¿Cómo la describiría?", tipo: "opciones", opciones: ["Puesta a punto", "Necesita reforma", "Bastante deteriorada"] },
      { id: "ultima_refaccion", texto: "¿Hace cuánto no se hace una refacción importante?" },
      { id: "problemas", texto: "¿Humedad, techo, electricidad o gas viejos, algo estructural?" },
    ] },
  { titulo: "C · Situación legal (filtra el deal)",
    preguntas: [
      { id: "titularidad", texto: "¿Está a su nombre o en sucesión?", tipo: "opciones", opciones: ["A su nombre", "En sucesión"] },
      { id: "declaratoria", texto: "Si es sucesión: ¿declaratoria hecha? ¿Cuántos herederos y están de acuerdo?", tipo: "opciones", opciones: ["No aplica", "Declaratoria hecha, todos de acuerdo", "Sin declaratoria", "Herederos en desacuerdo"] },
      { id: "deudas", texto: "¿Deudas asociadas: ABL, expensas, hipoteca, embargo?" },
      { id: "ocupante_conflicto", texto: "PREGUNTA FILTRO: ¿hay inquilino u ocupante que no quiera irse?", tipo: "si_no" },
    ] },
  { titulo: "D · Expectativa económica", nota: "No discutir precio. Solo registrar el ancla.",
    preguntas: [
      { id: "precio_esperado", texto: "¿Tiene un número en mente?" },
      { id: "conoce_mercado", texto: "¿Sabe a cuánto se mueven propiedades parecidas en la zona?" },
      { id: "forma_cobro", texto: "¿Necesita todo de una vez o hay flexibilidad?", tipo: "opciones", opciones: ["Todo de una vez", "Hay flexibilidad"] },
    ] },
  { titulo: "E · Timeline y decisión",
    preguntas: [
      { id: "decide_rapido", texto: "Si le acercamos una propuesta en días, ¿puede decidir rápido?", tipo: "si_no" },
      { id: "quien_decide", texto: "¿Quién más participa en la decisión?" },
    ] },
];

export function semaforoSugerido(r: Record<string, string>): { color: "verde" | "amarillo" | "rojo"; razon: string } {
  const urg = Number(r.urgencia || 0);
  if (r.ocupante_conflicto === "Sí") return { color: "rojo", razon: "Ocupada con conflicto: CIRE no compra así. Derivar a gestión legal." };
  if (r.declaratoria === "Herederos en desacuerdo") return { color: "rojo", razon: "Herederos en desacuerdo total." };
  if (urg && urg <= 4) return { color: "rojo", razon: "Sin urgencia real (está tanteando precio)." };
  if (r.decide_rapido === "No") return { color: "amarillo", razon: "La decisión de vender no está confirmada o falta quien decide." };
  if (r.declaratoria === "Sin declaratoria") return { color: "amarillo", razon: "Sucesión sin declaratoria: dar tiempo a que avance el trámite." };
  if (urg >= 8) return { color: "verde", razon: "Urgencia alta y sin trabas legales serias: oferta agresiva, visita en menos de 48 h." };
  if (urg >= 5) return { color: "amarillo", razon: "Urgencia media: negociar y seguir." };
  return { color: "amarillo", razon: "Faltan datos clave para decidir." };
}

export default function Descubrimiento({ contactId, relationId, nombre, alCerrar }: { contactId: string; relationId: string | null; nombre: string; alCerrar: (c: boolean) => void }) {
  const yo = useYo();
  const [r, setR] = useState<Record<string, string>>({});
  const [forzado, setForzado] = useState<"" | "verde" | "amarillo" | "rojo">("");
  const [guardando, setGuardando] = useState(false);
  const sug = useMemo(() => semaforoSugerido(r), [r]);
  const final = forzado || sug.color;
  const set = (k: string, v: string) => setR({ ...r, [k]: v });

  const guardar = async () => {
    if (!r.urgencia) return alert("Falta la urgencia del 1 al 10: es el dato más importante.");
    setGuardando(true);
    const ocupada = r.ocupante_conflicto === "Sí";
    await supabase.from("crm_descubrimientos").insert({ contact_id: contactId, relation_id: relationId, respuestas: r, urgencia: Number(r.urgencia), semaforo: final, semaforo_sugerido: sug.color, ocupada_conflicto: ocupada, autor: yo.clave });
    await supabase.from("crm_activities").insert({ contact_id: contactId, unidad: "inmobiliaria", tipo: "descubrimiento", autor: yo.clave, detalle: { semaforo: final, urgencia: r.urgencia, motivo: r.motivo } });
    const { data: perfil } = await supabase.from("crm_contact_profiles").select("datos").eq("contact_id", contactId).eq("perfil", "vendedor_motivado").maybeSingle();
    const datos = { ...(perfil?.datos || {}), urgencia_1a10: r.urgencia, motivo: r.motivo, estado_fisico: r.estado, titularidad: r.titularidad, deudas: r.deudas, precio_esperado: r.precio_esperado, quien_decide: r.quien_decide, semaforo: final };
    if (perfil) await supabase.from("crm_contact_profiles").update({ datos }).eq("contact_id", contactId).eq("perfil", "vendedor_motivado");
    else await supabase.from("crm_contact_profiles").insert({ contact_id: contactId, perfil: "vendedor_motivado", datos });
    if (relationId) {
      const etapa = final === "verde" ? "calificado" : final === "rojo" ? (ocupada ? "derivado_abogado" : "descartado") : "descubrimiento";
      await supabase.from("crm_relations").update({ semaforo: final, etapa, estado: final === "rojo" && !ocupada ? "descartado" : "prospecto", updated_at: new Date().toISOString() }).eq("id", relationId);
      const en = (dias: number) => new Date(Date.now() + dias * 864e5).toISOString();
      if (final === "verde")
        await supabase.from("crm_tareas").insert({ contact_id: contactId, relation_id: relationId, unidad: "inmobiliaria", tipo: "visita", titulo: `Caso VERDE de ${yo.nombre.split(" ")[0]}: coordinar visita y armar oferta (menos de 48 h)`, vence: en(1), responsable: "mati", prioridad: "alta", origen: "descubrimiento" });
      if (final === "amarillo")
        await supabase.from("crm_tareas").insert({ contact_id: contactId, relation_id: relationId, unidad: "inmobiliaria", tipo: "seguimiento", titulo: "Seguimiento del caso amarillo (documentación o trámite pendiente)", vence: en(10), responsable: yo.clave, origen: "descubrimiento" });
    }
    setGuardando(false); alCerrar(true);
  };

  return (
    <div className="modal-fondo" onClick={() => alCerrar(false)}>
      <div className="modal grande" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cab">
          <div><small className="sub">Guion de descubrimiento · vendedor</small><h2>{nombre}</h2></div>
          <button className="icono" onClick={() => alCerrar(false)}>✕</button>
        </div>
        <p className="aviso">Objetivo: no cerrar precio. Calificar el caso y coordinar visita o propuesta en 48 h. CIRE no compra ocupadas con conflicto.</p>
        {BLOQUES.map((b) => (
          <section key={b.titulo} className="bloque-guion">
            <h3>{b.titulo}</h3>
            {b.nota && <p className="sub chico">{b.nota}</p>}
            {b.preguntas.map((p) => (
              <label key={p.id} className="campo">{p.texto}
                {p.tipo === "escala" ? (
                  <div className="escala">{Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => <button key={n} className={r[p.id] === n ? "activo" : ""} onClick={(e) => { e.preventDefault(); set(p.id, n); }}>{n}</button>)}</div>
                ) : p.tipo === "si_no" ? (
                  <div className="opciones">{["Sí", "No"].map((o) => <button key={o} className={r[p.id] === o ? "activo" : ""} onClick={(e) => { e.preventDefault(); set(p.id, o); }}>{o}</button>)}</div>
                ) : p.tipo === "opciones" ? (
                  <div className="opciones">{p.opciones!.map((o) => <button key={o} className={r[p.id] === o ? "activo" : ""} onClick={(e) => { e.preventDefault(); set(p.id, o); }}>{o}</button>)}</div>
                ) : (
                  <input value={r[p.id] || ""} onChange={(e) => set(p.id, e.target.value)} />
                )}
              </label>
            ))}
          </section>
        ))}
        <div className={`semaforo ${final}`}>
          <div><strong>Semáforo: {final.toUpperCase()}</strong>{!forzado && <small> · sugerido</small>}<br /><span>{forzado ? "Elegido a mano." : sug.razon}</span></div>
          <div className="fila">
            {(["verde", "amarillo", "rojo"] as const).map((c) => <button key={c} className={final === c ? "activo" : ""} onClick={() => setForzado(c === sug.color ? "" : c)}>{c}</button>)}
          </div>
        </div>
        <p className="sub chico">Al guardar: verde pasa a "Motivación detectada" y te crea a vos (Mati) la tarea de visita y oferta; amarillo queda en descubrimiento con seguimiento a 10 días; rojo se descarta o se deriva a abogado si es por ocupación.</p>
        <div className="fila" style={{ justifyContent: "flex-end" }}>
          <button onClick={() => alCerrar(false)}>Cancelar</button>
          <button className="primario" disabled={guardando} onClick={guardar}>{guardando ? "Guardando…" : "Guardar descubrimiento"}</button>
        </div>
      </div>
    </div>
  );
}
