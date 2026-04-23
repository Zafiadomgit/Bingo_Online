import { supabaseAdmin as supabase, supabaseAdmin } from './supabase'
import { generateBingoCard } from './bingo-utils'
import { v4 as uuidv4 } from 'uuid'
import { hashPassword, verifyPassword, verifyToken } from './auth'
import { query } from './db'

export interface User {
    id: string
    email: string
    display_name: string | null
    credits: number
    role?: string
    password?: string
    created_at: string
    updated_at: string
}

export interface BingoGame {
    id: string
    name: string
    max_cards: number
    card_price: number
    status: 'WAITING' | 'ACTIVE' | 'FINISHED' | 'SCHEDULED' | 'waiting'
    current_number: number | null
    called_numbers: number[]
    winner_id: string | null
    created_at: string
    updated_at: string
    started_at: string | null
    finished_at: string | null
    scheduled_at: string | null
    admin_id: string
    auto_start: boolean
    start_delay_minutes: number
    notification_sent: boolean
    prize_line: number
    prize_two_lines: number
    prize_full_card: number
    use_percentage_prizes: boolean
    prize_line_percentage: number
    prize_two_lines_percentage: number
    prize_full_card_percentage: number
    currency: string
    admin?: {
        id: string
        email: string
        display_name: string | null
    }
}

export interface BingoCard {
    id: string
    game_id: string
    user_id: string
    card_number: number
    numbers: number[]
    marked_positions: boolean[]
    is_winner: boolean
    created_at: string
}

export class DataService {
    async getCurrentUser(token?: string): Promise<User | null> {
        if (!token) return null
        try {
            const decodedUser = verifyToken(token)
            if (!decodedUser) return null
            const { data, error } = await supabase.from('users').select('*').eq('id', decodedUser.id).single()
            if (error || !data) return null
            return data as User
        } catch (error) {
            console.error('Error getting user:', error)
            return null
        }
    }

    async getActiveGames(): Promise<BingoGame[]> {
        try {
            // Include admin_id details manually to mimic previous joins, or rely on supabase relations if set up
            const { data, error } = await supabase
                .from('bingo_games')
                .select('*')
                .in('status', ['WAITING', 'ACTIVE', 'waiting', 'active', 'SCHEDULED', 'ACTIVE_WAITING'])
                .order('created_at', { ascending: false })
            if (error) throw error

            const adminIds = data?.map((g: any) => g.admin_id).filter(Boolean) || []
            let admins: Record<string, any> = {}
            if (adminIds.length > 0) {
               const { data: usersData } = await supabase.from('users').select('id, email, display_name').in('id', adminIds)
               if (usersData) {
                   admins = usersData.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u }), {})
               }
            }

            return (data || []).map((row: any) => ({
                ...row,
                admin: row.admin_id && admins[row.admin_id] ? admins[row.admin_id] : undefined
            })) as BingoGame[]
        } catch (error) {
            console.error('Error getting games:', error)
            return []
        }
    }

    async getGame(gameId: string): Promise<BingoGame | null> {
        try {
            const { data: row, error } = await supabase.from('bingo_games').select('*').eq('id', gameId).single()
            if (error || !row) return null
            
            let admin = undefined
            if (row.admin_id) {
               const { data: u } = await supabase.from('users').select('id, email, display_name').eq('id', row.admin_id).single()
               if (u) admin = u
            }

            return { ...row, admin } as BingoGame
        } catch (error) {
            console.error('Error getting game:', error)
            return null
        }
    }

    async getUserCards(gameId: string, userId: string): Promise<BingoCard[]> {
        try {
            const { data, error } = await supabase.from('bingo_cards').select('*').eq('game_id', gameId).eq('user_id', userId).order('created_at', { ascending: false })
            if (error) throw error
            return data as BingoCard[]
        } catch (error) {
            console.error('Error getting user cards:', error)
            return []
        }
    }

    async getGameCardCount(gameId: string): Promise<number> {
        try {
            const { count } = await supabase.from('bingo_cards').select('*', { count: 'exact', head: true }).eq('game_id', gameId)
            return count || 0
        } catch (error) {
            console.error('Error getting card count:', error)
            return 0
        }
    }

    async purchaseCard(gameId: string, userId: string): Promise<{ success: boolean; card?: BingoCard; error?: string }> {
         // Reemplazado por REST API de /purchase/request
         return { success: false, error: 'Deprecation: Utilizar el endpoint REST directo' }
    }

    async addCredits(userId: string, amount: number): Promise<boolean> {
        try {
            const { data: u } = await supabase.from('users').select('credits').eq('id', userId).single()
            if (!u) return false
            const { error } = await supabase.from('users').update({ credits: Number(u.credits || 0) + Number(amount) }).eq('id', userId)
            return !error
        } catch (error) {
            console.error("Error adding credits:", error)
            return false
        }
    }

    async createUser(email: string, password: string, display_name?: string): Promise<{ success: boolean; user?: User; error?: string }> {
        try {
            const hashedPassword = await hashPassword(password)
            const newId = uuidv4()
            const { data, error } = await supabase.from('users').insert({
                id: newId, email, password: hashedPassword, display_name, credits: 1000
            }).select('*').single()

            if (error) throw error
            return { success: true, user: data as User }
        } catch (error: any) {
            console.error('Error creating user:', error)
            if (error.code === '23505') { 
                return { success: false, error: 'El email ya está registrado' }
            }
            return { success: false, error: 'Error al crear usuario' }
        }
    }

    async authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
        try {
            const cleanEmail = email.toLowerCase().trim()
            console.log(`📡 Probando autenticación para: ${cleanEmail}`)

            // 1. Obtener usuario (Prioridad DB Directa)
            let targetUser: User | null = null
            try {
                const pgRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [cleanEmail])
                if (pgRes.rows.length > 0) {
                    targetUser = pgRes.rows[0] as User
                    console.log(`✅ Usuario encontrado (DB): ${targetUser.email}`)
                }
            } catch (err) {
                console.error('❌ Error DB Directa:', err)
            }

            let restError = null;
            // 2. Fallback a REST con supabaseAdmin (service role) para saltarse el RLS
            if (!targetUser) {
                const resREST = await supabaseAdmin.from('users').select('*').eq('email', cleanEmail).single()
                const { data, error } = resREST
                restError = error;
                if (data) targetUser = data as User
                if (targetUser) console.log(`✅ Usuario encontrado (Supabase Admin): ${targetUser.email}`)
            }

            // 3. Auto-recuperación: Si NO hay usuarios en absoluto, crear el admin por defecto
            if (!targetUser) {
                try {
                    const countRes = await query('SELECT count(*) FROM users')
                    if (parseInt(countRes.rows[0].count) === 0) {
                        console.log('🚨 Base de datos vacía. Inicializando admin por defecto...')
                        await query(`
                            INSERT INTO users (id, email, password, display_name, role, credits)
                            VALUES ($1, $2, $3, $4, $5, $6)
                        `, ['00000000-0000-0000-0000-000000000000', 'admin@bingo.com', await hashPassword('admin123'), 'Admin Bingo', 'admin', 999999])
                        
                        // Si el email que intenta loguear es el de default, re-intentar búsqueda
                        if (cleanEmail === 'admin@bingo.com') {
                            const retry = await query('SELECT * FROM users WHERE email = $1', ['admin@bingo.com'])
                            targetUser = retry.rows[0] as User
                        }
                    }
                } catch (e) { console.error('Error in auto-init:', e) }
            }

            if (!targetUser) {
                console.warn(`❌ Usuario no encontrado: ${cleanEmail}`)
                return { success: false, error: "Usuario no registrado - REST Error: " + JSON.stringify(restError) }
            }

            // 4. Verificar Password
            const isValid = await verifyPassword(password, targetUser.password || '')
            if (!isValid) {
                console.warn(`❌ Password incorrecto para: ${cleanEmail}`)
                return { success: false, error: "Contraseña incorrecta" }
            }

            // 5. Devolver usuario seguro
            const { password: _, ...safeUser } = targetUser
            // Asegurar que si el email es admin@bingo.com o tiene ID 0...0 siempre tenga rol admin
            if (safeUser.id === '00000000-0000-0000-0000-000000000000') {
               safeUser.role = 'admin'
            }

            return { success: true, user: safeUser as User }
        } catch (error) {
            console.error('Error fatal al autenticar:', error)
            return { success: false, error: 'Error del sistema. Contacte soporte.' }
        }
    }

    async createPurchaseRequest(purchaseData: any) {
        try {
            // Seguir usando REST para inserts por consistencia con trigger/RLS si existen
            const { data, error } = await supabase.from('purchase_requests').insert({
                id: uuidv4(),
                email: purchaseData.email,
                game_id: purchaseData.game_id,
                card_number: purchaseData.card_number,
                amount: purchaseData.amount,
                status: purchaseData.status || 'pending',
                receipt_url: purchaseData.receipt_url,
                promoter_name: purchaseData.promoter_name,
                nombres: purchaseData.nombres,
                apellidos: purchaseData.apellidos,
                telefono: purchaseData.telefono,
                cedula: purchaseData.cedula,
                cantidad_cartones: purchaseData.cantidad_cartones,
                card_numbers: purchaseData.card_numbers,
                numero_referencia: purchaseData.numero_referencia
            }).select('*').single()

            if (error) {
                console.error('Error REST insertando solicitud:', error)
                // Fallback a SQL directo si REST falla (ej: por RLS)
                const res = await query(`
                    INSERT INTO purchase_requests (id, email, game_id, card_number, amount, status, receipt_url, promoter_name, nombres, apellidos, telefono, cedula, cantidad_cartones, card_numbers, numero_referencia)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    RETURNING id
                `, [uuidv4(), purchaseData.email, purchaseData.game_id, purchaseData.card_number, purchaseData.amount, purchaseData.status || 'pending', purchaseData.receipt_url, purchaseData.promoter_name, purchaseData.nombres, purchaseData.apellidos, purchaseData.telefono, purchaseData.cedula, purchaseData.cantidad_cartones, purchaseData.card_numbers, purchaseData.numero_referencia])
                return { success: true, purchaseId: res.rows[0].id }
            }
            return { success: true, purchaseId: data.id }
        } catch (error: any) {
            console.error('Error creating purchase request:', error)
            return { success: false, error: error.message }
        }
    }

    async getPurchaseRequests() {
        try {
            console.log('📡 Buscando solicitudes (Prioridad DB Directa)...')
            // Intento 1: DB Directa (Bypass RLS)
            try {
                const pgRes = await query('SELECT * FROM purchase_requests ORDER BY created_at DESC')
                if (pgRes.rows && pgRes.rows.length > 0) {
                    console.log(`✅ ${pgRes.rows.length} solicitudes encontradas vía DB Directa`)
                    return pgRes.rows
                }
            } catch (err) {
                console.error('❌ Error en DB Directa (Requests):', err)
            }

            // Intento 2: Supabase REST
            console.log('🔄 Probando fallback a REST (Requests)...')
            const { data, error } = await supabase.from('purchase_requests').select('*').order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error getting purchase requests:', error)
            return []
        }
    }

    async getPurchaseRequestsByEmail(email: string) {
        try {
            const { data, error } = await supabase.from('purchase_requests').select('*').eq('email', email).order('created_at', { ascending: false })
            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error getting purchase requests by email:', error)
            return []
        }
    }

    async updatePurchaseRequestStatus(id: string, status: string) {
        try {
            const { data, error } = await supabase.from('purchase_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
            if (error) throw error
            return { success: true, data }
        } catch (error: any) {
            console.error('Error updating purchase request:', error)
            return { success: false, error: error.message }
        }
    }

    async getGameStats(gameId: string) {
        try {
            const { data: cards } = await supabase.from('bingo_cards').select('user_id, is_winner').eq('game_id', gameId)
            const totalCards = cards?.length || 0
            const uniquePlayers = new Set((cards || []).map(r => r.user_id)).size
            const winners = (cards || []).filter(r => r.is_winner).length
            return { totalCards, uniquePlayers, winners }
        } catch (error) {
            console.error('Error getting game stats:', error)
            return { totalCards: 0, uniquePlayers: 0, winners: 0 }
        }
    }

    async getUserCardsByEmail(email: string, gameId?: string | null) {
        try {
            const { data: u, error: uErr } = await supabase.from('users').select('id').eq('email', email).single()
            if (uErr || !u) throw new Error('Usuario no encontrado')
            const userId = u.id

            let targetGameId = gameId
            if (!targetGameId) {
                const { data: activeGame } = await supabase.from('bingo_games').select('id').in('status', ['WAITING', 'ACTIVE']).order('created_at', { ascending: false }).limit(1).single()
                if (activeGame) targetGameId = activeGame.id
                else {
                    const { data: recentGame } = await supabase.from('bingo_games').select('id').order('created_at', { ascending: false }).limit(1).single()
                    if (recentGame) targetGameId = recentGame.id
                }
            }

            if (!targetGameId) return { cards: [], pendingRequests: [] }

            const { data: cards, error: cErr } = await supabase.from('bingo_cards').select('*, bingo_games!inner(id, name, status, scheduled_at, prize_line, prize_two_lines, prize_full_card)').eq('user_id', userId).eq('game_id', targetGameId).order('created_at', { ascending: false })
            if (cErr) throw cErr

            const { data: reqs, error: rErr } = await supabase.from('purchase_requests').select('*').eq('email', email).eq('status', 'pending').order('created_at', { ascending: false })
            if (rErr) throw rErr

            return { cards: cards || [], pendingRequests: reqs || [], gameId: targetGameId }
        } catch (error) {
            console.error('Error fetching user cards by email:', error)
            throw error
        }
    }

    async createGame(gameData: any): Promise<{ success: boolean; game?: BingoGame; error?: string }> {
        try {
            const { name, max_cards, card_price, admin_id, scheduled_at } = gameData
            const { data, error } = await supabase.from('bingo_games').insert({
                id: uuidv4(), name, max_cards, card_price, admin_id, scheduled_at, status: 'WAITING'
            }).select('*').single()
            if (error) throw error
            return { success: true, game: data as BingoGame }
        } catch (error: any) {
            console.error('Error creating game:', error)
            return { success: false, error: error.message || 'Error al crear juego' }
        }
    }

    async deleteGame(gameId: string): Promise<{ success: boolean; message?: string; error?: string; details?: any }> {
        try {
            console.log(`📡 EXTERMINANDO JUEGO: ${gameId}`)
            const { data: game, error: gErr } = await supabase.from('bingo_games').select('name').eq('id', gameId).single()
            if (gErr || !game) {
                console.error(`❌ Juego no encontrado en DB: ${gameId}`)
                throw new Error('Juego no encontrado')
            }

            console.log(`1. Limpiando card_numbers...`)
            await supabase.from('card_numbers').delete().eq('game_id', gameId)
            
            console.log(`2. Limpiando bingo_cards...`)
            const { data: cData, error: ce } = await supabase.from('bingo_cards').delete().eq('game_id', gameId).select('id')
            if (ce) console.warn('⚠️ Error en bingo_cards:', ce.message)
            
            console.log(`3. Limpiando purchase_requests...`)
            const { data: rData, error: re } = await supabase.from('purchase_requests').delete().eq('game_id', gameId).select('id')
            if (re) console.warn('⚠️ Error en purchase_requests:', re.message)
            
            console.log(`4. Limpiando game_notifications...`)
            await supabase.from('game_notifications').delete().eq('game_id', gameId)
            
            console.log(`5. Limpiando game_stats...`)
            await supabase.from('game_stats').delete().eq('game_id', gameId)
            
            console.log(`6. Limpiando game_calls...`)
            await supabase.from('game_calls').delete().eq('game_id', gameId)
            
            console.log(`7. ELIMINANDO REGISTRO MAESTRO bingo_games...`)
            const { error: finalErr } = await supabase.from('bingo_games').delete().eq('id', gameId)
            
            if (finalErr) {
                console.error(`❌ ERROR FINAL BORRANDO JUEGO:`, finalErr)
                throw new Error(`DB Error: ${finalErr.message}`)
            }

            console.log(`✅ EXTERMINIO COMPLETADO: ${game.name}`)
            return { 
                success: true, 
                message: 'Juego eliminado completely', 
                details: { 
                    game: game.name, 
                    deletedCards: cData?.length || 0, 
                    deletedRequests: rData?.length || 0 
                } 
            }
        } catch (error: any) {
            console.error('❌ FATAL Error deleting game:', error)
            return { success: false, error: error.message }
        }
    }

    async finishGame(gameId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const now = new Date().toISOString()
            const { error } = await supabase.from('bingo_games').update({
                status: 'FINISHED',
                finished_at: now,
                updated_at: now
            }).eq('id', gameId)

            if (error) throw error
            return { success: true }
        } catch (error: any) {
            console.error('Error finishing game:', error)
            return { success: false, error: error.message }
        }
    }
}

export const dataService = new DataService()
