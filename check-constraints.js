const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkConstraints() {
  try {
    console.log('🔍 Verificando restricciones de la tabla debts...\n');
    
    // Intentar consultar directamente las restricciones usando SQL
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT 
            conname as constraint_name,
            pg_get_constraintdef(oid) as constraint_definition
          FROM pg_constraint 
          WHERE conrelid = 'public.debts'::regclass
          AND conname LIKE '%check%';
        `
      });

    if (constraintsError) {
      console.log('❌ Error consultando restricciones:', constraintsError);
    } else {
      console.log('✅ Restricciones encontradas:', constraints);
    }

    // Alternativa: consultar el esquema de información
    const { data: checkConstraints, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .ilike('constraint_name', '%debts%');

    if (checkError) {
      console.log('❌ Error consultando check constraints:', checkError);
    } else {
      console.log('✅ Check constraints:', checkConstraints);
    }

    // Intentar consultar las columnas de la tabla
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'debts')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.log('❌ Error consultando columnas:', columnsError);
    } else {
      console.log('✅ Columnas de la tabla debts:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    }

  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

checkConstraints();
