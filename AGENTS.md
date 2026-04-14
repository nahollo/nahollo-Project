# Canvas Project Agent Guide

This repository is a pixel-canvas web app inspired by collaborative monthly pixel boards.
The goal of this project is not only to render a canvas, but to provide a clean, reliable, desktop-first collaborative UI where users can:
- view a monthly shared board
- see recent activity
- pick colors
- inspect selected coordinates
- zoom and navigate with a minimap
- place pixels with cooldown-based state transitions

This file defines the working agreement for Codex and any subagents operating on this repository.

---

## 1. Mission

Your job is to make the desktop canvas screen match the attached reference as closely as possible while preserving or improving actual functionality.

Success is not:
- "the screen looks roughly similar"
- "the CSS compiles"
- "the button exists"

Success is:
- layout matches the intended left / center / right desktop structure
- canvas remains visible and usable
- right inspector panel is stable and always visible on desktop
- interactions work
- status transitions work
- cooldown/progress/timers work
- the UI remains coherent under repeated testing

---

## 2. Non-negotiable constraints

1. Do not break canvas rendering.
2. Do not shrink or hide the main canvas to force the sidebars to fit.
3. Do not use a floating popup for the desktop right panel.
4. Do not stack endless CSS overrides if the structure is wrong.
5. Prefer structural fixes over patching symptoms.
6. Keep recent activity scrolling inside its own panel.
7. Preserve a stable right sidebar width on desktop.
8. Keep the center area visually dominant.
9. Treat interaction correctness as equally important as visual similarity.
10. Never declare completion without rerunning the checklist.

---

## 3. Desktop target layout

### Left sidebar
Must contain:
- shared board badge/title area
- monthly board title
- board description
- user card with nickname, edit button, and status text
- recent activity panel
- canvas history CTA button

### Center area
Must contain:
- main pixel canvas
- visible X/Y coordinate axes
- visible selected pixel highlight
- zoom controls
- minimap
- grouped status/info block

### Right sidebar
Must contain:
- selected pixel card
- current color field
- color picker / eyedropper entry point
- default palette
- recent colors
- placement status card
- placement CTA button
- helper text below CTA

---

## 4. Interaction model

### 4.1 Canvas selection
- Clicking the canvas selects a pixel coordinate.
- Selected coordinate must update:
  - right sidebar coordinate display
  - bottom status info
  - selected highlight on the board

### 4.2 Coordinate copy
- The coordinate copy button should copy the currently selected coordinate text.
- If there is no selection, copying must be disabled or produce safe feedback.

### 4.3 Color selection
- Clicking a default palette swatch updates current color and HEX value.
- Picking a custom color updates current color and HEX value.
- Selected color should show a visual active state in the palette.
- Recent colors should update after meaningful use.

### 4.4 Placement
The placement button must support multiple states.

#### READY
- valid coordinate selected
- valid color selected
- cooldown complete
- button enabled
- helper text explains that the selected color will be placed at the selected coordinate

#### NO-SELECTION
- no coordinate selected
- color selection can remain usable
- placement button disabled
- helper text must ask the user to select a position first
- coordinate display should show an empty-state prompt

#### COOLDOWN
- coordinate can remain visible
- color can remain visible
- placement button disabled
- countdown text visible
- progress bar visible and synchronized with countdown
- automatically return to READY after timer completion

#### LOADING / PLACING
- immediately after placement action
- provide temporary feedback
- then transition into cooldown if the product logic requires it

---

## 5. Cooldown and progress-bar behavior

Cooldown is not decorative.
It must be a functional state machine.

At minimum:
- track a cooldown duration
- start countdown immediately after a placement
- update numeric timer on a regular interval
- update progress bar in sync with remaining time
- disable button during cooldown
- re-enable automatically when countdown reaches zero

Example expected behavior:
- duration = 5 seconds
- after clicking place, timer displays 00:05
- then 00:04, 00:03, 00:02, 00:01, 00:00
- progress bar must visually track the remaining time
- after zero, button becomes active again

Do not fake this with static text.

---

## 6. Visual design rules

### Overall
- light background
- soft cards
- rounded corners
- subtle shadows
- purple / blue accents
- clean typography
- clear hierarchy

### Left sidebar
- compact but readable
- recent activity should feel dense but not cluttered
- history CTA should clearly look clickable

### Center area
- highest visual priority
- grid and artwork should remain crisp
- coordinate axes should be readable
- highlight should be visible but not overwhelming

### Right sidebar
- structured like a tool inspector
- should not feel like a modal or popup
- should support quick repeated use
- should not visually overpower the canvas

### CTA
- the placement button must be the strongest CTA in the right panel
- disabled state must be visually clear
- active state must be obviously clickable

---

## 7. CSS policy

You are allowed to refactor CSS aggressively if needed, but follow these rules:

1. Remove or consolidate dead CSS.
2. Remove duplicated selector blocks where possible.
3. Avoid leaving multiple conflicting desktop overrides for the same component.
4. Prefer a single source of truth for desktop layout.
5. If popup-era rules still exist from previous experiments, remove or isolate them.
6. Do not leave "temporary" overrides at the bottom unless they are intentionally the final authority.
7. Keep class naming consistent with the existing codebase unless a refactor clearly improves maintainability.

---

## 8. Component policy

If the current component structure fights the target UI, refactor it.

In particular:
- the desktop right panel should be a real inspector panel, not a disguised popup
- if `CanvasPaintPanel` still behaves like a popup launcher on desktop, rewrite that desktop path
- if `CanvasPage` desktop layout is too entangled, separate structural regions more clearly
- if bottom info controls are too coupled, split into clearer subcomponents if useful

Maintain or improve readability while doing so.

---

## 9. Validation requirements

You must validate after every meaningful change.

Validation must include:

### Left sidebar
- shared board label visible
- month visible
- description visible
- nickname visible
- edit button visible
- status visible
- activity list visible
- activity list scrolls internally
- canvas history button visible and clickable

### Center
- canvas visible
- axes visible
- selection highlight visible
- zoom out works
- zoom in works
- fit works
- percent text updates
- minimap visible
- minimap viewport visible
- selected coordinate reflected in bottom info
- connection text visible
- placed pixel count visible
- mouse wheel zoom works

### Right sidebar
- selected pixel title visible
- coordinate visible
- copy button works
- current color visible
- hex visible
- picker/eyedropper entry point works
- default palette works
- recent colors update
- cooldown card visible
- progress bar updates with time
- countdown text updates with time
- placement button state changes correctly
- helper text changes based on state

Never skip validation because a change seems "small".

---

## 10. Reporting requirements

At the end of each iteration, report:

- files changed
- why those files changed
- what was tested
- what passed
- what failed
- what still looks different from the reference
- what the next step is

Final report must include:
- final file list
- all passing checks
- any remaining issues
- any intentional deviations
- recommended follow-up cleanup tasks

---

## 11. Multi-hour work policy

For large tasks or refactors expected to last more than ~30 minutes, create and maintain a written execution plan.

Use an ExecPlan document when:
- reworking layout structure
- refactoring major UI components
- replacing popup-based desktop behavior with persistent panel behavior
- touching multiple related files
- making state-machine changes
- reconciling several overlapping CSS systems

An ExecPlan should include:
- objective
- current problems
- files involved
- state model
- layout model
- step-by-step implementation plan
- validation plan
- rollback risks
- open questions

Keep the plan updated as the work evolves.
Do not let a long task drift without a maintained plan.

---

## 12. Subagent policy

Subagents are encouraged for large tasks, but only when explicitly requested by the user or task prompt.

When using subagents:
- give each subagent a bounded responsibility
- require a return format
- do not let subagents produce noisy, unstructured output
- integrate their results in the main thread

Recommended split for this repository:

### Layout subagent
- left / center / right panel structure
- card spacing
- desktop alignment
- overflow and height issues

### Canvas interaction subagent
- selection
- zoom
- fit
- minimap
- bottom status synchronization

### Right panel state subagent
- coordinate field
- copy action
- color state
- recent colors
- placement states
- cooldown timer
- progress synchronization

Each subagent should return:
- files changed
- what they verified
- what failed
- unresolved risks

---

## 13. State-machine expectations for placement

Placement state logic should be explicit and easy to reason about.

Recommended enum or equivalent:
- no-selection
- ready
- placing
- cooldown
- offline (optional if supported)

Transitions:
- no-selection -> ready when coordinate is selected and cooldown is over
- ready -> placing on click
- placing -> cooldown after success
- cooldown -> ready when timer reaches zero
- any state -> no-selection if selection is cleared and a coordinate is required

This state machine must drive:
- button enabled/disabled
- button label
- helper text
- progress bar
- countdown visibility

---

## 14. Anti-patterns to avoid

Do not:
- hide the right sidebar to simulate a closed state
- leave stale popup classes affecting desktop layout
- use hardcoded visual fake timers that do not actually count down
- claim a feature works without clicking or testing it
- accumulate one-off overrides with unclear ownership
- move the main CTA into a floating detached element on desktop
- let the center canvas become cramped just to fit side panels
- silently change the interaction model without updating the validation plan

---

## 15. Preferred completion standard

This task is complete only when:
- the screen structure strongly matches the reference
- the canvas remains stable
- the right inspector panel is always present on desktop
- the color workflow is smooth
- the placement state machine is correct
- cooldown and progress are synchronized
- the recent activity panel behaves correctly
- no obvious layout drift remains
- the final report can explain exactly what changed and why

If something cannot be completed, say exactly what is blocked and why.
Do not pretend the task is done.