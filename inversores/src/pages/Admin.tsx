import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const FN_URL = `https://dhbyfrjkeecuvlkqlbne.supabase.co/functions/v1/inv-admin-stats`;

interface Stats {
  visits_7d: number;
  visits_30d: number;
  leads_total: number;
  leads_7d: number;
  leads_by_type: Record<string, number>;
  conversion_7d: string;
  recent_leads: any[];
}

export default function Admin() {
  const [pass, setPass] = useState(sessionStorage.getItem("cire_admin_pass") || "");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async (passphrase: string) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-pass": passphrase },
      });
      if (!res.ok) {
        setErr(res.status === 401 ? "Contraseña incorrecta" : `Error ${res.status}`);
        sessionStorage.removeItem("cire_admin_pass");
        setLoading(false);
        return;
      }
      const data = await res.json();
      sessionStorage.setItem("cire_admin_pass", passphrase);
      setStats(data);
    } catch (e: any) {
      setErr(e.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm p-6 space-y-4">
          <h1 className="font-display text-xl font-bold">Dashboard CIRE</h1>
          <Input
            type="password"
            placeholder="Contraseña admin"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(pass)}
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button onClick={() => load(pass)} disabled={loading || !pass} className="w-full">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Dashboard CIRE</h1>
          <Button variant="outline" size="sm" onClick={() => load(pass)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refrescar"}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Visitas 7d" value={stats.visits_7d} />
          <Stat label="Visitas 30d" value={stats.visits_30d} />
          <Stat label="Leads 7d" value={stats.leads_7d} accent />
          <Stat label="Conversión 7d" value={stats.conversion_7d} accent />
        </div>

        <Card className="p-5">
          <h2 className="font-display font-semibold mb-3">Leads por tipo</h2>
          <div className="space-y-1.5 text-sm">
            {Object.entries(stats.leads_by_type).length === 0 && (
              <p className="text-muted-foreground">Sin datos aún.</p>
            )}
            {Object.entries(stats.leads_by_type).map(([t, n]) => (
              <div key={t} className="flex justify-between border-b border-border/40 py-1">
                <span className="capitalize">{t.replace(/_/g, " ")}</span>
                <span className="font-mono font-semibold">{n}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-semibold">
              <span>Total histórico</span>
              <span className="font-mono">{stats.leads_total}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display font-semibold mb-3">Últimos 20 leads</h2>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-2">Fecha</th>
                  <th className="py-2 pr-2">Tipo</th>
                  <th className="py-2 pr-2">Nombre</th>
                  <th className="py-2 pr-2">Email</th>
                  <th className="py-2 pr-2">Tel</th>
                  <th className="py-2 pr-2">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_leads.map((l) => (
                  <tr key={l.id} className="border-b border-border/40">
                    <td className="py-1.5 pr-2 whitespace-nowrap text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-1.5 pr-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${l.tipo_lead === "calificado" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {l.tipo_lead}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2">{l.nombre}</td>
                    <td className="py-1.5 pr-2">{l.email || "—"}</td>
                    <td className="py-1.5 pr-2">{l.telefono}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{l.fuente || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "bg-primary/5 border-primary/20" : ""}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-2xl sm:text-3xl font-display font-bold mt-1 ${accent ? "text-primary" : ""}`}>{value}</p>
    </Card>
  );
}
