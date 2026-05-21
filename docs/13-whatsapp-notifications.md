# 13 — WhatsApp Notifications

## Purpose

Define the WhatsApp messaging integration — how messages are triggered, formatted, delivered, and how failures are handled without impacting booking integrity.

## Business Goal

Deliver instant, personal booking confirmations to guests via their preferred communication channel (WhatsApp), building trust and reducing "did my booking work?" anxiety.

---

## Integration Options

### Option A: Twilio WhatsApp API (Recommended for Phase 1)

- **Pros**: Simple REST API, well-documented, sandbox for testing, free tier
- **Cons**: Requires Twilio-approved message templates, per-message cost
- **Setup**: Register Twilio sandbox → configure webhook → send via REST

### Option B: Meta Cloud API (WhatsApp Business API)

- **Pros**: Direct Meta integration, no Twilio markup cost at scale
- **Cons**: More complex setup (Meta Business Manager, app review), longer time to production
- **Recommendation**: Start with Twilio; migrate to Meta Cloud API in Phase 2

---

## Message Template

### Booking Confirmation

```
🌊 *Soulfullescape — Booking Confirmed!*

Hi [customerName],

Your adventure is locked in! Here are your details:

📅 *Trip:* [tripTitle]
🗓 *Date:* [tripDate]
⏰ *Time:* [startTime] – [endTime]
👥 *Spots Reserved:* [spotsReserved]
💰 *Total:* $[totalPrice] USD

We can't wait to see you there. Get ready to escape, connect, and recharge! 🌿

Questions? Reply to this message.
```

### Field Mapping

| Template Variable | Source |
|---|---|
| `customerName` | `booking.customerName` |
| `tripTitle` | `trip.title` |
| `tripDate` | `trip.tripDate` formatted as "Saturday, July 19" |
| `startTime` | `trip.startTime` |
| `endTime` | `trip.endTime` |
| `spotsReserved` | `booking.spotsReserved` |
| `totalPrice` | `booking.totalPrice` formatted as `"74.99"` |

---

## Implementation

### Service Module

```ts
// lib/whatsapp.ts

interface BookingNotificationPayload {
  to: string               // WhatsApp phone number e.g. "+17875551234"
  customerName: string
  tripTitle: string
  tripDate: Date
  startTime: string
  endTime: string
  spotsReserved: number
  totalPrice: number
}

export async function sendWhatsAppConfirmation(
  payload: BookingNotificationPayload
): Promise<void> {
  const message = buildConfirmationMessage(payload)

  // Twilio implementation
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
    {
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
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Twilio error: ${error.message}`)
  }
}

function buildConfirmationMessage(payload: BookingNotificationPayload): string {
  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Puerto_Rico',
  }).format(payload.tripDate)

  return `🌊 *Soulfullescape — Booking Confirmed!*\n\nHi ${payload.customerName},\n\nYour adventure is locked in! Here are your details:\n\n📅 *Trip:* ${payload.tripTitle}\n🗓 *Date:* ${dateStr}\n⏰ *Time:* ${payload.startTime} – ${payload.endTime}\n👥 *Spots Reserved:* ${payload.spotsReserved}\n💰 *Total:* $${payload.totalPrice.toFixed(2)} USD\n\nWe can't wait to see you there. Get ready to escape, connect, and recharge! 🌿\n\nQuestions? Reply to this message.`
}
```

### Usage in Booking API Route

```ts
// After successful transaction:
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
  // Non-blocking: log error but do not rethrow
  console.error('[WhatsApp] Confirmation send failed:', {
    bookingId: booking.id,
    phone: booking.whatsappPhone,
    error: err.message,
  })
})
```

---

## Phone Number Validation

```ts
// Zod schema (shared client/server)
whatsappPhone: z.string().regex(
  /^\+?[1-9]\d{7,14}$/,
  'Enter a valid phone number with country code (e.g. +17875551234)'
)
```

- Accept with or without `+` prefix
- Strip spaces and dashes before storing and sending
- Display format in UI: `(787) 555-1234` but store as `+17875551234`

---

## Twilio Sandbox Setup (Development)

1. Create Twilio account → navigate to "Messaging" → "Try it out" → "Send a WhatsApp message"
2. Note the sandbox number (e.g. `+14155238886`)
3. Join sandbox: guest sends `join <sandbox-code>` to the Twilio number
4. Set `TWILIO_WHATSAPP_FROM` env var to sandbox number
5. Test: trigger a booking in dev and verify WhatsApp delivery

---

## Production Setup (Twilio)

1. Apply for Twilio WhatsApp sender (requires Meta Business Manager verification)
2. Create approved message template in Twilio console
3. Update `config.twilioWhatsappFrom` to production WhatsApp number
4. Remove sandbox join requirement for guests

---

## Error Handling

| Failure Scenario | Behaviour |
|---|---|
| Twilio API down | Error logged; booking unaffected; operator alerted (Phase 2) |
| Invalid phone number format | Zod validation rejects at form submission |
| Phone not registered on WhatsApp | Twilio returns error; logged; booking unaffected |
| Twilio rate limit exceeded | Error logged; booking unaffected |
| Network timeout | Error logged; booking unaffected |

---

## Future Enhancements

- Pre-trip reminder (24 hours before trip date) via scheduled job
- Trip cancellation notification to all confirmed bookers
- SMS fallback if WhatsApp delivery fails
- Structured delivery status logging in DB (`whatsapp_log` table)
- Template approval for Meta Cloud API migration

---

## Acceptance Criteria

- [ ] WhatsApp message sent within 2 seconds of booking confirmation
- [ ] Message contains all required fields (name, trip, date, time, spots, total)
- [ ] Twilio failure does NOT cause booking API to return error
- [ ] Phone number validated before form submit (client) and API (server)
- [ ] WhatsApp error logged with bookingId and phone for operator investigation

## Related Documents

- [12-booking-engine.md](12-booking-engine.md)
- [skills/whatsapp-integration.md](../skills/whatsapp-integration.md)
- [26-environment-variables.md](26-environment-variables.md)
