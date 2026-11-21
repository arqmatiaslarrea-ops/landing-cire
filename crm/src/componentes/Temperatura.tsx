export function nivelTemp(t: number | null | undefined) {
  const v = t ?? 0;
  return v >= 60 ? "caliente" : v >= 30 ? "tibia" : "fria";
}
export default function Temperatura({ t }: { t: number | null | undefined }) {
  const n = nivelTemp(t);
  return <span className={`temp ${n}`} title={`Temperatura ${t ?? 0}/100`}>{n === "caliente" ? "🔥" : n === "tibia" ? "●" : "○"} {t ?? 0}</span>;
}

export function hace(fechaIso: string | null | undefined) {
  if (!fechaIso) return "nunca";
  const min = Math.round((Date.now() - new Date(fechaIso).getTime()) / 6e4);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
}
