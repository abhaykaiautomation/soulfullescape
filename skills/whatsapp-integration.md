# Skill: WhatsApp Integration

## Purpose

Complete implementation guide for the Twilio WhatsApp API integration used to send booking confirmation messages.

## Business Goal

Deliver instant, personal booking confirmations to guests via WhatsApp — their primary communication channel.

## Scope

- Twilio WhatsApp API setup
- Message construction
- Non-blocking send pattern
- Error handling
- Phone number validation

---

## Architecture Notes

WhatsApp messages are sent **after** a booking is committed to the database. The send is fire-and-forget — failure is logged but never propagates to the HTTP response or causes a transaction rollback.

```
Booking committed to DB
      │
      └── sendWhatsAppConfirmation(payload)
            │
            ├── buildMessage(payload)
            ├── POST https://api.twilio.com/... (REST API)
            │
            ├── Success → logged (Phase 2: update delivery status in DB)
            └── Failure → console.error with bookingId (booking preserved)
```

---

## Implementation Details

### Service Function

```ts
// lib/whatsapp.ts

export interface WhatsAppPayload {
  to: string                  // E.164 format: +17875551234
  customerName: string
  tripTitle: string
  tripDate: Date
  startTime: string
  endTime: string
  spotsReserved: number
  totalPrice: number
}

export async function sendWhatsAppConfirmation(payload: WhatsAppPayload): Promise<void> {
  const message = buildConfirmationMessage(payload)
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`

  const response = await fetch(url, {
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Twilio ${response.status}: ${error.message ?? 'Unknown error'}`)
  }
}

function buildConfirmationMessage(payload: WhatsAppPayload): string {
  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Puerto_Rico',
  }).format(payload.tripDate)

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
```

### Non-Blocking Call in Booking API

```ts
// In POST /api/bookings — after transaction commits:
sendWhatsAppConfirmation({
  to: booking.whatsappPhone,
  customerName: booking.customerName,
  tripTitle: trip.title,
  tripDate: trip.tripDate,
  startTime: trip.startTime,
  endTime: trip.endTime,
  spotsReserved: booking.spotsReserved,
  totalPrice: Number(booking.totalPrice),
}).catch((err) => {
  console.error('[WhatsApp] Confirmation failed:', {
    bookingId: booking.id,
    error: err.message,
  })
})
// Note: no await — fire and forget
```

---

## Folder Structure

```
lib/
  whatsapp.ts           sendWhatsAppConfirmation + buildConfirmationMessage
  config.ts             Twilio env var access
```

---

## Related Components

- `POST /api/bookings` — only caller of `sendWhatsAppConfirmation`
- `lib/config.ts` — `twilioAccountSid`, `twilioAuthToken`, `twilioWhatsappFrom`

---

## Database Dependencies

None — the function receives all data as a payload; no DB queries inside.

---

## API Dependencies

- Twilio Messaging API: `POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json`

---

## Twilio Sandbox Setup (Development)

1. Go to Twilio Console → Messaging → Try it → WhatsApp
2. Note sandbox number (typically `+14155238886`)
3. Join: send `join [sandbox-code]` to the sandbox number from your personal WhatsApp
4. Set `TWILIO_WHATSAPP_FROM=+14155238886` in `.env.local`
5. Set `TWILIO_WHATSAPP_FROM` as the test guest's number for local testing

---

## Phone Number Validation

```ts
// Zod schema — shared client and server
whatsappPhone: z.string().regex(
  /^\+?[1-9]\d{7,14}$/,
  'Enter a valid phone number with country code (e.g. +17875551234)'
)

// Normalise before storing (strip spaces/dashes):
const normalised = phone.replace(/[\s\-()]/g, '')
const withPlus = normalised.startsWith('+') ? normalised : `+${normalised}`
```

---

## Edge Cases

| Case | Handling |
|---|---|
| Twilio API returns non-2xx | Error thrown; caught by `.catch()` in booking route |
| Phone not on WhatsApp | Twilio error logged; booking preserved |
| Twilio rate limit | Error logged; no retry in Phase 1 |
| Network timeout | Error logged; booking preserved |
| Invalid `TWILIO_WHATSAPP_FROM` format | Message fails; verify `whatsapp:+NNN` prefix not needed in env var |

---

## Error Handling

All errors caught by the `.catch()` block in the API route. The booking is always preserved. Errors are logged with `bookingId` so the operator can manually follow up via WhatsApp if needed.

---

## Acceptance Criteria

- [ ] Message delivered to test number within 5 seconds of booking
- [ ] Message contains all required fields (name, trip, date, time, spots, total)
- [ ] WhatsApp failure does NOT cause 500 response or transaction rollback
- [ ] Phone number normalised and stored in E.164 format
- [ ] `TWILIO_WHATSAPP_FROM` configured in all environments

## Future Improvements

- 24-hour pre-trip reminder (via Vercel Cron)
- Trip cancellation notifications to all bookers
- SMS fallback on WhatsApp delivery failure
- Delivery status webhook from Twilio → DB log
- Meta Cloud API migration (Phase 2)

## Related Documents

- [docs/13-whatsapp-notifications.md](../docs/13-whatsapp-notifications.md)
- [skills/booking-system.md](booking-system.md)
- [docs/26-environment-variables.md](../docs/26-environment-variables.md)
