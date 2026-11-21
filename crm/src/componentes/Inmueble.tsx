import { useState } from "react";
import { supabase } from "../config";

// Resumen del inmueble del vendedor motivado: lo primero que se ve en la ficha.
// Los datos viven en el perfil "vendedor_motivado" (vienen del formulario) y se pueden corregir acá mismo.
const CAMPOS: { k: string; label: string; ancho?: boolean }[] = [
  { k: "direccion", label: "Calle y altura", ancho: true },
  { k: "barrio", label: "Barrio" },
  { k: "tamanio_m2", label: "Metros" },
  { k: "precio_pretendido", label: "Valor pretendido" },
  { k: "tipo_propiedad", label: "Tipo" },
  { k: "ambientes", label: "Ambientes" },
  { k: "situacion", label: "Situación" },
  { k: "urgencia", label: "Urgencia" },
];
const vacio = (v: unknown) => v == null || v === "" || /^no especificad/i.test(String(v));

export default function Inmueble({ contactId, datos, puede, alGuardar }: { contactId: string; datos: Record<string, any>; puede: boolean; alGuardar: () => void }) {
  const [editando, setEditando] = useState<string | null>(null);
  const [valor, setValor] = useState("");

  const guardar = async (k: string) => {
    const nuevos = { ...datos, [k]: valor.trim() || null };
    const { error } = await supabase.from("crm_contact_profiles").update({ datos: nuevos, updated_at: new Date().toISOString() }).eq("contact_id", contactId).eq("perfil", "vendedor_motivado");
    setEditando(null);
    if (!error) alGuardar();
  };
  const mapa = datos.direccion ? `https://www.google.com/maps/search/${encodeURIComponent(`${datos.direccion}, ${datos.barrio || ""}`)}` : null;

  return (
    <div className="tarjeta inmueble">
      <div className="fila" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Inmueble</h2>
        {mapa && <a href={mapa} target="_blank" rel="noreferrer" className="chico">Ver en el mapa</a>}
      </div>
      <div className="inmueble-grilla">
        {CAMPOS.map(({ k, label, ancho }) => (
          <div key={k} className={`inmueble-dato ${ancho ? "ancho" : ""}`}>
            <span className="sub">{label}</span>
            {editando === k ? (
              <input autoFocus value={valor} onChange={(e) => setValor(e.target.value)} onBlur={() => guardar(k)} onKeyDown={(e) => { if (e.key === "Enter") guardar(k); if (e.key === "Escape") setEditando(null); }} />
            ) : (
              <button className={`inmueble-valor ${vacio(datos[k]) ? "falta" : ""}`} disabled={!puede} onClick={() => { setEditando(k); setValor(vacio(datos[k]) ? "" : String(datos[k])); }}>
                {vacio(datos[k]) ? (puede ? "Completar" : "—") : String(datos[k])}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
