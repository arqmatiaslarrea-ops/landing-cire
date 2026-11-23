import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarCheck, Clock, Phone } from "lucide-react";

// Agenda propia: próximos 3 días hábiles, 3 horarios por día, cruzados con el calendario de Mati.
// Al confirmar, la llamada queda en el CRM y llega la invitación al calendario de Mati y del lead.
const API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-reservas`;

type Dia = { dia: string; etiqueta: string; horarios: { hora: string; inicio: string }[] };
type Props = {
  leadId: string | null;
  origenLead: "inmo" | "inv";
  nombre: string;
  telefono: string;
  email?: string;
  unidad?: "inmobiliaria" | "desarrolladora";
  origen?: string;
  nota?: string;
  onVolver?: () => void;
  onAgendado?: (etiqueta: string) => void;
};

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AgendaLlamada({ leadId, origenLead, telefono, email, nota, onVolver, onAgendado }: Props) {
  const [dias, setDias] = useState<Dia[] | null>(null);
  const [diaSel, setDiaSel] = useState(0);
  const [horaSel, setHoraSel] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState<string | null>(null);

  const cargar = () => {
    setError("");
    fetch(API).then((r) => r.json()).then((d) => setDias(d.dias || [])).catch(() => { setDias([]); setError("No pudimos cargar la agenda. Escribinos por WhatsApp."); });
  };
  useEffect(cargar, []);

  const confirmar = async () => {
    if (!horaSel) return;
    if (!leadId) { setError("Todavía estamos guardando tu consulta. Probá de nuevo en unos segundos."); return; }
    setEnviando(true); setError("");
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: leadId, origen_lead: origenLead, inicio: horaSel, nota }) });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "No pudimos agendar. Probá con otro horario.");
        if (d.dias) { setDias(d.dias); setHoraSel(null); }
        return;
      }
      setListo(d.etiqueta);
      onAgendado?.(d.etiqueta);
    } catch {
      setError("No pudimos agendar. Probá de nuevo o escribinos por WhatsApp.");
    } finally {
      setEnviando(false);
    }
  };

  if (listo) {
    return (
      <div className="text-center py-2">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
          <CalendarCheck className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-2xl font-display font-bold text-foreground mb-2">Llamada agendada</h3>
        <p className="text-lg text-foreground mb-1">{capital(listo)}</p>
        <p className="text-muted-foreground text-sm">Te llamamos al {telefono}.{email ? " Te mandamos la confirmación por mail." : ""}</p>
      </div>
    );
  }

  const dia = dias?.[diaSel];

  return (
    <div className="text-left">
      {onVolver && (
        <button type="button" onClick={onVolver} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
      )}

      <div className="flex flex-col items-center text-center border-b border-border pb-5 mb-5">
        <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center font-display font-bold text-xl text-foreground mb-3">ML</div>
        <p className="text-sm text-muted-foreground">Arq. Matías Larrea · CIRE</p>
        <h3 className="text-2xl font-display font-bold text-foreground mt-1">Llamada telefónica</h3>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 30 min</span>
          <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> Te llamamos al {telefono}</span>
        </div>
      </div>

      {dias === null && <p className="text-center text-muted-foreground py-6">Buscando horarios libres…</p>}
      {dias && dias.length === 0 && !error && <p className="text-center text-muted-foreground py-6">No quedan horarios libres en los próximos días. Escribinos por WhatsApp y coordinamos.</p>}

      {dias && dias.length > 0 && (
        <>
          <p className="font-display font-semibold text-foreground mb-3">Elegí el día</p>
          <div className="grid grid-cols-3 gap-2 mb-5" role="tablist">
            {dias.map((d, i) => {
              const [dsem, ...resto] = d.etiqueta.split(" ");
              return (
                <button
                  key={d.dia}
                  type="button"
                  role="tab"
                  aria-selected={i === diaSel}
                  onClick={() => { setDiaSel(i); setHoraSel(null); }}
                  className={`rounded-xl border px-2 py-3 text-center transition-colors ${i === diaSel ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/60"}`}
                >
                  <span className="block text-xs uppercase tracking-wide">{dsem.replace(",", "")}</span>
                  <span className="block font-display font-bold text-lg text-foreground">{resto.join(" ").replace(/ de /, " ")}</span>
                </button>
              );
            })}
          </div>

          <p className="font-display font-semibold text-foreground mb-3">Elegí el horario</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {dia?.horarios.map((h) => (
              <button
                key={h.inicio}
                type="button"
                onClick={() => setHoraSel(h.inicio)}
                className={`rounded-xl border py-3 font-display font-bold text-lg transition-colors ${horaSel === h.inicio ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/60"}`}
              >
                {h.hora}
              </button>
            ))}
          </div>

          <Button onClick={confirmar} disabled={!horaSel || enviando} className="w-full gradient-primary text-primary-foreground font-bold py-6 text-lg whitespace-normal h-auto">
            {enviando ? "Agendando…" : horaSel ? `Confirmar ${(dia?.etiqueta || "").split(",")[0]} ${dia?.horarios.find((h) => h.inicio === horaSel)?.hora}` : "Elegí un horario"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">Horario de Buenos Aires. Te llega la confirmación con la invitación al calendario.</p>
        </>
      )}

      {error && <p className="text-sm text-destructive text-center mt-4" role="alert">{error}</p>}
    </div>
  );
}
