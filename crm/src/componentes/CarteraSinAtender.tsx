import { useEffect, useState } from "react";
import { supabase } from "../config";
import { useYo } from "../main";

// Aviso para admin: cartera asignada a alguien que todavía no entra al CRM (hoy, Juan). Permite tomarla en un clic.
export default function CarteraSinAtender({ alCambiar }: { alCambiar: () => void }) {
  const yo = useYo();
  const [filas, setFilas] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const cargar = () => supabase.rpc("crm_cartera_sin_atender").then(({ data }) => setFilas((data || []).filter((f: any) => f.tareas_vencidas > 0 || f.leads_nuevos > 0)));
  useEffect(() => { if (yo.admin) cargar(); }, []);
  if (!yo.admin || !filas.length) return msg ? <p className="aviso">{msg}</p> : null;

  const tomar = async (de: string, nombre: string) => {
    const { data, error } = await supabase.rpc("crm_reasignar", { p_de: de, p_a: yo.clave });
    if (error) return setMsg(error.message);
    setMsg(`Listo: pasaron a tu nombre ${data.tareas} tareas y ${data.oportunidades} oportunidades de ${nombre}. Cuando ${nombre} tenga usuario, se las devolvés desde acá mismo.`);
    cargar(); alCambiar();
  };

  return (
    <div className="aviso" style={{ marginBottom: 16 }}>
      {filas.map((f) => (
        <div key={f.clave} className="fila" style={{ justifyContent: "space-between" }}>
          <span><b>{f.nombre}</b> todavía no entra al CRM y tiene {f.tareas_vencidas} tareas vencidas y {f.leads_nuevos} leads sin primer contacto. Nadie los está atendiendo.</span>
          <button className="chico primario" onClick={() => tomar(f.clave, f.nombre.split(" ")[0])}>Tomarlos yo</button>
        </div>
      ))}
    </div>
  );
}
