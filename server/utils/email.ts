import { Resend } from 'resend'

export const sendOrderConfirmation = async (input: { to: string; orderNumber: string; total: number }) => {
  const config = useRuntimeConfig()
  if (!config.resendApiKey || !config.resendFrom) return { skipped: true }

  const resend = new Resend(config.resendApiKey)
  const total = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK'
  }).format(input.total / 100)

  return resend.emails.send({
    from: config.resendFrom,
    to: input.to,
    template: {
      id: 'nordpaws-order-confirmation',
      variables: {
        ORDER_NUMBER: input.orderNumber,
        TOTAL: total
      }
    }
  })
}
