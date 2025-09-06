const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testWithAuthentication() {
  try {
    console.log('🔍 Probando con autenticación...\n');
    
    // Primero, intentar obtener el usuario actual (si hay una sesión activa)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ No hay usuario autenticado. Necesitamos crear una sesión temporal.');
      console.log('   Por favor, ejecuta este script desde tu aplicación React donde ya estés autenticado.\n');
      
      // Como alternativa, vamos a probar deshabilitar RLS temporalmente
      console.log('🔧 Creando script SQL para probar sin RLS...\n');
      
      const sqlScript = `
-- Script para probar valores permitidos en la tabla debts
-- Ejecutar en Supabase SQL Editor (como superusuario)

-- 1. Deshabilitar RLS temporalmente para testing
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;

-- 2. Probar diferentes valores de payment_type y status
-- Prueba 1: single + pending
INSERT INTO debts (
    user_id,
    type,
    creditor_debtor_name,
    title,
    description,
    original_amount,
    remaining_amount,
    payment_type,
    status,
    due_date
) VALUES (
    gen_random_uuid(),
    'i_owe',
    'Test User 1',
    'Test Debt 1',
    'Test description',
    100.00,
    100.00,
    'single',
    'pending',
    CURRENT_DATE
);

-- Si el anterior funciona, probar otros valores:
-- Prueba 2: lump_sum + active
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test User 2', 'Test Debt 2', 'Test description',
    100.00, 100.00, 'lump_sum', 'active', CURRENT_DATE
);

-- Prueba 3: installment + open  
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test User 3', 'Test Debt 3', 'Test description',
    100.00, 100.00, 'installment', 'open', CURRENT_DATE
);

-- Prueba 4: installments + pending
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test User 4', 'Test Debt 4', 'Test description',
    100.00, 100.00, 'installments', 'pending', CURRENT_DATE
);

-- 3. Ver qué registros se insertaron exitosamente
SELECT payment_type, status, COUNT(*) as count
FROM debts 
WHERE creditor_debtor_name LIKE 'Test User%'
GROUP BY payment_type, status;

-- 4. Ver todos los valores únicos actuales (si existen registros reales)
SELECT DISTINCT payment_type FROM debts WHERE payment_type IS NOT NULL;
SELECT DISTINCT status FROM debts WHERE status IS NOT NULL;

-- 5. Limpiar datos de prueba
DELETE FROM debts WHERE creditor_debtor_name LIKE 'Test User%';

-- 6. Rehabilitar RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- 7. Ver las restricciones CHECK exactas
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%debts%';
`;

      console.log('📄 Guarda este script como test-debt-values.sql y ejecútalo en Supabase:');
      console.log('=' .repeat(60));
      console.log(sqlScript);
      console.log('=' .repeat(60));
      
      // Guardar el script en un archivo
      const fs = require('fs');
      fs.writeFileSync('test-debt-values.sql', sqlScript);
      console.log('✅ Script guardado como test-debt-values.sql');
      
    } else {
      console.log('✅ Usuario autenticado:', user.email);
      console.log('🔧 Probando con user_id válido...\n');
      
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
              user_id: user.id, // Usar el ID del usuario autenticado
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
    }

  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

testWithAuthentication();
