import { NextResponse } from 'next/server'
import { dataService } from '@/lib/data-service'

export async function POST(request: Request) {
    try {
        const { email, password, display_name } = await request.json()

        // Log input
        console.log('Testing registration for:', email)

        // Call data service
        const result = await dataService.createUser(email, password, display_name)

        // Log result
        console.log('Registration result:', result)

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Test registration error:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
