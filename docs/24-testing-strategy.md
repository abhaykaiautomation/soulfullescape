# 24 — Testing Strategy

## Purpose

Define what to test, how to test it, and where testing adds the most value for the Soulfullescape platform.

## Business Goal

Build confidence that the booking engine, auth flow, and admin operations work correctly without manual verification for every change.

---

## Testing Philosophy

- Test behaviour, not implementation
- Prioritise the booking engine above everything else
- Integration tests over unit tests for critical paths
- No mocking the database — use a real test database (Neon branch or local PostgreSQL)

---

## Test Pyramid

```
        ┌───────────────────┐
        │   E2E Tests (few) │  Playwright — critical user journeys
        └─────────┬─────────┘
        ┌─────────▼─────────────────┐
        │ Integration Tests (many)  │  Supertest / vitest — API routes + DB
        └─────────┬─────────────────┘
        ┌─────────▼─────────────────────────┐
        │   Unit Tests (selective)          │  Vitest — pure functions, Zod schemas
        └───────────────────────────────────┘
```

---

## Test Frameworks

| Layer | Framework | Config |
|---|---|---|
| Unit + Integration | **Vitest** | `vitest.config.ts` |
| API route integration | **Supertest** or `fetch` against test server | |
| E2E | **Playwright** | `playwright.config.ts` |
| Component tests | **React Testing Library** + Vitest | |

---

## Unit Tests

Target: Pure functions, Zod schema validation, utility functions.

### High-Value Unit Tests

```ts
// __tests__/schemas/booking.schema.test.ts
describe('bookingSchema', () => {
  it('accepts valid booking input')
  it('rejects spotsRequested > 10')
  it('rejects spotsRequested < 1')
  it('rejects invalid whatsapp format')
  it('rejects invalid email')
  it('rejects invalid cuid for tripId')
})

// __tests__/lib/whatsapp.test.ts
describe('buildConfirmationMessage', () => {
  it('includes trip title')
  it('formats price correctly')
  it('formats date in Puerto Rico timezone')
})
```

---

## Integration Tests — Booking Engine (Critical)

These tests use a real test database (Neon `test` branch). They are the most important tests in the codebase.

```ts
// __tests__/api/bookings.test.ts
describe('POST /api/bookings', () => {
  describe('success cases', () => {
    it('creates booking and increments spots_booked')
    it('returns 201 with booking data')
    it('auto-marks trip FULL when last spot is taken')
    it('stores price snapshot (not current trip price)')
  })

  describe('overbooking prevention', () => {
    it('rejects booking when trip is exactly full')
    it('20 concurrent requests on 5-spot trip — exactly 5 succeed')
    it('booking fails gracefully on serialization conflict')
  })

  describe('validation', () => {
    it('returns 401 without token')
    it('returns 404 for non-existent trip')
    it('returns 409 for FULL trip')
    it('returns 409 for CANCELLED trip')
    it('returns 409 for past trip date')
    it('returns 422 for spotsRequested > 10')
    it('returns 422 for invalid phone')
  })
})
```

### Concurrency Test

```ts
it('20 concurrent requests on 5-spot trip — exactly 5 succeed', async () => {
  const trip = await createTestTrip({ capacity: 5, spotsBooked: 0 })
  const users = await createTestUsers(20)

  const results = await Promise.allSettled(
    users.map(user =>
      postBooking(trip.id, { spotsRequested: 1 }, user.token)
    )
  )

  const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 201)
  const conflicts = results.filter(r => r.status === 'fulfilled' && r.value.status === 409)

  expect(successes).toHaveLength(5)
  expect(conflicts).toHaveLength(15)

  const updatedTrip = await prisma.trip.findUnique({ where: { id: trip.id } })
  expect(updatedTrip.spotsBooked).toBe(5)
  expect(updatedTrip.status).toBe('FULL')
})
```

---

## Integration Tests — Auth

```ts
describe('Auth middleware', () => {
  it('requireAuth returns 401 for missing token')
  it('requireAuth returns 401 for expired token')
  it('requireAuth returns 401 for unknown firebase_uid')
  it('requireAdmin returns 403 for GUEST role user')
  it('requireAdmin returns user for ADMIN role user')
})
```

---

## Integration Tests — Admin API

```ts
describe('POST /api/trips', () => {
  it('creates trip for admin user')
  it('returns 403 for guest user')
  it('returns 422 for missing required fields')
  it('returns 422 if tripDate is in the past')
})

describe('DELETE /api/trips/[tripId]', () => {
  it('cancels trip and all associated bookings')
  it('returns count of cancelled bookings')
})

describe('GET /api/bookings/export', () => {
  it('returns CSV with correct headers')
  it('includes all confirmed bookings')
  it('returns 403 for non-admin')
})
```

---

## Component Tests (React Testing Library)

```ts
describe('TripCard', () => {
  it('shows "Sold Out" when status is FULL')
  it('shows spot count when available')
  it('shows "Only X spots left!" warning for ≤ 5 spots')
  it('CTA button links to /book/[tripId]')
})

describe('SpotSelector', () => {
  it('min is 1, cannot decrement below 1')
  it('max is the maxBookable prop value')
  it('calls onChange with correct value')
})

describe('BookingForm', () => {
  it('pre-fills name and email from auth context')
  it('shows inline error for invalid phone')
  it('disables submit during submission')
})
```

---

## E2E Tests (Playwright)

Test critical user journeys in a real browser against the staging environment.

```ts
// e2e/booking-flow.spec.ts
test('guest can complete full booking flow', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-testid="book-now-btn"]')
  // redirected to login
  await signInWithTestUser(page)
  // back on booking form
  await page.fill('[name="customerName"]', 'Test User')
  await page.fill('[name="whatsappPhone"]', '+17875551234')
  await page.click('[data-testid="submit-booking"]')
  await expect(page).toHaveURL(/\/booking\/confirmation\//)
  await expect(page.locator('[data-testid="confirmation-heading"]')).toBeVisible()
})

test('admin can create and publish a trip', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/admin/trips/new')
  // ... fill form
  await page.click('[data-testid="submit-trip"]')
  await expect(page).toHaveURL('/admin/trips')
  await expect(page.locator('text=Lake Day')).toBeVisible()
})
```

---

## Test Database Setup

```ts
// __tests__/helpers/db.ts
export async function setupTestDatabase() {
  // Neon test branch or local PG
  await prisma.$executeRaw`TRUNCATE users, trips, bookings CASCADE`
}

export async function createTestTrip(overrides?: Partial<Trip>): Promise<Trip> {
  return prisma.trip.create({
    data: {
      title: 'Test Trip',
      description: 'Test description',
      tripDate: addDays(new Date(), 7),
      startTime: '8:00 AM',
      endTime: '5:00 PM',
      capacity: 20,
      spotsBooked: 0,
      pricePerPerson: 74.99,
      status: 'PUBLISHED',
      ...overrides,
    },
  })
}
```

---

## CI Integration

```yaml
# .github/workflows/ci.yml
- name: Run unit and integration tests
  run: npx vitest run --coverage
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

- name: Run E2E tests
  run: npx playwright test
  env:
    BASE_URL: ${{ secrets.PREVIEW_URL }}
```

---

## Acceptance Criteria

- [ ] Concurrency test (20 requests, 5 spots) passes consistently
- [ ] All booking validation cases covered by integration tests
- [ ] E2E test covers: discover → login → book → confirmation
- [ ] E2E test covers: admin create trip → publish → visible on site
- [ ] Test suite runs in < 3 minutes in CI

## Related Documents

- [12-booking-engine.md](12-booking-engine.md)
- [25-deployment-guide.md](25-deployment-guide.md)
- [21-error-handling.md](21-error-handling.md)
