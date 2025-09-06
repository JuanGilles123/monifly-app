require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testValues() {
  console.log('🧪 Probando valores para payment_type...\n');
  
  const testValues = [
    'single', 'multiple', 'one_time', 'recurring',
    'lump_sum', 'installment', 'installments',
    'monthly', 'weekly', 'full', 'partial'
  ];
  
  for (const value of testValues) {
    try {
      const { error: insertError } = await supabase
        .from('debts')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          title: 'Test',
          original_amount: 100,
          remaining_amount: 100,
          type: 'owed',
          payment_type: value,
          status: 'open'
        });
      
      if (!insertError) {
        console.log(`✅ payment_type: ${value} - VÁLIDO`);
        // Limpiar inmediatamente
        await supabase
          .from('debts')
          .delete()
          .eq('title', 'Test')
          .eq('user_id', '00000000-0000-0000-0000-000000000000');
      } else if (insertError.code === '23514' && insertError.message.includes('payment_type')) {
        console.log(`❌ payment_type: ${value} - NO VÁLIDO`);
      } else {
        console.log(`⚠️  payment_type: ${value} - Otro error: ${insertError.message.substring(0, 50)}...`);
      }
    } catch (e) {
      console.log(`❌ payment_type: ${value} - Error: ${e.message}`);
    }
  }
}

testValues();
