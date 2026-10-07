import { Resend } from 'resend'

export const sendOrderConfirmation = async (input: { to: string; orderNumber: string; total: number }) => {
  const config = useRuntimeConfig()
  if (!config.resendApiKey || !config.resendFrom) return { skipped: true }
  const resend = new Resend(config.resendApiKey)
  const total = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(input.total / 100)
  return resend.emails.send({
    from: config.resendFrom,
    to: input.to,
    subject: `Order ${input.orderNumber} confirmed · NORDPAWS`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#191816"><p style="letter-spacing:.16em;font-size:12px">NORDPAWS</p><h1>Thank you for your order.</h1><p>We have received order <strong>${input.orderNumber}</strong>.</p><p>Total: <strong>${total}</strong></p><p>We will email tracking details when the order is on its way.</p></div>`,
    text: `NORDPAWS\n\nThank you for your order. We received order ${input.orderNumber}. Total: ${total}. We will email tracking details when it is on its way.`
  })
}
