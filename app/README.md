# Memberly app

The native Memberly app for iPhone and Android, with Gelatin talent booking built into Create New Event. Members find what's on tonight, open an event and see who is playing. Organizers run their community and book DJs without leaving Memberly.

This is the **safe direction** chosen on 4 Nov 2026: Memberly at night (dark), a map-first Home, and talent as the Lineup section of Create New Event. The design source is the "Memberly App: Design Directions" canvas, and the rules are in `../DESIGN.md` and `../PRODUCT.md`.

## Status

| Milestone | Scope | State |
|---|---|---|
| 1 | Design tokens and shared components | Done |
| 2 | App shell and navigation; sign-in, onboarding, Explore filters, Events, Memberly Card, Me (fake data) | Done |
| 3 | Create New Event with the Lineup section (fake data) | Done |
| 4 | Browse talent, filters, DJ cards, DJ profile, talent edge states (fake data) | Done |
| 5 | Offer review, card hold, offer edge states and Get a pass, on a test payment sheet (fake data) | Done |
| 6 | Status, alternates, hand-off to Gelatin | |
| 7 | Public event lineup | |
| 8 | Live API through Memberly's backend, Gelatin test environment only | |

Screenshots for each milestone are in `docs/screenshots/`.

## Stack and why

- **Expo SDK 58 with React Native 0.88.** Expo is the framework React Native recommends for new apps. Native folders are generated from `app.json` (Continuous Native Generation), so `ios/` and `android/` are never edited by hand.
- **Expo Router.** File-based routes under `src/app`, native stack navigation, and deep links from the same routes (`memberly://event/<id>`). The floating tab bar is built on Router's headless tabs (`expo-router/ui`) so it matches the design exactly.
- **TanStack Query.** All server state. Its focus manager is tied to the app's foreground state, so booking-status polling (every 5 seconds, only while a DJ is deciding) pauses in the background and refreshes once on resume.
- **A repository interface.** Every read goes through `MemberlyRepository` (`src/data/repository.ts`). Milestones 1–7 run on `createFakeRepository()`, sample data that matches the canvas. Milestone 8 adds an implementation that calls Memberly's backend. The app never calls Gelatin directly.
- **Inter, bundled.** Five weights in `assets/fonts`, loaded before the splash screen hides.
- **Lucide icons** at a 2px stroke, via `react-native-svg`.

## Folder structure

```
src/
  app/                 Routes only (Expo Router). (tabs)/ holds Home, Explore, Events, Manage, Me.
    (auth)/            Welcome, Intro, Sign in and Create account sheets, Verify (signed-out only)
    preferences.tsx    Preferences steps 1–4 (onboarding, and Me → Preferences with ?edit=1)
    permissions.tsx    Location and notifications
    card.tsx           My Memberly Card
    tonight.tsx        Tonight in the city: List / Map
    event/[id].tsx     Event page with the public lineup
    event/[id]/pass.tsx  Get a pass: a bottom sheet over the event page (M5)
    organizer/events/  Create New Event, its sub-screens, Lineup and Published (M3)
    kit.tsx            Parts kit: every component in every state (dev only)
    later.tsx          Labelled stop for screens a later milestone builds
  components/
    ui/                Shared components (Button, Chip, StatusPill, MoneySummary, Toggle, …)
    motion/            Rise (stagger), DrawnCheck
    navigation/        The floating tab bar
  features/
    booking/           Status mapping, money formatting, lineup summary, offer validation, status lines
    events/            Event rows, grouping, Create New Event (form, sections, calendar, draft context)
    lineup/            The Lineup section: blocked, empty, DJs added, in motion
    talent/            Browse talent: DJ cards, Filters sheet, DJ profile sheet, edge states, dev simulation
    offers/            Sending offers: review sheet, card hold, Card held, DJ taken, payment failed, offline queue (M5)
    passes/            Get a pass: pass types sheet, order, wait for paid, the order watcher (M5)
    navigation/        Labelled placeholders for later milestones
    auth/              Session context, the sign-in gate, code entry, sheets, Welcome video backdrop
    preferences/       The four preference steps and the minimum-three rule
    explore/           Search and filter logic (shared with the fake), the Filters sheet
    card/              Memberly Card: view, offline cache, brightness
    home/              Home's featured card logic, the Tonight map, map placeholder
    launch/            The animated launch splash
    permissions/       OS permission prompts
  data/                Types, repository interface, fake repository, query hooks
  lib/                 Query client, dates, payments (the payment sheet interface and its test stand-in)
  theme/               Tokens (from DESIGN.md) and the theme provider
```

## Milestone 2 member screens (GEL-998, GEL-1000, GEL-1003, GEL-1005)

All run on the fake repository. No real accounts, no backend.

| Route | Screen | Issue |
|---|---|---|
| `/welcome` | Welcome: looping crowd video (poster first, muted, mixes with other audio), wordmark, two ways in | GEL-998 |
| `/intro` | Three slides with Skip; Skip and the last Next open Create account | GEL-998 |
| `/sign-in`, `/create-account` | Bottom sheets over the dimmed Welcome (transparent modals, the video keeps playing): email code, Continue with Google, Continue with Apple (iPhone). No password anywhere | GEL-998 |
| `/verify` | Four digit boxes, "Resend in 0:24", wrong and expired states | GEL-998 |
| `/preferences` | Steps 1–4: event types (at least three), music genres, vibes, themes. `?edit=1` from Me | GEL-1000 |
| `/permissions` | Location and Notifications toggles; Allow & continue asks the OS in turn; Maybe later | GEL-1000 |
| `/` | Home ("2 · Exploring"): date and greeting, the purple Memberly card, tonight's pass as a photo card, Also tonight | GEL-1001 (layout change) |
| `/tonight` | Tonight in the city, List (default) or Map; `?view=map` from Home's map button | GEL-1001 |
| `/explore` | Search (results after a short pause), chips, Filters sheet with live count and Reset, results list | GEL-1003 |
| `/events` | Upcoming / Past / Saved, count line, This week and Later, Pass / Going / Saved pills | GEL-1005 |
| `/card` | My Memberly Card: QR on white, memberships with Active / Expired, brightness up, "Shown offline" from the cached token | GEL-1005 |
| `/me` | Profile with Edit, Preferences, My Memberly Card, Upcoming events, Referrals, You organize, Appearance, Parts kit (dev builds only), Sign out with a confirmation | GEL-1005 |

### The sign-in gate and fake accounts

The root layout routes from the session: signed out → Welcome; signed in but onboarding not finished → Preferences; otherwise the tabs. A deep link opened while signed out (for example `memberly://event/e_rooftop_hours`) goes through sign-in, then opens. The session lives in the keychain via `expo-secure-store`; **Me → Sign out** clears it and returns to Welcome.

Fake sign-in:

| You do | Fake result |
|---|---|
| Create account, any name and valid email, code **1234** | New member: Preferences, then Permissions, then Home |
| Sign in, any valid email, code **1234** | Returning member (Jordan): straight to Home, or the deep link |
| Code **0000** | "That code expired. We sent a new one." and the countdown restarts |
| Any other code | "That code doesn't match. Check the latest email or resend." |
| Continue with Google / Continue with Apple | Signs in Jordan directly (no native sheet yet) |

**Dev bypass:** start Metro with `EXPO_PUBLIC_FAKE_SIGNED_IN=1 npx expo start --dev-client` and the fake starts signed in and onboarded when nothing is stored. Signing out turns it off until the next reload. Without the flag the app starts signed out (unless the keychain still holds a fake session from an earlier run).

**What M8 needs for real sign-in:** an HTTP repository behind the same `MemberlyRepository` session methods (`POST /app/auth/email-code`, `/verify`, `/google`, `/apple`, `/refresh`, `/sign-out`), token refresh before expiry, a native Google sign-in module and `expo-apple-authentication` (both need a rebuild and an iOS entitlement for Apple), and server-side account linking so Google with an existing email signs into that account. Face ID unlock (`expo-local-authentication` + `requireAuthentication` on the stored token) is not built yet.

### Motion

The native splash hands off to a JS splash (same black and wordmark), which pulses a purple disc behind the mark and cross-fades into the first screen; signed out, the Welcome poster fades in behind the mark first, so it hands straight to the video. Welcome's copy rises in a stagger; the sign-in sheets spring up; fields ease their focus ring in; Verify pops each digit, shakes on a wrong code and draws a check on success; primary buttons scale to 0.97 when pressed. All of it is transform and opacity only, and Reduce Motion turns it into instant changes or a plain fade (Welcome shows the poster still and never starts the video). Low Power Mode is not detected yet (it would need `expo-battery`).

Native modules added in M2: `expo-secure-store`, `expo-location`, `expo-notifications`, `expo-brightness`, `expo-network`, `expo-video` (plus `react-native-qrcode-svg`, JS on top of `react-native-svg`). Their config plugins live in `app.json`; after adding or changing a plugin run `npx expo prebuild --platform ios` before `npx expo run:ios`, or the usage strings will be missing from Info.plist.

Sample clock: the fake pretends it is **Friday, Nov 20, 2026 at 6 PM** in Atlanta, so "tonight" and "this week" have content.

Screenshots: `docs/screenshots/m2-gaps/`.

## Milestone 3 routes

All run on the fake repository. Nothing calls Gelatin, nothing is charged.

| Route | Screen | Issue |
|---|---|---|
| `/manage` | Manage: **New event** opens Create New Event; an event row opens its Lineup; Members, Tiers and Marketing open a labelled placeholder | GEL-1007 |
| `/organizer/events/new` | Create New Event: five section cards (Event details, Date & time, Location, Lineup with a New pill, Access & passes), **Save as draft**, **Create & publish** | GEL-1008 |
| `/organizer/events/[id]/edit` | The same form for a saved event (`?open=when` jumps to Date & time) | GEL-1008 |
| `/organizer/events/details` | Event details for the open draft: name, tagline, description | GEL-1008 |
| `/organizer/events/when` | Date & time and Location: month calendar, Starts and Ends on the half hour, venue, city; times are the venue's wall clock in its IANA zone | GEL-1008 |
| `/organizer/events/[id]/lineup` | Lineup: blocked, empty, DJs added (Your offer, Note to [DJ], fee-missing), in motion (status, money line, one action). `id` is `new` for an unsaved event | GEL-1009 |
| `/organizer/events/[id]/published` | After Create & publish: "[Event] is live", with no lineup or with open bookings | GEL-1010 |

Deep links work for each, for example `memberly://organizer/events/e_warehouse_friday/lineup`.

Sample events: **Warehouse Friday** has bookings in every in-motion state; **Long Table** has none (empty Lineup); **Late Service** is a draft with two DJs added and no offers sent (KOYO at the published rate, NIGHTFORM on a private rate with no fee yet); **River Street Social** (added in M4) is a draft in Savannah, where Gelatin has no DJs yet.

Manage in Gelatin, Other DJs open that night and Access & passes open labelled placeholders for milestone 6, or the web page until it is native. Send offers and Pay now are built in milestone 5. Screenshots: `docs/screenshots/m3/`.

## Milestone 4: Browse talent (GEL-1012 to GEL-1015)

Still the fake repository. Nothing calls Gelatin, nothing is sent to a DJ and nothing is charged.

| Route | Screen | Issue |
|---|---|---|
| `/organizer/events/[id]/browse` | Browse talent, a full-screen modal over Lineup, opened by Lineup's **Browse talent** and **+** (and **Add talent** after publishing). DJ cards with photo or initials, tier, genres, draw, rate and **Add** / **Added**; Budget and Genre chips; pages of four by cursor with a quiet spinner row; **Done · N added** closes back to Lineup, which shows the added DJs with their offer fields | GEL-1012 |
| (sheet on Browse) | Filters: the event's city and night shown locked, one budget band, one genre, **Show N DJs**, **Reset**. Dismissing the sheet (tap outside or pull down) changes nothing. When nothing matches, Browse says so and offers **Any budget · N**, **Any genre · N** and **Show all N** | GEL-1013 |
| (sheet on Browse) | DJ profile: tap a card (not its button). Large photo, name, tier, genres, published rate or Private rate, 90-day draw, a short bio when there is one. **Add to lineup** adds and closes; once added the button reads **Added** and removes | GEL-1014 |
| (states of Browse) | Loading skeletons, no DJs in this city with **Notify me**, catalog unavailable and offline with **Try again** | GEL-1015 |

Deep link: `memberly://organizer/events/e_long_table/browse`.

The screen only names the event. The repository works out the city and the night from the saved event (`getTalent(eventId, { budget, genre, cursor })`), which is how the backend will do it. So an event that has never been saved is saved as a draft the first time Browse talent opens from its Lineup, and a live event with an unsaved date or city change is asked to save first.

### Sample catalog

Ten invented Atlanta DJs across the four tiers and four budget bands, two with a private rate and two with no draw yet (`sampleCatalog` in `src/data/fakeRepository.ts`). KOYO and NIGHTFORM have photos; the rest show initials. The fake leaves out a DJ who is taken that night (OKTAVE on Sun, Nov 22) or who already holds a booking on the event, and never says why.

### Reaching each state

| State | How |
|---|---|
| Browse list, paging | Manage → **Long Table** → **Browse talent**. Scroll to load the next four |
| Already added | Manage → **Late Service** → **+** (KOYO and NIGHTFORM show **Added**) |
| Filters too tight | Filters → pick **Techno**, then **Under $300** → **Show 0 DJs** |
| No DJs in this city | Manage → **River Street Social** (a draft in Savannah) → **Browse talent**, or `memberly://organizer/events/e_river_street/browse` |
| Loading skeletons | `memberly://organizer/events/e_long_table/browse?simulate=loading` (holds for 12 seconds, then loads) |
| Catalog unavailable | `memberly://organizer/events/e_long_table/browse?simulate=unavailable` (**Try again** keeps failing; close Browse and open it normally to recover) |
| Offline | `memberly://organizer/events/e_long_table/browse?simulate=offline` (reconnects after 12 seconds and loads by itself). On a device, airplane mode does the same through `expo-network` |

`simulate` works in development builds only and only acts on the fake repository (`src/features/talent/devSimulation.ts`). Open a deep link on the simulator with `xcrun simctl openurl booted "<link>"`. Tests set the same states through `createFakeRepository({ talentMode })`.

None of these states touches Save or Publish. Screenshots: `docs/screenshots/m4/`.

### What M8 needs for the live catalog

`getTalent` → `GET /app/events/:id/talent?budget=&genre=&cursor=&limit=` (map `published_rate_cents`, `draw`, `next_cursor`, `city_supported`; throw `CatalogUnavailableError` on `503 catalog_unavailable`), `getTalentGenres` → `GET /app/talent/genres`, `joinCityWaitlist` → `POST /app/talent/city-waitlist`. Unsent offers (`addDraftOffer` and friends) have no endpoint in the issues yet.

## Milestone 5: offers, the card hold and Get a pass (GEL-1018, GEL-1019, GEL-1020, GEL-1036)

Still the fake repository. There is no backend, nothing calls Gelatin, **no payment is real and the Stripe SDK is not installed**. Where the payment sheet will be, a test payment sheet stands in (see "Where Stripe plugs in").

| Route | Screen | Issue |
|---|---|---|
| `/organizer/events/[id]/lineup` | **Send N offers** opens the offer review sheet, one DJ at a time in the order added: the DJ's fee, the Gelatin service fee, **Held on your card** with the server's total, the three numbered lines, **Hold $457.00 and send**. Each note is saved as it is typed and counts characters from 240 of 280 | GEL-1018 |
| (sheet on Lineup and Published) | The payment sheet for the hold, then **Card held** with the status the server gives. With more DJs to send it offers **Next: your offer to [DJ]**; on the last one, **Back to your lineup** and **Add another DJ**. **Pay now** on a Lineup card and on the Published screen runs the same hold | GEL-1019 |
| (sheets on Lineup) | **DJ taken**: "[DJ] isn't available that night", nothing sent or held, never a reason, up to three DJs still open with **Offer**, and **See everyone open that night**. **Payment didn't go through** with **Try again**. Offline: "You're offline. Your offers are saved and will send when you're back." | GEL-1020 |
| `/event/[id]/pass` | **Get a pass**: a bottom sheet over the event page with the event's pass types (name, price, what's included, **Sold out**, **Free for members**). A paid pass goes through the payment sheet; a members-free pass is claimed in one tap. Then "Your pass is on your card." and the event footer reads **Show my pass** | GEL-1036 |

Deep links: `memberly://organizer/events/e_late_service/lineup`, `memberly://event/e_rooftop_hours/pass`.

### How it works

- **The server's total is the only total.** `quoteOffer` gives the review sheet its three figures before anything is sent; `createOffer` returns the request with `totalCents`; every later screen shows that number through `formatCents`. Nothing outside `src/data/fakeRepository.ts` adds a fee to an offer. `src/__tests__/noClientTotals.test.ts` reads the source and fails if feature, UI or route code adds, subtracts or multiplies amounts.
- **One DJ, one request.** Before `createOffer` is called the app writes a `clientOfferId` to secure storage (`src/features/offers/pendingOffers.ts`: one key per event and DJ, plus an index). It stays there until an answer arrives, so a retry after a timeout or after the app is closed sends the same id and the server returns the original request. Pass orders keep their `idempotencyKey` the same way (`src/features/passes/pendingPassOrders.ts`).
- **The server says how a payment ended.** After the payment sheet closes, whatever it reported, the app refetches the event's bookings and shows the status it finds. Card held appears only when the request has moved on from `authorization_required`. Booking status is not polled yet (milestone 6).
- **Offline.** Offers sent with no connection are stored with their ids and marked queued. `PendingOfferSync`, mounted at the root, sends them when the app opens and whenever the connection returns; they come back as **Payment needed** with **Pay now**.
- **Passes.** After the payment sheet succeeds the sheet asks for the order every second for up to 10 seconds. Still pending after that, it says "We're confirming your payment. Your pass will appear on your card shortly." and `PassOrderWatcher` (root) keeps asking every 3 seconds until the order settles, including after a restart. It only reads the order; it never starts a second payment. A new pass refreshes the event page, Home, Events and the Card (which now lists **Your passes**).

### Reaching each state

| State | How |
|---|---|
| Review, hold, Card held | Manage → **Late Service** → enter a fee for NIGHTFORM → **Send 2 offers** → **Hold $457.00 and send** → **Pay with test wallet** |
| Several DJs, one left unpaid | As above, then **Next: your offer to NIGHTFORM** → **Hold $607.00 and send** → close the payment sheet. Lineup shows KOYO held and NIGHTFORM **Payment needed** with **Pay now** |
| Payment cancelled | Close the test payment sheet (the round ✕, the dimmed screen, or pull it down). The card stays **Payment needed**; no error |
| Payment failed | On the test payment sheet tap **Use a declined test card**, read the message, close the sheet. **Try again** asks for a fresh session |
| DJ taken | Add **OKTAVE** to any event from Browse talent and send the offer (the sample DJ who is open in Browse and taken when the offer is sent), or `memberly://organizer/events/e_late_service/lineup?simulate=dj-taken` for whichever DJ is sent next |
| Timeout, then the same id | `memberly://organizer/events/e_late_service/lineup?simulate=timeout`: the first **Hold and send** answers "That didn't go through"; tap it again and the same request comes back |
| Offline, then sent on reconnect | `memberly://organizer/events/e_late_service/lineup?simulate=offline`, then **Send offers** within 30 seconds. The connection "returns" after 30 seconds and the offers send by themselves. On a device, airplane mode does the same |
| Expired session | `memberly://organizer/events/e_late_service/lineup?simulate=expired-session`: the first session comes back expired and is replaced without a word |
| Pay now from Published or Lineup | Manage → **Warehouse Friday** (NIGHTFORM is unpaid at $607.00) |
| Get a pass: paid, free, sold out | Home → **Rooftop Hours** → **Get a pass**: General pass $30, Member pass (free for members), Table for four (sold out) |
| Pass sold out while paying | `memberly://event/e_rooftop_hours/pass?simulate=sold-out`, then **Get** |
| Price changed | `memberly://event/e_rooftop_hours/pass?simulate=price-changed`, then **Get**: the row shows $35 and asks to confirm again |
| Payment still confirming | `memberly://event/e_rooftop_hours/pass?simulate=slow`, then **Get** and pay: after 10 seconds the "confirming" message; the pass lands about 6 seconds later |

`simulate` works in development builds only and only acts on the fake repository (`src/features/offers/devSimulation.ts`, `src/features/passes/devSimulation.ts`). Tests set the same states through `createFakeRepository({ simulation })` and `repository.fake.simulate(…)`. The fake's state lives in memory: reload the app to start again. Screenshots: `docs/screenshots/m5/`.

### Where Stripe plugs in (milestone 8)

Card holds and pass checkout take payment through one interface, `src/lib/payments`:

```ts
interface PaymentSheet {
  presentPaymentSheet(session: PaymentSheetSession): Promise<{ status: 'succeeded' | 'cancelled' | 'failed'; message?: string }>;
}
```

`PaymentSheetSession` is what Memberly's backend returns (`clientSecret`, `publishableKey`, `stripeAccountId?`, `totalCents`, `merchantDisplayName`, `expiresAt`) plus a `purpose` so the sheet can name the DJ or the pass. `PaymentsProvider` (in `src/app/_layout.tsx`) supplies the implementation, and `usePayments()` hands it to `useOfferFlow` and `usePassPurchase`. Nothing else in the app knows how a payment is taken.

Today the only implementation is the **test payment sheet** (`src/lib/payments/TestPaymentSheet.tsx`): a "Test payment" pill, the server's total, **Pay with test wallet**, **Use a declined test card**, and close. It has no card fields and never will. It is chosen only when the repository is the fake one. With any other repository and no implementation, a production build throws `PaymentsNotConfiguredError` when the provider mounts, and a development build throws it when a payment is asked for (`src/lib/payments/resolve.ts`).

To add the real sheet:

1. `npx expo install @stripe/stripe-react-native`, add its config plugin to `app.json` with the **Apple Pay merchant ID** (`merchantIdentifier`), and make a new development build. This is the one native change.
2. Write `src/lib/payments/stripePaymentSheet.ts` implementing `PaymentSheet`. For each call: set the publishable key and connected account **from the session** (`initStripe({ publishableKey: session.publishableKey, stripeAccountId: session.stripeAccountId, merchantIdentifier })`; the key is per session and is never bundled), then `initPaymentSheet({ paymentIntentClientSecret: session.clientSecret, merchantDisplayName: session.merchantDisplayName, applePay: { merchantCountryCode: 'US' }, appearance: Memberly's dark theme, brand purple button, 6px radius, Inter })`, then `presentPaymentSheet()`.
3. **No saved cards:** pass no `customerId` and no `customerEphemeralKeySecret`.
4. Map the result: no error → `succeeded`; error code `Canceled` → `cancelled`; any other error → `failed` with Stripe's `message`.
5. Pass it in: `<PaymentsProvider implementation={stripePaymentSheet}>`. `PaymentSheetOutlet` then renders nothing, because the native sheet presents itself over the app.

Check the option names above against the version of `@stripe/stripe-react-native` that `npx expo install` picks; they are written from the SDK's documented API, not from an installed copy.

The app still never marks a payment done: after `succeeded` it refetches the booking or the pass order, exactly as it does now.

### What M8 needs for offers and passes

`createOffer` → `POST /app/events/:id/offers {dj_id, offer_cents, note, client_offer_id}` (map `409 dj_unavailable`, `409 offer_open`, `400` to `RepositoryError`); `createPaymentSession` → `POST /app/bookings/:request_id/payment-session` (`409 not_payable`); `getPassTypes` → pass types for an event; `createPassOrder` → `POST /app/events/:id/pass-orders {pass_type_id, quantity, idempotency_key}` (`409 pass_unavailable`, `409 price_changed` with the new `total_cents`); `getPassOrder` → `GET /app/pass-orders/:id`. A request that never got an answer must surface as `RepositoryError('offline')` or `('timeout')`, which is what the queue and the retry act on.

Open with the backend:

- **A quote before sending.** The review sheet shows the total before the request exists, so the app calls `quoteOffer`. GEL-1016 returns `total_cents` only after `POST /offers`. Either add a quote endpoint, or the sheet changes to create the request first.
- **Payment session shape** (contract gap C in GEL-1016/GEL-1019). `PaymentSession` follows the fields listed in GEL-1016 and will change with it.
- **`price_changed`.** The app sends the price the member saw (`expectedPriceCents`) so the server can tell it changed. GEL-1035's request body does not carry it yet.
- **A pass-types endpoint** is not named in GEL-1035.

## Setup

Requires Node 22 or 24 LTS, Xcode with an iOS simulator, and (for Android) Android Studio.

```bash
npm install
npx expo run:ios       # builds and opens the development build on a simulator
npx expo run:android   # same for Android
```

If `pod install` fails with `Unicode Normalization not appropriate for ASCII-8BIT`, your shell isn't UTF-8. Run `export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` and try again.

After the first build, `npx expo start` serves JavaScript to the installed development build.

## Environment

The app holds no secrets. There is no Gelatin key, partner key or Stripe secret in this project, and there never will be: Memberly's backend holds the Gelatin partner key and proxies every call.

Milestone 8 adds one public setting, read at build time:

```bash
EXPO_PUBLIC_API_BASE_URL=https://<memberly-backend-test-host>
```

It points at Memberly's backend wired to **Gelatin's test environment only**. Live keys are never used from this app.

## Tests

```bash
npm test               # Jest (jest-expo) and React Native Testing Library
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
```

Milestone 2 adds: the sign-in gate's routing decision (signed out, needs onboarding, ready, edit mode) and a real-routes test that a deep link resumes after sign-in; code verification (1234, wrong, 0000 expired) and the resend countdown; the three-pick minimum on Preferences and Skip; Explore filter counts, Reset, the search pause and its empty state; Events scope grouping and pills; the Memberly Card online, "Shown offline" from cache, and never an expired token; Home's featured card choice and lineup line; and every motion component with Reduce Motion on (Welcome shows the poster and starts no video).

Covered so far: all eight booking statuses and their labels, actions and polling rule; money formatting (the app shows the server's total and never computes one); event times in the venue's time zone; the fake repository; and the StatusPill, Button and MoneySummary components.

Milestone 3 adds: Create New Event completeness and the publish button's reason ("Add a date to publish"); "Ends the next morning" and the time-zone label ("Eastern Time, from the venue"), venue wall time to an instant across daylight saving; offer fee parsing and the fee-missing rule that disables **Send N offers**; the status money lines and the published-screen rows; save, publish and draft offers in the fake repository; and the Lineup screen rendering blocked, empty, DJs added and in motion (React Native Testing Library), plus the Create New Event form.

Milestone 5 adds: the fake server's offers, sessions and pass orders (idempotent by `clientOfferId` and `idempotencyKey`, `dj_unavailable` with no reason, `offer_open`, `not_payable`, `pass_unavailable`, `price_changed`); the stored `clientOfferId` across a timeout and a cold start, with one request in the fake; the review sheet showing the quoted total (including a total that is not fee plus $7); hold success showing the server's status, and a lagging server leaving it "Payment needed"; cancel and failure; an expired session replaced silently; DJ taken with no reason text; the offline queue sending on reconnect with the same ids; two DJs in sequence with one left unpaid; Pay now from Lineup and Published; which payment sheet is chosen and that the test sheet has no card fields; pass purchase paid, free, sold out, price changed, slow confirmation and idempotent retry; the event footer; and the guard that fails if feature or UI code does arithmetic on amounts.

Milestone 4 adds: the budget pills mapped to the API's band ids and the single-select filter state; the Filters sheet applying, resetting and changing nothing when dismissed; the too-tight state and its one-tap loosening; adding and removing across pages and the Lineup showing the result; `Private rate` and `Draw not yet established`; each card as one VoiceOver sentence; the DJ profile's add and remove; loading skeletons, the city with no coverage and Notify me called once, catalog unavailable with Try again, offline recovering on reconnect; and the fake repository deriving the city and the night from the saved event, paging by cursor and keeping private-rate DJs in their band.

## The test-mode booking flow (milestones 3–8)

1. An organizer opens Create New Event, sets the night and city, and opens **Lineup**.
2. **Browse talent** lists DJs open that night in that city, from Gelatin.
3. The organizer adds DJs and enters a fee and an optional note for each. Each DJ is a separate booking with its own card hold.
4. Memberly's backend creates the booking request with an idempotency key. The app shows the server's total, for example $457.00 for a $450 offer.
5. The card hold runs in the native payment sheet inside the app (decided 6 Nov 2026; Stripe test cards and Apple Pay in test mode from milestone 8, a test payment sheet until then). The DJ sees nothing until the hold succeeds.
6. The Lineup section polls status through Memberly's backend every 5 seconds while the DJ is deciding, and shows each status in plain words.
7. Counters, new prices, changes and refunds open in Gelatin's portal through a single-use link, and return to the app.
8. Publishing never waits on talent; an event can go live with no lineup.
