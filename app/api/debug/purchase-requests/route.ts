import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = devOnlyGuard(); if (guard) return guard

  try {
    console.log('🔍 Debug - Verificando solicitudes de compra');

    // Obtener todas las solicitudes
    const { data: requests, error } = await supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase requests:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error fetching purchase requests' 
      }, { status: 500 });
    }

    // Agrupar por estado
    const requestsByStatus = requests?.reduce((acc, request) => {
      const status = request.status || 'unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(request);
      return acc;
    }, {} as Record<string, any[]>) || {};

    const debugInfo = {
      total: requests?.length || 0,
      byStatus: Object.keys(requestsByStatus).reduce((acc, status) => {
        acc[status] = requestsByStatus[status].length;
        return acc;
      }, {} as Record<string, number>),
      recent: requests?.slice(0, 5).map(req => ({
        id: req.id,
        nombres: req.nombres,
        apellidos: req.apellidos,
        email: req.email,
        status: req.status,
        cantidad_cartones: req.cantidad_cartones,
        total: req.total,
        created_at: req.created_at,
        game_id: req.game_id
      })) || []
    };

    console.log('📊 Debug info:', debugInfo);

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      allRequests: requests
    });

  } catch (error: any) {
    console.error('Error in purchase requests debug:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
