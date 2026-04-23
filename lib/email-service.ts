import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailData {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Configuración para Gmail (puedes cambiar por otro proveedor)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    })
  }

  async sendEmail({ to, subject, html, attachments }: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: `"Bingo Online" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments
      })

      console.log('Email sent:', info.messageId)
      return { success: true }
    } catch (error) {
      console.error('Error sending email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  async sendBingoCards(userEmail: string, userName: string, cards: any[], gameName: string): Promise<{ success: boolean; error?: string }> {
    const subject = `🎲 Tus cartones de bingo - ${gameName}`
    
    const html = this.generateBingoCardsEmail(userName, cards, gameName)
    
    return this.sendEmail({
      to: userEmail,
      subject,
      html
    })
  }

  private generateBingoCardsEmail(userName: string, cards: any[], gameName: string): string {
    const cardsHtml = cards.map((card, index) => `
      <div style="margin-bottom: 30px; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; background: #f8fafc;">
        <h3 style="color: #1e40af; margin-bottom: 15px;">Cartón #${index + 1} - Número ${card.card_number}</h3>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; max-width: 400px;">
          ${this.generateCardGrid(card.numbers)}
        </div>
      </div>
    `).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tus cartones de bingo</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .card-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
          .card-cell { 
            background: #f1f5f9; 
            border: 1px solid #cbd5e1; 
            padding: 8px; 
            text-align: center; 
            font-weight: bold; 
            min-height: 40px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
          }
          .card-header { background: #3b82f6; color: white; font-weight: bold; }
          .free-space { background: #fbbf24; color: #92400e; }
          .footer { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎲 ¡Tus cartones de bingo están listos!</h1>
            <p>Hola ${userName}, aquí tienes tus cartones para el juego: <strong>${gameName}</strong></p>
          </div>
          
          <div class="content">
            <h2>📋 Tus cartones (${cards.length}):</h2>
            ${cardsHtml}
            
            <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px;">
              <h3 style="color: #065f46; margin-top: 0;">🎯 Cómo jugar:</h3>
              <ul style="color: #047857;">
                <li>Los números se sortearán automáticamente durante el juego</li>
                <li>Marca los números que salgan en tus cartones</li>
                <li>Gana completando una línea horizontal, vertical o diagonal</li>
                <li>¡El cartón lleno es el premio mayor!</li>
              </ul>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px;">
              <p style="margin: 0; color: #92400e;"><strong>💡 Tip:</strong> Guarda este email para consultar tus cartones durante el juego</p>
            </div>
          </div>
          
          <div class="footer">
            <p>¡Que tengas mucha suerte! 🍀</p>
            <p style="color: #6b7280; font-size: 14px;">Bingo Online - Tu plataforma de juegos favorita</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateCardGrid(numbers: number[]): string {
    const letters = ['B', 'I', 'N', 'G', 'O']
    let html = ''
    
    // Header con letras
    html += '<div class="card-header">B</div>'
    html += '<div class="card-header">I</div>'
    html += '<div class="card-header">N</div>'
    html += '<div class="card-header">G</div>'
    html += '<div class="card-header">O</div>'
    
    // Números del cartón
    for (let i = 0; i < 25; i++) {
      if (i === 12) {
        // Espacio libre en el medio
        html += '<div class="card-cell free-space">FREE</div>'
      } else {
        const number = numbers[i] || 0
        html += `<div class="card-cell">${number}</div>`
      }
    }
    
    return html
  }
}
