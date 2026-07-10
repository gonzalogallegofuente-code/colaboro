import nodemailer from 'nodemailer'

// Envío de email transaccional (recuperación de contraseña). Usa el mismo
// SMTP que los avisos del VPS (MAIL_* en .env.local; puerto 587 = STARTTLS).
export async function sendMail(opts: { to: string; subject: string; text: string }): Promise<void> {
  const host = process.env.MAIL_HOST
  const port = Number(process.env.MAIL_PORT) || 587
  const user = process.env.MAIL_USER
  const pass = process.env.MAIL_PASS
  const from = process.env.MAIL_FROM || user
  if (!host || !user || !pass) throw new Error('SMTP sin configurar (MAIL_* en el entorno)')

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 587 → STARTTLS
    requireTLS: true,
    auth: { user, pass },
  })
  await transporter.sendMail({ from: `Colaboro <${from}>`, ...opts })
}
