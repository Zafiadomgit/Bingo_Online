import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticación requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userData = verifyToken(token)
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Parsear FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const gameId = formData.get('gameId') as string
    const amount = parseInt(formData.get('amount') as string)
    const paymentMethod = formData.get('paymentMethod') as string
    const reference = formData.get('reference') as string
    const notes = formData.get('notes') as string

    // Validaciones
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Archivo requerido' },
        { status: 400 }
      )
    }

    if (!gameId || !amount || !paymentMethod || !reference) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Solo se permiten archivos de imagen' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Archivo demasiado grande (máximo 5MB)' },
        { status: 400 }
      )
    }

    // Crear directorio de uploads si no existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payments')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // El directorio ya existe
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `payment_${userData.id}_${timestamp}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Guardar archivo
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Crear registro en la base de datos
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userData.id,
        game_id: gameId,
        amount: amount,
        status: 'PENDING',
        payment_method: paymentMethod,
        receipt_url: `/uploads/payments/${fileName}`
      })
      .select()
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: 'Error al crear el pago' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      message: 'Comprobante subido exitosamente'
    })

  } catch (error) {
    console.error('Error uploading payment:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
