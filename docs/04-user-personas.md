# 04 — User Personas

## Purpose

Define the distinct user types who interact with Soulfullescape so that UX decisions are grounded in real human needs, not assumptions.

## Business Goal

Ensure feature prioritisation and UI design always serve the people most likely to drive revenue and repeat engagement.

---

## Persona 1 — The Social Adventurer (Primary Guest)

**Name:** Camila Rodríguez  
**Age:** 28  
**Location:** San Juan, Puerto Rico  
**Occupation:** Marketing coordinator  

### Profile
Camila works hard Monday–Friday and lives for weekend experiences with her friend group. She discovered Soulfullescape through an Instagram Reel from a friend. She's comfortable with apps but has no patience for clunky UIs. She books exclusively from her iPhone.

### Goals
- Find a group experience for 4–6 people on a Saturday
- Know exactly what she's getting (vibe, schedule, what's included)
- Book in under 3 minutes
- Receive confirmation she can screenshot and share with the group

### Frustrations
- Websites that don't work on mobile
- Vague event descriptions with no concrete details
- Having to call or DM to book
- Uncertainty about whether her spots are actually confirmed

### Behaviours
- Discovers on Instagram → taps link in bio → browses on Safari iOS
- Shares booking confirmation in WhatsApp group immediately
- Checks "how many spots left" before committing

### Jobs to Be Done
> "When I find an experience I love, help me book it instantly so I can spend my energy on excitement, not logistics."

---

## Persona 2 — The Remote Worker Escape Seeker

**Name:** Derek Thompson  
**Age:** 35  
**Location:** Remote — visiting Puerto Rico for a month  
**Occupation:** Software engineer (freelance)  

### Profile
Derek works remotely and travels to new destinations for 4–8 week stretches. He's been in Rincón for two weeks and wants to spend a Saturday doing something memorable. He found Soulfullescape via a Google search. He books solo or with one other person.

### Goals
- A day of genuine disconnection from screens
- Book solo with confidence it'll be a social experience
- Understand the logistical details (meeting point, what to bring)

### Frustrations
- Experiences that feel targeted only at locals or couples
- No clear FAQ or logistics info
- Forms that don't autofill (hates friction)

### Jobs to Be Done
> "Help me find the best possible way to spend a Saturday in Puerto Rico, and make me feel like I'll fit in even if I'm coming solo."

---

## Persona 3 — The Platform Administrator (Operator)

**Name:** Sofia Velázquez  
**Age:** 32  
**Location:** Puerto Rico  
**Occupation:** Soulfullescape founder / operator  

### Profile
Sofia runs every aspect of Soulfullescape: sourcing dates, coordinating vendors, managing guests, and handling all communications. She is tech-savvy but not a developer. She manages operations from her MacBook and iPhone. She needs the admin dashboard to be fast, obvious, and reliable.

### Goals
- Create and publish a new trip in under 5 minutes
- See at a glance how many bookings each trip has
- Export a guest list to share with her team the morning of the trip
- Know immediately if a trip books out so she can manage expectations

### Frustrations
- Needing a developer to make routine changes
- Exporting data that requires manual cleanup
- Receiving WhatsApp messages from guests asking "is there still space?"
- Losing track of who booked what

### Jobs to Be Done
> "Let me run my business from a single screen so I can focus on the experience, not the admin."

---

## Persona 4 — The Gift Buyer (Secondary Guest)

**Name:** Marco Jiménez  
**Age:** 41  
**Location:** New York City (visiting family in PR)  
**Occupation:** Financial analyst  

### Profile
Marco wants to treat his family to something special during their trip back to Puerto Rico. He'll book for a group of 5 (himself, spouse, two kids, and his mother). He's less familiar with the destination and needs extra reassurance in the copy.

### Goals
- Understand if the experience is suitable for kids and older adults
- Book multiple spots at once as a gift experience
- Have a confirmation he can print or email to his family

### Frustrations
- Unclear age/fitness requirements
- Group booking flows that only let you book one spot at a time
- No customer service contact if something goes wrong

### Jobs to Be Done
> "Help me confidently book a special memory for my whole family without second-guessing whether it's right for everyone."

---

## Persona Matrix

| Attribute | Camila | Derek | Sofia (Admin) | Marco |
|---|---|---|---|---|
| Primary device | iPhone | MacBook | MacBook + iPhone | MacBook |
| Discovery channel | Instagram | Google | Direct | Referral |
| Group size | 4–6 | 1–2 | N/A (operator) | 5 |
| Tech comfort | High | Very high | Medium | Medium |
| Booking urgency | High (FOMO) | Medium | N/A | Low |
| WhatsApp user | Yes | Sometimes | Yes | No |
| Key anxiety | Spot availability | Fitting in solo | Operational control | Age suitability |

---

## Implications for Design

1. **Mobile-first is non-negotiable** — Camila represents the majority of guests.
2. **Spot count must be prominent** — address availability anxiety before it becomes a blocker.
3. **Admin UX must be zero-training** — Sofia cannot wait for a developer.
4. **Group booking UI must handle 1–10 spots elegantly** — serve both Derek and Marco.
5. **WhatsApp confirmation is the primary receipt** — do not rely on email alone.

## Related Documents

- [05-user-flows.md](05-user-flows.md)
- [06-site-map.md](06-site-map.md)
- [18-ui-design-system.md](18-ui-design-system.md)
