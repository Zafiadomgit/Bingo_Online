import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Base de datos no configurada' }, { status: 500 })
    }

    console.log('🧹 Iniciando limpieza completa de la base de datos (REST)...');

    // 1. Identificar el usuario admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({
        success: false,
        error: 'No admin user found. Cannot proceed with safe cleanup.'
      }, { status: 400 });
    }

    console.log('👑 Usuario admin encontrado:', adminUser.email);

    // Funciones helper para borrar todo usando REST
    const deleteAll = async (table: string) => {
       const res = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id')
       return res.data?.length || 0
    }

    // 2. Limpiar
    await deleteAll('card_numbers');
    console.log('🔄 Card numbers eliminados');

    const cardsCount = await deleteAll('bingo_cards')
    console.log(`🗑️ ${cardsCount} cartones eliminados`);

    const prCount = await deleteAll('purchase_requests')
    console.log(`🗑️ ${prCount} solicitudes eliminadas`);

    const gamesCount = await deleteAll('bingo_games')
    console.log(`🗑️ ${gamesCount} juegos eliminados`);

    const notifCount = await deleteAll('game_notifications')
    console.log(`🗑️ ${notifCount} notificaciones eliminadas`);

    // 7. Eliminar usuarios excepto admin
    const { data: deletedUsers } = await supabase
       .from('users')
       .delete()
       .neq('id', adminUser.id)
       .select('id')
       
    const usersCount = deletedUsers?.length || 0
    console.log(`🗑️ ${usersCount} usuarios eliminados`);

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada exitosamente',
      results: {
        adminPreserved: adminUser.email,
        deleted: {
          cards: cardsCount,
          requests: prCount,
          games: gamesCount,
          users: usersCount,
          notifications: notifCount
        }
      }
    });

  } catch (error: any) {
    console.error('Error in database cleanup:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
    }, { status: 500 });
  }
}
