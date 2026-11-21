// Reglas de negocio de CIRE. Escenarios proyectados, sujetos a validación.

export type Propiedad = {
  id: string; direccion: string; barrio: string | null; localidad: string; tipo: string | null; ambientes: number | null;
  m2_cubiertos: number | null; m2_totales: number | null; estado_fisico: string | null; situacion: string | null; ocupacion: string | null;
  vendedor_contact_id: string | null; organizacion_id: string | null; prospecto_por: string | null;
  estrategia: string; etapa_loacc: string; precio_pedido_usd: number | null; arv_usd: number | null; costo_obra_usd: number | null;
  gastos_usd: number | null; factor_mao: number; operacion: string | null; precio_operacion_usd: number | null;
  wholesale_pct: number | null; wholesale_fee_min_usd: number | null; punta_vendedora_pct: number | null; punta_compradora_pct: number | null;
  puntas: string | null; honorario_nocional_pct: number | null; comercial: string | null; instancia: string | null;
  drive_url: string | null; responsable: string; notas: string | null; created_at: string; updated_at: string;
};

const n = (v: number | null | undefined) => Number(v || 0);

// MAO = ARV × factor (0,70) − obra − gastos. Ganancia = ARV − compra − obra − gastos. ROI = ganancia / inversión total.
export function analisis(p: Propiedad, compra: number | null) {
  const arv = n(p.arv_usd), obra = n(p.costo_obra_usd), gastos = n(p.gastos_usd);
  const mao = arv ? Math.round(arv * Number(p.factor_mao || 0.7) - obra - gastos) : null;
  const c = n(compra);
  const inversion = c + obra + gastos;
  const ganancia = arv && c ? arv - inversion : null;
  const roi = ganancia != null && inversion ? ganancia / inversion : null;
  const margenSobreMao = mao != null && c ? mao - c : null;
  return { mao, inversion: c ? inversion : null, ganancia, roi, margenSobreMao };
}

export type Parametros = { tasa_prospeccion: number; tasa_captacion: number; tasa_cierre: number; gasto_matricula: number; gasto_mkt_usd: number };
export const PARAM_DEF: Parametros = { tasa_prospeccion: 0.05, tasa_captacion: 0.15, tasa_cierre: 0.35, gasto_matricula: 0.1, gasto_mkt_usd: 500 };

// Calculadora de Deal: la comercial cobra UNA tasa (la de la instancia más avanzada), no acumulable.
export function reparto(p: Propiedad, par: Parametros) {
  const precio = n(p.precio_operacion_usd);
  let bruto = 0;
  if (p.operacion === "wholesale") bruto = Math.max(precio * n(p.wholesale_pct) / 100, n(p.wholesale_fee_min_usd));
  if (p.operacion === "corretaje") {
    const pv = p.puntas === "compradora" ? 0 : n(p.punta_vendedora_pct);
    const pc = p.puntas === "vendedora" ? 0 : n(p.punta_compradora_pct);
    bruto = precio * (pv + pc) / 100;
  }
  if (p.operacion === "flip") bruto = precio * n(p.honorario_nocional_pct) / 100;
  const tasa = p.instancia === "cierre" ? par.tasa_cierre : p.instancia === "captacion" ? par.tasa_captacion : p.instancia === "prospeccion" ? par.tasa_prospeccion : 0;
  const comision = bruto * tasa;
  const remanente = bruto - comision;
  const matricula = remanente * par.gasto_matricula;
  const mkt = bruto > 0 ? par.gasto_mkt_usd : 0;
  const neto = remanente - matricula - mkt;
  return { bruto, tasa, comision, remanente, matricula, mkt, neto };
}

// Cruce inversor ↔ propiedad (reglas del CRM anterior): barrio +40, activo +20, capital +15, sin compromisos +15, experiencia +10.
export function capitalMax(texto: string | null | undefined) {
  if (!texto) return 0;
  // Quita separadores de miles ("150.000" o "1,500,000") antes de leer los números.
  const limpio = String(texto).toLowerCase().replace(/(\d)[.,](?=\d{3}(?!\d))/g, "$1");
  const nums = [...limpio.matchAll(/(\d+(?:[.,]\d+)?)\s*(k|mil|m)?/g)].map((m) => {
    let v = parseFloat(m[1].replace(",", "."));
    if (m[2] === "k" || m[2] === "mil") v *= 1000; else if (m[2] === "m") v *= 1_000_000;
    return v;
  });
  return nums.length ? Math.max(...nums) : 0;
}

export function scoreInversor(inv: { datos: any; estado: string; comprometido_en_otra: boolean }, p: Propiedad, necesidad: number) {
  const d = inv.datos || {};
  const zonas = [d.barrios, d.ciudad, d.zona].filter(Boolean).join(" ").toLowerCase();
  const det: string[] = [];
  let s = 0;
  if (p.barrio && zonas.includes(p.barrio.toLowerCase())) { s += 40; det.push("barrio"); }
  if (inv.estado !== "descartado") { s += 20; det.push("activo"); }
  const cap = capitalMax(d.capital);
  if (cap && (!necesidad || cap >= necesidad * 0.25)) { s += 15; det.push("capital"); }
  if (!inv.comprometido_en_otra) { s += 15; det.push("sin compromisos"); }
  if (d.experiencia && !/sin|ningun|primera|no tengo/i.test(d.experiencia)) { s += 10; det.push("experiencia"); }
  return { score: s, detalle: det, capital: cap };
}

export const ESTRATEGIAS: Record<string, string> = { a_definir: "A definir", wholesale: "Wholesale", flip: "Fix & Flip", corretaje: "Corretaje", descartada: "Descartada" };
export const ETAPAS_PROP: Record<string, string> = { L: "Lead", O: "Ofertada", A: "Visitada", C1: "Contrato / reserva", C2: "Cerrada", X: "Descartada" };
