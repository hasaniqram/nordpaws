type BrevoEmailInput = {
  to: string
  orderNumber: string
  total: number
}

const brevoRequest = async (path: string, init: RequestInit = {}) => {
  const config = useRuntimeConfig()
  if (!config.brevoApiKey) return null

  return $fetch(`https://api.brevo.com/v3${path}`, {
    ...init,
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': config.brevoApiKey,
      ...(init.headers || {})
    }
  })
}

export const sendOrderConfirmation = async (input: BrevoEmailInput) => {
  const config = useRuntimeConfig()
  if (!config.brevoApiKey || !config.brevoSenderEmail) return { skipped: true }

  const total = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK'
  }).format(input.total / 100)

  return brevoRequest('/smtp/email', {
    method: 'POST',
    body: JSON.stringify({
      sender: {
        name: config.brevoSenderName || 'Norrli Pets',
        email: config.brevoSenderEmail
      },
      to: [{ email: input.to }],
      subject: `Order ${input.orderNumber} confirmed · Norrli Pets`,
      htmlContent: `<!DOCTYPE html><html><body style="margin:0;background:#f7f5ef;font-family:Arial,Helvetica,sans-serif;color:#171714"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:32px 16px"><table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px"><tr><td style="padding:36px 36px 12px;font-size:12px;letter-spacing:2px;font-weight:bold">Norrli Pets</td></tr><tr><td style="padding:10px 36px;font-size:32px;line-height:38px;font-weight:bold">Thank you for your order.</td></tr><tr><td style="padding:8px 36px;font-size:16px;line-height:25px;color:#696861">We received order <strong style="color:#171714">${input.orderNumber}</strong>.</td></tr><tr><td style="padding:8px 36px;font-size:16px;line-height:25px;color:#696861">Order total: <strong style="color:#171714">${total}</strong></td></tr><tr><td style="padding:8px 36px 36px;font-size:14px;line-height:22px;color:#696861">We’ll email you again when your order is on the way.</td></tr></table></td></tr></table></body></html>`,
      tags: ['norrli-pets-order-confirmation']
    })
  })
}

export const syncBrevoContact = async (email: string) => {
  const config = useRuntimeConfig()
  if (!config.brevoApiKey) return { skipped: true }

  const listId = Number(config.brevoListId)
  const payload: Record<string, unknown> = {
    email,
    updateEnabled: true
  }

  if (Number.isInteger(listId) && listId > 0) payload.listIds = [listId]

  return brevoRequest('/contacts', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
