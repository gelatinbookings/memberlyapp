---
name: Memberly App
description: Memberly at night, carried to the phone. Black ground, white type, one purple.
colors:
  background: "#000000"
  card: "#0D0D0D"
  muted-surface: "#1F1F1F"
  border: "#292929"
  foreground: "#FAFAFA"
  muted-text: "#A1A1A1"
  brand: "#9333EA"
  brand-pressed: "#7E22CE"
  ring: "#8B5CF6"
  brand-tint: "rgba(59,7,100,.4)"
  brand-text: "#D8B4FE"
  brand-line: "#6B21A8"
  success-bg: "rgba(6,78,59,.4)"
  success-text: "#6EE7B7"
  warning-bg: "rgba(120,53,15,.4)"
  warning-text: "#FCD34D"
  error-bg: "rgba(127,29,29,.4)"
  error-text: "#FCA5A5"
  destructive: "#EF4444"
  on-brand: "#FFFFFF"
  photo-scrim: "rgba(0,0,0,.6)"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  secondary:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  helper:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  money:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tabular-nums"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    letterSpacing: "0.04em"
rounded:
  control: "6px"
  notice: "12px"
  card: "16px"
  sheet: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  label: "6px"
  sm: "8px"
  row: "12px"
  card: "14px"
  md: "16px"
  gutter: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.card-title}"
    rounded: "{rounded.control}"
    height: "52px"
  button-primary-pressed:
    backgroundColor: "{colors.brand-pressed}"
    textColor: "{colors.on-brand}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.card-title}"
    rounded: "{rounded.control}"
    height: "48px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.on-brand}"
    typography: "{typography.card-title}"
    rounded: "{rounded.control}"
    height: "52px"
  pill-action:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.secondary}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand-text}"
    typography: "{typography.secondary}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  pill-status:
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "48px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.card}"
    padding: "14px"
  card-selected:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.card}"
    padding: "14px"
  notice:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.muted-text}"
    typography: "{typography.secondary}"
    rounded: "{rounded.notice}"
    padding: "12px 14px"
  sheet:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sheet}"
    padding: "10px 20px 34px"
  tab-bar:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.pill}"
    padding: "6px"
    height: "64px"
  tab-active:
    backgroundColor: "{colors.brand-tint}"
    textColor: "{colors.brand-text}"
    typography: "{typography.secondary}"
    rounded: "{rounded.pill}"
    height: "50px"
---

# Design System: Memberly App

Memberly's established visual world, carried to the native phone app. This records the incumbent system (web app tokens, the Kit on the Lineup canvas, the brief's rules) as it landed on the "Memberly App: Design Directions" canvas (47 boards, 30 Oct 2026). It does not invent a replacement. Where the boards settled something the earlier plan left open, the boards win and the change is noted.

## Overview

**Creative North Star: "Memberly at Night"**

Black ground, white type, one purple. The look of the current web app and of the rooms its organizers run: dark, confident, uncluttered, with money and status always legible at arm's length. The phone version keeps every Memberly token exactly and adds only what a phone needs: a floating round tab bar, bottom sheets for self-contained tasks, and round pills for the light actions that sit inside rows.

Appearance: dark only in the design directions (decision 30 Oct 2026). A light theme exists in the web tokens and may be built later from the same roles.

**Key Characteristics:**
- Flat. 1px borders carry every edge; no shadows, no glass, no gradients.
- One purple, used for actions, selection and state. Photography carries the warmth.
- Two radii for controls: 6px for the primary thing on a screen, round for everything lighter.
- Every dollar line says held, charged or released, in the money type.
- Sentence case, second person, no eyebrow labels.

## Colors

Restrained: black and near-black surfaces, one purple for intent, and three status tints that are read rather than looked at.

### Primary
- **Brand purple** (`brand`): primary buttons, the active tab's pill, selection, map pins, the toggle's on state. Pressed state is **Pressed purple** (`brand-pressed`). Focus uses **Ring** (`ring`), a web token the static boards do not show.
- **Purple tint** (`brand-tint`) with **Purple text** (`brand-text`) and **Purple line** (`brand-line`): selected chips, the active tab, initials avatars, held/negotiating status pills, the added-DJ card, the "You organize" card, the back-from-Gelatin notice. Links on dark use `brand-text`.

### Neutral
- **Background** (`background`): screen ground and the ground of every bottom sheet.
- **Card** (`card`): cards, the tab bar, the top bar in the portal, round over-map controls, text fields.
- **Muted surface** (`muted-surface`): inset notices, icon tiles, skeletons, grey status pills, tier pills, the step-progress track.
- **Border** (`border`): every 1px line, the sheet grab handle, the row separators inside a card.
- **Foreground** (`foreground`): primary text.
- **Muted text** (`muted-text`): secondary text, inactive tab icons, chevrons. 4.5:1+ on black and card.
- **On brand** (`on-brand`): text on purple and red fills.

### Status
- **Success** (`success-text` on `success-bg`): Confirmed, the member's own Pass.
- **Warning** (`warning-text` on `warning-bg`): Payment needed, New offer from the DJ.
- **Error** (`error-text` on `error-bg`): Unavailable, failed, timed out, the Sign out row.
- **Destructive** (`destructive`): filled Change date and Cancel buttons.
- **Passed / Expired / Cancelled**: `muted-text` on `muted-surface`, the same grey as tier pills.

### Named Rules
**The One Purple Rule.** Purple is for actions, selection and state. It never tints a surface for decoration; a tinted card means "selected", "yours" or "held".

**The Photo Scrim Rule.** The only wash in the system is `photo-scrim` (60% black) as a round pill under white text over a cover photo, or a cover photo itself dimmed to 35% behind a sheet. No gradient washes.

## Typography

**Display Font:** Inter (with system-ui, sans-serif)
**Body Font:** Inter
**Label/Mono Font:** Inter with tabular numerals for money

**Character:** One family, weight does the work. Headings are heavy and tight (700–800, negative tracking); body is plain 400 at 15px; the only small caps are the 10px status and tier pills.

### Hierarchy
- **Display** (800, 28px, 1.1, -0.02em): large-title screens and sheet welcomes (Welcome, onboarding, "Welcome back"). 24–26px variants appear where a 28 would wrap.
- **Headline** (700, 20px, 1.2, -0.02em): the standard navigation-bar screen title (15 boards). 22px/700 for a person's or DJ's name at the head of a profile.
- **Title** (700, 17px, -0.01em): section headers inside a screen and sheet headers ("4 events tonight", "You organize", "Lineup").
- **Card title** (600, 16px): DJ name, event name, row labels, primary button labels.
- **Body** (400, 15px, 1.45): default; also row labels in settings lists (500).
- **Secondary** (400, 13px, muted): meta lines, chip labels (500), field labels (500), link labels (500–600).
- **Helper** (400, 12px, muted): under fields, footers, the map-pin label (700, white).
- **Money** (800, 28–32px, tabular): the held total in a money summary (28) and in checkout (32). Inline amounts in rows are 600 at body size.
- **Label** (700, 10px, 0.04em, uppercase): status and tier pills only.

### Named Rules
**The No Eyebrow Rule.** No kicker or eyebrow labels above headings. The only uppercase text is inside a 10px pill. Sentence case everywhere. Second person.

**The Tabular Money Rule.** Any amount above body size is 800 weight with `font-variant-numeric: tabular-nums`, and the line beside it says held, charged or released.

## Layout

Phone-first at 390×844 (iPhone), with Android following the same screens. Screen gutters are 20px; the tab bar and over-map controls inset 16px. Content starts at 60px from the top (under the status bar) or at 56px inside a 92px top bar with a 1px bottom border. Vertical rhythm: 20px between screen sections, 14px inside a card, 12px between a row's avatar and text, 10px between stacked cards, 8px between stacked buttons or chips, 6px between a field label and its field, 4px between a title and its meta line.

Home (decided 6 Nov 2026) follows the Exploring layout in the dark theme: date line and large greeting with the initials avatar, the purple Memberly card, tonight's pass as a large photo card, then an "Also tonight" carousel. The map view (map on top, sheet from 500px) is secondary, reached from See all, never the default. The floating tab bar sits 34px above the bottom edge. Lists are a single column; event covers are 150px tall cards or 64px row thumbnails; DJ cards stack at full width. Large titles collapse on scroll; safe areas are honored; edge-swipe back is always alive.

## Elevation & Depth

Flat. No drop shadows, no blur, no glass. Depth is one step of tone (black ground, #0D0D0D card, #1F1F1F inset) and a 1px `border` line on every edge. Layering over a screen is done by dimming: when a bottom sheet or dialog is up, the screen content behind it is rendered at 35% opacity and the sheet or dialog sits on the full-opacity ground with its own 1px border. Over photographs, text sits in a 60% black round pill.

### Named Rules
**The Flat Rule.** No shadows anywhere, including the floating tab bar and sheets; they are separated by their 1px border and the dimmed screen behind them.

## Shapes

Four radii and one circle. **6px** is the Memberly control radius: primary buttons, secondary full-width buttons, destructive buttons, text fields, sheet actions, and the Apple Pay button. **12px** is the notice and thumbnail radius: inset notices, 64px and 44px event thumbnails. **16px** is the card radius: cards, event covers, the centered alert dialog, grouped settings lists. **24px** is the bottom sheet's top radius. **Round** (999px) is everything lighter than the primary action: chips, in-row and in-card actions (Add, Offer, Show card, Edit, Manage), status and tier pills, avatars and initials, the tab bar and its active pill, over-map controls, map pins, the toggle, the step-progress segments and the 40×4 grab handle.

Square icon tiles and logo marks take roughly a quarter of their size as radius (36px → 10px muted tile, 36px → 9px / 32px → 8px / 28px → 7px purple "M"). Nested cards are not used; rows inside a card are separated by 1px borders.

### Named Rules
**The Two-Radius Rule.** Primary buttons, fields and sheet actions are 6px. Secondary actions inside a row or card, and chips, are round pills, so they read lighter than the primary action. Nothing tappable falls between.

**The 44 Rule.** Every tappable control is at least 44px tall. Primary buttons are 52px, fields and secondary full-width buttons 48px, chips and in-row pills 44px. Smaller round icon buttons (36px) get a 44px hit area.

## Components

### Buttons
- **Shape:** Memberly control radius (6px), full width in sheets and footers.
- **Primary:** brand fill, white 16px/600 label, 52px tall. Pressed `brand-pressed`. Disabled: same fill at 50% opacity.
- **Secondary:** transparent, 1px `border`, foreground 16px/600 label (14px in sign-in rows), 48–52px tall.
- **Destructive:** `destructive` fill, white label, 52px, for Change date and Cancel.
- **Pill action:** round, 44px, 1px `border`, 14px/600 label, inside rows and cards (Add). The filled variant (brand fill, white 13px/600 label) marks the one action on a highlighted card (Manage, Added).
- **Platform:** Apple Pay is a white 48px 6px button with black mark and label, as the platform supplies it.

### Chips
- **Style:** round, 44px tall, 0 14px padding, 13px/500 label, transparent with 1px `border`.
- **Selected:** `brand-tint` fill, `brand-line` border, `brand-text` label.
- **Info tag (non-tappable):** round, 36px, 12px/500, 1px `border` or `muted-surface`; over photos, `photo-scrim` fill with white 600 text.

### Pills
- **Status pill:** 10px/700 uppercase, 0.04em, 5px 9px, round. Warning for Payment needed and New offer; tint for Card held and Negotiating; success for Confirmed and Pass; grey for Passed, Expired, Cancelled.
- **Tier pill:** same type, grey, 4px 8px (3px 7px inline beside a name).

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** `card`, 1px `border`. Selected/added/yours: `brand-tint` with `brand-line` border.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Internal Padding:** 14px (12px on DJ cards, 10px on event row cards); 10px vertical gap inside.
- **Lists in a card:** rows 13px 14px padding, 44px minimum, 1px `border` between rows, 36px muted icon tile at 10px radius, 16px muted chevron.
- **Money summary:** fee rows in secondary text, 1px rule, then the total in Money type.
- **Notice:** 12px radius, 12px 14px padding, 13px text; muted (hold line), tint with `brand-line` (back from Gelatin), error (unavailable).

### Inputs / Fields
- **Style:** 48px, 6px radius, 1px `border`, `card` background (transparent in the Kit), 0 14px padding, 15px text (16px/600 for a money field with a muted "$" prefix). 13px/500 label 6px above; 12px muted helper below.
- **Focus:** `ring` (#8B5CF6), carried from the web tokens; not shown on static boards.
- **Grouped card entry:** fields share one 6px bordered box with 1px internal rules.
- **Toggle:** 44×26 round, brand when on, 20px white knob.

### Navigation
- **Tab bar:** floating, 64px, round, `card` fill, 1px `border`, 6px inner padding, 16px from each edge and 34px above the bottom. Members see four items: Home, Explore, Events, Me. Organizers get a fifth, Manage. The active item is a 50px round `brand-tint` pill with a 20px icon and 13px/600 `brand-text` label at 1.6× width; inactive items are 22px `muted-text` icons only. The Card is reached from Home (the member's pass row) and from Me, not from a tab.
- **Top bar:** 92px including status bar, `card` fill, 1px bottom border, 15px/500 text action, 13px muted centre.
- **Over-map controls:** round 48px `card` buttons with 1px `border` (location chip "Atlanta · Tonight", search).
- **Icons:** one stroke set at 2px (Lucide-style): 22px inactive tab, 20px active tab and search, 18px in buttons, rows and tiles, 16px chevrons, 12–13px inside tags.
- **Android:** Material navigation bar, predictive back, snackbars for transient feedback, Material dialogs. Same screens.

### Bottom Sheet (signature)
Sign in, create account, filters, offer, hand-off, "DJ taken", "timed out" and other self-contained tasks rise as a sheet: `background` fill, 1px top `border`, 24px top radius, 10px 20px 34px padding, a 40×4 round `border` grab handle centred at the top, then a Display or Headline title with a 14px muted subtitle, 14–18px gaps, and 6px primary actions. The screen behind drops to 35% opacity. Confirmations that need a decision (Change the date?) use a centred 16px `card` alert dialog with 20px padding over the same dimmed screen.

### Map pin (signature)
Round brand pill, 34px, with a 22px white disc carrying the pin number in purple and the event name in 12px/700 white.

### Motion
150–250ms, state-conveying only inside the product; Reduce Motion honored everywhere (instant or a plain fade). Authored moments, decided 6 Nov 2026 to make first run feel alive:
- **Launch:** the native splash hands off to the Memberly mark scaling and fading in with a brief brand-purple reveal, then a cross-fade into Welcome or Home; under about 1.6s and never blocking once data is ready.
- **Welcome:** a slow drift and zoom on the photo; wordmark, tagline and buttons rise in a stagger.
- **Sign in and create account:** sheets spring up; verification digits pop in, a wrong code shakes, success draws a check.
- **Status pill cross-fade** when a booking changes state after a poll ("Updates every few seconds while a DJ is deciding").
Transform and opacity only; no glows, gradients or shadows; one purple. The one exception to "no gradients" is a black-only legibility scrim over photos or video (Welcome), so text never sits on a hard-edged band.

## Do's and Don'ts

### Do:
- **Do** give every tappable control at least 44px; primary buttons 52px, fields 48px.
- **Do** use 6px for the primary action, fields and sheet actions, and round pills for chips and actions inside rows and cards.
- **Do** separate layers with a 1px `border` and a dimmed (35%) screen, never a shadow.
- **Do** set every amount above body size in 800 tabular Inter beside a line that says held, charged or released.
- **Do** keep purple to actions, selection and state; let cover photos and avatars carry the warmth.
- **Do** write status labels exactly as the product fixes them (see PRODUCT.md) in the matching status pill colour.

### Don't:
- **Don't** add drop shadows, blur, glass or gradient washes anywhere, including the floating tab bar.
- **Don't** put eyebrow or kicker labels above headings; the only uppercase text is a 10px pill.
- **Don't** nest cards; use 1px rules between rows inside one card.
- **Don't** show fees, offer history or booker details on public surfaces.
- **Don't** use a fifth tab for members; the Card is reached from Home and Me, and Manage appears only for organizers.
- **Don't** compute or style a total the client invented; the server's amount is the only number in Money type.

## Copy

- Status labels and actions are fixed by the product (see PRODUCT.md).
- The hold line, verbatim: "Your card is held, not charged. You're charged only if [DJ] accepts. If they pass or don't answer, the hold is released."
- Attribution under any catalog: "DJs, availability and rates from Gelatin".
- Controls name their action: "Browse talent", "Send 2 offers", "Pay now", "Manage in Gelatin", "Notify me", "Search another date".
