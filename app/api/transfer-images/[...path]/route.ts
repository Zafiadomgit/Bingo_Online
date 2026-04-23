import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const imagePath = params.path.join('/')
    const fullPath = join(process.cwd(), 'public', 'uploads', 'transfers', imagePath)
    
    // Verificar que el archivo existe
    if (!existsSync(fullPath)) {
      return new NextResponse('Imagen no encontrada', { status: 404 })
    }
    
    // Leer el archivo
    const fileBuffer = await readFile(fullPath)
    
    // Determinar el tipo de contenido basado en la extensión
    const extension = imagePath.split('.').pop()?.toLowerCase()
    let contentType = 'image/jpeg'
    
    switch (extension) {
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      default:
        contentType = 'image/jpeg'
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving transfer image:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}
