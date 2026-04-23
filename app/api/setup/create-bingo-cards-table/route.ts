import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Verificar si la tabla ya existe intentando hacer una consulta
    const { data: testQuery, error: testError } = await supabase
      .from('bingo_cards')
      .select('id')
      .limit(1)

    if (!testError) {
      console.log('✅ Tabla bingo_cards ya existe')
      return NextResponse.json({ 
        success: true, 
        message: 'Tabla bingo_cards ya existe' 
      })
    }

    console.log('❌ Tabla bingo_cards no existe, error:', testError.message)

    // Si no existe, necesitamos crearla manualmente desde Supabase
    return NextResponse.json({ 
      success: false, 
      error: 'La tabla bingo_cards no existe',
      message: 'Necesitas crear la tabla manualmente en Supabase con este SQL:',
      sql: `
        CREATE TABLE bingo_cards (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          game_id UUID NOT NULL REFERENCES bingo_games(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          card_number INTEGER NOT NULL,
          numbers INTEGER[] NOT NULL,
          marked_positions BOOLEAN[] DEFAULT ARRAY_FILL(false, 25),
          is_winner BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(game_id, card_number)
        );
        
        CREATE INDEX idx_bingo_cards_game_id ON bingo_cards(game_id);
        CREATE INDEX idx_bingo_cards_user_id ON bingo_cards(user_id);
        CREATE INDEX idx_bingo_cards_card_number ON bingo_cards(card_number);
        
        ALTER TABLE bingo_cards ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own cards" ON bingo_cards
          FOR SELECT USING (auth.uid() = user_id);
          
        CREATE POLICY "Users can insert their own cards" ON bingo_cards
          FOR INSERT WITH CHECK (auth.uid() = user_id);
          
        CREATE POLICY "Admins can view all cards" ON bingo_cards
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.role = 'admin'
            )
          );
      `
    })

  } catch (error) {
    console.error('Error in setup API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
