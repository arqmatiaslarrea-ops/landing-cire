import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Datos de comparación: inversión inicial de USD 50.000 durante 10 años
// Datos de comparación: inversión inicial de USD 50.000 durante 10 años (20% anual CIRE)
const investmentData = [
  { year: "Inicio", cire: 50000, colchon: 50000, rentaVariable: 50000 },
  { year: "Año 1", cire: 60000, colchon: 50000, rentaVariable: 56000 },
  { year: "Año 2", cire: 72000, colchon: 50000, rentaVariable: 62720 },
  { year: "Año 3", cire: 86400, colchon: 50000, rentaVariable: 70246 },
  { year: "Año 4", cire: 103680, colchon: 50000, rentaVariable: 78676 },
  { year: "Año 5", cire: 124416, colchon: 50000, rentaVariable: 88117 },
  { year: "Año 6", cire: 149299, colchon: 50000, rentaVariable: 98691 },
  { year: "Año 7", cire: 179159, colchon: 50000, rentaVariable: 110534 },
  { year: "Año 8", cire: 214991, colchon: 50000, rentaVariable: 123798 },
  { year: "Año 9", cire: 257989, colchon: 50000, rentaVariable: 138654 },
  { year: "Año 10", cire: 309587, colchon: 50000, rentaVariable: 155293 },
];

const chartConfig = {
  cire: {
    label: "CIRE Fix & Flip (20% anual)",
    color: "hsl(var(--cire-orange))",
  },
  colchon: {
    label: "Dólares abajo del colchón (0%)",
    color: "hsl(var(--cire-blue-soft))",
  },
  rentaVariable: {
    label: "Renta Variable (12% anual)",
    color: "hsl(var(--cire-yellow))",
  },
};

export const InvestmentChart = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-cire-blue-deep via-cire-blue to-cire-blue-deep">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-cire-yellow-soft uppercase tracking-wider mb-4">
            Proyección de Rendimientos
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            El poder del{" "}
            <span className="bg-gradient-to-r from-cire-orange-light to-cire-orange bg-clip-text text-transparent">interés compuesto</span>
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Comparativa de una inversión inicial de <span className="font-semibold text-cire-yellow-soft">USD 50.000</span> en 
            diferentes instrumentos a lo largo de 10 años.
          </p>
        </div>

        {/* Chart */}
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-sm rounded-2xl p-6 md:p-10 border border-white/10">
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={investmentData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis 
                  dataKey="year" 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value) => `USD ${Number(value).toLocaleString()}`}
                    />
                  }
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => <span className="text-white/90 text-sm">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="cire"
                  name="CIRE Fix & Flip (20% anual)"
                  stroke="hsl(14, 90%, 65%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(14, 90%, 65%)", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, fill: "hsl(12, 85%, 55%)" }}
                />
                <Line
                  type="monotone"
                  dataKey="rentaVariable"
                  name="Renta Variable (12% anual)"
                  stroke="hsl(34, 80%, 68%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(34, 80%, 68%)", strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="colchon"
                  name="Dólares abajo del colchón (0%)"
                  stroke="hsl(216, 18%, 58%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(216, 18%, 58%)", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Results summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cire-orange/25 to-cire-orange/10 border border-cire-orange/30">
              <p className="text-sm text-white/80 mb-1">CIRE Fix & Flip</p>
              <p className="font-display text-2xl md:text-3xl font-bold text-cire-orange-light">USD 309.587</p>
              <p className="text-sm text-cire-orange-soft">+519% en 10 años</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-white/80 mb-1">Renta Variable</p>
              <p className="font-display text-2xl md:text-3xl font-bold text-cire-yellow-soft">USD 155.293</p>
              <p className="text-sm text-white/60">+210% en 10 años</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-white/80 mb-1">Dólares abajo del colchón</p>
              <p className="font-display text-2xl md:text-3xl font-bold text-white/60">USD 50.000</p>
              <p className="text-sm text-white/50">0% de crecimiento</p>
            </div>
          </div>
        </div>

        {/* Callout */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <p className="text-white/40 text-[10px] leading-relaxed">
            * Proyección ilustrativa basada en supuestos de rendimiento. No constituye recomendación de inversión ni garantía de resultados futuros. 
            Rendimientos pasados no garantizan rendimientos futuros. Cada proyecto tiene sus propias condiciones y riesgos asociados.
          </p>
        </div>
      </div>
    </section>
  );
};
