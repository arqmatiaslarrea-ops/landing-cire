import { useEffect, useMemo, useState } from "react";
import { supabase, waLink } from "../config";

// Directorio de gremios y proveedores de obra (base heredada de HubSpot / CRM Lovable).
export default function Gremios() {
  const [lista, setLista] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [rubro, setRubro] = useState("");

  const cargar = () => supabase.from("crm_gremios").select("*").order("rubro").order("nombre").then(({ data }) => setLista(data || []));
  useEffect(() => { cargar(); }, []);

  const rubros = useMemo(() => [...new Set(lista.map((g) => g.rubro || "Sin clasificar"))].sort(), [lista]);
  const vis = lista.filter((g) => (!rubro || (g.rubro || "Sin clasificar") === rubro) && (!q || [g.nombre, g.rubro, g.notas].some((v) => v?.toLowerCase().includes(q.toLowerCase()))));

  const calificar = async (g: any, n: number) => {
    setLista((l) => l.map((x) => (x.id === g.id ? { ...x, calificacion: n } : x)));
    await supabase.from("crm_gremios").update({ calificacion: n }).eq("id", g.id);
  };
  const nuevo = async () => {
    const nombre = prompt("Nombre del gremio o proveedor"); if (!nombre) return;
    const r = prompt("Rubro (albañilería, electricidad, plomería…)") || null;
    const tel = prompt("Teléfono") || null;
    const { error } = await supabase.from("crm_gremios").insert({ nombre, rubro: r, telefono: tel, fuente: "Carga manual" });
    if (error) alert(error.message.includes("duplicate") ? "Ya hay un gremio con ese teléfono." : error.message); else cargar();
  };

  return (
    <>
      <div className="cabecera">
        <div><h1>Gremios</h1><p className="sub">{lista.length} gremios y proveedores de obra. El rubro se asignó por palabras clave del nombre: corregilo cuando lo uses.</p></div>
        <button className="primario" onClick={nuevo}>+ Nuevo gremio</button>
      </div>
      <div className="filtros">
        <input type="search" placeholder="Buscar nombre o rubro" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={rubro} onChange={(e) => setRubro(e.target.value)} aria-label="Rubro">
          <option value="">Todos los rubros</option>
          {rubros.map((r) => <option key={r} value={r}>{r} ({lista.filter((g) => (g.rubro || "Sin clasificar") === r).length})</option>)}
        </select>
      </div>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Nombre</th><th>Rubro</th><th>Teléfono</th><th>Calificación</th><th></th></tr></thead>
          <tbody>
            {vis.map((g) => {
              const wa = waLink(g.telefono);
              return (
                <tr key={g.id}>
                  <td><strong>{g.nombre}</strong>{g.email && <><br /><small className="sub">{g.email}</small></>}</td>
                  <td>
                    <select className="chico" value={g.rubro || ""} onChange={async (e) => { const v = e.target.value || null; setLista((l) => l.map((x) => (x.id === g.id ? { ...x, rubro: v } : x))); await supabase.from("crm_gremios").update({ rubro: v }).eq("id", g.id); }}>
                      <option value="">Sin clasificar</option>
                      {rubros.filter((r) => r !== "Sin clasificar").map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{g.telefono || "—"}</td>
                  <td>{[1, 2, 3, 4, 5].map((n) => <button key={n} className="link" aria-label={`${n} de 5`} style={{ color: (g.calificacion || 0) >= n ? "var(--naranja)" : "var(--linea)", fontSize: 16, padding: 0 }} onClick={() => calificar(g, n)}>★</button>)}</td>
                  <td>{wa && <a href={wa} target="_blank" rel="noreferrer"><button className="chico">WhatsApp</button></a>}</td>
                </tr>
              );
            })}
            {!vis.length && <tr><td colSpan={5} className="sub">Ningún gremio coincide con la búsqueda.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
