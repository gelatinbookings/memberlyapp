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
| 6 | Live booking status, alternates, the hand-off to Gelatin on a test portal, date changes with bookings (fake data) | Done |
| + | Home "+" button, Create community, Add a pass for a community or an event (GEL-1055 to GEL-1057, fake data) | Done |
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
    organizer/events/  Create New Event, its sub-screens, Lineup and Published (M3); [id]/passes, the event's passes
    organizer/communities/  new (Create community) and [id]/passes (Tiers)
    organizer/passes/  new and [id]: the pass form, for a community or an event
    return/portal.tsx  Where Gelatin's portal sends the organizer back: memberly://return/portal?event=<id> (M6)
    kit.tsx            Parts kit: every component in every state (dev only)
    later.tsx          Labelled stop for screens a later milestone builds
  components/
    ui/                Shared components (Button, Chip, StatusPill, MoneySummary, Toggle, …)
    motion/            Rise (stagger), DrawnCheck
    navigation/        The floating tab bar
  features/
    booking/           Status mapping, money formatting, lineup summary, offer validation, status lines, "Last updated"
    events/            Event rows, grouping, Create New Event (form, sections, calendar, draft context), date change with bookings (M6)
    lineup/            The Lineup section: blocked, empty, DJs added, in motion, the live status pill, alternates (M6)
    handoff/           Continue in Gelatin: the sheet, minting a launch at tap time, the return (M6)
    talent/            Browse talent: DJ cards, Filters sheet, DJ profile sheet, edge states, dev simulation
    offers/            Sending offers: review sheet, card hold, Card held, DJ taken, payment failed, offline queue (M5)
    passes/            Get a pass: pass types sheet, order, wait for paid, the order watcher (M5)
    create/            The Create sheet behind Home's "+" and its provider
    communities/       Create community: the two steps, the city sheet, choice cards, the cover thumb
    passSetup/         Pass setup: the pass form, the pass lists (Tiers, Access & passes), routes
    navigation/        Labelled placeholders for later milestones
    auth/              Session context, the sign-in gate, code entry, sheets, Welcome video backdrop
    preferences/       The four preference steps and the minimum-three rule
    explore/           Search and filter logic (shared with the fake), the Filters sheet
    card/              Memberly Card: view, offline cache, brightness
    home/              Home's featured card logic, the Tonight map, map placeholder
    launch/            The animated launch splash
    permissions/       OS permission prompts
  data/                Types, repository interface, fake repository, query hooks
  lib/                 Query client, dates, payments (the payment sheet interface and its test stand-in),
                       portal (the way into Gelatin: interface, the in-app browser, and the test portal)
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
| Sign in → **Test accounts** → pick one | Signs in as that test account (see "Test accounts" below) |
| Sign in or Create account with a test account's email, code **1234** | The same test account |
| Create account, any other name and valid email, code **1234** | A new member under that name with nothing joined: Preferences, then Permissions, then Home |
| Sign in, any other valid email, code **1234** | The existing organizer (Jordan): straight to Home, or the deep link |
| Code **0000** | "That code expired. We sent a new one." and the countdown restarts |
| Any other code | "That code doesn't match. Check the latest email or resend." |
| Continue with Google / Continue with Apple | Signs in the existing organizer (Jordan) directly (no native sheet yet) |

### Test accounts

Four people on the sample (fake) backend, one for each stage of the product. They are defined in one file, `src/data/testAccounts.ts`: who each is and what each sees. The emails are on the reserved `.test` domain, so none can be anyone's.

| Account | Email | Lands on | What it shows |
|---|---|---|---|
| **New user · account created** | `new.user@memberly.test` | Preferences, step 1 | Onboarding still to do. After it: Home with tonight's top event and "No passes yet", Events empty, a Card with no memberships, four tabs. Not an organizer |
| **New organizer · setup to finish** | `new.organizer@memberly.test` | Home | Runs a new community, Porchlight Social, with one member and no events. **Manage** shows Finish setting up (Connect Stripe), $0 / +0 / – with "No sales or new members yet…", and "No events yet" with **New event**. No passes or memberships of their own |
| **Existing organizer · active booking and event** | `jordan@secondsundays.test` | Home | The sample person as before (Jordan Reese): Second Sundays, Warehouse Friday live with bookings in motion, Sunday Sessions in every status, Long Table, Late Service, River Street Social, one pass tonight and four memberships. Continue with Google and Continue with Apple sign in this account |
| **Existing member · no community yet** | `member@memberly.test` | Home | Two passes (Warehouse Friday tonight, Daylight) and three memberships, one lapsed. Four tabs, no Manage. **Me** has **Start a community**, which opens Create community. |

**How to sign in as one**

1. On Welcome, tap **I already have an account**.
2. At the bottom of the Sign in sheet, tap **Test accounts** ("Running on sample data. Test accounts").
3. Pick an account. It signs in at once: no email, no code.

Or type the account's email on Sign in (or Create account) and enter the sample code **1234**. To switch, **Me → Sign out**, then pick another. With `EXPO_PUBLIC_FAKE_SIGNED_IN=1` the app opens already signed in as the existing organizer; sign out first.

**How it works**

- **The Test accounts link shows whenever the app is running on the fake repository, in development and release builds alike**, and never with a real repository: its one switch is `getFakeControls(repository)`, not `__DEV__`. A standalone build that ships the fake has it; the first build wired to Memberly's backend does not.
- **Each account has its own world.** The fake keeps a separate set of events, bookings, unsent offers, passes, pass orders, preferences and simulated edge states per account, made the first time the account is used and kept until the app reloads. Tonight's events, communities and DJs are one shared catalog. Nothing one account does (an offer sent, a pass bought, an event created) shows for another; switching back finds your own changes still there.
- **Nothing is left over from the last person.** Signing in and signing out clear the query cache. Signing in as a different person also clears what the phone keeps between launches: the offline copy of the card, offers queued to send, and pass orders still settling (`src/features/auth/deviceOwner.ts`). The same person signing back in keeps theirs, so a queued offer still goes out under the id it already has.
- **At a cold start the app's repository answers nothing until it has read who is signed in** (`holdUntilSession`), so a screen that asks early is never answered as the wrong person. An HTTP repository does the same by reading its token before the first request.
- **Onboarding is remembered for the session.** Finish or skip it as the new user and the next sign-in as them goes straight to Home, until the app reloads.
- **Start a community** shows for anyone signed in who runs no community, and opens Create community (GEL-1056).

Screenshots: `docs/screenshots/test-accounts/`.

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

Access & passes opens a labelled placeholder until the web page is native. Send offers and Pay now are built in milestone 5; Manage in Gelatin and Other DJs open that night in milestone 6. Screenshots: `docs/screenshots/m3/`.

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
- **The server says how a payment ended.** After the payment sheet closes, whatever it reported, the app refetches the event's bookings and shows the status it finds. Card held appears only when the request has moved on from `authorization_required`. From there the Lineup polls status (milestone 6).
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

## Milestone 6: live status, alternates, the hand-off to Gelatin, date changes (GEL-1022 to GEL-1025)

Still the fake repository. There is no backend, **nothing calls Gelatin**, and Gelatin's portal is not connected: where it will open, a **test portal** stands in (see "Where the real portal plugs in").

| Route | Screen | Issue |
|---|---|---|
| `/organizer/events/[id]/lineup` | Every booking shows its status pill, one money line and one action, from the status table in `src/features/booking/status.ts`. A status the app does not know reads **Checking status**, grey, with no action. While any booking is `requested` or `negotiating` the list asks again every 5 seconds and says "Updates every few seconds while a DJ is deciding."; a change cross-fades the pill and is announced ("KOYO: Confirmed"). If the answer is stale or a refresh fails, the last known lineup stays with a quiet "Last updated 2 min ago" | GEL-1022 |
| (sheet on Lineup) | **Other DJs open that night**, from a Passed, Expired or Cancelled card: the DJ it was with greyed at the top, up to three open DJs with **Offer**, **See everyone open on Nov 20** (Browse talent) and **Search another date** (Date & time). Offer adds the DJ as an unsent offer; the ended card stays below it. Never a reason, a message or any history | GEL-1023 |
| (sheet on Lineup and Date & time) | **Continue in Gelatin**, from **Manage in Gelatin** and **Review the new offer in Gelatin**: where the organizer is going and how they get back, then **Open in Gelatin** | GEL-1024 |
| `/return/portal?event=<id>` | Where Gelatin's portal sends the organizer back. Closes the portal and lands on the event's Lineup, which reads the bookings again and shows "Back from Gelatin. Your lineup is up to date." | GEL-1024 |
| `/organizer/events/when` | Date & time on a saved event with bookings: picking another date opens a dialog and **the date does not change**. With a confirmed DJ: "KOYO is confirmed for Fri, Nov 20", **Keep this date** / **Manage in Gelatin**. With open offers: "Change the date to Sat, Nov 21?", the offers are for the current date and are handled in Gelatin first, **Keep Fri, Nov 20** / **Manage in Gelatin** | GEL-1025 |

Deep links: `memberly://organizer/events/e_sunday_sessions/lineup`, `memberly://return/portal?event=e_warehouse_friday`.

### How it works

- **Polling follows the bookings, the screen and the app.** `useEventBookings(eventId, { live })` sets TanStack's `refetchInterval` to a function: 5 seconds while any booking is `requested` or `negotiating`, off otherwise. The Lineup passes `live` only while it is the screen in front and Gelatin's portal is not over it. The query client already follows AppState and the connection (`src/lib/queryClient.ts`), so polling pauses in the background and offline, and a live list is never treated as fresh, so it reads once at once on the way back.
- **Conditional reads.** `getEventBookings(eventId, { ifNoneMatch })` answers `{ notModified: true }` or `{ bookings, etag, stale? }`. Every read goes through `eventBookingsFetcher` (`src/data/RepositoryProvider.tsx`), which keeps the last ETag per event beside the bookings and, on "not modified", hands back the very list already in the cache: nothing renders.
- **Behind, not broken.** `stale: true` or a failed refresh never clears the screen. `useBookingsFreshness` says the list may be behind and since when; the Lineup shows "Last updated N min ago" in place of the polling line and keeps trying. Only a first load that fails is an error screen.
- **Everything after the first payment is Gelatin's.** The app has no counter form, no accept or decline, no capture logic. `reauthorization_required` shows "New offer from the DJ" with the DJ's price when Gelatin sends one, and one button into Gelatin. An unpaid booking has no Gelatin link at all.
- **A launch is minted at the tap.** `createPortalLaunch(requestId)` is called when **Open in Gelatin** is tapped, never when the sheet or the Lineup opens. The launch (single use, 60 seconds) lives in one local variable on its way to the portal: it is not in the query cache, not stored and not logged. One that arrives already expired is replaced once, silently; if the replacement has expired too the sheet says "That link expired. Tap again to open Gelatin."
- **Coming back.** When the portal closes, however it closed, the bookings are read again at once and polling resumes if a DJ is still deciding. The notice appears only when Gelatin sent the organizer back (not when they closed the portal themselves) and only after that read succeeded.
- **Sheets outlive the list.** The hand-off, the alternates sheet and the portal are held in `LineupView`, above every lineup state, so a status changing underneath (or a card moving down when its booking ends) never takes an open sheet with it. Booking cards are one keyed list for the same reason: a card that moves is the same card, so its pill still fades and the change is still announced.
- **The date is never changed behind a booking.** Date & time asks `useDateChangeGuard` before it takes a new date. A confirmed DJ, or an open offer, keeps the event on its date; DJs added but not sent do not, and the screen says they will be re-checked for the new night. The fake server refuses the same save (`confirmed_booking`, `open_bookings`), and the form shows the same dialog if that happens.

**Not built, on purpose (contract gap A in GEL-1025):** withdrawing open offers. Gelatin's Partner API has no confirmed route to withdraw a request before the DJ accepts, so the app does not withdraw, does not release a hold and does not work around it. The open-offers dialog sends the organizer to Gelatin instead of the board's "cancels the request and releases the hold". The copy and a comment naming the gap are in `src/features/events/dateChange.ts`; that file is where the withdraw path goes when Gelatin confirms a route.

### Reaching each state

| State | How |
|---|---|
| Every status in one list | Manage → **Sunday Sessions**, or `memberly://organizer/events/e_sunday_sessions/lineup` (one booking in each of the eight statuses) |
| Polling | Manage → **Warehouse Friday** (BLKMTN is waiting, so the line "Updates every few seconds…" shows) |
| A status changes | On Warehouse Friday: **Manage in Gelatin** on BLKMTN → **Open in Gelatin** → pick an outcome in the test portal → **Back to Memberly** |
| Negotiating, then New offer from the DJ | In the test portal: **Counter at a new price** → **Back to Memberly**. The card reads Negotiating; about 6 seconds later a poll brings "New offer from the DJ" at the DJ's price |
| Passed, Expired, Cancelled | In the test portal: **Pass**, **Let it expire**, **Cancel booking** |
| Alternates | **Other DJs open that night** on any ended card. **Offer** adds the DJ to the lineup |
| Alternates, nobody open | `memberly://organizer/events/e_sunday_sessions/lineup?simulate=no-alternates`, then **Other DJs open that night** |
| Back from Gelatin | **Back to Memberly** in the test portal. **Close** (top left) is the organizer closing the portal themselves: the lineup refreshes with no notice |
| The return link itself | With the test portal open: `xcrun simctl openurl booted "memberly://return/portal?event=e_warehouse_friday"` |
| Last updated (stale) | `memberly://organizer/events/e_warehouse_friday/lineup?simulate=stale`. Stale answers start 3 seconds after the screen opens; wait a minute for "1 min ago" |
| Last updated (refresh fails) | `memberly://organizer/events/e_warehouse_friday/lineup?simulate=refetch-fails` |
| Checking status | `memberly://organizer/events/e_warehouse_friday/lineup?simulate=unknown-status` (the first booking reports a status the app does not know, 3 seconds in) |
| Expired launch, replaced silently | `memberly://organizer/events/e_warehouse_friday/lineup?simulate=expired-launch`, then Manage in Gelatin → Open in Gelatin: the portal opens as usual on the second launch |
| Date change, confirmed DJ | Manage → **Warehouse Friday** → pencil → **Date & time** → tap another day |
| Date change, open offers | First cancel KOYO in the test portal (Manage in Gelatin on KOYO → **Cancel booking**), then Date & time → tap another day |
| Date change, DJs added but not sent | Manage → **Late Service** → pencil → **Date & time** → tap another day: the date changes and a notice says the DJs are re-checked for the new night |

`simulate` works in development builds only and only acts on the fake repository (`src/features/lineup/devSimulation.ts`). Tests set the same states through `createFakeRepository({ simulation })`, `repository.fake.simulate(…)`, `repository.fake.setStatus(requestId, status)` and `repository.fake.playDj(requestId, action)`. `repository.fake.bookingFetches(eventId)` counts full and "not modified" reads. The fake's state lives in memory: reload the app to start again. Screenshots: `docs/screenshots/m6/`.

### Where the real portal plugs in

The hand-off opens Gelatin through one interface, `src/lib/portal`, the same shape as payments:

```ts
interface Portal {
  openPortal(launch: PortalLaunch): Promise<'returned' | 'dismissed'>; // { launchUrl, expiresAt }
  completeReturn(): boolean; // the return link arrived: close what is open
}
```

`PortalProvider` (in `src/app/_layout.tsx`) supplies it and `usePortal()` hands it to `useGelatinHandoff`. Nothing else in the app knows how Gelatin is shown.

- **The real implementation is already written:** `src/lib/portal/webBrowserPortal.ts` opens the launch URL with `expo-web-browser`'s `openBrowserAsync` (SFSafariViewController on iPhone; no WebView, no embed). It is chosen automatically whenever the repository is **not** the fake one, so milestone 8 needs no change here. It needs no new native module.
- **The return:** Gelatin's portal finishes by opening `memberly://return/portal?event=<event id>` (GEL-1017 registers the origin). Expo Router shows `src/app/return/portal.tsx`, which calls `completeReturn()`: the browser is dismissed, `openPortal` resolves `returned`, and the Lineup reads the bookings and shows the notice. If the app was closed in the meantime, the route opens the event's Lineup instead, which does the same. Tapping Done in the browser resolves `dismissed`: a refresh and no notice.
- **Today, on the fake repository, the portal is the test portal** (`src/lib/portal/TestPortalScreen.tsx`): a full screen with a "Test portal" pill, one line saying it stands in for Gelatin, the booking, and buttons that play the DJ (**Accept**, **Pass**, **Counter at a new price**, **Let it expire**, **Cancel booking**), plus **Back to Memberly** and **Close**. Fake launches point at `https://gelatin-portal.invalid`, which resolves nowhere. It is not a design for anything in Memberly: the organizer's real actions happen in Gelatin.
- To use another implementation (a different browser, a mock in a test), pass it in: `<PortalProvider implementation={…}>`.

Not exercised against a real page yet: `openBrowserAsync` and `dismissBrowser` are covered by unit tests with the module mocked, and the return route by tests and on the simulator with the test portal, but no real Gelatin URL has been opened. On Android `openBrowserAsync` resolves as soon as the tab opens and there is nothing to dismiss; the return route already covers that case, and Android is paused.

### What M8 needs for status, alternates and the portal

`getEventBookings` → `GET /app/events/:id/bookings` with `If-None-Match` (map `304` to `{ notModified: true }`, the `ETag` header to `etag`, and `stale`; pass unknown statuses through); `getAlternates` → `GET /app/bookings/:request_id/alternates` (throw `CatalogUnavailableError` on `503`); `createPortalLaunch` → `POST /app/bookings/:request_id/portal-launch` mapping `{ url, expires_at }` to `{ launchUrl, expiresAt }` (never log or cache the answer; `409` before a hold → `portal_unavailable`); `saveEvent` → map the date-change refusals to `RepositoryError('confirmed_booking' | 'open_bookings')`. `logEvent` in `src/lib/analytics.ts` reports an unknown status once per status; it goes nowhere until an analytics provider sets a sink.

Open with the backend:

- **Withdrawing a request before acceptance** (contract gap A): see above. Until then the open-offers branch is "Manage in Gelatin" only.
- **An unpaid offer blocks a date change and has no way out in the app.** With every open offer still `authorization_required` there is no hold, so no Gelatin link: the dialog offers only **Keep [date]**. Whether an unpaid request should hold the date at all, or lapse, is a product and backend decision.
- **The DJ's new price.** `Booking.newOfferCents` carries the counter for "came back at $520"; GEL-1021's field list does not name it. Without it the card uses the helper from GEL-1024 ("proposed new terms…").
- **The return link's shape** (`memberly://return/portal?event=`) follows this build; GEL-1017 owns the registered origin and may change it.
- **Push for "DJ accepted"** (contract gap D) is undecided; the app promises none and polls only while the Lineup is open.

## Create: the "+" button, Create community and Add a pass (GEL-1055, GEL-1056, GEL-1057)

Still the fake repository; it stands in for the endpoints in GEL-1058. Nothing reaches Stripe: **Connect Stripe** is a labelled stop.

| Route | Screen | Issue |
|---|---|---|
| `/` (Home) | A round 56pt purple **+** (`Fab`, in the Parts kit) 16pt from the right edge and 12pt above the tab bar; Home's content scrolls clear of it. VoiceOver reads it as "Create". On Home only | GEL-1055 |
| (sheet on Home) | **Create**: **Create community**, **Add event**, **Add pass**, each with an icon and one line. Add event with one community opens Create New Event for it; with several, a second step **Add an event for** lists them. Add pass asks **Add a pass for**: **A community** (listed, or skipped with one) or **An event** (upcoming events with cover, name and date; with none, "No upcoming events" and **New event**). Someone who runs no community sees Add event and Add pass disabled and "Start a community to add events and passes." A back arrow returns to the three rows; a swipe down or a tap on the dim closes it and changes nothing | GEL-1055 |
| `/organizer/communities/new` | **Create community** in two steps under a two-part step header. **Community details**: cover photo (the iOS photo picker; optional, a muted tile otherwise), name, city (sheet), type (the six Explore types), description (280 characters). **Membership pricing**: **Free to join** or **Paid membership** (name, default "Member", and a monthly price in whole dollars, with "You'll connect Stripe before you can take payments."). The button says what is missing ("Add a name to continue"). Back keeps step 1; Back on step 1 with anything entered asks before discarding (the edge swipe is off on this screen); a failed save keeps everything and offers **Try again**. Creating carries a key made on the phone, so a retry makes one community. Then the app opens that community's Manage | GEL-1056 |
| `/manage?community=<id>` | Manage for one community. With several, chips at the top switch between them. **Tiers** opens the community's passes; **Finish setting up → Connect** for Stripe is a labelled stop | GEL-1056, GEL-1057 |
| `/organizer/communities/[id]/passes` | **Tiers**: each membership with its monthly price, members (against the limit), what's included, **Off** when turned off, and "Not on sale until Stripe is connected" for a paid one waiting on Stripe, under the notice "Connect Stripe to sell paid passes". **Add pass**; empty: "No passes yet" | GEL-1057 |
| `/organizer/events/[id]/passes` | **Access & passes** for one event, the same list with quantities ("40 of 48 held") and a summary line ("2 passes · from $30"). Reached from the Access & passes section of Create New Event, which shows the same summary. A new event is saved as a draft first, as Browse talent does | GEL-1057 |
| `/organizer/passes/new?community=<id>` / `?event=<id>` | The pass form. Community pass: name, **Free** or **Monthly** price, one line of what's included, an optional member limit. Event pass: name, **Free** or **Paid**, included, optional quantity, **Free for members**. Save stays disabled and says why ("Add a name to save", "Enter a price to save"). Saving is idempotent and lands on the pass list | GEL-1057 |
| `/organizer/passes/[id]?community=<id>` / `?event=<id>` | Edit a pass and turn it off (**On sale**). A pass nobody holds can be deleted after a confirmation; one people hold says "894 people hold this pass. You can turn it off, but it can't be deleted." | GEL-1057 |

Deep links: `memberly://organizer/communities/new`, `memberly://organizer/communities/c_second_sundays/passes`, `memberly://organizer/events/e_long_table/passes`, `memberly://organizer/passes/new?event=e_late_service`.

### How it works

- **One account, one world.** `createCommunity`, the pass methods and `updatePass` act on the signed-in test account's own world in `src/data/fakeRepository.ts`. A community one account creates is never seen by another. Creating a community makes the account an organizer at once (`getViewer().roles` gains `organizer`, `getOrganizedCommunities` lists it), so the Manage tab appears and Me lists it under **You organize**.
- **Stripe is never connected in this build.** A paid membership or pass saves with `sellable: false` and adds the **Connect Stripe** setup task to its community. `getPassTypes(eventId)` (Get a pass) lists passes that are turned on and sellable; free passes are on sale at once and read **Free** with **Claim**. Sample passes stay on sale as before.
- **Money.** Prices are typed as whole dollars and sent as integer cents; lists show them through `formatRate`/`formatCents`. Nothing is added, and nothing about any fee appears.
- **Idempotent.** Create community and each new pass carry a key made once per visit (`newClientId`); the fake returns what the first call made. Tests drop the answer with `repository.fake.simulate({ timeoutNextSave: true })`.
- **The sheet outlives Home.** `CreateSheetProvider` sits in `src/app/(tabs)/_layout.tsx`, above the tabs; Home only asks it to open. It mounts on the first tap, so it reads nothing until someone uses it.

### Reaching each state

| State | How |
|---|---|
| Create sheet, organizer with one community | Sign in → Test accounts → **Existing organizer** (or **New organizer**) → **+** |
| Create sheet, several communities | As an organizer, create a second community (**+** → Create community), then **+** → Add event: "Add an event for" |
| Create sheet, runs no community | Test accounts → **Existing member** or **New user** → **+**: Add event and Add pass are disabled |
| Create community | **+** → Create community, or Me → **Start a community** (anyone who runs no community) |
| A failed create | Not reachable on the simulator; covered by tests (`timeoutNextSave`, `offline`) |
| New community's Manage, "No events yet", Connect Stripe | Finish Create community with **Paid membership** |
| Add pass for a community, skipped list | **+** → Add pass → A community (one community) |
| No upcoming events | New organizer (or a just-created community) → **+** → Add pass → An event |
| Tiers, with a pass waiting on Stripe | Manage → **Tiers**, after adding a paid pass |
| A pass people hold | Existing organizer → Manage → Tiers → **Member** (894 members): no Delete |
| Access & passes with passes | Manage → **Warehouse Friday** → pencil: "2 passes · from $30" |
| A new pass in Get a pass | Add a free pass to **Long Table**, then `memberly://event/e_long_table` → **Get a pass** |

Screenshots: `docs/screenshots/create/`.

### What M8 needs for create and pass setup

`createCommunity` → `POST /app/organizer/communities` (the cover goes first to `POST /app/uploads/cover`; send `cover_upload_id`, not the local `{ uri }` the fake keeps); `getCommunityPasses` / `createCommunityPass` → `GET|POST /app/organizer/communities/:id/passes`; `getOrganizerEventPasses` / `createEventPass` → `GET|POST /app/organizer/events/:id/passes`; `updatePass` → `PATCH /app/organizer/passes/:id`. After a create, read `GET /app/me` and `GET /app/organizer/communities` again (`refreshAfterCommunity`).

Open with the backend:

- **Deleting a pass.** GEL-1058 lists only `PATCH {active}`. The app offers Delete for a pass nobody holds (`deletePass`, refused with `pass_held` once anyone does); it needs a `DELETE` route or should be removed.
- **The membership a paid community starts with.** The fake makes it the community's first pass; whether the backend does the same is not stated.
- **"Members see it when they join."** Joining is not in the app yet, so community passes are shown to organizers only.

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

The test accounts add: the seed (four accounts, `.test` emails); what each account's repository answers (viewer and roles, onboarding, preferences, memberships, card, passes, my events, organized community and overview, bookings, unsent offers); signing in by email and code from either sheet, any other email as before, and Google / Apple still signing in the existing organizer; that one account never sees another's bookings, offers, events, passes, preferences or simulated states, and finds its own again on return; the repository holding early calls until the session is read; the Test accounts sheet (listed by label and description, marked as test data, signs in as each, absent without the fake repository, no `__DEV__` switch); Home, Events, the Card, Manage and Me for each account, with Start a community for anyone who runs none (the existing member and the new user); where each lands on the real routes (Preferences for the new user, Home for the rest) and whether the Manage tab is there; that switching leaves nothing of the last account in the query cache; and what the phone keeps or clears when a different person signs in.

Milestone 6 adds: the fake server's ETag (changes only when bookings change), "not modified", stale and failing reads, every test-portal action, counters, alternates with no reason, single-use 60-second launches, no launch before a hold, and the date-change refusals; all eight statuses plus unknown on the Lineup card (pill, money line, one action); the polling lifecycle on fake timers (starts on `requested`, stops on `confirmed`, nothing when unmounted or when another screen is in front, pauses in the background and offline, reads at once on return, sends `ifNoneMatch`, and a "not modified" answer renders nothing); the status announcement and the cross-fade with and without Reduce Motion; the "Last updated" line for stale and failed reads; alternates (list, Offer adds a draft below which the passed card stays, empty, no reason text, the one-booking case); the hand-off (launch minted at the tap and never logged, an expired launch replaced once, the return reading at once and showing the notice, closing the portal showing none, polling paused around the visit, the return link with and without a portal open, the one-booking case); which portal is chosen and the in-app browser portal with the module mocked; and the date-change dialogs (confirmed, open offers, unpaid only, none, drafts only, and a save the server refuses).

The Create work adds: the **+** (a 56pt button read as "Create", in the Parts kit); the Create sheet for an organizer with one community (Add event straight to Create New Event for it; Add pass → A community skipping the list; An event listing upcoming events, and "No upcoming events" with New event), with several (Add an event for, and choosing the community for a pass), and for someone who runs none (disabled rows and the line); closing on the dim changing nothing, the back arrow, and reopening at the first step; Create community's validation messages, the six types, the cover picker (mocked), Back keeping step 1, the discard question, Free and Paid (default "Member", the Stripe helper), creating once across a lost answer, offline, and afterwards the Manage tab, You organize, Manage with "No events yet", New event for that community and Connect Stripe, the community switcher and Tiers, and that no other test account sees it; the pass form for a community and an event (validation, free and paid, member limit, quantity, Free for members), idempotent save, edit and turn off, a held pass that can't be deleted, deleting one nobody holds, Tiers empty and with a pass waiting on Stripe, the setup task, Access & passes with "1 pass · free", "2 passes · from $30" and the empty line, a new event saved as a draft before its passes, a turned-off or unsellable pass leaving Get a pass, a new free pass in Get a pass, organizer-only access and the summary line.

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
