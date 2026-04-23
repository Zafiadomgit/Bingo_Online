
import { Pool } from 'pg'

const isProduction = process.env.NODE_ENV === 'production'

let connectionString = process.env.DATABASE_URL || ''

// Auto-fix "Tenant or user not found" error for Supabase (Pooler or Direct PgBouncer)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
if (connectionString && supabaseUrl) {
    try {
        // Asegurar que tenga protocolo para que el URL parser de Node no falle
        if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
            connectionString = 'postgres://' + connectionString;
        }
        
        const urlObj = new URL(connectionString)
        const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
        
        if (match && match[1]) {
            const projectRef = match[1]
            // Si el host es supabase (pooler o directo) y el usuario no tiene el project ref
            if ((urlObj.hostname.includes('supabase') || urlObj.hostname.includes('pooler')) && 
                (urlObj.username === 'postgres' || urlObj.username === 'postgres.[PROJECT-REF]')) {
                
                urlObj.username = `postgres.${projectRef}`
                connectionString = urlObj.toString()
                console.log('🔧 Auto-corrigiendo username del connection string de Supabase PgBouncer')
            }
        }
    } catch (e) {
        console.error('Error parseando DATABASE_URL para auto-corrección', e)
    }
}

const pool = new Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false
})

export const query = async (text: string, params?: any[]) => {
    const start = Date.now()
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('executed query', { text, duration, rows: res.rowCount })
    return res
}

export const getClient = async () => {
    const client = await pool.connect()
    return client
}

export default pool
