import { useState } from "react";
import { MOTIVOS_DESCARTE, supabase } from "../config";

// Botón único para descartar (o reactivar) una oportunidad desde cualquier pantalla.
// Cierra sus tareas, da de baja las secuencias y deja el motivo en el historial.
export default function Descartar({ relationId, nombre, descartado, alCambiar, chico = true }: { relationId: string; nombre?: string; descartado?: boolean; alCambiar: () => void; chico?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS_DESCARTE[0]);
  const [otro, setOtro] = useState("");
  const [error, setError] = useState("");

  if (descartado) {
    return <button className={`link ${chico ? "chico" : ""}`} onClick={async (e) => { e.stopPropagation(); const { error } = await supabase.rpc("crm_reactivar", { p_relation: relationId }); if (!error) alCambiar(); }}>Reactivar</button>;
  }
  const confirmar = async () => {
    const m = motivo === "Otro" ? otro.trim() || "Otro" : motivo;
    const { error } = await supabase.rpc("crm_descartar", { p_relation: relationId, p_motivo: m });
    if (error) return setError(error.message.includes("unidad") ? "No operás esa unidad." : error.message);
    setAbierto(false); alCambiar();
  };
  return (
    <>
      <button className={`descartar ${chico ? "chico" : ""}`} onClick={(e) => { e.stopPropagation(); setAbierto(true); setError(""); }} title="Descartar este lead">Descartar</button>
      {abierto && (
        <div className="modal-fondo" onClick={(e) => { e.stopPropagation(); setAbierto(false); }}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-cab"><h2>Descartar{nombre ? ` a ${nombre}` : ""}</h2><button className="icono" onClick={() => setAbierto(false)} aria-label="Cerrar">✕</button></div>
            <p className="sub chico">Se cierran sus tareas y sus mails automáticos. Queda en el historial y se puede reactivar.</p>
            <div className="opciones">
              {MOTIVOS_DESCARTE.map((m) => <button key={m} className={motivo === m ? "activo" : ""} onClick={() => setMotivo(m)}>{m}</button>)}
            </div>
            {motivo === "Otro" && <label className="campo chico">¿Cuál?<input value={otro} onChange={(e) => setOtro(e.target.value)} autoComplete="off" /></label>}
            {error && <p className="aviso">{error}</p>}
            <div className="fila" style={{ justifyContent: "flex-end", marginTop: 14 }}>
              <button onClick={() => setAbierto(false)}>Cancelar</button>
              <button className="primario" onClick={confirmar}>Descartar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
