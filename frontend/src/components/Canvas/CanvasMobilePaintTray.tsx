import React from "react";
import { FIXED_CANVAS_PALETTE, RGBColor, rgbToHex } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";
import { PlaceActionState } from "./CanvasPaintPanel";

interface CanvasMobilePaintTrayProps {
  readonly selectedColor: RGBColor;
  readonly isExpanded: boolean;
  readonly cooldownLabel: string;
  readonly placementProgress: string;
  readonly placeState: PlaceActionState;
  readonly isPlaceDisabled: boolean;
  readonly hasPlaceError: boolean;
  readonly onToggleExpanded: () => void;
  readonly onPlace: () => void;
  readonly onPresetClick: (color: RGBColor) => void;
  readonly onToggleCustom: () => void;
}

function resolveActionLabel(placeState: PlaceActionState, cooldownLabel: string): string {
  if (placeState === "loading") {
    return CANVAS_COPY.actions.placing;
  }
  if (placeState === "no-selection") {
    return "위치를 선택하세요";
  }
  if (placeState === "cooldown") {
    return cooldownLabel;
  }
  if (placeState === "offline") {
    return CANVAS_COPY.actions.connectionLost;
  }
  return CANVAS_COPY.actions.placePixel;
}

function CanvasMobilePaintTray(props: CanvasMobilePaintTrayProps): JSX.Element {
  const selectedHex = rgbToHex(props.selectedColor);
  const actionLabel = resolveActionLabel(props.placeState, props.cooldownLabel);
  const isReady = props.placeState === "ready";

  return (
    <div className={`canvas-mobile-paint-tray ${props.isExpanded ? "is-expanded" : "is-collapsed"}`}>
      <div className="canvas-mobile-paint-handle">
        <span className="canvas-color-swatch" style={{ backgroundColor: selectedHex }} aria-hidden="true" />
        <div className="canvas-paint-copy">
          <strong className="canvas-paint-title">{CANVAS_COPY.chips.paint}</strong>
          <span className="canvas-paint-hex">{selectedHex}</span>
        </div>
        <div className="canvas-mobile-paint-actions">
          <button
            type="button"
            className={`canvas-mobile-tray-toggle ${props.isExpanded ? "is-active" : ""}`}
            onClick={props.onToggleExpanded}
            aria-expanded={props.isExpanded}
            aria-pressed={props.isExpanded}
          >
            <span>{props.isExpanded ? CANVAS_COPY.actions.closePaint : CANVAS_COPY.actions.openPaint}</span>
            <span className={`canvas-expand-caret ${props.isExpanded ? "is-open" : "is-closed"}`} aria-hidden="true">
              ^
            </span>
          </button>
          <button
            type="button"
            className={`canvas-place-button is-${props.placeState} ${props.hasPlaceError ? "is-error" : ""}`}
            onClick={props.onPlace}
            disabled={props.isPlaceDisabled}
            aria-busy={props.placeState === "loading"}
          >
            {props.placeState === "loading" ? (
              <>
                <span className="canvas-loading-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span>{CANVAS_COPY.actions.placing}</span>
              </>
            ) : (
              <>
                <span className="canvas-place-indicator" style={{ backgroundColor: selectedHex }} aria-hidden="true" />
                <span>{actionLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className={`canvas-mobile-tray-sheet ${props.isExpanded ? "is-open" : "is-closed"}`} aria-hidden={!props.isExpanded}>
        <div className="canvas-mobile-tray-sheet-inner">
          <div className="canvas-mobile-tray-status">
            <span className={`canvas-paint-trigger-state is-${props.placeState} ${props.isExpanded ? "is-active" : ""}`}>
              {actionLabel}
            </span>
            <span className="canvas-cooldown-label">
              {isReady ? CANVAS_COPY.status.ready : `${CANVAS_COPY.paint.cooldownPrefix} ${props.cooldownLabel}`}
            </span>
          </div>

          <div className="canvas-palette-grid is-mobile">
            {FIXED_CANVAS_PALETTE.map((color) => {
              const hex = rgbToHex(color);
              return (
                <button
                  key={hex}
                  type="button"
                  className={`canvas-palette-swatch ${selectedHex === hex ? "is-active" : ""}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => props.onPresetClick(color)}
                  aria-label={`색상 ${hex}`}
                />
              );
            })}
            <button type="button" className="canvas-custom-trigger" onClick={props.onToggleCustom} aria-label={CANVAS_COPY.actions.openColorPicker}>
              <span>+</span>
            </button>
          </div>

          <div className="canvas-cooldown-bar">
            <span style={{ width: props.placementProgress }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CanvasMobilePaintTray;
