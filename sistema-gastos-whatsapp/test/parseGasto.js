// Copia exacta de la lógica del nodo "5. Parsear gasto" del workflow n8n.
// Ver n8n/n8n_workflow_gastos_whatsapp.json para el nodo original.
// Se extrae acá como función pura para poder testearla con Node sin n8n.

function parsearGasto(json) {
  const rawText = json.mensaje_texto || '';

  const categorias = {
    'Materiales': ['cemento','arena','ladrillo','hierro','caño','cano','cable','pintura','madera'],
    'Mano de Obra': ['jornal','oficial','ayudante','cuadrilla','contratista'],
    'Honorarios Profesionales': ['arquitecto','ingeniero','gestoria','gestoría','escribano','abogado'],
    'Servicios': ['luz','gas','agua','internet','seguro','alquiler equipo'],
    'Impuestos y Tasas': ['abl','ingresos brutos','tasa','municipalidad','monotributo'],
    'Equipamiento': ['herramienta','andamio','alquiler maquina','alquiler máquina','compra equipo'],
    'Varios': ['flete','comida obra','imprevisto','otros']
  };

  let categoria = null, monto = null, descripcion = null, estado = 'OK', motivo = '';

  if (!rawText || rawText.trim().length < 3) {
    return { ...json, ignorar: true };
  }

  const structured = rawText.match(/^\s*GASTO\s*\/\s*([^\/]+)\/\s*([\d.,]+)\s*\/\s*(.+)$/i);

  if (structured) {
    categoria = structured[1].trim();
    monto = parseFloat(structured[2].replace(/\./g,'').replace(',','.'));
    descripcion = structured[3].trim();
    const catNames = Object.keys(categorias);
    const match = catNames.find(c => c.toLowerCase() === categoria.toLowerCase());
    if (!match) {
      estado = 'Revisar';
      motivo = `Categoría "${categoria}" no reconocida`;
    } else {
      categoria = match;
    }
  } else {
    const lower = rawText.toLowerCase();
    const tieneNumero = /\d/.test(lower);
    if (!tieneNumero) {
      return { ...json, ignorar: true };
    }
    const montoMatch = lower.match(/(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)\s*(mil|lucas|k)?/);
    if (montoMatch) {
      let num = parseFloat(montoMatch[1].replace(/\./g,'').replace(',','.'));
      if (montoMatch[2]) num *= 1000;
      monto = num;
    }
    for (const [cat, keywords] of Object.entries(categorias)) {
      if (keywords.some(k => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`, 'i').test(lower))) { categoria = cat; break; }
    }
    descripcion = rawText;
    if (!monto || !categoria) {
      estado = 'Revisar';
      motivo = (!monto && !categoria) ? 'No se detectó monto ni categoría'
               : (!monto ? 'No se detectó un monto claro' : 'No se detectó una categoría reconocida');
      categoria = categoria || 'Varios';
      monto = monto || 0;
    }
  }

  return {
    ...json,
    ignorar: false,
    categoria,
    monto,
    descripcion,
    estado,
    motivo_revision: motivo
  };
}

module.exports = { parsearGasto };
