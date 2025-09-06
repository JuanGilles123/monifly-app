// Script temporal para verificar la estructura de las tablas de deudas
import { supabase } from './src/supabaseClient.js'

async function checkTablesStructure() {
  try {
    console.log('Verificando estructura de la tabla debts...')
    
    // Intentar obtener un registro de debts para ver la estructura
    const { data: debtsData, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .limit(1)
    
    if (debtsError) {
      console.log('Error en debts:', debtsError)
    } else {
      console.log('Estructura de debts:')
      if (debtsData && debtsData.length > 0) {
        console.log('Campos encontrados:', Object.keys(debtsData[0]))
        console.log('Ejemplo de registro:', debtsData[0])
      } else {
        console.log('Tabla debts existe pero está vacía')
      }
    }

    console.log('\nVerificando estructura de la tabla debt_payments...')
    
    // Intentar obtener un registro de debt_payments para ver la estructura
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('debt_payments')
      .select('*')
      .limit(1)
    
    if (paymentsError) {
      console.log('Error en debt_payments:', paymentsError)
    } else {
      console.log('Estructura de debt_payments:')
      if (paymentsData && paymentsData.length > 0) {
        console.log('Campos encontrados:', Object.keys(paymentsData[0]))
        console.log('Ejemplo de registro:', paymentsData[0])
      } else {
        console.log('Tabla debt_payments existe pero está vacía')
      }
    }

  } catch (error) {
    console.error('Error general:', error)
  }
}

checkTablesStructure()
