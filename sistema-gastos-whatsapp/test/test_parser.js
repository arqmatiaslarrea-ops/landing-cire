// Test unitario del parser de gastos, sin depender de n8n ni de WhatsApp real.
// Correr con: node test/test_parser.js
const assert = require('assert');
const { parsearGasto } = require('./parseGasto');

let ok = 0, fail = 0;

function caso(nombre, texto, esperado) {
  const resultado = parsearGasto({ mensaje_texto: texto });
  try {
    for (const [k, v] of Object.entries(esperado)) {
      assert.deepStrictEqual(resultado[k], v, `campo "${k}"`);
    }
    console.log(`✅ ${nombre}`);
    ok++;
  } catch (e) {
    console.log(`❌ ${nombre} -> ${e.message}`);
    console.log('   resultado:', JSON.stringify(resultado));
    fail++;
  }
}

// Formato estructurado, categoría válida (igual al ejemplo de la guía Paso 9 y de la hoja Gastos)
caso(
  'Formato estructurado válido',
  'GASTO / Materiales / 45000 / Cemento y arena',
  { ignorar: false, categoria: 'Materiales', monto: 45000, descripcion: 'Cemento y arena', estado: 'OK' }
);

// Formato estructurado con decimales y separador de miles
caso(
  'Formato estructurado con miles y decimales',
  'GASTO / Mano de Obra / 120.500,50 / Jornal cuadrilla semana',
  { ignorar: false, categoria: 'Mano de Obra', monto: 120500.5, estado: 'OK' }
);

// Formato estructurado con categoría no reconocida -> Revisar
caso(
  'Formato estructurado con categoría inválida',
  'GASTO / Combustible / 15000 / Nafta camioneta',
  { ignorar: false, categoria: 'Combustible', monto: 15000, estado: 'Revisar' }
);

// Texto libre con palabra clave de categoría + monto simple
caso(
  'Texto libre con categoría detectada por palabra clave',
  'compre cemento por 8000',
  { ignorar: false, categoria: 'Materiales', monto: 8000, estado: 'OK' }
);

// Texto libre con "lucas" (jerga) -> igual al ejemplo real de la hoja Gastos (G0003)
caso(
  'Texto libre con jerga "lucas" y sin categoría clara',
  'gasté como 8 lucas en flete',
  { ignorar: false, categoria: 'Varios', monto: 8000, estado: 'OK' }
);

// Texto libre sin número -> se ignora (charla normal del grupo)
caso(
  'Mensaje sin número se ignora (charla del grupo)',
  'buenas, alguien vio a Juan hoy?',
  { ignorar: true }
);

// Mensaje vacío / muy corto -> se ignora
caso(
  'Mensaje vacío se ignora',
  '',
  { ignorar: true }
);

caso(
  'Mensaje muy corto se ignora',
  'ok',
  { ignorar: true }
);

// Texto libre con número pero sin categoría reconocible -> Revisar
caso(
  'Texto libre con monto pero sin categoría',
  'pagué 5000 por el tema ese',
  { ignorar: false, monto: 5000, estado: 'Revisar' }
);

console.log(`\n${ok} OK, ${fail} fallidos de ${ok + fail} casos`);
process.exit(fail > 0 ? 1 : 0);
