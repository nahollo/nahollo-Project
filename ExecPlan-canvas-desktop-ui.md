# ExecPlan: Canvas Desktop UI Precision Rebuild

## Objective
- Rebuild the desktop `/canvas` screen so it matches the reference structure and interaction quality as closely as possible.
- Preserve canvas rendering, selection, zoom, minimap, and placement correctness while bringing the layout and card hierarchy in line with the reference.
- Use repeated implementation and validation loops rather than one-pass styling.

## Scope
- Target: desktop canvas screen excluding the shared site header implementation.
- Must cover:
  - left sidebar structure
  - center canvas stage
  - right inspector panel
  - selection/zoom/minimap/status synchronization
  - placement/cooldown/progress state machine
- Mobile can be kept functional, but desktop is the priority for this task.

## Current Problems
- Desktop layout structure is only partially aligned with the reference.
- The right inspector behavior and card structure need to be stabilized.
- Canvas controls and status grouping are not yet fully aligned with the reference.
- CSS has accumulated multiple generations of desktop overrides and needs careful consolidation.
- Some existing desktop UI paths are simplified compared with the required feature set.

## Files Involved
- `frontend/src/components/Canvas/CanvasPage.tsx`
- `frontend/src/components/Canvas/CanvasSidebar.tsx`
- `frontend/src/components/Canvas/CanvasHistoryPanel.tsx`
- `frontend/src/components/Canvas/CanvasPaintPanel.tsx`
- `frontend/src/components/Canvas/CanvasHistoryOverlay.tsx`
- `frontend/src/components/Canvas/CanvasPreview.tsx`
- `frontend/src/components/Canvas/canvasUtils.ts`
- `frontend/src/components/Canvas/canvasCopy.ts`
- `frontend/src/components/Canvas/canvas.css`
- `frontend/src/data/canvas.ts`
- `frontend/scripts/check-canvas-workspace.cjs`
- `frontend/scripts/capture-canvas-layout-localhost.cjs`
- `frontend/scripts/capture-canvas-feature-states.cjs`

## State Model
- Placement states:
  - `no-selection`
  - `ready`
  - `placing`
  - `cooldown`
  - `offline`
- Driving UI:
  - coordinate field
  - copy button enabled state
  - CTA label
  - helper text
  - progress bar
  - countdown display
- Canvas interaction states:
  - hovered pixel
  - selected pixel
  - selected pixel metadata
  - zoom scale
  - viewport offset
  - minimap viewport rectangle

## Layout Model
- Left column
  - shared board card
  - user card
  - recent activity card with internal scroll
  - canvas history CTA
- Center column
  - canvas board with axes
  - zoom controls
  - minimap
  - grouped status area
- Right column
  - selected pixel inspector
  - color field and picker entry point
  - default palette
  - recent colors
  - placement status card
  - placement CTA and helper text

## Implementation Plan
1. Audit current DOM, state, and CSS ownership.
2. Split the work across three bounded subagents:
   - layout
   - canvas-interactions
   - right-panel-states
3. Rebuild desktop TSX structure where needed instead of stacking overrides.
4. Consolidate desktop CSS into a clearer source of truth.
5. Restore or implement missing desktop controls:
   - zoom rail
   - minimap
   - bottom grouped status block
   - persistent right inspector
6. Validate build and run locally.
7. Capture desktop screenshots across required viewports.
8. Record failures, patch, and repeat until the checklist is stable.

## Validation Plan
- Functional validation:
  - click selection
  - selected highlight visibility
  - wheel zoom
  - zoom buttons and fit
  - minimap viewport synchronization
  - coordinate copy
  - default palette
  - custom color entry
  - recent colors
  - placement state transitions
  - cooldown timer and progress synchronization
- Visual validation:
  - compare desktop screen against the reference
  - inspect balance at:
    - `1366x768`
    - `1440x900`
    - `1536x864`
    - `1728x1117`
    - `1920x1080`
    - `2560x1440`
    - `3840x2160`

## Rollback Risks
- `CanvasPage.tsx` owns a large amount of orchestration logic; changes can ripple into selection and network sync.
- `canvas.css` contains overlapping generations of layout rules; careless edits may break desktop or mobile unexpectedly.
- Right panel behavior must remain persistent on desktop without breaking mobile tray behavior.

## Open Questions
- Whether the existing grid toggle should be visually restored as part of this pass or remain present but secondary.
- Whether to keep the current mobile paths untouched unless desktop refactor forces a shared-state adjustment.

## Iteration Log

### Iteration 0
- Status: in progress
- Focus:
  - audit current structure
  - create execution plan
  - spawn and brief subagents
- Findings:
  - `CanvasPage.tsx` remains the orchestration hub for layout, interaction, and networking.
  - desktop DOM currently has left/center/right regions, but feature completeness does not yet match the reference.
  - right inspector and zoom/minimap/status structure need another pass.
- Next:
  - receive subagent findings
  - integrate structure and state changes

## Per-Iteration Report Template
- Files changed:
- Why changed:
- What was tested:
- What passed:
- What failed:
- Reference gaps:
- Next step:
