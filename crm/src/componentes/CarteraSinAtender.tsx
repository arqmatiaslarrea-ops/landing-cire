import { useEffect, useState } from "react";
import { supabase } from "../config";
import { useYo } from "../main";

// Aviso para admin: cartera asignada a alguien que todavía no entra al CRM (hoy, Juan).
// Se toma por partes (solo tareas vencidas, los 10 leads más calientes o todo) y cada toma se puede deshacer.
export default function CarteraSinAtender({ alCambiar }: { alCambiar: () => void }) {
  const yo = useYo();
  const [filas, setFilas] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const cargar = () => {
    supabase.rpc("crm_cartera_sin_atender").then(({ data }) => setFilas((data || []).filter((f: any) => f.tareas_vencidas > 0 || f.leads_nuevos > 0)));
    supabase.rpc("crm_ultimas_reasignaciones").then(({ data }) => setLotes((data || []).filter((l: any) => !l.revertida && Date.now() - new Date(l.cuando).getTime() < 7 * 864e5)));
  };
  useEffect(() => { if (yo.admin) cargar(); }, []);
  if (!yo.admin || (!filas.length && !lotes.length)) return msg ? <p className="aviso">{msg}</p> : null;

  const tomar = async (de: string, nombre: string, alcance: "vencidas" | "calientes" | "todo") => {
    if (alcance === "todo" && !window.confirm(`Vas a pasar a tu nombre toda la cartera abierta de ${nombre}. ¿Seguro?`)) return;
    setOcupado(true);
    const { data, error } = await supabase.rpc("crm_reasignar", { p_de: de, p_a: yo.clave, p_alcance: alcance, p_cantidad: 10 });
    setOcupado(false);
    if (error) return setMsg(error.message);
    setMsg(`Listo: pasaron a tu nombre ${data.tareas} tareas y ${data.oportunidades} oportunidades de ${nombre}. Si te arrepentís, tocá "Deshacer".`);
    cargar(); alCambiar();
  };
  const deshacer = async (lote: string) => {
    setOcupado(true);
    const { data, error } = await supabase.rpc("crm_revertir_reasignacion", { p_lote: lote });
    setOcupado(false);
    if (error) return setMsg(error.message);
    setMsg(`Devueltas ${data.tareas} tareas y ${data.oportunidades} oportunidades. Lo que ya habías cambiado desde entonces queda como está.`);
    cargar(); alCambiar();
  };

  return (
    <div className="aviso" style={{ marginBottom: 16 }}>
      {filas.map((f) => {
        const n = f.nombre.split(" ")[0];
        return (
          <div key={f.clave} style={{ marginBottom: 8 }}>
            <p style={{ margin: "0 0 6px" }}><b>{f.nombre}</b> todavía no entra al CRM y tiene {f.tareas_vencidas} tareas vencidas y {f.leads_nuevos} leads sin primer contacto. Nadie los está atendiendo.</p>
            <div className="fila">
              <button className="chico primario" disabled={ocupado} onClick={() => tomar(f.clave, n, "calientes")}>Tomar los 10 más calientes</button>
              <button className="chico" disabled={ocupado} onClick={() => tomar(f.clave, n, "vencidas")}>Tomar solo las tareas vencidas</button>
              <button className="chico link" disabled={ocupado} onClick={() => tomar(f.clave, n, "todo")}>Tomar todo</button>
            </div>
          </div>
        );
      })}
      {lotes.map((l) => (
        <div key={l.lote} className="fila" style={{ justifyContent: "space-between" }}>
          <span className="sub">Tomaste {l.oportunidades} oportunidades y {l.tareas} tareas de {l.de} el {new Date(l.cuando).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "short" })}.</span>
          <button className="chico link" disabled={ocupado} onClick={() => deshacer(l.lote)}>Deshacer</button>
        </div>
      ))}
      {msg && <p style={{ margin: "6px 0 0" }}>{msg}</p>}
    </div>
  );
}
