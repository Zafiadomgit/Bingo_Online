import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esrrtfjzxrosytuwfokn.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcnJ0Zmp6eHJvc3l0dXdmb2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjk4ODIsImV4cCI6MjA4NTY0NTg4Mn0.rxRLX88TPPala7jwS396zhO0RXgllQyNP8G5ZD6c9vk'

const supabase = createClient(url, key)

async function verifyDB() {
  console.log(`🔌 Conectando a Supabase: ${url}`)
  
  const tables = ['users', 'bingo_games', 'bingo_cards', 'purchase_requests', 'card_numbers', 'promoters']
  let allOk = true

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.error(`❌ Error en tabla '${table}':`, error.message)
        allOk = false
      } else {
        console.log(`✅ Tabla '${table}' accesible. (Contiene ${data.length > 0 ? 'datos' : '0 filas'})`)
      }
    } catch (e) {
      console.error(`❌ Excepción al consultar '${table}':`, e)
      allOk = false
    }
  }

  if (allOk) {
    console.log('\n🟢 ¡LA BASE DE DATOS ESTÁ FUNCIONANDO PERFECTAMENTE! 🟢')
  } else {
    console.log('\n🔴 EXISTEN ERRORES DE CONEXIÓN O TABLAS FALTANTES 🔴')
  }
}

verifyDB()
