import React, { useEffect, useState } from "react";
import { BASIC_PICKER_PALETTE, FIXED_CANVAS_PALETTE, RGBColor, rgbToHex } from "../../data/canvas";
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
  readonly isEyedropperAvailable: boolean;
  readonly onPickEyedropper: () => void;
  readonly onApplyCustom: () => void;
  readonly onPickRecent: (color: RGBColor) => void;
}

function resolveActionLabel(placeState: PlaceActionState, cooldownLabel: string): string {
  if (placeState === "loading") {
    return CANVAS_COPY.actions.placing;
  }
  if (placeState === "cooldown") {
    return cooldownLabel;
  }
  if (placeState === "offline") {
    return CANVAS_COPY.actions.connectionLost;
  }
  return CANVAS_COPY.actions.placePixel;
}

function CanvasPaintPanel(props: CanvasPaintPanelProps): JSX.Element {
  const selectedHex = rgbToHex(props.selectedColor);
  const customHex = rgbToHex(props.customColorDraft);
  const actionLabel = resolveActionLabel(props.placeState, props.cooldownLabel);
  const isReady = props.placeState === "ready";
  const [hexInput, setHexInput] = useState(customHex);
  const [pickerTab, setPickerTab] = useState<"custom" | "palette">("custom");

  useEffect(() => {
    setHexInput(customHex);
  }, [customHex, props.isCustomColorOpen]);

  useEffect(() => {
    if (props.isCustomColorOpen) {
      setPickerTab("custom");
    }
  }, [props.isCustomColorOpen]);

  return (
    <div className={`canvas-paint-panel ${props.isExpanded ? "is-expanded" : "is-collapsed"}`}>
      <div className={`canvas-paint-expandable ${props.isExpanded ? "is-open" : "is-closed"}`} aria-hidden={!props.isExpanded}>
        <div className="canvas-paint-expandable-inner">
          <div className="canvas-paint-popup-header">
            <button
              type="button"
              className="canvas-current-color-trigger"
              onClick={props.onToggleCustom}
              aria-label={CANVAS_COPY.actions.openColorPicker}
            >
              <span className="canvas-current-color-swatch" style={{ backgroundColor: selectedHex }} aria-hidden="true" />
              <span>{selectedHex}</span>
            </button>
            <button type="button" className="canvas-close-button" onClick={props.onToggleExpanded} aria-label={CANVAS_COPY.actions.closePaint}>
              ×
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
                    aria-label={`색상 ${hex}`}
                  />
                );
              })}

              <button type="button" className="canvas-custom-trigger" onClick={props.onToggleCustom} aria-label={CANVAS_COPY.actions.openColorPicker}>
                <span>+</span>
              </button>
            </div>

            <div className="canvas-cooldown-bar-shell">
              <span className="canvas-cooldown-label">
                {isReady ? CANVAS_COPY.status.ready : `${CANVAS_COPY.paint.cooldownPrefix} ${props.cooldownLabel}`}
              </span>
              <div className="canvas-cooldown-bar">
                <span style={{ width: props.placementProgress }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`canvas-paint-launch-button is-${props.placeState} ${props.hasPlaceError ? "is-error" : ""} ${props.isExpanded ? "is-active" : ""}`}
        onClick={props.isExpanded ? props.onPlace : props.onToggleExpanded}
        disabled={props.isExpanded ? props.isPlaceDisabled : false}
        aria-expanded={props.isExpanded}
        aria-pressed={props.isExpanded}
        aria-busy={props.isExpanded && props.placeState === "loading"}
      >
        {props.isExpanded && props.placeState === "loading" ? (
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
            <span>{props.isExpanded ? actionLabel : CANVAS_COPY.actions.placePixelReady}</span>
          </>
        )}
      </button>

      {props.isExpanded && props.isCustomColorOpen && (
        <div className="canvas-color-popover">
          <div className="canvas-popover-header">
            <div>
              <strong>{CANVAS_COPY.paint.pickerGui}</strong>
            </div>
            <button type="button" className="canvas-close-button" onClick={props.onCloseCustom} aria-label={CANVAS_COPY.actions.closeColorPicker}>
              ×
            </button>
          </div>

          <div className="canvas-popover-tabs">
            <button
              type="button"
              className={pickerTab === "custom" ? "is-active" : ""}
              onClick={() => setPickerTab("custom")}
            >
              {CANVAS_COPY.paint.pickerTabCustom}
            </button>
            <button
              type="button"
              className={pickerTab === "palette" ? "is-active" : ""}
              onClick={() => setPickerTab("palette")}
            >
              {CANVAS_COPY.paint.pickerTabPalette}
            </button>
          </div>

          <div className={`canvas-picker-tab-content is-${pickerTab}`}>
            {pickerTab === "custom" ? (
              <div className="canvas-picker-tab-panel">
                <div className="canvas-hex-row">
                  <label className="canvas-color-button" title={CANVAS_COPY.paint.pickerGui} style={{ backgroundColor: customHex }}>
                    <input type="color" value={customHex} onChange={(event) => props.onCustomPickerChange(event.target.value)} />
                  </label>

                  <label className="canvas-text-field canvas-hex-field">
                    <span>{CANVAS_COPY.paint.hex}</span>
                    <input
                      type="text"
                      value={hexInput}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setHexInput(nextValue);
                        props.onCustomHexChange(nextValue);
                      }}
                      onBlur={() => setHexInput(customHex)}
                    />
                  </label>

                  <button
                    type="button"
                    className="canvas-eyedropper-button"
                    onClick={props.onPickEyedropper}
                    disabled={!props.isEyedropperAvailable}
                    aria-label={CANVAS_COPY.paint.pickScreenColor}
                    title={props.isEyedropperAvailable ? CANVAS_COPY.paint.pickScreenColor : CANVAS_COPY.paint.eyedropperUnsupported}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M13.6 3.3a1.5 1.5 0 0 1 2.1 0l5 5a1.5 1.5 0 0 1 0 2.1l-1.9 1.9-2.8-2.8-1.8 1.8 2.8 2.8-5.1 5.1a2.5 2.5 0 0 1-1.1.6l-4.3 1.1a1 1 0 0 1-1.2-1.2l1.1-4.3a2.5 2.5 0 0 1 .6-1.1l5.1-5.1 2.8 2.8 1.8-1.8-2.8-2.8 1.9-1.9Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>

                <div className="canvas-rgb-fields">
                  {([
                    ["red", CANVAS_COPY.paint.channelRed],
                    ["green", CANVAS_COPY.paint.channelGreen],
                    ["blue", CANVAS_COPY.paint.channelBlue]
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
              </div>
            ) : (
              <div className="canvas-palette-library">
                {BASIC_PICKER_PALETTE.map((group) => (
                  <section key={group.label} className="canvas-palette-group">
                    <strong className="canvas-palette-group-title">{group.label}</strong>
                    <div className="canvas-palette-bank">
                      {group.colors.map((color) => {
                        const hex = rgbToHex(color);
                        const active = hex === customHex;
                        return (
                          <button
                            key={`${group.label}-${hex}`}
                            type="button"
                            className={`canvas-picker-swatch ${active ? "is-active" : ""}`}
                            style={{ backgroundColor: hex }}
                            onClick={() => props.onCustomPickerChange(hex)}
                            aria-label={`팔레트 색상 ${hex}`}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
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
                      aria-label={`최근 색상 ${hex}`}
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
  );
}

export default CanvasPaintPanel;
