import React from "react";
import { FIXED_CANVAS_PALETTE, RGBColor, rgbToHex } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";

interface CanvasMobilePaintTrayProps {
  readonly selectedColor: RGBColor;
  readonly isExpanded: boolean;
  readonly canPlace: boolean;
  readonly isPlacing: boolean;
  readonly cooldownLabel: string;
  readonly placementProgress: string;
  readonly onToggleExpanded: () => void;
  readonly onPlace: () => void;
  readonly onPresetClick: (color: RGBColor) => void;
  readonly onToggleCustom: () => void;
}

function CanvasMobilePaintTray(props: CanvasMobilePaintTrayProps): JSX.Element {
  const selectedHex = rgbToHex(props.selectedColor);

  return (
    <div className={`canvas-mobile-paint-tray ${props.isExpanded ? "is-expanded" : "is-collapsed"}`}>
      <div className="canvas-mobile-paint-handle">
        <span className="canvas-color-swatch" style={{ backgroundColor: selectedHex }} aria-hidden="true" />
        <div className="canvas-paint-copy">
          <strong className="canvas-paint-title">{CANVAS_COPY.chips.paint}</strong>
          <span className="canvas-paint-hex">{selectedHex}</span>
        </div>
        <div className="canvas-mobile-paint-actions">
          <button type="button" className="canvas-mobile-tray-toggle" onClick={props.onToggleExpanded} aria-expanded={props.isExpanded}>
            {props.isExpanded ? CANVAS_COPY.actions.closePaint : CANVAS_COPY.actions.openPaint}
          </button>
          <button type="button" className="canvas-place-button" onClick={props.onPlace} disabled={!props.canPlace}>
            {props.isPlacing ? CANVAS_COPY.actions.placing : props.canPlace ? CANVAS_COPY.actions.placePixel : props.cooldownLabel}
          </button>
        </div>
      </div>

      {props.isExpanded && (
        <div className="canvas-mobile-tray-sheet">
          <div className="canvas-mobile-tray-status">
            <span className="canvas-paint-trigger-state">{props.canPlace ? CANVAS_COPY.status.ready : `${props.cooldownLabel} 남음`}</span>
            <span className="canvas-cooldown-label">{props.canPlace ? CANVAS_COPY.status.ready : `${CANVAS_COPY.paint.cooldownPrefix} ${props.cooldownLabel}`}</span>
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
      )}
    </div>
  );
}

export default CanvasMobilePaintTray;
