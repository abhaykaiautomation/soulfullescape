import { config } from './config'
import { formatDate } from './utils'

export interface WhatsAppPayload {
  to: string
  customerName: string
  tripTitle: string
  tripDate: Date
  startTime: string
  endTime: string
  spotsReserved: number
  totalPrice: number
  waitlistPosition?: number  // present → send waitlist message instead of booking confirmation
}

export async function sendWhatsAppConfirmation(payload: WhatsAppPayload): Promise<void> {
  const message = payload.waitlistPosition
    ? buildWaitlistMessage(payload)
    : buildConfirmationMessage(payload)

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${config.twilioAccountSid}:${config.twilioAuthToken}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:${config.twilioWhatsappFrom}`,
      To: `whatsapp:${payload.to}`,
      Body: message,
    }).toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Twilio ${res.status}: ${(err as { message?: string }).message ?? 'Unknown error'}`)
  }
}

function buildConfirmationMessage(payload: WhatsAppPayload): string {
  const dateStr = formatDate(payload.tripDate)
  return [
    `🌊 *Soulfullescape — Booking Confirmed!*`,
    ``,
    `Hi ${payload.customerName},`,
    ``,
    `Your adventure is locked in! Here are your details:`,
    ``,
    `📅 *Trip:* ${payload.tripTitle}`,
    `🗓 *Date:* ${dateStr}`,
    `⏰ *Time:* ${payload.startTime} – ${payload.endTime}`,
    `👥 *Spots Reserved:* ${payload.spotsReserved}`,
    `💰 *Total:* $${payload.totalPrice.toFixed(2)} USD`,
    ``,
    `We can't wait to see you there. Get ready to escape, connect, and recharge! 🌿`,
    ``,
    `Questions? Reply to this message.`,
  ].join('\n')
}

function buildWaitlistMessage(payload: WhatsAppPayload): string {
  const dateStr = formatDate(payload.tripDate)
  return [
    `📋 *Soulfullescape — You're on the Waitlist!*`,
    ``,
    `Hi ${payload.customerName},`,
    ``,
    `This trip is currently full, but you've been added to the waitlist:`,
    ``,
    `📅 *Trip:* ${payload.tripTitle}`,
    `🗓 *Date:* ${dateStr}`,
    `⏰ *Time:* ${payload.startTime} – ${payload.endTime}`,
    `👥 *Spots Requested:* ${payload.spotsReserved}`,
    `🔢 *Your Position:* #${payload.waitlistPosition}`,
    ``,
    `We'll contact you here if a spot opens up. Fingers crossed! 🤞`,
    ``,
    `Questions? Reply to this message.`,
  ].join('\n')
}
