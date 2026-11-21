import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, waLink } from "../config";
import { puedeOperar, useYo } from "../main";
import { nivelTemp } from "../componentes/Temperatura";

// Tanda diaria de WhatsApp asistida: el CRM arma la lista y el mensaje; la persona envía con un clic desde su WhatsApp.
// Sin envíos automáticos: así no se arriesga el número.
const ZONAS = ["Saavedra", "Coghlan", "Villa Urquiza", "Villa Pueyrredón", "Nuñez", "Belgrano", "Villa Ortúzar", "Colegiales", "Villa Devoto", "Villa del Parque", "Agronomía", "Parque Chas"];
const hoyISO = () => new Date().toISOString().slice(0, 10);
const nombre1 = (n: string) => (n || "").split(" ")[0].replace(/^\w/, (c) => c.toUpperCase());

export default function Tanda() {
  const yo = useYo();
  const [leads, setLeads] = useState<any[]>([]);
  const [inmos, setInmos] = useState<any[]>([]);
  const [hechos, setHechos] = useState<Set<string>>(new Set());
  const [zona, setZona] = useState(() => ZONAS[Math.floor(Date.now() / 864e5) % ZONAS.length]);
  const [cuantas, setCuantas] = useState(10);

  useEffect(() => {
    supabase.from("crm_vista_relaciones").select("id,contact_id,nombre,telefono,inm_direccion,inm_barrio,situacion,etapa,estado,temperatura,ultima_gestion,unidad")
      .eq("embudo", "vendedores_motivados").in("etapa", ["nuevo", "contactado", "descubrimiento"]).neq("estado", "descartado").not("telefono", "is", null).limit(2000)
      .then(({ data }) => setLeads((data || []).filter((r: any) => r.temperatura >= 30 && (!r.ultima_gestion || Date.now() - +new Date(r.ultima_gestion) > 5 * 864e5)).sort((a: any, b: any) => b.temperatura - a.temperatura).slice(0, 10)));
    supabase.from("crm_difusiones").select("contact_id,organizacion_id").eq("motivo", "tanda").gte("created_at", hoyISO())
      .then(({ data }) => setHechos(new Set((data || []).map((d: any) => d.contact_id || d.organizacion_id))));
  }, []);
  useEffect(() => {
    supabase.from("crm_organizaciones").select("id,nombre,barrio,whatsapp,estado_contacto").eq("barrio", zona).not("whatsapp", "is", null).eq("estado_contacto", "sin_contactar").order("propiedades_venta", { ascending: false, nullsFirst: false }).limit(cuantas)
      .then(({ data }) => setInmos(data || []));
  }, [zona, cuantas]);

  const msgLead = (r: any) => `Hola ${nombre1(r.nombre)}, ¿cómo estás? Soy Matías Larrea, de CIRE. Te escribo por la propiedad${r.inm_direccion ? ` de ${r.inm_direccion}` : ""} que nos dejaste en el formulario. ¿Seguís con ganas de venderla? Si te parece, coordinamos una llamada corta esta semana.`;
  const msgInmo = (o: any) => `Hola, ¿cómo están? Soy Matías Larrea de CIRE. Compramos PH y departamentos para reciclar en ${o.barrio}. Si tienen algo con alguna complicación (sucesión, deudas, mal estado o urgencia), lo analizamos en 48 h y respetamos honorarios. ¿Tienen algo así en cartera?`;

  const marcarLead = async (r: any) => {
    setHechos((s) => new Set(s).add(r.contact_id));
    await Promise.all([
      supabase.from("crm_difusiones").insert({ contact_id: r.contact_id, motivo: "tanda", canal: "whatsapp" }),
      supabase.from("crm_activities").insert({ contact_id: r.contact_id, unidad: r.unidad, tipo: "whatsapp", detalle: { resultado: "Mensaje de tanda enviado", texto: msgLead(r) } }),
      r.etapa === "nuevo" ? supabase.from("crm_relations").update({ etapa: "contactado" }).eq("id", r.id) : Promise.resolve(),
    ]);
  };
  const marcarInmo = async (o: any) => {
    setHechos((s) => new Set(s).add(o.id));
    await Promise.all([
      supabase.from("crm_difusiones").insert({ organizacion_id: o.id, motivo: "pedido_producto", canal: "whatsapp" }),
      supabase.from("crm_organizaciones").update({ estado_contacto: "contactada", ultimo_contacto: hoyISO() }).eq("id", o.id),
    ]);
  };
  const total = leads.length + inmos.length;
  const enviados = useMemo(() => leads.filter((r) => hechos.has(r.contact_id)).length + inmos.filter((o) => hechos.has(o.id)).length, [hechos, leads, inmos]);
  const opera = puedeOperar(yo, "inmobiliaria");

  return (
    <>
      <div className="cabecera">
        <div><h1>Tanda de WhatsApp</h1><p className="sub">La lista de hoy, con el mensaje listo. Tocás "Enviar", se abre tu WhatsApp con el texto, lo mandás y el CRM lo registra. De a uno, en horario laboral: así no se arriesga el número.</p></div>
      </div>
      <div className="tarjeta kpi" style={{ marginBottom: 16 }}>
        <div className="titulo">Avance de la tanda de hoy</div>
        <div className="valor">{enviados} <small>/ {total}</small></div>
        <div className="barra"><i style={{ width: `${total ? (enviados / total) * 100 : 0}%` }} /></div>
      </div>
      <div className="columnas-dia">
        <div className="tarjeta">
          <h2 style={{ marginTop: 0 }}>Vendedores para recontactar <small className="sub">{leads.length}</small></h2>
          <p className="sub chico">Tibios y calientes, sin gestión hace más de 5 días, ordenados por temperatura.</p>
          {leads.map((r) => {
            const wa = waLink(r.telefono, msgLead(r)); const ya = hechos.has(r.contact_id);
            return (
              <div className="item" key={r.id} style={{ opacity: ya ? 0.5 : 1 }}>
                <div className="item-txt">
                  <Link to={`/contactos/${r.contact_id}`} className="item-nombre">{r.nombre}</Link>
                  <small className="sub">{[r.inm_direccion, r.inm_barrio, r.situacion].filter(Boolean).join(" · ")}</small>
                </div>
                <div className="item-acc">
                  <span className={`temp ${nivelTemp(r.temperatura)}`}>{r.temperatura}</span>
                  {wa && opera && <a href={wa} target="_blank" rel="noreferrer" onClick={() => !ya && marcarLead(r)}><button className="chico">{ya ? "Enviado" : "Enviar"}</button></a>}
                </div>
              </div>
            );
          })}
          {!leads.length && <p className="sub">No hay vendedores tibios pendientes hoy.</p>}
        </div>
        <div className="tarjeta">
          <div className="fila" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>Inmobiliarias: pedir producto</h2>
            <div className="fila">
              <select value={zona} onChange={(e) => setZona(e.target.value)} aria-label="Zona">{ZONAS.map((z) => <option key={z}>{z}</option>)}</select>
              <select value={cuantas} onChange={(e) => setCuantas(Number(e.target.value))} aria-label="Cantidad">{[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}</select>
            </div>
          </div>
          <p className="sub chico">Sin contactar, con WhatsApp, las de más cartera primero. La zona rota cada día por el corredor norte y la Comuna 12.</p>
          {inmos.map((o) => {
            const wa = waLink(o.whatsapp, msgInmo(o)); const ya = hechos.has(o.id);
            return (
              <div className="item" key={o.id} style={{ opacity: ya ? 0.5 : 1 }}>
                <div className="item-txt"><span className="item-nombre">{o.nombre}</span><small className="sub">{o.barrio}</small></div>
                <div className="item-acc">{wa && <a href={wa} target="_blank" rel="noreferrer" onClick={() => !ya && marcarInmo(o)}><button className="chico">{ya ? "Enviado" : "Enviar"}</button></a>}</div>
              </div>
            );
          })}
          {!inmos.length && <p className="sub">No quedan inmobiliarias sin contactar con WhatsApp en {zona}. Elegí otra zona.</p>}
        </div>
      </div>
      <p className="sub chico" style={{ marginTop: 12 }}>Mensajes a bases de terceros: revisar consentimiento y baja según la Ley 25.326, a validar con profesional matriculado.</p>
    </>
  );
}
