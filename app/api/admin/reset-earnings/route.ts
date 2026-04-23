import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Base de datos no configurada' }, { status: 500 })
        }

        console.log('💰 Iniciando reinicio de ganancias (REST)...');

        const deleteAll = async (table: string, primaryKey = 'id') => {
           const { data, error } = await supabase.from(table).delete().not(primaryKey, 'is', null).select(primaryKey)
           if (error) console.error(`Error deleting from ${table}:`, error)
           return data?.length || 0
        }

        // 1. Limpiar
        await deleteAll('card_numbers', 'number');

        // 2. Eliminar purchase_requests 
        const prCount = await deleteAll('purchase_requests')

        // 3. Eliminar cartones
        const cardsCount = await deleteAll('bingo_cards')

        // 4. Eliminar todos los juegos para un "Hard Reset" de dinero
        const gamesCount = await deleteAll('bingo_games')

        console.log(`✅ Ganancias reiniciadas: ${prCount} compras, ${cardsCount} cartones, ${gamesCount} juegos eliminados.`);

        return NextResponse.json({
            success: true,
            message: 'Ganancias y datos financieros reiniciados exitosamente'
        });

    } catch (error: any) {
        console.error('Error resetting earnings:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error interno del servidor',
        }, { status: 500 });
    }
}
