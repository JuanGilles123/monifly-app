const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testDebtsAccess() {
  console.log('=== Probando acceso a la tabla debts ===');
  
  try {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Error al acceder a debts:');
      console.error('  Código:', error.code);
      console.error('  Mensaje:', error.message);
      console.error('  Detalles:', error.details);
      console.error('  Hint:', error.hint);
    } else {
      console.log('✅ Acceso exitoso a debts');
      console.log('  Registros encontrados:', data.length);
    }
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }
}

async function testRLSStatus() {
  console.log('\n=== Verificando estado de RLS ===');
  
  try {
    // Intentar acceso a información del sistema
    const { data, error } = await supabase.rpc('test_rls_status');
    
    if (error) {
      console.log('ℹ️  No se puede verificar RLS directamente (esperado)');
    }
  } catch (err) {
    console.log('ℹ️  Verificación de RLS no disponible');
  }
}

async function testUserAuth() {
  console.log('\n=== Verificando autenticación ===');
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('❌ Error de autenticación:', error.message);
    console.log('💡 Esto puede causar el error 403');
  } else if (user) {
    console.log('✅ Usuario autenticado:', user.email);
    console.log('  ID:', user.id);
  } else {
    console.log('⚠️  No hay usuario autenticado');
    console.log('💡 Esto explica el error 403 - RLS requiere autenticación');
  }
}

async function runTests() {
  await testUserAuth();
  await testRLSStatus();
  await testDebtsAccess();
  
  console.log('\n=== Resumen ===');
  console.log('Si el error es 403 y no hay usuario autenticado,');
  console.log('necesitas hacer login antes de usar el modal de deudas.');
}

runTests().catch(console.error);
