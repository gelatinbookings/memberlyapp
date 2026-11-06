---
version: 1
slug: "design-canvas-project-main-dc-html"
primary_target: "design/canvas/project/Main.dc.html"
related_targets: []
---

# Surface brief: Memberly App design directions (canvas)

Scope: the native phone app, member and organizer sides, with the Gelatin DJ booking flow built into Create New Event. Visitor mode: Operate. Dark only. Delivered as artboards on the canvas "Memberly App: Design Directions" for CeD to discuss with Memberly's CEO; the Flutter build follows once agreed.

Audience and job: members finding an event and seeing who plays; organizers building an event and booking a DJ on a phone under time pressure. Proof and content: current web screens, the Lineup web canvas copy, the fixed status mapping, mock DJs (KOYO, NIGHTFORM, BLKMTN, Sable Hart), mock money ($450 → $457.00). Constraints: Memberly tokens exactly; no fees, offer history or booker details on public surfaces; every bad state designed; no counters, capture, embed, webhooks or saved cards.

Chosen direction (locked by the user, 30 Oct 2026): map-first Home for members (tonight's events on a map of the city, the list in a sheet, the member's next pass as the first row), organizer work behind a Manage tab, talent as a section of Create New Event. Card-led (A) and week-strip (B) Homes stay on the canvas for reference only. Memorable moment: the status pill that changes under your thumb after a poll, and a card-hold sheet that says in one line what is held, what is charged, and when.

Radius rule recorded in the Kit: primary buttons, fields and sheet actions are 6px; secondary actions inside rows and cards (Add, Offer, Show card, chips) are round pills, a deliberate carry-over from the travel reference. Every tappable control is at least 44px tall.

Unresolved: the map provider for Home; whether Android ships in the pilot; whether the Card gets a wallet pass.

## Direction contract

THESIS: One app, two jobs: tonight for members, the event you are building for organizers. It refuses the category default of a generic event-card feed plus a bolted-on marketplace tab; talent is a section inside Create New Event, and Home leads with tonight on a map of your city, not a feed.

OWN-WORLD: Black ground, #0D0D0D cards with 1px #292929 borders, 16px card radius, 6px primary controls, round pills for chips and in-row actions, round avatars, Inter only, one purple #9333EA for actions, selection and state, purple tint for selected chips and held states, amber for payment needed, green for confirmed, grey for passed/expired/cancelled. Photographs only as event covers and DJ avatars; no gradients, no shadows, no glass.

STORY: A member opens the app, sees tonight's events on the map and their next pass first in the sheet, opens an event and sees who is confirmed. An organizer opens Manage, creates an event, opens Lineup, browses DJs open that night, offers a fee, holds a card, reads the status as it changes, and is handed to Gelatin for anything after the first payment. Every dollar line says held, charged or released.

FIRST VIEWPORT (Home, member): a dark map of Atlanta fills the top 560px with purple numbered pins that carry event names; over it sit a round location chip ("Atlanta · Tonight") and a round search button. A sheet rises from 500px with a grab handle, "4 events tonight" and a List view link, then event rows (64px cover, name, community · time · distance), the member's own pass first with a green Pass pill. The floating round tab bar Home, Explore, Events, Me sits over the sheet. The primary action is the first row. The map tiles are a labelled placeholder until the provider is chosen.

FORM: Map-first Home, position 7 on the ordered structure list (a dealt challenger, locked by the user over the dealt lead), with position 6 (card-led) and position 3 (week strip) kept beside it for reference. Seed key 364b7c7e.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
