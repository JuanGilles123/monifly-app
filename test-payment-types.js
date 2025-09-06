// Test script para verificar los valores permitidos en payment_type
// Ejecutar en la consola del navegador

// Valores comunes que podrían estar permitidos
const testValues = [
  'single',
  'installments', 
  'one_time',
  'multiple',
  'lump_sum',
  'recurring',
  'monthly',
  'weekly',
  'full',
  'partial'
];

console.log('Probando valores para payment_type:');
testValues.forEach(value => {
  console.log(`- ${value}`);
});

// El error indica: "new row for relation "debts" violates check constraint "debts_payment_type_check""
// Esto significa que hay un CHECK constraint que limita los valores permitidos

console.log('\nRevisa en Supabase SQL Editor:');
console.log('SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE table_name = \'debts\';');
