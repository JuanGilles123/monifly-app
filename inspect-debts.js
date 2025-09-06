const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function inspectDebtsTable() {
  try {
    console.log('🔍 Inspeccionando tabla debts...\n');
    
    // 1. Intentar obtener algunos registros existentes para ver la estructura
    console.log('1️⃣ Consultando registros existentes...');
    const { data: existingDebts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .limit(5);

    if (debtsError) {
      console.log('❌ Error consultando debts:', debtsError);
    } else {
      console.log('✅ Registros encontrados:', existingDebts?.length || 0);
      if (existingDebts && existingDebts.length > 0) {
        console.log('📄 Ejemplo de registro:');
        console.log(JSON.stringify(existingDebts[0], null, 2));
        
        // Ver qué valores únicos hay para payment_type y status
        const paymentTypes = [...new Set(existingDebts.map(d => d.payment_type).filter(Boolean))];
        const statuses = [...new Set(existingDebts.map(d => d.status).filter(Boolean))];
        
        console.log('\n📊 Valores únicos encontrados:');
        console.log('payment_type:', paymentTypes);
        console.log('status:', statuses);
      }
    }

    // 2. Intentar insertar un registro mínimo para identificar errores específicos
    console.log('\n2️⃣ Probando inserción con valores básicos...');
    
    const testValues = [
      { payment_type: 'single', status: 'pending' },
      { payment_type: 'lump_sum', status: 'active' },
      { payment_type: 'installment', status: 'open' },
      { payment_type: 'installments', status: 'pending' }
    ];

    for (const values of testValues) {
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('debts')
          .insert([{
            type: 'i_owe',
            creditor_debtor_name: 'Test User',
            title: 'Test Debt',
            description: 'Test description',
            original_amount: 100.00,
            remaining_amount: 100.00,
            payment_type: values.payment_type,
            status: values.status,
            due_date: new Date().toISOString().split('T')[0]
          }])
          .select();

        if (insertError) {
          console.log(`❌ Error con payment_type: "${values.payment_type}", status: "${values.status}"`);
          console.log('   Error:', insertError.message);
        } else {
          console.log(`✅ Éxito con payment_type: "${values.payment_type}", status: "${values.status}"`);
          
          // Limpiar el registro de prueba
          if (insertData && insertData[0]) {
            await supabase
              .from('debts')
              .delete()
              .eq('id', insertData[0].id);
          }
        }
      } catch (err) {
        console.log(`❌ Excepción con payment_type: "${values.payment_type}", status: "${values.status}"`);
        console.log('   Error:', err.message);
      }
    }

  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

inspectDebtsTable();
