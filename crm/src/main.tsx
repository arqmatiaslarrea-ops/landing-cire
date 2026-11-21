import React, { createContext, useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from "react-router-dom";
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

export type Yo = { email: string; nombre: string; clave: string; unidades: Unidad[]; admin: boolean };
const YoCtx = createContext<Yo | null>(null);
export const useYo = () => useContext(YoCtx)!;
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

function Buscador() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form className="buscador" onSubmit={(e) => { e.preventDefault(); nav(`/contactos?q=${encodeURIComponent(q)}`); setQ(""); }}>
      <input type="search" placeholder="Buscar contacto…" value={q} onChange={(e) => setQ(e.target.value)} />
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
          <aside>
            <div className="marca">CIRE <span>Holding</span></div>
            <Buscador />
            <nav>
              <span className="nav-grupo">Mi trabajo</span>
              <NavLink to="/" end>Mi día</NavLink>
              <NavLink to="/agenda">Agenda</NavLink>
              <NavLink to="/tanda">Tanda de WhatsApp</NavLink>
              <NavLink to="/reuniones">Reuniones</NavLink>
              <span className="nav-grupo">Ventas</span>
              <NavLink to="/embudos">Embudos</NavLink>
              <NavLink to="/contactos">Contactos</NavLink>
              <NavLink to="/ofertas">Ofertas · Plan 260</NavLink>
              <span className="nav-grupo">Activos y red</span>
              <NavLink to="/propiedades">Propiedades</NavLink>
              <NavLink to="/inmobiliarias">Inmobiliarias</NavLink>
              <NavLink to="/gremios">Gremios</NavLink>
              <span className="nav-grupo">Marketing</span>
              <NavLink to="/listas">Listas y eventos</NavLink>
              <NavLink to="/seguimiento">Seguimiento automático</NavLink>
              <span className="nav-grupo">Resultados</span>
              <NavLink to="/tablero">Tablero</NavLink>
            </nav>
            <div className="usuario">
              <strong>{yo.nombre}</strong>
              <small>{yo.admin ? "Todas las unidades" : yo.unidades.map((u) => UNIDADES[u]).join(" · ")}</small>
              <div className="fila"><button className="link" onClick={() => setClave(true)}>Cambiar contraseña</button><button className="link" onClick={() => supabase.auth.signOut()}>Salir</button></div>
            </div>
          </aside>
          <main>
            <Routes>
              <Route path="/" element={<MiDia />} />
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
