import React from "react";
import { FIXED_CANVAS_PALETTE, RGBColor, rgbToHex } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";

export type PlaceActionState = "ready" | "loading" | "cooldown" | "offline";

interface CanvasPaintPanelProps {
  readonly selectedColor: RGBColor;
  readonly customColorDraft: RGBColor;
  readonly recentColors: readonly RGBColor[];
  readonly isExpanded: boolean;
  readonly cooldownLabel: string;
  readonly placementProgress: string;
  readonly isCustomColorOpen: boolean;
  readonly placeState: PlaceActionState;
  readonly isPlaceDisabled: boolean;
  readonly hasPlaceError: boolean;
  readonly onToggleExpanded: () => void;
  readonly onPlace: () => void;
  readonly onPresetClick: (color: RGBColor) => void;
  readonly onToggleCustom: () => void;
  readonly onCloseCustom: () => void;
  readonly onCustomHexChange: (value: string) => void;
  readonly onCustomPickerChange: (value: string) => void;
  readonly onCustomChannelChange: (channel: keyof RGBColor, value: number) => void;
  readonly onApplyCustom: () => void;
  readonly onPickRecent: (color: RGBColor) => void;
}

function resolvePlaceLabel(placeState: PlaceActionState, cooldownLabel: string): string {
  if (placeState === "loading") {
    return CANVAS_COPY.actions.placing;
  }
  if (placeState === "cooldown") {
    return cooldownLabel;
  }
  if (placeState === "offline") {
    return CANVAS_COPY.actions.connectionLost;
  }
  return CANVAS_COPY.actions.placePixelReady;
}

function CanvasPaintPanel(props: CanvasPaintPanelProps): JSX.Element {
  const selectedHex = rgbToHex(props.selectedColor);
  const customHex = rgbToHex(props.customColorDraft);
  const placeLabel = resolvePlaceLabel(props.placeState, props.cooldownLabel);
  const isReady = props.placeState === "ready";

  return (
    <div className={`canvas-paint-panel ${props.isExpanded ? "is-expanded" : "is-collapsed"}`}>
      <button type="button" className="canvas-paint-dock-trigger" onClick={props.onToggleExpanded} aria-expanded={props.isExpanded}>
        <span className="canvas-color-swatch" style={{ backgroundColor: selectedHex }} aria-hidden="true" />
        <div className="canvas-paint-copy">
          <strong className="canvas-paint-title">{CANVAS_COPY.chips.paint}</strong>
          <span className="canvas-paint-hex">{selectedHex}</span>
        </div>
        <span className={`canvas-paint-trigger-state is-${props.placeState}`}>
          {props.placeState === "offline" ? `! ${CANVAS_COPY.status.offline}` : isReady ? CANVAS_COPY.actions.placePixelReady : placeLabel}
        </span>
        <span className={`canvas-expand-caret ${props.isExpanded ? "is-open" : "is-closed"}`} aria-hidden="true">
          ^
        </span>
      </button>

      <div className={`canvas-paint-expandable ${props.isExpanded ? "is-open" : "is-closed"}`} aria-hidden={!props.isExpanded}>
        <div className="canvas-paint-expandable-inner">
          <div className="canvas-paint-top">
            <span className="canvas-color-swatch is-large" style={{ backgroundColor: selectedHex }} aria-hidden="true" />
            <div className="canvas-paint-copy">
              <strong className="canvas-paint-title">{CANVAS_COPY.chips.paint}</strong>
              <span className="canvas-paint-hex">{selectedHex}</span>
            </div>
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
                  <span>{placeLabel}</span>
                </>
              )}
            </button>
          </div>

          <div className="canvas-paint-bottom">
            <div className="canvas-palette-grid">
              {FIXED_CANVAS_PALETTE.map((color) => {
                const hex = rgbToHex(color);
                return (
                  <button
                    key={hex}
                    type="button"
                    className={`canvas-palette-swatch ${selectedHex === hex ? "is-active" : ""}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => props.onPresetClick(color)}
                    aria-label={`color ${hex}`}
                  />
                );
              })}

              <button type="button" className="canvas-custom-trigger" onClick={props.onToggleCustom} aria-label={CANVAS_COPY.actions.openColorPicker}>
                <span>+</span>
              </button>
            </div>

            <div className="canvas-cooldown-bar-shell">
              <span className="canvas-cooldown-label">
                {isReady ? CANVAS_COPY.actions.placePixelReady : `${CANVAS_COPY.paint.cooldownPrefix} ${props.cooldownLabel}`}
              </span>
              <div className="canvas-cooldown-bar">
                <span style={{ width: props.placementProgress }} />
              </div>
            </div>
          </div>

          {props.isExpanded && props.isCustomColorOpen && (
            <div className="canvas-color-popover">
              <div className="canvas-popover-header">
                <div>
                  <span className="canvas-chip">{CANVAS_COPY.chips.custom}</span>
                  <strong>{CANVAS_COPY.paint.pickerTitle}</strong>
                </div>
                <button type="button" className="canvas-close-button" onClick={props.onCloseCustom} aria-label={CANVAS_COPY.actions.closeColorPicker}>
                  x
                </button>
              </div>

              <div className="canvas-popover-tabs">
                <span className="is-active">{CANVAS_COPY.paint.pickerTabCustom}</span>
                <span>{CANVAS_COPY.paint.pickerTabPalette}</span>
              </div>

              <div className="canvas-custom-preview" style={{ background: customHex }} />

              <label className="canvas-color-picker-field">
                <span>{CANVAS_COPY.paint.pickerGui}</span>
                <input type="color" value={customHex} onChange={(event) => props.onCustomPickerChange(event.target.value)} />
              </label>

              <label className="canvas-text-field">
                <span>{CANVAS_COPY.paint.hex}</span>
                <input type="text" value={customHex} onChange={(event) => props.onCustomHexChange(event.target.value)} />
              </label>

              <div className="canvas-rgb-fields">
                {([
                  ["red", "Red"],
                  ["green", "Green"],
                  ["blue", "Blue"]
                ] as const).map(([channel, label]) => (
                  <label key={channel} className="canvas-rgb-field">
                    <span>{label}</span>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={props.customColorDraft[channel]}
                      onChange={(event) => props.onCustomChannelChange(channel, Number(event.target.value))}
                    />
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={props.customColorDraft[channel]}
                      onChange={(event) => props.onCustomChannelChange(channel, Number(event.target.value))}
                    />
                  </label>
                ))}
              </div>

              {props.recentColors.length > 0 && (
                <div className="canvas-recent-colors">
                  <span>{CANVAS_COPY.paint.recentColors}</span>
                  <div>
                    {props.recentColors.map((color) => {
                      const hex = rgbToHex(color);
                      return (
                        <button
                          key={hex}
                          type="button"
                          className="canvas-recent-swatch"
                          style={{ backgroundColor: hex }}
                          onClick={() => props.onPickRecent(color)}
                          aria-label={`recent color ${hex}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="canvas-popover-actions">
                <button type="button" className="canvas-secondary-button" onClick={props.onCloseCustom}>
                  {CANVAS_COPY.actions.cancel}
                </button>
                <button type="button" className="canvas-primary-button" onClick={props.onApplyCustom}>
                  {CANVAS_COPY.actions.apply}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CanvasPaintPanel;
