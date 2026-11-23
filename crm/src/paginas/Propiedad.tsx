import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fecha, supabase, usd, etiqueta, hoyBA } from "../config";
import { puedeOperar, useYo } from "../main";
import Difusion from "../componentes/Difusion";
import Obra from "../componentes/Obra";
import GenerarOferta from "../componentes/GenerarOferta";
import { ESTRATEGIAS, ETAPAS_PROP, PARAM_DEF, analisis, reparto, scoreInversor, type Parametros, type Propiedad as P } from "../negocio";

const pct = (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);

export default function Propiedad() {
  const { id } = useParams();
  const yo = useYo();
  const puede = puedeOperar(yo, "inmobiliaria") || puedeOperar(yo, "desarrolladora");
  const puedeInv = puedeOperar(yo, "desarrolladora");
  const [p, setP] = useState<P | null>(null);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [presentados, setPresentados] = useState<any[]>([]);
  const [inversores, setInversores] = useState<any[]>([]);
  const [par, setPar] = useState<Parametros>(PARAM_DEF);
  const [compraEval, setCompraEval] = useState<string>("");
  const [nuevaOferta, setNuevaOferta] = useState<{ fecha: string; monto: string } | null>(null);

  const cargar = async () => {
    const [a, o, pi, prm] = await Promise.all([
      supabase.from("crm_propiedades").select("*").eq("id", id).single(),
      supabase.from("crm_ofertas").select("*").eq("propiedad_id", id).order("fecha", { ascending: false }),
      supabase.from("crm_propiedad_inversores").select("*, crm_contacts(nombre,telefono)").eq("propiedad_id", id),
      supabase.from("crm_parametros").select("*"),
    ]);
    setP(a.data); setOfertas(o.data || []); setPresentados(pi.data || []);
    if (prm.data?.length) setPar({ ...PARAM_DEF, ...Object.fromEntries(prm.data.map((x: any) => [x.clave, Number(x.valor)])) });
  };
  useEffect(() => {
    cargar();
    supabase.from("crm_contact_profiles").select("contact_id, crm_contacts(nombre,barrio)").eq("perfil", "vendedor_motivado").limit(3000).then(({ data }) => setVendedores(data || []));
    supabase.from("crm_organizaciones").select("id,nombre").order("nombre").then(({ data }) => setOrgs(data || []));
    (async () => {
      const [pr, rel, comp] = await Promise.all([
        supabase.from("crm_contact_profiles").select("contact_id,datos,crm_contacts(nombre,telefono)").eq("perfil", "inversor"),
        supabase.from("crm_relations").select("contact_id,estado").eq("embudo", "inversores"),
        supabase.from("crm_propiedad_inversores").select("contact_id,propiedad_id,estado").eq("estado", "comprometido"),
      ]);
      setInversores((pr.data || []).map((x: any) => ({
        ...x, estado: rel.data?.find((r: any) => r.contact_id === x.contact_id)?.estado || "prospecto",
        comprometido_en_otra: (comp.data || []).some((c: any) => c.contact_id === x.contact_id && c.propiedad_id !== id),
      })));
    })();
  }, [id]);

  const guardar = async (cambios: Partial<P>) => {
    setP((x) => (x ? { ...x, ...cambios } : x));
    const { error } = await supabase.from("crm_propiedades").update({ ...cambios, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) alert("No tenés permiso para editar propiedades.");
  };
  const num = (v: string) => (v === "" ? null : Number(v));

  const compra = compraEval ? Number(compraEval) : ofertas[0]?.monto_usd ?? null;
  const a = useMemo(() => (p ? analisis(p, compra) : null), [p, compra]);
  const rep = useMemo(() => (p ? reparto(p, par) : null), [p, par]);
  const necesidad = (compra || 0) + Number(p?.costo_obra_usd || 0);
  const sugeridos = useMemo(() => p ? inversores
    .filter((i) => !presentados.some((x) => x.contact_id === i.contact_id))
    .map((i) => ({ ...i, ...scoreInversor(i, p, necesidad) }))
    .sort((x, y) => y.score - x.score).slice(0, 8) : [], [inversores, presentados, p, necesidad]);

  if (!p || !a || !rep) return <div className="cargando">Cargando…</div>;

  const Campo = ({ label, k, tipo = "text", opciones }: { label: string; k: keyof P; tipo?: string; opciones?: [string, string][] }) => (
    <label className="campo chico">{label}
      {opciones ? (
        <select disabled={!puede} value={(p[k] as any) ?? ""} onChange={(e) => guardar({ [k]: e.target.value || null } as any)}>
          <option value="">—</option>{opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      ) : (
        <input disabled={!puede} type={tipo} defaultValue={(p[k] as any) ?? ""} onBlur={(e) => { const v = tipo === "number" ? num(e.target.value) : e.target.value || null; if (v !== p[k]) guardar({ [k]: v } as any); }} />
      )}
    </label>
  );

  const registrarOferta = async () => {
    if (!nuevaOferta?.monto) return;
    const { error } = await supabase.from("crm_ofertas").insert({ fecha: nuevaOferta.fecha, direccion: p.direccion, barrio: p.barrio, localidad: p.localidad, monto_usd: Number(nuevaOferta.monto), propiedad_id: p.id, responsable: yo.clave, estado: "enviada", etapa_loacc: "O", contact_id: p.vendedor_contact_id });
    if (error) return alert(error.message);
    if (p.etapa_loacc === "L") await guardar({ etapa_loacc: "O" });
    setNuevaOferta(null); cargar();
  };
  const presentar = async (contactId: string, score: number) => {
    const { error } = await supabase.from("crm_propiedad_inversores").insert({ propiedad_id: p.id, contact_id: contactId, score_match: score, esquema: "a_definir" });
    if (error) return alert("Solo la desarrolladora puede presentar inversores.");
    await supabase.from("crm_activities").insert({ contact_id: contactId, unidad: "desarrolladora", tipo: "nota", autor: yo.clave, detalle: { texto: `Presentado para ${p.direccion}` } });
    cargar();
  };
  const actPres = async (x: any, cambios: any) => { await supabase.from("crm_propiedad_inversores").update({ ...cambios, updated_at: new Date().toISOString() }).eq("propiedad_id", p.id).eq("contact_id", x.contact_id); cargar(); };

  const superaMao = a.mao != null && compra != null && compra > a.mao;

  return (
    <>
      <Link to="/propiedades">← Propiedades</Link>
      <div className="cabecera" style={{ marginTop: 10 }}>
        <div><h1>{p.direccion}</h1><p className="sub">{[p.barrio, p.localidad].filter(Boolean).join(", ")} · alta {fecha(p.created_at)}</p></div>
        <div className="fila">
          <select disabled={!puede} value={p.etapa_loacc} onChange={(e) => guardar({ etapa_loacc: e.target.value })}>{Object.entries(ETAPAS_PROP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select disabled={!puede} value={p.estrategia} onChange={(e) => guardar({ estrategia: e.target.value })}>{Object.entries(ESTRATEGIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          {p.drive_url && <a href={p.drive_url} target="_blank" rel="noreferrer"><button>Documento</button></a>}
        </div>
      </div>
      {p.ocupacion === "ocupante_conflicto" && <p className="aviso">Ocupada con conflicto: CIRE no compra en esta condición. Derivar a gestión legal.</p>}

      <div className="ficha">
        <div>
          <div className="tarjeta">
            <h2>Datos del inmueble</h2>
            <div className="grilla-campos">
              {Campo({ label: "Barrio", k: "barrio" })}
              {Campo({ label: "Localidad", k: "localidad" })}
              {Campo({ label: "Tipo", k: "tipo", opciones: [["departamento", "Departamento"], ["ph", "PH"], ["casa", "Casa"], ["local", "Local"], ["terreno", "Terreno"], ["otro", "Otro"]] })}
              {Campo({ label: "Ambientes", k: "ambientes", tipo: "number" })}
              {Campo({ label: "m² cubiertos", k: "m2_cubiertos", tipo: "number" })}
              {Campo({ label: "m² totales", k: "m2_totales", tipo: "number" })}
              {Campo({ label: "Estado físico", k: "estado_fisico", opciones: [["a_estrenar", "A estrenar"], ["buen_estado", "Buen estado"], ["necesita_reforma", "Necesita reforma"], ["deteriorada", "Deteriorada"]] })}
              {Campo({ label: "Ocupación", k: "ocupacion", opciones: [["vacia", "Vacía"], ["dueño", "La habita el dueño"], ["inquilino", "Inquilino"], ["ocupante_conflicto", "Ocupante con conflicto"]] })}
              {Campo({ label: "Situación", k: "situacion" })}
              {Campo({ label: "Precio pedido (USD)", k: "precio_pedido_usd", tipo: "number" })}
            </div>
            <label className="campo chico">Vendedor
              <select disabled={!puede} value={p.vendedor_contact_id || ""} onChange={(e) => guardar({ vendedor_contact_id: e.target.value || null })}>
                <option value="">—</option>
                {vendedores.map((v: any) => <option key={v.contact_id} value={v.contact_id}>{v.crm_contacts?.nombre}{v.crm_contacts?.barrio ? ` (${v.crm_contacts.barrio})` : ""}</option>)}
              </select>
            </label>
            {p.vendedor_contact_id && <Link to={`/contactos/${p.vendedor_contact_id}`} className="chico">Ver ficha del vendedor →</Link>}
            <label className="campo chico">La trajo la inmobiliaria
              <select disabled={!puede} value={p.organizacion_id || ""} onChange={(e) => guardar({ organizacion_id: e.target.value || null })}>
                <option value="">— Directo (sin inmobiliaria)</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
            </label>
            {Campo({ label: "Prospectó (quién consiguió el dato)", k: "prospecto_por" })}
            <label className="campo chico">Notas<textarea disabled={!puede} defaultValue={p.notas || ""} onBlur={(e) => e.target.value !== (p.notas || "") && guardar({ notas: e.target.value || null })} /></label>
          </div>

          <div className="tarjeta" style={{ marginTop: 16 }}>
            <h2>Reparto comercial <small>Calculadora de Deal</small></h2>
            <div className="grilla-campos">
              {Campo({ label: "Operación", k: "operacion", opciones: [["wholesale", "Wholesale (fee de asignación)"], ["flip", "Venta inventario propio (flip)"], ["corretaje", "Venta por corretaje (tercero)"]] })}
              {Campo({ label: "Precio de la operación (USD)", k: "precio_operacion_usd", tipo: "number" })}
              {p.operacion === "wholesale" && <>{Campo({ label: "% wholesale", k: "wholesale_pct", tipo: "number" })}{Campo({ label: "Fee mínimo (USD)", k: "wholesale_fee_min_usd", tipo: "number" })}</>}
              {p.operacion === "corretaje" && <>{Campo({ label: "% punta vendedora", k: "punta_vendedora_pct", tipo: "number" })}{Campo({ label: "% punta compradora", k: "punta_compradora_pct", tipo: "number" })}{Campo({ label: "Puntas que cobra CIRE", k: "puntas", opciones: [["ambas", "Ambas"], ["vendedora", "Solo vendedora"], ["compradora", "Solo compradora"]] })}</>}
              {p.operacion === "flip" && Campo({ label: "% honorario nocional", k: "honorario_nocional_pct", tipo: "number" })}
              {Campo({ label: "Comercial", k: "comercial" })}
              {Campo({ label: "Instancia más avanzada lograda", k: "instancia", opciones: [["prospeccion", `Prospección (${par.tasa_prospeccion * 100}%)`], ["captacion", `Captación / reserva (${par.tasa_captacion * 100}%)`], ["cierre", `Cierre / escritura (${par.tasa_cierre * 100}%)`]] })}
            </div>
            {rep.bruto > 0 ? (
              <table className="resumen">
                <tbody>
                  <tr><td>Ingreso bruto de CIRE</td><td>{usd(Math.round(rep.bruto))}</td></tr>
                  <tr><td>Comisión de la comercial ({pct(rep.tasa)})</td><td>{usd(Math.round(rep.comision))}</td></tr>
                  <tr><td>Gasto matrícula ({pct(par.gasto_matricula)} del remanente)</td><td>{usd(Math.round(rep.matricula))}</td></tr>
                  <tr><td>Gasto marketing</td><td>{usd(rep.mkt)}</td></tr>
                  <tr className="total"><td>Neto final para CIRE</td><td>{usd(Math.round(rep.neto))}</td></tr>
                </tbody>
              </table>
            ) : <p className="sub chico">Elegí la operación y el precio para ver el reparto.</p>}
            <p className="sub chico">Una sola tasa por operación (la de la instancia más avanzada), no acumulable. Valores orientativos, a validar con profesional matriculado (matrícula, abogado y contador).</p>
          </div>
        </div>

        <div>
          <div className="tarjeta">
            <h2>Análisis del negocio <small>escenario proyectado, sujeto a validación</small></h2>
            <div className="grilla-campos">
              {Campo({ label: "Precio de venta estimado después de obra (ARV)", k: "arv_usd", tipo: "number" })}
              {Campo({ label: "Costo de obra (USD)", k: "costo_obra_usd", tipo: "number" })}
              {Campo({ label: "Gastos: escritura, comisiones, tenencia (USD)", k: "gastos_usd", tipo: "number" })}
              {Campo({ label: "Factor de oferta máxima", k: "factor_mao", tipo: "number" })}
            </div>
            <label className="campo chico">Precio de compra a evaluar (por defecto, la última oferta)
              <input type="number" placeholder={ofertas[0] ? String(ofertas[0].monto_usd) : "USD"} value={compraEval} onChange={(e) => setCompraEval(e.target.value)} />
            </label>
            <div className="metricas">
              <div><span>Oferta máxima</span><b>{a.mao != null ? usd(a.mao) : "—"}</b><small>ARV × {p.factor_mao} − obra − gastos</small></div>
              <div><span>Inversión total</span><b>{a.inversion != null ? usd(a.inversion) : "—"}</b><small>compra + obra + gastos</small></div>
              <div><span>Ganancia estimada</span><b className={a.ganancia != null && a.ganancia < 0 ? "alerta" : ""}>{a.ganancia != null ? usd(a.ganancia) : "—"}</b><small>ARV − inversión</small></div>
              <div><span>Rentabilidad estimada</span><b>{a.roi != null ? pct(a.roi) : "—"}</b><small>ganancia / inversión</small></div>
            </div>
            {superaMao && <p className="aviso">La compra evaluada ({usd(compra)}) supera la oferta máxima ({usd(a.mao)}) por {usd((compra || 0) - (a.mao || 0))}.</p>}
            {a.mao == null && <p className="sub chico">Cargá el ARV, la obra y los gastos para calcular la oferta máxima.</p>}
          </div>

          <div className="tarjeta" style={{ marginTop: 16 }}>
            <h2>Ofertas <small>{ofertas.length}</small></h2>
            {ofertas.map((o) => (
              <div className="item" key={o.id}>
                <div className="item-txt"><span className="item-nombre">{usd(o.monto_usd)}</span><small className="sub">{fecha(o.fecha + "T12:00")} · {etiqueta(o.estado)}{o.respuesta ? ` · ${o.respuesta}` : ""}</small></div>
                <div className="item-acc">{o.doc_url && <a href={o.doc_url} target="_blank" rel="noreferrer"><button className="chico">Documento</button></a>}</div>
              </div>
            ))}
            {puede && (nuevaOferta ? (
              <div className="fila" style={{ marginTop: 8 }}>
                <input type="date" value={nuevaOferta.fecha} onChange={(e) => setNuevaOferta({ ...nuevaOferta, fecha: e.target.value })} />
                <input type="number" placeholder="Monto USD" value={nuevaOferta.monto} onChange={(e) => setNuevaOferta({ ...nuevaOferta, monto: e.target.value })} />
                <button className="primario" onClick={registrarOferta}>Guardar</button><button onClick={() => setNuevaOferta(null)}>Cancelar</button>
              </div>
            ) : <button className="chico" style={{ marginTop: 8 }} onClick={() => setNuevaOferta({ fecha: hoyBA(), monto: a.mao ? String(a.mao) : "" })}>+ Registrar oferta</button>)}
            {puede && <div style={{ marginTop: 10 }}><GenerarOferta propiedadId={p.id} montoSugerido={a.mao ?? ofertas[0]?.monto_usd} alCrear={cargar} /></div>}
          </div>

          <div className="tarjeta" style={{ marginTop: 16 }}>
            <h2>Inversores <small>presentados y sugeridos</small></h2>
            {presentados.map((x) => (
              <div className="item" key={x.contact_id}>
                <div className="item-txt"><Link to={`/contactos/${x.contact_id}`} className="item-nombre">{x.crm_contacts?.nombre}</Link><small className="sub">coincidencia {x.score_match ?? "—"}/100</small></div>
                <div className="item-acc">
                  <select disabled={!puedeInv} value={x.estado} onChange={(e) => actPres(x, { estado: e.target.value })}>{["presentado", "interesado", "comprometido", "invirtio", "descartado"].map((s) => <option key={s} value={s}>{etiqueta(s)}</option>)}</select>
                  <select disabled={!puedeInv} value={x.esquema || "a_definir"} onChange={(e) => actPres(x, { esquema: e.target.value })}>{[["a_definir", "Esquema a definir"], ["participacion", "Participación societaria"], ["prestamo_hipotecario", "Préstamo con garantía hipotecaria"], ["compra_directa", "Compra directa"]].map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  <input disabled={!puedeInv} type="number" placeholder="USD" defaultValue={x.monto_usd || ""} onBlur={(e) => actPres(x, { monto_usd: e.target.value ? Number(e.target.value) : null })} style={{ width: 100 }} />
                </div>
              </div>
            ))}
            <h3>Sugeridos por coincidencia</h3>
            {sugeridos.map((s) => (
              <div className="item" key={s.contact_id}>
                <div className="item-txt"><Link to={`/contactos/${s.contact_id}`} className="item-nombre">{s.crm_contacts?.nombre}</Link>
                  <small className="sub">{s.score}/100 · {s.detalle.join(", ") || "sin coincidencias"}{s.datos?.capital ? ` · capital ${s.datos.capital}` : ""}</small></div>
                <div className="item-acc">{puedeInv && <button className="chico" onClick={() => presentar(s.contact_id, s.score)}>Presentar</button>}</div>
              </div>
            ))}
            {!sugeridos.length && <p className="sub">No hay inversores cargados para cruzar.</p>}
            <p className="sub chico">Puntaje: barrio +40, activo +20, capital suficiente +15, sin otro compromiso +15, experiencia +10. No constituye oferta pública.</p>
          </div>
          <Difusion p={p} />
          {(p.estrategia === "flip" || p.etapa_loacc === "C2" || p.operacion === "flip") && <Obra propiedadId={p.id} puede={puedeInv} />}
        </div>
      </div>
    </>
  );
}
