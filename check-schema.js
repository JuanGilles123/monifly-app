require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkDebtsSchema() {
  console.log('🔍 Verificando esquema de la tabla debts...\n');
  
  try {
    // Get table structure
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error al consultar tabla debts:', error);
      return;
    }
    
    console.log('✅ Tabla debts accesible');
    
    // Try to check constraints by attempting to insert invalid data
    console.log('\n🧪 Probando valores para payment_type...');
    
    const testValues = ['lump_sum', 'installment', 'single', 'multiple', 'one_time'];
    
    for (const value of testValues) {
      try {
        const { error } = await supabase
          .from('debts')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            description: 'Test',
            original_amount: 100,
            remaining_amount: 100,
            type: 'owed',
            payment_type: value,
            status: 'pending'
          });
        
        if (error) {
          console.log(`❌ ${value}: ${error.message}`);
        } else {
          console.log(`✅ ${value}: VÁLIDO`);
          // Delete test record if successful
          await supabase
            .from('debts')
            .delete()
            .eq('description', 'Test')
            .eq('user_id', '00000000-0000-0000-0000-000000000000');
        }
      } catch (e) {
        console.log(`❌ ${value}: ${e.message}`);
      }
    }
    
    console.log('\n🧪 Probando valores para type...');
    
    const typeValues = ['owed', 'owing', 'receivable', 'payable'];
    
    for (const value of typeValues) {
      try {
        const { error } = await supabase
          .from('debts')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            description: 'Test Type',
            original_amount: 100,
            remaining_amount: 100,
            type: value,
            payment_type: 'lump_sum',
            status: 'pending'
          });
        
        if (error) {
          console.log(`❌ ${value}: ${error.message}`);
        } else {
          console.log(`✅ ${value}: VÁLIDO`);
          // Delete test record if successful
          await supabase
            .from('debts')
            .delete()
            .eq('description', 'Test Type')
            .eq('user_id', '00000000-0000-0000-0000-000000000000');
        }
      } catch (e) {
        console.log(`❌ ${value}: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

checkDebtsSchema();
