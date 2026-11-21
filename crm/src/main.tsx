import React, { createContext, useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { supabase, UNIDADES, type Unidad } from "./config";
import "./estilos.css";
import Inicio from "./paginas/Inicio";
import MiDia from "./paginas/MiDia";
import Contactos from "./paginas/Contactos";
import Ficha from "./paginas/Ficha";
import Embudos from "./paginas/Embudos";
import Ofertas from "./paginas/Ofertas";
import Listas from "./paginas/Listas";
import Propiedades from "./paginas/Propiedades";
import Propiedad from "./paginas/Propiedad";
import Organizaciones from "./paginas/Organizaciones";
import Reuniones from "./paginas/Reuniones";
import Envios from "./paginas/Envios";
import Gremios from "./paginas/Gremios";
import Tanda from "./paginas/Tanda";
import Agenda from "./paginas/Agenda";
import Cerebro from "./paginas/Cerebro";
import Compradores from "./paginas/Compradores";
import Campanas from "./paginas/Campanas";
import Directorio from "./paginas/Directorio";
import PanelRanka, { Estrella } from "./paginas/PanelRanka";
import FinanzasRanka from "./paginas/FinanzasRanka";
import Notificaciones from "./componentes/Notificaciones";

export type Yo = { email: string; nombre: string; clave: string; unidades: Unidad[]; admin: boolean };
const YoCtx = createContext<Yo | null>(null);
export const useYo = () => useContext(YoCtx)!;
// Sistema de marca: las pantallas de Ranka usan la marca de Ranka; el resto, la de CIRE.
export const soloRanka = (yo: Yo) => !yo.admin && yo.unidades.length > 0 && yo.unidades.every((u) => u === "ranka" || u === "ranka_by_cire");
export function useMarca(marca: "ranka" | "cire" | null) {
  useEffect(() => {
    if (!marca) return;
    const previa = document.documentElement.dataset.marca;
    document.documentElement.dataset.marca = marca;
    return () => { if (previa) document.documentElement.dataset.marca = previa; else delete document.documentElement.dataset.marca; };
  }, [marca]);
}
export const puedeOperar = (yo: Yo, u: Unidad) => yo.admin || yo.unidades.includes(u);

function Login() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault(); setCargando(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave });
    if (error) setError("Email o contraseña incorrectos.");
    setCargando(false);
  };
  return (
    <div className="login">
      <form onSubmit={entrar} className="tarjeta">
        <div className="marca">CIRE <span>Holding</span></div>
        <h1>CRM</h1>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
        <label>Contraseña<input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="primario" disabled={cargando}>{cargando ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}

// Navegación: lateral fija en compu; en celular, barra inferior con lo diario y un menú completo.
const MENU: [string, [string, string][]][] = [
  ["Mi trabajo", [["/", "Mi día"], ["/agenda", "Agenda"], ["/tanda", "Tanda de WhatsApp"], ["/reuniones", "Reuniones"]]],
  ["Ranka", [["/ranka", "Panel Ranka"], ["/ranka/finanzas", "Finanzas Ranka"]]],
  ["Ventas", [["/embudos", "Embudos"], ["/compradores", "Compradores"], ["/contactos", "Contactos"], ["/ofertas", "Ofertas · Plan 260"]]],
  ["Activos y red", [["/propiedades", "Propiedades"], ["/inmobiliarias", "Inmobiliarias"], ["/gremios", "Gremios"], ["/directorio", "Directorio"]]],
  ["Marketing", [["/listas", "Listas y eventos"], ["/campanas", "Campañas"], ["/seguimiento", "Seguimiento automático"]]],
  ["Resultados", [["/tablero", "Tablero"], ["/cerebro", "Cerebro"]]],
];
const BARRA: [string, string, string][] = [["/", "Mi día", "M3 12l9-8 9 8M5 10v10h14V10"], ["/agenda", "Agenda", "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"], ["/embudos", "Embudos", "M4 5h16l-6 8v6l-4-2v-4z"], ["/contactos", "Contactos", "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0"]];

function Marca({ ranka }: { ranka: boolean }) {
  return ranka ? <div className="marca marca-ranka">RANKA <Estrella tam={15} /></div> : <div className="marca">CIRE <span>Holding</span></div>;
}

function useMovil() {
  const [m, setM] = useState(() => window.matchMedia("(max-width: 820px)").matches);
  useEffect(() => { const q = window.matchMedia("(max-width: 820px)"); const f = () => setM(q.matches); q.addEventListener("change", f); return () => q.removeEventListener("change", f); }, []);
  return m;
}

function Lateral({ yo, alCambiarClave }: { yo: Yo; alCambiarClave: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const movil = useMovil();
  const loc = useLocation();
  const rk = soloRanka(yo);
  // Sofi ve lo de Ranka: su inicio es el Panel Ranka y no le mostramos lo que es sólo de CIRE
  const SOLO_CIRE = new Set(["/tanda", "/compradores", "/ofertas", "/propiedades", "/gremios", "/cerebro", "/ranka"]);
  const menu = rk ? MENU.map(([g, items]) => [g, items.filter(([to]) => !SOLO_CIRE.has(to)).map(([to, txt]) => (to === "/" ? [to, "Panel Ranka"] : [to, txt]))] as [string, [string, string][]]).filter(([, i]) => i.length) : MENU;
  const enRanka = rk || loc.pathname.startsWith("/ranka");
  useEffect(() => { setAbierto(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => { document.body.style.overflow = abierto ? "hidden" : ""; }, [abierto]);
  return (
    <>
      <aside className={abierto ? "abierto" : ""}>
        <div className="lateral-cab">
          <Marca ranka={enRanka} />
          <button className="icono lateral-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar menú">✕</button>
        </div>
        <Buscador />
        {!movil && <Notificaciones />}
        <nav>
          {menu.map(([grupo, items]) => (
            <React.Fragment key={grupo}>
              <span className="nav-grupo">{grupo}</span>
              {items.map(([to, txt]) => <NavLink key={to} to={to} end={to === "/"}>{txt}</NavLink>)}
            </React.Fragment>
          ))}
        </nav>
        <div className="usuario">
          <strong>{yo.nombre}</strong>
          <small>{yo.admin ? "Todas las unidades" : yo.unidades.map((u) => UNIDADES[u]).join(" · ")}</small>
          <div className="fila"><button className="link" onClick={alCambiarClave}>Cambiar contraseña</button><button className="link" onClick={() => supabase.auth.signOut()}>Salir</button></div>
        </div>
      </aside>
      <header className="movil-cab">
        <Marca ranka={enRanka} />
        {movil && <Notificaciones />}
      </header>
      <nav className="movil-barra" aria-label="Navegación principal">
        {BARRA.map(([to, txt, d]) => (
          <NavLink key={to} to={to} end={to === "/"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg><span>{rk && to === "/" ? "Panel" : txt}</span>
          </NavLink>
        ))}
        <button className={abierto ? "active" : ""} onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg><span>Más</span>
        </button>
      </nav>
    </>
  );
}

// Búsqueda global instantánea: contactos, propiedades e inmobiliarias. "/" la enfoca desde cualquier pantalla.
function Buscador() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ tipo: string; id: string; titulo: string; sub: string; to: string }[]>([]);
  const [activo, setActivo] = useState(0);
  const [foco, setFoco] = useState(false);
  const ref = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    const f = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, []);
  useEffect(() => {
    const t = q.trim(); if (t.length < 2) { setRes([]); return; }
    const like = `%${t.replace(/[%,()]/g, " ")}%`;
    const h = setTimeout(async () => {
      const [c, p, o] = await Promise.all([
        supabase.from("crm_contacts").select("id,nombre,telefono,email").or(`nombre.ilike.${like},telefono.ilike.${like},email.ilike.${like}`).limit(6),
        supabase.from("crm_propiedades").select("id,direccion,barrio").ilike("direccion", like).limit(4),
        supabase.from("crm_organizaciones").select("id,nombre,barrio").ilike("nombre", like).limit(4),
      ]);
      setActivo(0);
      setRes([
        ...(c.data || []).map((x: any) => ({ tipo: "Contacto", id: x.id, titulo: x.nombre, sub: x.telefono || x.email || "", to: `/contactos/${x.id}` })),
        ...(p.data || []).map((x: any) => ({ tipo: "Propiedad", id: x.id, titulo: x.direccion, sub: x.barrio || "", to: `/propiedades/${x.id}` })),
        ...(o.data || []).map((x: any) => ({ tipo: "Inmobiliaria", id: x.id, titulo: x.nombre, sub: x.barrio || "", to: `/inmobiliarias?id=${x.id}` })),
      ]);
    }, 220);
    return () => clearTimeout(h);
  }, [q]);
  const ir = (to: string) => { nav(to); setQ(""); setRes([]); ref.current?.blur(); };
  return (
    <form className="buscador" role="search" onSubmit={(e) => { e.preventDefault(); if (res[activo]) ir(res[activo].to); else if (q.trim()) ir(`/contactos?q=${encodeURIComponent(q)}`); }}>
      <input ref={ref} type="search" placeholder="Buscar…  ( / )" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFoco(true)} onBlur={() => setTimeout(() => setFoco(false), 150)}
        onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setActivo((a) => Math.min(a + 1, res.length - 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setActivo((a) => Math.max(a - 1, 0)); } if (e.key === "Escape") { setQ(""); ref.current?.blur(); } }}
        aria-label="Buscar contactos, propiedades o inmobiliarias" autoComplete="off" />
      {foco && q.trim().length >= 2 && (
        <div className="buscador-res" role="listbox">
          {res.map((r, i) => (
            <button type="button" key={r.tipo + r.id} className={i === activo ? "activo" : ""} onMouseDown={(e) => e.preventDefault()} onClick={() => ir(r.to)} role="option" aria-selected={i === activo}>
              <span>{r.titulo}</span><small>{r.tipo}{r.sub ? ` · ${r.sub}` : ""}</small>
            </button>
          ))}
          {!res.length && <p>Sin resultados para "{q.trim()}".</p>}
          <button type="button" className="buscador-todos" onMouseDown={(e) => e.preventDefault()} onClick={() => ir(`/contactos?q=${encodeURIComponent(q)}`)}>Ver todos los contactos que coinciden</button>
        </div>
      )}
    </form>
  );
}

function CambiarClave({ alCerrar }: { alCerrar: () => void }) {
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [msg, setMsg] = useState("");
  const guardar = async () => {
    if (a.length < 8) return setMsg("Mínimo 8 caracteres.");
    if (a !== b) return setMsg("No coinciden.");
    const { error } = await supabase.auth.updateUser({ password: a });
    setMsg(error ? "No se pudo cambiar: " + error.message : "Listo, contraseña cambiada.");
    if (!error) setTimeout(alCerrar, 1200);
  };
  return (
    <div className="modal-fondo" onClick={alCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cab"><h2>Cambiar contraseña</h2><button className="icono" onClick={alCerrar}>✕</button></div>
        <label className="campo">Nueva contraseña<input type="password" value={a} onChange={(e) => setA(e.target.value)} /></label>
        <label className="campo">Repetila<input type="password" value={b} onChange={(e) => setB(e.target.value)} /></label>
        {msg && <p className="sub">{msg}</p>}
        <div className="fila" style={{ justifyContent: "flex-end" }}><button className="primario" onClick={guardar}>Guardar</button></div>
      </div>
    </div>
  );
}

function App() {
  const [sesion, setSesion] = useState<boolean | null>(null);
  const [yo, setYo] = useState<Yo | null | "sin_acceso">(null);
  const [clave, setClave] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesion(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sesion) { setYo(null); return; }
    supabase.rpc("crm_yo").then(({ data }) => setYo(data && data.email ? (data as Yo) : "sin_acceso"));
  }, [sesion]);

  if (sesion === null) return <div className="cargando">Cargando…</div>;
  if (!sesion) return <Login />;
  if (yo === null) return <div className="cargando">Cargando…</div>;
  if (yo === "sin_acceso")
    return (
      <div className="login"><div className="tarjeta"><h1>Sin acceso</h1><p>Tu usuario no está habilitado en el CRM.</p>
        <button onClick={() => supabase.auth.signOut()}>Salir</button></div></div>
    );

  return (
    <YoCtx.Provider value={yo}>
      <BrowserRouter>
        <div className="app">
          <Lateral yo={yo} alCambiarClave={() => setClave(true)} />
          <main>
            <Routes>
              <Route path="/" element={soloRanka(yo) ? <PanelRanka /> : <MiDia />} />
              <Route path="/ranka" element={<PanelRanka />} />
              <Route path="/ranka/finanzas" element={<FinanzasRanka />} />
              <Route path="/tablero" element={<Inicio />} />
              <Route path="/contactos" element={<Contactos />} />
              <Route path="/contactos/:id" element={<Ficha />} />
              <Route path="/embudos" element={<Embudos />} />
              <Route path="/ofertas" element={<Ofertas />} />
              <Route path="/propiedades" element={<Propiedades />} />
              <Route path="/propiedades/:id" element={<Propiedad />} />
              <Route path="/inmobiliarias" element={<Organizaciones />} />
              <Route path="/listas" element={<Listas />} />
              <Route path="/reuniones" element={<Reuniones />} />
              <Route path="/seguimiento" element={<Envios />} />
              <Route path="/gremios" element={<Gremios />} />
              <Route path="/tanda" element={<Tanda />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/cerebro" element={<Cerebro />} />
              <Route path="/compradores" element={<Compradores />} />
              <Route path="/campanas" element={<Campanas />} />
              <Route path="/directorio" element={<Directorio />} />
              <Route path="*" element={<div className="tarjeta"><h1>Esta página no existe</h1><p className="sub">Volvé a <NavLink to="/">Mi día</NavLink>.</p></div>} />
            </Routes>
          </main>
        </div>
        {clave && <CambiarClave alCerrar={() => setClave(false)} />}
      </BrowserRouter>
    </YoCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
