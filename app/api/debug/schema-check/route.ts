
import { NextResponse } from 'next/server'
import { devOnlyGuard } from '@/lib/dev-only';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = devOnlyGuard(); if (guard) return guard

    try {
        const tableRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        let cardNumbersSchema = [];
        try {
            const cnRes = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'card_numbers'
        `);
            cardNumbersSchema = cnRes.rows;
        } catch (e) {
            console.error("Error fetching card_numbers schema", e);
        }

        return NextResponse.json({
            success: true,
            tables: tableRes.rows.map(r => r.table_name),
            cardNumbersSchema
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
