import React, { createContext, useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { supabase, UNIDADES, type Unidad } from "./config";
import "./estilos.css";
import Inicio from "./paginas/Inicio";
import Contactos from "./paginas/Contactos";
import Ficha from "./paginas/Ficha";
import Embudos from "./paginas/Embudos";
import Ofertas from "./paginas/Ofertas";
import Listas from "./paginas/Listas";

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

function App() {
  const [sesion, setSesion] = useState<boolean | null>(null);
  const [yo, setYo] = useState<Yo | null | "sin_acceso">(null);

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
            <nav>
              <NavLink to="/" end>Inicio</NavLink>
              <NavLink to="/contactos">Contactos</NavLink>
              <NavLink to="/embudos">Embudos</NavLink>
              <NavLink to="/ofertas">Ofertas · Plan 260</NavLink>
              <NavLink to="/listas">Listas y eventos</NavLink>
            </nav>
            <div className="usuario">
              <strong>{yo.nombre}</strong>
              <small>{yo.admin ? "Todas las unidades" : yo.unidades.map((u) => UNIDADES[u]).join(" · ")}</small>
              <button className="link" onClick={() => supabase.auth.signOut()}>Salir</button>
            </div>
          </aside>
          <main>
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/contactos" element={<Contactos />} />
              <Route path="/contactos/:id" element={<Ficha />} />
              <Route path="/embudos" element={<Embudos />} />
              <Route path="/ofertas" element={<Ofertas />} />
              <Route path="/listas" element={<Listas />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </YoCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
