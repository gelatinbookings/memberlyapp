# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

React Native (Expo) shipping to iPhone and Android phones. One Memberly design language on both; each OS keeps its own guarantees (safe areas, edge-swipe and predictive back, system sheets, Reduce Motion). iPhone is the first device class designed and reviewed; Android follows the same screens with Material affordances.

## Stack

User decision, 4 Nov 2026: React Native with Expo (TypeScript, Expo Router), feature-first structure. The app talks only to Memberly's backend, which proxies every call to Gelatin's Partner API and holds the partner key. No partner key, no Gelatin call and no Stripe secret ever ships in the app. This session delivers design directions as a canvas first; the React Native build started 4 Nov 2026.

## Users

- **Organizers** (community owners): run a community on Memberly, create events, sell passes, manage members. In the Gelatin flow they are booking a DJ from inside Create New Event, often on a phone, often under time pressure, paying with a card they hold until the DJ accepts.
- **Members**: join communities, browse and attend events, hold a Memberly Card, set event preferences (event types, music genres, vibes, themes). They see the public event page and its lineup.
- **Memberly's and Gelatin's engineers** read the same screens as the spec for the React Native build.

## Product Purpose

Memberly is a community and membership platform: organizers run communities, create events, sell passes and manage members; members discover communities and events that match their taste. The native app brings that to the phone. Gelatin talent is built in natively so an organizer can book a DJ while creating an event, without leaving Memberly.

Success: an organizer can create an event, add DJs, offer a fee, hold a card and read every booking state on their phone without confusion about what is held, charged or released. A member can find an event and see who is confirmed to play.

## Positioning

Memberly is the only community platform where talent booking is a section of event creation rather than a separate marketplace. Gelatin supplies the bookable DJ catalog, the booking engine, payments and payouts; Memberly supplies the organizers, their audiences and every native screen.

Gelatin is a global talent marketplace where DJs, venues, creatives and organizers find and book each other. It is never described as Atlanta-based or as an event platform. The pilot is DJ-only, in one Atlanta community.

## Operating Context

- **Memberly today (web, Next.js):** Dashboard, Profile (Overview and Preferences), Explore (communities and events, filters by location, community type, music genre, event vibe, event theme), My Memberly Card, Upcoming Events, Referrals, Community management (Community overview, Events, Memberships, Marketing, Integrations), Create community (Community details, Membership pricing), Create New Event (collapsible sections: Event details, Date & time, Location, Lineup, Access & passes).
- **The agreed Gelatin flow (decided 22 Oct 2026):** organizer opens the Lineup section, browses DJs pre-filtered by the event's city and date, adds DJs, enters a fee and optional note per DJ (each DJ is a separate booking with a separate card hold), holds their card on Memberly's surface, Gelatin captures on acceptance and releases on decline or expiry. Counters, reauthorization and everything after first payment happen in Gelatin's Memberly-themed portal, opened from a single-use 60-second launch. Status is read by polling through Memberly's backend. Publishing never waits on talent; an event can be created with no lineup.
- **Money:** organizer pays the DJ fee plus a flat $7 Gelatin service fee per booking. The server calculates and returns the total; the client only displays it. Mocks use $457.00 for a $450 offer.
- **Portal:** Memberly-themed origin (for example book.memberly.com), returns to the app through a registered origin.

## Capabilities and Constraints

- Status to UI mapping is fixed: authorization_required → "Payment needed" / Pay now; requested → "Card held · waiting for the DJ" / Manage in Gelatin; negotiating → "Negotiating" / Manage in Gelatin; reauthorization_required → "New offer from the DJ" / Review the new offer in Gelatin; confirmed → "Confirmed" / Manage in Gelatin; declined → "Passed", expired → "Expired", cancelled → "Cancelled", each with "Other DJs open that night".
- Budget bands: under $300, $300–$600, $600–$1,000, $1,000+. Private-rate DJs still appear in bands. Published rate and draw can be absent: show "Private rate" and "Draw not yet established".
- "DJ taken" (409) shows no reason.
- Not in this build: counter screens, capture logic, a DJ database, an embed, a webhook receiver, saved cards, Confirm & Book, Make a Deal, a 15% hold. Offers are fee plus note only.
- Public surfaces show no fees, offer history or booker details. The public lineup shows confirmed DJs only; pending appears as "TBA" only when the organizer enables it.
- Every state must be designed: empty, loading, no date or location, no DJs in the city (with Notify me), filters too tight, catalog unavailable, DJ taken, checkout timed out, date changed before and after confirmation, publish with offers outstanding, skip with no lineup.
- Decided 4 Nov 2026 (after the review with Memberly's CEO): build the **safe direction**, "Memberly at night": dark, talent as the Lineup section of Create New Event. The exploring (daylight) and very-far (concierge) ideations are parked for reference.
- Decided 6 Nov 2026: **Home uses the Exploring option's layout, in the dark theme**: greeting, the purple Memberly card with Show card, tonight's pass as a large photo card, then "Also tonight". The map is never the default; it is a secondary view behind See all. The launch splash, Welcome and sign-in use motion (Reduce Motion respected) to make first run feel alive.
- Undecided: whether members get a native Memberly Card wallet pass; push notification strategy; Android is paused until the iPhone app is finished.

## Brand Commitments

- Name: Memberly. The talent catalog is always attributed: "DJs, availability and rates from Gelatin" wherever it appears. Organizer-facing hand-offs say "Manage in Gelatin".
- Typeface: Inter. Purple #9333EA (hover #7E22CE, ring #8B5CF6). Buttons and inputs 6px radius, cards 16px, pills and avatars round. Flat 1px borders. Sentence-case, second-person copy. Touch targets at least 44px.
- Dark appearance leads and is the only appearance in the design directions (user decision, 30 Oct 2026). Dark tokens: background #000, card #0D0D0D, muted #1F1F1F, border #292929, muted text #A1A1A1, foreground #FAFAFA; purple tint rgba(59,7,100,.4) with text #D8B4FE; success #6EE7B7 on rgba(6,78,59,.4); warning #FCD34D on rgba(120,53,15,.4); error #FCA5A5 on rgba(127,29,29,.4); destructive #EF4444.
- Copy rule: tell the organizer plainly that the card is held, not charged, and is charged only if the DJ accepts.
- Memberly's share of the service fee is commercial information and never appears in UI, code, comments or tickets.

## Evidence on Hand

- Screenshots of the current Memberly web app (Explore, Profile Overview and Preferences, Community Dashboard, Create New Community, Community Overview) attached to the brief on 30 Oct 2026.
- The existing web design canvas "Memberly Lineup: Front-End Design" (https://claude.ai/artifact/XKC9PPcARDV5QnJBEvKAr7) with the Lineup section, browse, DJ cards, offer, checkout, status rows, dialogs, public event page, three phone screens and a parts kit. Its copy is the source for this app's Gelatin copy.
- A travel-app design reference (Figma "Memberly ReDesign", node 69-23437, and attached screenshots) used only for native mobile patterns: preference onboarding steps, pill tab bar, image-led cards, bottom sheets, step progress.
- The Memberly design-system file (`DESIGN (1).md`) could not be read from Downloads due to folder permissions; its rules are restated in the brief and in the canvas Kit.
- No real DJ data, photos or member data. DJ names on screens (KOYO, NIGHTFORM, BLKMTN, Sable Hart) are mock. Do not fabricate testimonials, counts or press.

## Product Principles

1. Every dollar is obvious: what is held, what is charged, what is released, and when. Never compute a total in the client.
2. Booking is a section of creating an event, not a separate app. Publishing never waits on talent.
3. The organizer always knows where they are: on Memberly, or handed to Gelatin, and how they get back.
4. Native first: platform navigation, sheets, back gestures and safe areas; Memberly's look lives in tint, type, radius and copy.
5. Each state is a designed screen, including the bad ones: taken, timed out, unavailable, date changed.
