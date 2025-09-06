require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testPaymentTypes() {
  console.log('🧪 Probando diferentes valores para payment_type...\n');
  
  // Obtener usuario actual para poder hacer las pruebas
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.log('❌ No hay usuario autenticado. Probando con usuario de prueba...');
    console.log('Nota: Esto puede fallar por políticas RLS, pero veremos el error específico.\n');
  }
  
  const testValues = [
    'lump_sum',
    'installment', 
    'single',
    'multiple',
    'one_time',
    'monthly_payment',
    'full',
    'partial'
  ];
  
  for (const paymentType of testValues) {
    try {
      console.log(`Probando: "${paymentType}"`);
      
      const { data, error } = await supabase
        .from('debts')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          title: 'Test payment type',
          original_amount: 100,
          remaining_amount: 100,
          type: 'owed',
          payment_type: paymentType,
          status: 'pending'
        })
        .select();
      
      if (error) {
        if (error.code === '23514' && error.message.includes('payment_type_check')) {
          console.log(`  ❌ "${paymentType}" - NO es válido (violates constraint)`);
        } else if (error.code === '42501' || error.message.includes('row-level security')) {
          console.log(`  ✅ "${paymentType}" - ES válido (RLS policy error, pero constraint OK)`);
        } else {
          console.log(`  ❓ "${paymentType}" - Error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ "${paymentType}" - ES válido y se insertó`);
        // Limpiar el registro de prueba
        await supabase.from('debts').delete().eq('title', 'Test payment type');
      }
    } catch (e) {
      console.log(`  ❌ "${paymentType}" - Error: ${e.message}`);
    }
  }
  
  console.log('\n🔍 También probando valores para "type"...\n');
  
  const typeValues = ['owed', 'owing', 'receivable', 'payable', 'debt_to_me', 'debt_from_me'];
  
  for (const type of typeValues) {
    try {
      console.log(`Probando type: "${type}"`);
      
      const { data, error } = await supabase
        .from('debts')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          title: 'Test type',
          original_amount: 100,
          remaining_amount: 100,
          type: type,
          payment_type: 'lump_sum', // Usar un valor que sabemos que funciona
          status: 'pending'
        })
        .select();
      
      if (error) {
        if (error.code === '23514') {
          console.log(`  ❌ "${type}" - NO es válido (violates constraint)`);
        } else if (error.code === '42501' || error.message.includes('row-level security')) {
          console.log(`  ✅ "${type}" - ES válido (RLS policy error, pero constraint OK)`);
        } else {
          console.log(`  ❓ "${type}" - Error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ "${type}" - ES válido y se insertó`);
        // Limpiar el registro de prueba
        await supabase.from('debts').delete().eq('title', 'Test type');
      }
    } catch (e) {
      console.log(`  ❌ "${type}" - Error: ${e.message}`);
    }
  }
}

testPaymentTypes();
