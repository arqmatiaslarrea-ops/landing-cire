import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, hoyBA, traerTodo } from "../config";
import { puedeOperar, useMarca, useYo } from "../main";
import { Estrella } from "./PanelRanka";

// Finanzas de Ranka: caja, reserva de overhead en orden de recorte, cuentas por cobrar y movimientos.
// Reemplaza al panel "Reserva de Overhead Ranka" y a la carga manual en la planilla. Moneda: ARS.
const TIPOS: { t: string; s: 1 | -1 | 0 }[] = [
  { t: "Cobro de cliente", s: 1 }, { t: "Pago a proveedor", s: -1 }, { t: "Gasto de estructura", s: -1 }, { t: "Sueldo", s: -1 },
  { t: "Pauta de terceros — entra", s: 1 }, { t: "Pauta de terceros — sale", s: -1 }, { t: "Devolución a cliente", s: -1 },
  { t: "Aporte de capital", s: 1 }, { t: "Retiro de socio", s: -1 }, { t: "Movimiento interno", s: 0 },
];
const CATEGORIAS = ["Fee de cliente", "Producción", "Implementación de campañas", "Edición de video", "Diseño", "Sueldo", "Pauta propia", "Pauta de cliente", "Suite de IA — 3 asientos", "Hosting, dominios y landings", "Automatización y CRM", "Google Workspace — 3 usuarios", "Contador y gestoría", "Carga fiscal — monotributo", "Movilidad y viáticos", "Canva equipo", "Otros"];
const GRUPOS = [
  { t: "Se recorta primero", d: "Nadie afuera lo nota. Es el margen real de maniobra.", c: "g0" },
  { t: "Duele pero se puede", d: "Baja la capacidad de producción propia, no el servicio contratado.", c: "g1" },
  { t: "Compromete clientes", d: "Recortar acá es una decisión comercial, no financiera.", c: "g2" },
  { t: "Intocable", d: "Sin esto la agencia deja de funcionar o entra en deuda.", c: "g3" },
];
const FUERA_RESULTADO = new Set(["Pauta de terceros — entra", "Pauta de terceros — sale", "Aporte de capital", "Retiro de socio", "Movimiento interno"]);
const ars = (n: number) => (n < 0 ? "−" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("es-AR");
const hoyISO = () => hoyBA();
const mesDe = (f: string) => f.slice(0, 7);
const nombreMes = (m: string) => new Date(m + "-15").toLocaleDateString("es-AR", { month: "long", year: "numeric" });

export default function FinanzasRanka() {
  useMarca("ranka");
  const yo = useYo();
  const opera = puedeOperar(yo, "ranka");
  const [cfg, setCfg] = useState<any>(null);
  const [partidas, setPartidas] = useState<any[]>([]);
  const [movs, setMovs] = useState<any[]>([]);
  const [cobros, setCobros] = useState<any[]>([]);
  const [cortadas, setCortadas] = useState<Set<string>>(new Set());
  const [mes, setMes] = useState("");
  const [cliente, setCliente] = useState("");
  const [msg, setMsg] = useState("");
  const [clientes, setClientes] = useState<string[]>([]);
  const vacio = { fecha: hoyISO(), tipo: "Cobro de cliente", bolsillo: "Ualá", contraparte: "", cliente: "", categoria: "Fee de cliente", monto: "", descripcion: "" };
  const [f, setF] = useState(vacio);

  const cargar = async () => {
    const [c, p, m, k, cl] = await Promise.all([
      supabase.from("crm_ranka_config").select("*").maybeSingle(),
      supabase.from("crm_ranka_partidas").select("*").order("orden"),
      traerTodo(() => supabase.from("crm_ranka_movimientos").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false })),
      supabase.from("crm_ranka_cobros").select("*").order("created_at"),
      supabase.from("crm_vista_relaciones").select("empresa,nombre").eq("embudo", "clientes_ranka").eq("etapa", "cliente"),
    ]);
    setCfg(c.data); setPartidas(p.data || []); setMovs(m.data || []); setCobros(k.data || []);
    setClientes([...new Set([...(cl.data || []).map((x: any) => x.empresa || x.nombre), ...(m.data || []).map((x: any) => x.cliente).filter(Boolean)])].filter((x) => x && x !== "Ranka" && x !== "Varios").sort());
  };
  useEffect(() => { cargar(); }, []);

  // Caja por bolsillo: Ualá arranca del saldo validado; Mercado Pago y efectivo se muestran por lo que se movió
  const desdeApertura = movs.filter((m) => cfg && m.fecha >= cfg.fecha_apertura);
  const neto = (b: string) => desdeApertura.filter((m) => m.bolsillo === b).reduce((a, m) => a + m.monto * m.signo, 0);
  const cajaUala = (cfg?.saldo_apertura || 0) + neto("Ualá");
  const custodia = (cfg?.custodia_apertura || 0) + desdeApertura.filter((m) => m.tipo.startsWith("Pauta de terceros")).reduce((a, m) => a + m.monto * m.signo, 0);
  const overheadTotal = partidas.reduce((a, p) => a + Number(p.monto), 0);
  const overhead = overheadTotal - partidas.filter((p) => cortadas.has(p.id)).reduce((a, p) => a + Number(p.monto), 0);
  const libre = cajaUala + neto("Efectivo") - custodia - overhead;
  const abiertos = cobros.filter((c) => c.estado === "a_cobrar" || c.estado === "vencido");
  const porCobrar = abiertos.reduce((a, c) => a + Number(c.monto), 0);
  const vencido = abiertos.filter((c) => c.estado === "vencido").reduce((a, c) => a + Number(c.monto), 0);

  const meses = useMemo(() => [...new Set(movs.map((m) => mesDe(m.fecha)))].sort().reverse(), [movs]);
  const mesActual = mes || meses[0] || mesDe(hoyISO());
  const delMes = movs.filter((m) => mesDe(m.fecha) === mesActual && !FUERA_RESULTADO.has(m.tipo));
  const ingresos = delMes.filter((m) => m.signo > 0).reduce((a, m) => a + Number(m.monto), 0);
  const egresos = delMes.filter((m) => m.signo < 0).reduce((a, m) => a + Number(m.monto), 0);

  const porCliente = useMemo(() => {
    const t: Record<string, { ing: number; cost: number }> = {};
    movs.filter((m) => m.cliente && !["Ranka", "Varios"].includes(m.cliente) && !FUERA_RESULTADO.has(m.tipo) && (!mes || mesDe(m.fecha) === mes)).forEach((m) => {
      t[m.cliente] = t[m.cliente] || { ing: 0, cost: 0 };
      if (m.signo > 0) t[m.cliente].ing += Number(m.monto); else t[m.cliente].cost += Number(m.monto);
    });
    return Object.entries(t).sort((a, b) => b[1].ing - b[1].cost - (a[1].ing - a[1].cost));
  }, [movs, mes]);

  const vis = movs.filter((m) => (!mes || mesDe(m.fecha) === mes) && (!cliente || m.cliente === cliente));

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(String(f.monto).replace(/\D/g, ""));
    if (!f.contraparte.trim() || !monto) { setMsg("Completá la contraparte y el monto."); return; }
    const signo = TIPOS.find((t) => t.t === f.tipo)?.s ?? 1;
    const { error } = await supabase.from("crm_ranka_movimientos").insert({ ...f, contraparte: f.contraparte.trim(), cliente: f.cliente || null, descripcion: f.descripcion || null, monto, signo, cargado_por: yo.clave, origen: "Carga en el CRM" });
    if (error) { setMsg("No se pudo guardar: " + error.message); return; }
    setF({ ...vacio, fecha: f.fecha, bolsillo: f.bolsillo }); setMsg("Registrado. Lo ven los tres socios."); cargar();
  };
  const borrar = async (m: any) => {
    if (!window.confirm(`¿Borrar el movimiento de ${ars(m.monto)} con ${m.contraparte}?`)) return;
    await supabase.from("crm_ranka_movimientos").delete().eq("id", m.id); cargar();
  };
  const cobrar = async (c: any) => {
    const { data, error } = await supabase.from("crm_ranka_movimientos").insert({ fecha: hoyISO(), tipo: "Cobro de cliente", bolsillo: "Ualá", contraparte: c.cliente, cliente: c.cliente, categoria: "Fee de cliente", descripcion: c.concepto, monto: c.monto, signo: 1, cargado_por: yo.clave, origen: "Cobro de cuenta por cobrar" }).select("id").single();
    if (error) { setMsg(error.message); return; }
    await supabase.from("crm_ranka_cobros").update({ estado: "cobrado", movimiento_id: data.id }).eq("id", c.id); cargar();
  };
  const cambiarEstado = async (c: any, estado: string) => { await supabase.from("crm_ranka_cobros").update({ estado }).eq("id", c.id); cargar(); };
  const [nuevoCobro, setNuevoCobro] = useState<{ cliente: string; concepto: string; monto: string } | null>(null);
  const crearCobro = async () => {
    if (!nuevoCobro?.cliente || !nuevoCobro.concepto || !Number(nuevoCobro.monto.replace(/\D/g, ""))) return;
    await supabase.from("crm_ranka_cobros").insert({ cliente: nuevoCobro.cliente, concepto: nuevoCobro.concepto, monto: Number(nuevoCobro.monto.replace(/\D/g, "")), estado: "a_cobrar" });
    setNuevoCobro(null); cargar();
  };

  if (!opera) return <div className="rk-tarjeta"><h1>Finanzas de Ranka</h1><p className="sub">Esta sección es de los socios de Ranka.</p></div>;

  return (
    <div className="rk">
      <div className="cabecera">
        <div>
          <div className="rk-marca"><span>RANKA</span><Estrella tam={16} /></div>
          <h1 style={{ marginTop: 10 }}>Finanzas</h1>
          <p className="sub">Cuánta plata hay y de quién es, qué está reservado para sostener la agencia y qué queda libre. Cada movimiento que cargan lo ven los tres socios.</p>
        </div>
        <Link to="/ranka" className="boton">Volver al panel</Link>
      </div>

      <div className="fz-tiles">
        <div><span>Caja en Ualá</span><b>{ars(cajaUala)}</b><small>Apertura validada al {cfg && new Date(cfg.fecha_apertura + "T12:00").toLocaleDateString("es-AR")} más lo cargado</small></div>
        <div><span>Terceros en custodia</span><b>{ars(custodia)}</b><small>Pauta y anticipos de clientes: no es plata de Ranka</small></div>
        <div><span>Reserva de overhead</span><b>{ars(overhead)}</b><small>Un mes de agencia abierta{cortadas.size ? " (con recortes simulados)" : ""}</small></div>
        <div className={libre < 0 ? "rojo" : "lima"}><span>Libre después de todo</span><b>{ars(libre)}</b><small>Lo único que se puede usar para otra cosa</small></div>
        <div><span>Por cobrar</span><b>{ars(porCobrar)}</b><small className={vencido ? "alerta" : ""}>{vencido ? `${ars(vencido)} vencidos` : "Nada vencido"}</small></div>
      </div>

      <div className="rk-columnas">
        <section className="rk-tarjeta">
          <div className="rk-tarjeta-cab"><h2>Reserva de overhead, en orden de recorte</h2><small className="sub">Tocá "Recortar" para simular. No se guarda.</small></div>
          <div className="fz-oh">
            {partidas.map((p) => (
              <div key={p.id} className={`fz-oh-fila ${GRUPOS[p.grupo].c} ${cortadas.has(p.id) ? "off" : ""}`}>
                <span className="fz-ord">{p.orden}</span>
                <div><strong>{p.nombre}</strong><small>{p.descripcion}</small></div>
                <b>{ars(Number(p.monto))}</b>
                <button className="chico" onClick={() => setCortadas((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}>{cortadas.has(p.id) ? "Reponer" : "Recortar"}</button>
              </div>
            ))}
          </div>
          <div className="fz-grupos">
            {GRUPOS.map((g, i) => <div key={g.t} className={g.c}><span>{g.t}</span><b>{ars(partidas.filter((p) => p.grupo === i).reduce((a, p) => a + Number(p.monto), 0))}</b><small>{g.d}</small></div>)}
          </div>
        </section>

        <section className="rk-tarjeta">
          <div className="rk-tarjeta-cab"><h2>Cuentas por cobrar</h2><button className="chico" onClick={() => setNuevoCobro({ cliente: "", concepto: "", monto: "" })}>+ Agregar</button></div>
          {nuevoCobro && (
            <div className="fz-nuevo">
              <input list="fz-clientes" placeholder="Cliente" value={nuevoCobro.cliente} onChange={(e) => setNuevoCobro({ ...nuevoCobro, cliente: e.target.value })} autoComplete="off" />
              <input placeholder="Concepto (ej.: fee noviembre)" value={nuevoCobro.concepto} onChange={(e) => setNuevoCobro({ ...nuevoCobro, concepto: e.target.value })} autoComplete="off" />
              <input placeholder="Monto" inputMode="numeric" value={nuevoCobro.monto} onChange={(e) => setNuevoCobro({ ...nuevoCobro, monto: e.target.value })} autoComplete="off" />
              <div className="fila"><button className="primario chico" onClick={crearCobro}>Guardar</button><button className="chico" onClick={() => setNuevoCobro(null)}>Cancelar</button></div>
            </div>
          )}
          {abiertos.map((c) => (
            <div key={c.id} className="item">
              <div className="item-txt">
                <span className="item-nombre">{c.cliente} · {ars(Number(c.monto))}</span>
                <small className={c.estado === "vencido" ? "alerta" : "sub"}>{c.estado === "vencido" ? "Vencido · " : ""}{c.concepto}</small>
                {c.nota && <small className="sub">{c.nota}</small>}
              </div>
              <div className="item-acc">
                <button className="chico primario" onClick={() => cobrar(c)}>Cobrado</button>
                {c.estado !== "vencido" && <button className="enlace chico" onClick={() => cambiarEstado(c, "vencido")}>Marcar vencido</button>}
              </div>
            </div>
          ))}
          {!abiertos.length && <p className="sub">No hay cobros pendientes.</p>}
          <p className="sub chico">Cargadas al 30/10 desde el control financiero. "Cobrado" registra el ingreso en la caja de Ualá con fecha de hoy.</p>
        </section>
      </div>

      <section className="rk-tarjeta">
        <div className="rk-tarjeta-cab"><h2>Cargar un movimiento</h2><small className="sub">Montos en pesos y en positivo: el tipo define si entra o sale.</small></div>
        <form className="fz-form" onSubmit={registrar} autoComplete="off">
          <label className="campo chico">Fecha<input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} required /></label>
          <label className="campo chico">Tipo<select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>{TIPOS.map((t) => <option key={t.t}>{t.t}</option>)}</select></label>
          <label className="campo chico">Bolsillo<select value={f.bolsillo} onChange={(e) => setF({ ...f, bolsillo: e.target.value })}><option>Ualá</option><option>Mercado Pago</option><option>Efectivo</option></select></label>
          <label className="campo chico">Contraparte<input placeholder="MAPRO, Tomi, Ualá…" value={f.contraparte} onChange={(e) => setF({ ...f, contraparte: e.target.value })} required /></label>
          <label className="campo chico">Cliente al que se imputa<input list="fz-clientes" placeholder="Ranka si es estructura" value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} /></label>
          <label className="campo chico">Categoría<select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="campo chico">Monto (ARS)<input inputMode="numeric" placeholder="0" value={f.monto} onChange={(e) => setF({ ...f, monto: e.target.value })} required /></label>
          <label className="campo chico fz-desc">Detalle<input placeholder="Opcional" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></label>
          <button className="primario" type="submit">Registrar</button>
          <datalist id="fz-clientes">{["Ranka", ...clientes].map((c) => <option key={c} value={c} />)}</datalist>
        </form>
        {msg && <p className="sub chico" role="status">{msg}</p>}
      </section>

      <div className="rk-columnas">
        <section className="rk-tarjeta">
          <div className="rk-tarjeta-cab"><h2>Resultado de {nombreMes(mesActual)}</h2><small className="sub">Sin pauta de terceros, aportes ni retiros</small></div>
          <div className="fz-res">
            <div><span>Entró</span><b>{ars(ingresos)}</b></div>
            <div><span>Salió</span><b>{ars(egresos)}</b></div>
            <div className={ingresos - egresos < 0 ? "neg" : "pos"}><span>Resultado de caja</span><b>{ars(ingresos - egresos)}</b></div>
          </div>
          <p className="sub chico">Es caja, no devengado: un fee que se cobra a mes vencido cae en el mes en que entra la plata.</p>
        </section>
        <section className="rk-tarjeta">
          <div className="rk-tarjeta-cab"><h2>Margen por cliente</h2><small className="sub">{mes ? nombreMes(mes) : "Desde que hay movimientos"}</small></div>
          <table className="rk-tabla fz-tabla">
            <thead><tr><th>Cliente</th><th className="num">Cobrado</th><th className="num">Costos directos</th><th className="num">Margen</th></tr></thead>
            <tbody>
              {porCliente.map(([c, v]) => <tr key={c}><td>{c}</td><td className="num">{ars(v.ing)}</td><td className="num">{ars(v.cost)}</td><td className={`num ${v.ing - v.cost < 0 ? "neg" : "pos"}`}>{ars(v.ing - v.cost)}</td></tr>)}
              {!porCliente.length && <tr><td colSpan={4} className="sub">Sin movimientos imputados a clientes.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      <section className="rk-tarjeta">
        <div className="rk-tarjeta-cab">
          <h2>Movimientos <small className="sub">{vis.length}</small></h2>
          <div className="fila">
            <select value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Mes"><option value="">Todos los meses</option>{meses.map((m) => <option key={m} value={m}>{nombreMes(m)}</option>)}</select>
            <select value={cliente} onChange={(e) => setCliente(e.target.value)} aria-label="Cliente"><option value="">Todos los clientes</option>{["Ranka", "Varios", ...clientes].map((c) => <option key={c}>{c}</option>)}</select>
          </div>
        </div>
        <div className="tabla-scroll">
          <table className="rk-tabla fz-tabla">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Contraparte</th><th>Cliente</th><th>Detalle</th><th className="num">Monto</th><th>Bolsillo</th><th></th></tr></thead>
            <tbody>
              {vis.map((m) => (
                <tr key={m.id} className={cfg && m.fecha < cfg.fecha_apertura ? "fz-previo" : ""}>
                  <td className="num">{new Date(m.fecha + "T12:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</td>
                  <td><span className="fz-pill">{m.tipo}</span></td>
                  <td>{m.contraparte}</td>
                  <td>{m.cliente || "—"}</td>
                  <td><small>{m.descripcion || m.categoria}</small></td>
                  <td className={`num ${m.signo > 0 ? "pos" : m.signo < 0 ? "neg" : ""}`}>{ars(m.monto * (m.signo || 1))}</td>
                  <td><small>{m.bolsillo}</small></td>
                  <td>{(yo.admin || m.cargado_por === yo.clave) && <button className="icono" onClick={() => borrar(m)} aria-label="Borrar movimiento" title="Borrar">✕</button>}</td>
                </tr>
              ))}
              {!vis.length && <tr><td colSpan={8} className="sub">No hay movimientos con estos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="sub chico">Importado: extracto de Ualá del 11/09 al 30/10 con la imputación por cliente ya resuelta. Lo anterior a la apertura del 06/09 ya está dentro del saldo de apertura.</p>
      </section>
    </div>
  );
}
