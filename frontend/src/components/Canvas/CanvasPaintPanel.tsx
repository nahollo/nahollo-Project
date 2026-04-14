import React, { useEffect, useState } from "react";
import { BASIC_PICKER_PALETTE, FIXED_CANVAS_PALETTE, RGBColor, rgbToHex } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";

export type PlaceActionState = "no-selection" | "ready" | "loading" | "cooldown" | "offline";

interface CanvasPaintPanelProps {
  readonly selectedColor: RGBColor;
  readonly customColorDraft: RGBColor;
  readonly recentColors: readonly RGBColor[];
  readonly isExpanded: boolean;
  readonly isDocked?: boolean;
  readonly cooldownLabel: string;
  readonly placementProgress: string;
  readonly isCustomColorOpen: boolean;
  readonly placeState: PlaceActionState;
  readonly isPlaceDisabled: boolean;
  readonly hasPlaceError: boolean;
  readonly selectedPixelLabel?: string;
  readonly canCopyCoordinates?: boolean;
  readonly helperText?: string;
  readonly onToggleExpanded: () => void;
  readonly onPlace: () => void;
  readonly onCopyCoordinates?: () => void;
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
    return `${cooldownLabel} ${CANVAS_COPY.paint.cooldownActionSuffix}`;
  }

  if (placeState === "offline") {
    return CANVAS_COPY.actions.connectionLost;
  }

  if (placeState === "no-selection") {
    return "위치를 선택하세요";
  }

  return CANVAS_COPY.actions.placePixel;
}

function renderCustomEditor(
  customHex: string,
  hexInput: string,
  pickerTab: "custom" | "palette",
  setPickerTab: React.Dispatch<React.SetStateAction<"custom" | "palette">>,
  setHexInput: React.Dispatch<React.SetStateAction<string>>,
  props: CanvasPaintPanelProps
): JSX.Element {
  return (
    <div className="canvas-inline-custom-editor">
      <div className="canvas-inline-custom-header">
        <strong>{CANVAS_COPY.paint.pickerGui}</strong>
        <button type="button" className="canvas-close-button" onClick={props.onCloseCustom} aria-label={CANVAS_COPY.actions.closeColorPicker}>
          ×
        </button>
      </div>

      <div className="canvas-popover-tabs">
        <button type="button" className={pickerTab === "custom" ? "is-active" : ""} onClick={() => setPickerTab("custom")}>
          {CANVAS_COPY.paint.pickerTabCustom}
        </button>
        <button type="button" className={pickerTab === "palette" ? "is-active" : ""} onClick={() => setPickerTab("palette")}>
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
                        aria-label={`palette color ${hex}`}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="canvas-popover-actions">
        <button type="button" className="canvas-secondary-button" onClick={props.onCloseCustom}>
          {CANVAS_COPY.actions.cancel}
        </button>
        <button type="button" className="canvas-primary-button" onClick={props.onApplyCustom}>
          {CANVAS_COPY.actions.apply}
        </button>
      </div>
    </div>
  );
}

function CanvasPaintPanel(props: CanvasPaintPanelProps): JSX.Element {
  const isPersistentInspector = Boolean(props.isDocked);
  const isExpanded = isPersistentInspector ? true : props.isExpanded;
  const selectedHex = rgbToHex(props.selectedColor);
  const customHex = rgbToHex(props.customColorDraft);
  const actionLabel = resolveActionLabel(props.placeState, props.cooldownLabel);
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

  const handlePrimaryAction = (): void => {
    if (!isPersistentInspector && !isExpanded) {
      props.onToggleExpanded();
      return;
    }

    props.onPlace();
  };

  if (isPersistentInspector) {
    return (
      <div className="canvas-paint-panel is-docked is-persistent">
        <section className="canvas-inspector-card">
          <div className="canvas-inspector-header">
            <strong>{CANVAS_COPY.status.selectedPixel}</strong>
          </div>

          <div className="canvas-coordinate-row">
            <div className={`canvas-coordinate-field ${props.canCopyCoordinates ? "is-filled" : "is-empty"}`}>
              {props.selectedPixelLabel ?? "좌표를 선택하세요"}
            </div>
            <button
              type="button"
              className="canvas-copy-button"
              onClick={props.onCopyCoordinates}
              disabled={!props.canCopyCoordinates}
              aria-label="좌표 복사"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h6A2.25 2.25 0 0 1 19.5 9.75v7.5a2.25 2.25 0 0 1-2.25 2.25h-6A2.25 2.25 0 0 1 9 17.25v-7.5Zm-4.5-3A2.25 2.25 0 0 1 6.75 4.5h6.75"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>

          <div className="canvas-paint-section">
            <span className="canvas-paint-section-label">{CANVAS_COPY.paint.currentColor}</span>
            <div className="canvas-current-color-row">
              <button
                type="button"
                className="canvas-current-color-trigger"
                onClick={props.onToggleCustom}
                aria-label={CANVAS_COPY.actions.openColorPicker}
              >
                <span className="canvas-current-color-swatch" style={{ backgroundColor: selectedHex }} aria-hidden="true" />
                <span>{selectedHex}</span>
              </button>

              <button
                type="button"
                className="canvas-color-tool-button"
                onClick={props.isEyedropperAvailable ? props.onPickEyedropper : props.onToggleCustom}
                aria-label={props.isEyedropperAvailable ? CANVAS_COPY.paint.pickScreenColor : CANVAS_COPY.actions.openColorPicker}
                title={props.isEyedropperAvailable ? CANVAS_COPY.paint.pickScreenColor : CANVAS_COPY.actions.openColorPicker}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M13.6 3.3a1.5 1.5 0 0 1 2.1 0l5 5a1.5 1.5 0 0 1 0 2.1l-1.9 1.9-2.8-2.8-1.8 1.8 2.8 2.8-5.1 5.1a2.5 2.5 0 0 1-1.1.6l-4.3 1.1a1 1 0 0 1-1.2-1.2l1.1-4.3a2.5 2.5 0 0 1 .6-1.1l5.1-5.1 2.8 2.8 1.8-1.8-2.8-2.8 1.9-1.9Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="canvas-paint-section canvas-paint-section-palette">
            <span className="canvas-paint-section-label">{CANVAS_COPY.paint.palette}</span>
            <div className="canvas-palette-grid canvas-palette-grid-reference">
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
          </div>

          {props.recentColors.length > 0 && (
            <div className="canvas-paint-section canvas-paint-recent-colors">
              <span className="canvas-paint-section-label">{CANVAS_COPY.paint.recentColors}</span>
              <div className="canvas-recent-color-row">
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

          {props.isCustomColorOpen && renderCustomEditor(customHex, hexInput, pickerTab, setPickerTab, setHexInput, props)}
        </section>

        <section className="canvas-placement-card">
          <div className="canvas-placement-card-header">
            <strong>{CANVAS_COPY.paint.statusTitle}</strong>
          </div>

          <div className="canvas-cooldown-bar-shell canvas-cooldown-bar-shell-reference">
            <div className="canvas-cooldown-bar">
              <span style={{ width: props.placementProgress }} />
            </div>
          </div>

          <div className="canvas-placement-status-row">
            <span className={`canvas-placement-status-badge is-${props.placeState}`}>{actionLabel}</span>
            <strong className="canvas-placement-status-time">
              {props.placeState === "ready" ? "지금 가능" : props.cooldownLabel}
            </strong>
          </div>

          <button
            type="button"
            className={`canvas-paint-launch-button is-desktop-cta is-${props.placeState} ${props.hasPlaceError ? "is-error" : ""}`}
            onClick={handlePrimaryAction}
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

          <p className="canvas-placement-helper">{props.helperText}</p>
        </section>
      </div>
    );
  }

  return (
    <div className={`canvas-paint-panel ${isExpanded ? "is-expanded" : "is-collapsed"} ${props.isDocked ? "is-docked" : ""}`}>
      <div className={`canvas-paint-expandable ${isExpanded ? "is-open" : "is-closed"}`} aria-hidden={!isExpanded}>
        <div className="canvas-paint-expandable-inner canvas-paint-reference-card">
          <button
            type="button"
            className="canvas-paint-popover-close canvas-close-button"
            onClick={props.onToggleExpanded}
            aria-label={CANVAS_COPY.actions.closePaint}
          >
            ×
          </button>

          <div className="canvas-paint-section">
            <span className="canvas-paint-section-label">{CANVAS_COPY.paint.currentColor}</span>
            <button
              type="button"
              className="canvas-current-color-trigger"
              onClick={props.onToggleCustom}
              aria-label={CANVAS_COPY.actions.openColorPicker}
            >
              <span className="canvas-current-color-swatch" style={{ backgroundColor: selectedHex }} aria-hidden="true" />
              <span>{selectedHex}</span>
            </button>
          </div>

          <div className="canvas-paint-section canvas-paint-section-palette">
            <span className="canvas-paint-section-label">{CANVAS_COPY.paint.palette}</span>
            <div className="canvas-palette-grid canvas-palette-grid-reference">
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
          </div>

          {props.recentColors.length > 0 && (
            <div className="canvas-paint-section canvas-paint-recent-colors">
              <span className="canvas-paint-section-label">{CANVAS_COPY.paint.recentColors}</span>
              <div className="canvas-recent-color-row">
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

          <div className="canvas-paint-section canvas-cooldown-bar-shell canvas-cooldown-bar-shell-reference">
            <span className="canvas-paint-section-label">{CANVAS_COPY.paint.statusTitle}</span>
            <div className="canvas-cooldown-bar">
              <span style={{ width: props.placementProgress }} />
            </div>
            <span className="canvas-cooldown-helper">{props.helperText}</span>
          </div>

          {props.isCustomColorOpen && renderCustomEditor(customHex, hexInput, pickerTab, setPickerTab, setHexInput, props)}
        </div>
      </div>

      <div className={`canvas-paint-action-row ${isExpanded ? "is-open" : "is-closed"}`}>
        <button
          type="button"
          className={`canvas-paint-launch-button ${isExpanded ? "is-active is-expanded-action" : ""} is-${props.placeState} ${props.hasPlaceError ? "is-error" : ""}`}
          onClick={handlePrimaryAction}
          disabled={isExpanded ? props.isPlaceDisabled : false}
          aria-expanded={isExpanded}
          aria-pressed={isExpanded}
          aria-busy={isExpanded && props.placeState === "loading"}
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
              <span>{isExpanded ? actionLabel : CANVAS_COPY.actions.placePixel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default CanvasPaintPanel;
