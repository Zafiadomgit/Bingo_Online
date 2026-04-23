import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const clientToUse = supabaseAdmin || supabase;

    const { data: rates, error } = await clientToUse
      .from('exchange_rates')
      .select('*')
      .order('from_currency');

    if (error) {
      console.error('Error fetching exchange rates:', error);
      // Retornar tasas por defecto si hay error
      return NextResponse.json({
        success: true,
        rates: [
          { from_currency: 'USD', to_currency: 'VES', rate: 36.50 },
          { from_currency: 'VES', to_currency: 'USD', rate: 0.0274 }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      rates: rates || []
    });

  } catch (error: any) {
    console.error('Error in exchange-rates API:', error);
    return NextResponse.json({
      success: true,
      rates: [
        { from_currency: 'USD', to_currency: 'VES', rate: 36.50 },
        { from_currency: 'VES', to_currency: 'USD', rate: 0.0274 }
      ]
    });
  }
}

export async function POST(request: Request) {
  try {
    const { from_currency, to_currency, rate } = await request.json();

    if (!from_currency || !to_currency || !rate) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos'
      }, { status: 400 });
    }

    const clientToUse = supabaseAdmin || supabase;

    const { data, error } = await clientToUse
      .from('exchange_rates')
      .upsert({
        from_currency,
        to_currency,
        rate,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating exchange rate:', error);
      return NextResponse.json({
        success: false,
        error: 'Error actualizando tasa de cambio'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rate: data
    });

  } catch (error: any) {
    console.error('Error in exchange-rates POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
