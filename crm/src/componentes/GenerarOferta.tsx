import { useState } from "react";
import { supabase } from "../config";

// Arma la oferta desde la plantilla única (reserva en comisión, firma Mati), la guarda en la carpeta de ofertas y la registra.
export default function GenerarOferta({ propiedadId, montoSugerido, alCrear }: { propiedadId: string; montoSugerido?: number | null; alCrear: () => void }) {
  const [f, setF] = useState<any | null>(null);
  const [estado, setEstado] = useState<{ cargando?: boolean; error?: string; url?: string }>({});

  const abrir = () => {
    const monto = montoSugerido ? Math.round(montoSugerido / 1000) * 1000 : "";
    setF({ fecha: new Date().toISOString().slice(0, 10), monto_usd: monto, reserva_usd: monto ? Math.max(1000, Math.round(Number(monto) * 0.01 / 500) * 500) : "", dias_contingencia: 10, plazo_escritura: 30, validez: 3, escribano: "", clausula_honorarios: "" });
    setEstado({});
  };
  const generar = async () => {
    setEstado({ cargando: true });
    const { data, error } = await supabase.functions.invoke("crm-oferta", { body: { ...f, propiedad_id: propiedadId, monto_usd: Number(f.monto_usd), reserva_usd: Number(f.reserva_usd || 0) } });
    if (error || data?.error) {
      let msg = data?.error || "No se pudo generar la oferta.";
      try { const b = await (error as any)?.context?.json(); if (b?.error) msg = b.error; } catch { /* sin cuerpo */ }
      return setEstado({ error: msg });
    }
    setEstado({ url: data.url }); alCrear();
  };
  const campo = (k: string, label: string, tipo = "text") => (
    <label className="campo chico">{label}<input type={tipo} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
  );

  return (
    <>
      <button className="chico primario" onClick={abrir}>Generar oferta en Drive</button>
      {f && (
        <div className="modal-fondo" onClick={() => setF(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cab"><h2>Generar oferta</h2><button className="icono" onClick={() => setF(null)} aria-label="Cerrar">✕</button></div>
            <p className="sub chico">Usa la plantilla única: reserva en comisión y firma de Matías. El documento queda en la carpeta de ofertas, vinculado a esta propiedad y en el plan 260 como borrador hasta que lo marques como enviada.</p>
            <div className="grilla-campos">
              {campo("fecha", "Fecha", "date")}
              {campo("monto_usd", "Monto ofertado (USD)", "number")}
              {campo("reserva_usd", "Reserva (USD)", "number")}
              {campo("dias_contingencia", "Contingencia de inspección (días)", "number")}
              {campo("plazo_escritura", "Plazo de escritura (días)", "number")}
              {campo("validez", "Validez (días hábiles)", "number")}
            </div>
            {campo("escribano", "Escribano (vacío: a designar por la compradora)")}
            <label className="campo chico">Cláusula de honorarios (vacío: a cargo de cada parte según usos y costumbres)<textarea rows={2} value={f.clausula_honorarios} onChange={(e) => setF({ ...f, clausula_honorarios: e.target.value })} /></label>
            <p className="sub chico">Cláusulas y montos a validar con profesional matriculado antes de enviar.</p>
            {estado.error && <p className="aviso">{estado.error}</p>}
            {estado.url ? (
              <div className="fila" style={{ justifyContent: "flex-end", marginTop: 12 }}><a href={estado.url} target="_blank" rel="noreferrer"><button className="primario">Abrir el documento</button></a></div>
            ) : (
              <div className="fila" style={{ justifyContent: "flex-end", marginTop: 12 }}><button className="primario" disabled={estado.cargando || !f.monto_usd} onClick={generar}>{estado.cargando ? "Generando…" : "Generar documento"}</button></div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
