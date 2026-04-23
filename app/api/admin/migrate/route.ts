import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        console.log('Running migration: Add promoter_name to purchase_requests...')

        await query(`
      ALTER TABLE purchase_requests 
      ADD COLUMN IF NOT EXISTS promoter_name TEXT;
    `)

        return NextResponse.json({
            success: true,
            message: 'Migration successful: promoter_name column added'
        })
    } catch (error: any) {
        console.error('Migration failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
