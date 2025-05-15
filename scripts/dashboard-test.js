// Script de prueba para consultar los pagos directamente
import { createClient } from '@supabase/supabase-js'

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPayments() {
  try {
    console.log('Consultando pagos...')
    
    // Consultar pagos
    const { data, error } = await supabase
      .from('attendees')
      .select('id, paymentamount, paymentstatus')
      .eq('paymentstatus', 'Pagado')
      .not('istest', 'eq', true)
    
    if (error) {
      throw error
    }
    
    console.log(`Total de registros con estado 'Pagado': ${data.length}`)
    
    // Mostrar los primeros 5 registros
    if (data.length > 0) {
      console.log('Primeros 5 registros:')
      data.slice(0, 5).forEach(record => {
        console.log(`ID: ${record.id}, Monto: ${record.paymentamount}, Tipo: ${typeof record.paymentamount}`)
      })
      
      // Calcular suma usando diferentes métodos
      const suma1 = data.reduce((sum, record) => sum + (Number(record.paymentamount) || 0), 0)
      
      let suma2 = 0
      data.forEach(record => {
        suma2 += Number(record.paymentamount) || 0
      })
      
      console.log(`Suma total (reduce): ${suma1}`)
      console.log(`Suma total (forEach): ${suma2}`)
    } else {
      console.log('No se encontraron registros')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Ejecutar prueba
testPayments() 