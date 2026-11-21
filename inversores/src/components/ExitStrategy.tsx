import { Target, Clock, DollarSign, TrendingUp } from "lucide-react";

const strategies = [
  {
    icon: Target,
    title: "Precio competitivo",
    description: "Posicionamos cada propiedad un 5-10% por debajo del mercado para garantizar velocidad de venta.",
    iconGradient: "from-cire-blue to-cire-blue-light",
  },
  {
    icon: Clock,
    title: "90 días desde publicación",
    description: "Nuestro objetivo es cerrar cada operación en máximo 90 días desde que sale al mercado.",
    iconGradient: "from-cire-blue-light to-cire-yellow",
  },
  {
    icon: DollarSign,
    title: "Margen protegido",
    description: "El precio de salida ya contempla el margen del inversor. No hay sorpresas.",
    iconGradient: "from-cire-yellow to-cire-orange",
  },
  {
    icon: TrendingUp,
    title: "Múltiples canales",
    description: "Publicamos en portales, redes inmobiliarias y base de compradores directos.",
    iconGradient: "from-cire-orange to-cire-orange-light",
  },
];

export const ExitStrategy = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-cire-blue-light uppercase tracking-wider mb-4">
            Estrategia de Salida
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-cire-blue-deep mb-6">
            Vendemos rápido,{" "}
            <span className="bg-gradient-to-r from-cire-orange to-cire-yellow bg-clip-text text-transparent">sin comprometer margen</span>
          </h2>
          <p className="text-lg text-warm-400 max-w-2xl mx-auto">
            Nuestra estrategia de salida está diseñada para cerrar operaciones en 90 días 
            manteniendo la rentabilidad proyectada.
          </p>
        </div>

        {/* Strategy grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {strategies.map((strategy, index) => (
            <div
              key={index}
              className="group p-6 bg-white rounded-2xl border border-warm-100 hover:border-cire-blue/20 hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className={`flex items-center justify-center w-14 h-14 mx-auto mb-5 rounded-xl bg-gradient-to-br ${strategy.iconGradient} group-hover:scale-105 transition-transform`}>
                <strategy.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold text-cire-blue-deep mb-2">
                {strategy.title}
              </h3>
              <p className="text-sm text-warm-400 leading-relaxed">
                {strategy.description}
              </p>
            </div>
          ))}
        </div>

        {/* Highlight box */}
        <div className="max-w-3xl mx-auto mt-12 p-6 bg-gradient-to-br from-cire-blue/8 to-cire-blue-light/5 border border-cire-blue/15 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="font-display text-2xl font-bold text-cire-blue-deep mb-1">
                Tiempo promedio de venta
              </p>
              <p className="text-warm-400">
                Desde la publicación hasta la escritura
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold bg-gradient-to-r from-cire-blue to-cire-blue-light bg-clip-text text-transparent">45</span>
              <span className="text-xl text-warm-400">días</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
