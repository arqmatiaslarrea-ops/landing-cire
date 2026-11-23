import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fecha, supabase } from "../config";
import { useYo } from "../main";

// Bandeja de aprobación de las secuencias automáticas: las primeras 3 tandas de cada secuencia
// las revisa una persona; desde la 4.ª se envían solas.
export default function Envios() {
  const yo = useYo();
  const [secs, setSecs] = useState<any[]>([]);
  const [pend, setPend] = useState<any[]>([]);
  const [hist, setHist] = useState<any[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const cargar = async () => {
    const [s, p, h] = await Promise.all([
      supabase.from("crm_secuencias").select("id,nombre,activa,tandas_aprobadas,pasos,pasos_revisados"),
      supabase.from("crm_envios").select("*, crm_contacts(id,nombre), crm_inscripciones(secuencia_id)").eq("estado", "pendiente_aprobacion").order("created_at"),
      supabase.from("crm_envios").select("id,estado,asunto,destino,enviado_at,crm_contacts(id,nombre)").in("estado", ["enviado", "error", "descartado"]).order("created_at", { ascending: false }).limit(30),
    ]);
    setSecs(s.data || []); setPend(p.data || []); setHist(h.data || []);
  };
  useEffect(() => { cargar(); }, []);

  const aprobarTanda = async (secId: string) => {
    const ids = pend.filter((e) => e.crm_inscripciones?.secuencia_id === secId).map((e) => e.id);
    if (!ids.length) return;
    const { data, error } = await supabase.rpc("crm_aprobar_tanda", { p_secuencia: secId, p_ids: ids });
    if (error) return setMsg(error.message.includes("admin") ? "Solo un administrador aprueba tandas." : error.message);
    setMsg(`${data.aprobados} ${data.aprobados === 1 ? "mail sale" : "mails salen"} en los próximos 5 minutos.${data.cuenta ? " La tanda cuenta para el envío automático." : " Con menos de 3 mails la tanda no cuenta para el envío automático."}`);
    cargar();
  };
  const descartar = async (id: string) => {
    await supabase.from("crm_envios").update({ estado: "descartado" }).eq("id", id);
    cargar();
  };
  const pausar = async (s: any) => {
    const { error } = await supabase.from("crm_secuencias").update({ activa: !s.activa }).eq("id", s.id);
    if (error) setMsg("Solo un administrador puede pausar secuencias."); else cargar();
  };

  return (
    <>
      <div className="cabecera">
        <div><h1>Seguimiento automático</h1><p className="sub">Cada lead nuevo entra en una secuencia de mails. Las primeras 3 tandas (de 3 mails o más) de cada una las aprobás acá, y cada paso de la secuencia tiene que pasar por tu revisión al menos una vez; después salen solas. Si el contacto responde o registrás una gestión, la secuencia se pausa.</p></div>
      </div>
      {msg && <p className="aviso">{msg}</p>}

      <div className="grilla" style={{ marginBottom: 16 }}>
        {secs.map((s) => {
          const n = pend.filter((e) => e.crm_inscripciones?.secuencia_id === s.id).length;
          const revisados = (s.pasos_revisados || []).length, total = (s.pasos || []).length;
          const auto = s.tandas_aprobadas >= 3 && revisados >= total;
          return (
            <div className="tarjeta" key={s.id}>
              <h3 style={{ margin: "0 0 4px" }}>{s.nombre}</h3>
              <p className="sub" style={{ margin: 0 }}>{(s.pasos || []).length} mails · {auto ? "envío automático" : `${Math.min(s.tandas_aprobadas, 3)} de 3 tandas · ${revisados} de ${total} pasos revisados`}{!s.activa && " · pausada"}</p>
              <div className="barra"><i style={{ width: `${Math.min(100, (s.tandas_aprobadas / 3) * 100)}%` }} /></div>
              <div className="fila">
                {n > 0 ? <button className="primario" onClick={() => aprobarTanda(s.id)}>Aprobar {n} {n === 1 ? "mail" : "mails"}</button> : <span className="sub">Nada pendiente</span>}
                {n > 0 && <button onClick={() => setAbierto(abierto === s.id ? null : s.id)}>{abierto === s.id ? "Ocultar" : "Revisar"}</button>}
                {yo.admin && <button className="link" onClick={() => pausar(s)}>{s.activa ? "Pausar" : "Reactivar"}</button>}
              </div>
            </div>
          );
        })}
      </div>

      {abierto && (
        <div className="tarjeta panel">
          <h2>Mails a aprobar</h2>
          {pend.filter((e) => e.crm_inscripciones?.secuencia_id === abierto).map((e) => (
            <details key={e.id} className="item" style={{ display: "block" }}>
              <summary className="fila" style={{ justifyContent: "space-between", cursor: "pointer" }}>
                <span><Link to={`/contactos/${e.contact_id}`}>{e.crm_contacts?.nombre}</Link> <span className="sub">· paso {e.paso + 1} · {e.asunto}</span></span>
                <button className="link" onClick={(ev) => { ev.preventDefault(); descartar(e.id); }}>No enviar</button>
              </summary>
              <p className="sub" style={{ margin: "8px 0 0" }}>Para: {e.destino}</p>
              <div style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 6 }}>{e.cuerpo}</div>
            </details>
          ))}
        </div>
      )}

      <div className="tarjeta">
        <h2>Últimos envíos</h2>
        {!hist.length && <p className="sub">Todavía no salió ningún mail automático.</p>}
        {hist.map((e) => (
          <div className="item" key={e.id}>
            <div className="item-txt"><span className="item-nombre">{e.crm_contacts?.nombre}</span><span className="sub">{e.asunto}</span></div>
            <span className={e.estado === "error" ? "alerta" : "sub"}>{e.estado === "enviado" ? `Enviado ${fecha(e.enviado_at)}` : e.estado === "error" ? "No se pudo enviar" : "Descartado"}</span>
          </div>
        ))}
      </div>
    </>
  );
}
