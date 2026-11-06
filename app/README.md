# Memberly app

The native Memberly app for iPhone and Android, with Gelatin talent booking built into Create New Event. Members find what's on tonight, open an event and see who is playing. Organizers run their community and book DJs without leaving Memberly.

This is the **safe direction** chosen on 4 Nov 2026: Memberly at night (dark), a map-first Home, and talent as the Lineup section of Create New Event. The design source is the "Memberly App: Design Directions" canvas, and the rules are in `../DESIGN.md` and `../PRODUCT.md`.

## Status

| Milestone | Scope | State |
|---|---|---|
| 1 | Design tokens and shared components | Done |
| 2 | App shell and navigation; sign-in, onboarding, Explore filters, Events, Memberly Card, Me (fake data) | Done |
| 3 | Create New Event with the Lineup section (fake data) | Done |
| 4 | Browse talent, filters, DJ cards | |
| 5 | Offer and card hold | |
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
    navigation/        Labelled placeholders for later milestones
    auth/              Session context, the sign-in gate, code entry, sheets, Welcome video backdrop
    preferences/       The four preference steps and the minimum-three rule
    explore/           Search and filter logic (shared with the fake), the Filters sheet
    card/              Memberly Card: view, offline cache, brightness
    home/              Home's featured card logic, the Tonight map, map placeholder
    launch/            The animated launch splash
    permissions/       OS permission prompts
  data/                Types, repository interface, fake repository, query hooks
  lib/                 Query client, dates
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

Sample events: **Warehouse Friday** has bookings in every in-motion state; **Long Table** has none (empty Lineup); **Late Service** is a draft with two DJs added and no offers sent (KOYO at his published rate, NIGHTFORM on a private rate with no fee yet).

Browse talent, Send offers, Pay now, Manage in Gelatin, Other DJs open that night and Access & passes open labelled placeholders for milestones 4, 5 and 6, or the web page until it is native. Screenshots: `docs/screenshots/m3/`.

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

## The test-mode booking flow (milestones 3–8)

1. An organizer opens Create New Event, sets the night and city, and opens **Lineup**.
2. **Browse talent** lists DJs open that night in that city, from Gelatin.
3. The organizer adds DJs and enters a fee and an optional note for each. Each DJ is a separate booking with its own card hold.
4. Memberly's backend creates the booking request with an idempotency key. The app shows the server's total, for example $457.00 for a $450 offer.
5. The card hold runs on Gelatin's checkout in an in-app browser sheet (Stripe test cards and Apple Pay in test mode). The DJ sees nothing until the hold succeeds.
6. The Lineup section polls status through Memberly's backend every 5 seconds while the DJ is deciding, and shows each status in plain words.
7. Counters, new prices, changes and refunds open in Gelatin's portal through a single-use link, and return to the app.
8. Publishing never waits on talent; an event can go live with no lineup.
