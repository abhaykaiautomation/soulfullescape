# Skill: CSV Export System

## Purpose

Implementation guide for the admin CSV export feature — generating and downloading a booking list as a spreadsheet.

## Business Goal

Give the operator a guest list they can print or share with their team on the morning of each trip.

## Scope

- CSV generation API
- File download trigger from browser
- Column definition
- Encoding and formatting

---

## Architecture Notes

CSV generation happens entirely server-side in a Next.js API route. The browser triggers a download by navigating to the endpoint or using `fetch` + `Blob`. No third-party library needed — CSV is built from template strings.

```
Admin clicks "Export CSV"
  └── GET /api/bookings/export?tripId=[optional]
        ├── requireAdmin()
        ├── Query bookings from DB
        ├── Build CSV string
        └── Return with Content-Disposition: attachment
              └── Browser downloads file
```

---

## Implementation Details

### API Route

```ts
// app/api/bookings/export/route.ts
export async function GET(request: Request) {
  await requireAdmin(request)

  const { searchParams } = new URL(request.url)
  const tripId = searchParams.get('tripId') ?? undefined

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      ...(tripId ? { tripId } : {}),
    },
    include: {
      trip: { select: { title: true, tripDate: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const csv = buildCSV(bookings)
  const filename = `soulfullescape_bookings_${formatDateForFilename(new Date())}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

### CSV Builder

```ts
function buildCSV(bookings: BookingWithTrip[]): string {
  const headers = [
    'Name',
    'Email',
    'WhatsApp',
    'Trip',
    'Trip Date',
    'Spots',
    'Total (USD)',
    'Status',
    'Booked At',
  ]

  const rows = bookings.map((b) => [
    escapeCsvField(b.customerName),
    escapeCsvField(b.customerEmail),
    escapeCsvField(b.whatsappPhone),
    escapeCsvField(b.trip.title),
    formatDate(b.trip.tripDate),
    b.spotsReserved.toString(),
    Number(b.totalPrice).toFixed(2),
    b.status,
    formatDateTime(b.createdAt),
  ])

  const lines = [headers, ...rows].map((row) => row.join(','))
  return '﻿' + lines.join('\r\n')  // BOM prefix for Excel UTF-8 compatibility
}

function escapeCsvField(value: string): string {
  // Wrap in quotes if value contains comma, quote, or newline
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'America/Puerto_Rico',
  }).format(date)
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Puerto_Rico',
  }).format(date)
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().slice(0, 10) // YYYY-MM-DD
}
```

### Client-Side Download Trigger

```tsx
// components/admin/BookingTable.tsx
const handleExport = async () => {
  const token = await getCurrentUserToken()
  const params = tripId ? `?tripId=${tripId}` : ''

  const response = await fetch(`/api/bookings/export${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    toast('Export failed', 'error')
    return
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `soulfullescape_bookings_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

---

## CSV Output Format

```csv
Name,Email,WhatsApp,Trip,Trip Date,Spots,Total (USD),Status,Booked At
Camila Rodriguez,camila@email.com,+17875551234,Lake Day — July 19,07/19/2025,4,299.96,CONFIRMED,07/15/2025 09:32 AM
Derek Thompson,derek@email.com,+19175551234,Lake Day — July 19,07/19/2025,1,74.99,CONFIRMED,07/15/2025 11:14 AM
```

---

## Folder Structure

```
app/
  api/
    bookings/
      export/
        route.ts          GET CSV export
lib/
  csv.ts                  buildCSV, escapeCsvField, format helpers
components/
  admin/
    BookingTable.tsx       Download trigger button
```

---

## Related Components

- `BookingTable` — contains "Export CSV" button
- `GET /api/bookings/export` — the download endpoint

---

## Database Dependencies

- `bookings` — filtered by trip and status
- `trips` — joined for title and date

---

## Edge Cases

| Case | Handling |
|---|---|
| 0 matching bookings | CSV with header row only (no error) |
| Field contains comma | Wrapped in double-quotes |
| Field contains double-quote | Escaped as `""` (RFC 4180) |
| Field contains newline | Wrapped in double-quotes |
| Large export (> 1000 rows) | In-memory for Phase 1 (adequate up to ~10k rows) |
| Non-admin access | 403 from `requireAdmin()` |

---

## Error Handling

| Scenario | Handling |
|---|---|
| DB query fails | 500 response; client shows error toast |
| Auth missing | 401 response |
| Non-admin | 403 response |
| Client network error on download | Error toast with retry instruction |

---

## Acceptance Criteria

- [ ] CSV downloads in Chrome, Safari, and Firefox
- [ ] Fields with commas/quotes correctly escaped
- [ ] BOM prefix ensures correct UTF-8 in Excel
- [ ] Filename includes current date
- [ ] Filter by `tripId` query param works
- [ ] 0-booking export returns valid CSV with headers only
- [ ] Non-admin returns 403

## Future Improvements

- Streaming export for large datasets (> 10k rows)
- Additional columns: booking ID, payment status
- Excel (.xlsx) format option
- Scheduled automatic export emailed to operator

## Related Documents

- [docs/14-admin-dashboard.md](../docs/14-admin-dashboard.md)
- [skills/admin-dashboard.md](admin-dashboard.md)
