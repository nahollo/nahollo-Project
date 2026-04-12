import React, { useEffect, useState } from "react";
import { BASIC_PICKER_PALETTE, RGBColor, rgbToHex } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";

interface CanvasMobileColorSheetProps {
  readonly isOpen: boolean;
  readonly customColorDraft: RGBColor;
  readonly recentColors: readonly RGBColor[];
  readonly onClose: () => void;
  readonly onCustomHexChange: (value: string) => void;
  readonly onCustomPickerChange: (value: string) => void;
  readonly onCustomChannelChange: (channel: keyof RGBColor, value: number) => void;
  readonly isEyedropperAvailable: boolean;
  readonly onPickEyedropper: () => void;
  readonly onApply: () => void;
  readonly onPickRecent: (color: RGBColor) => void;
}

function CanvasMobileColorSheet(props: CanvasMobileColorSheetProps): JSX.Element | null {
  const customHex = rgbToHex(props.customColorDraft);
  const [hexInput, setHexInput] = useState(customHex);
  const [pickerTab, setPickerTab] = useState<"custom" | "palette">("custom");

  useEffect(() => {
    setHexInput(customHex);
  }, [customHex, props.isOpen]);

  useEffect(() => {
    if (props.isOpen) {
      setPickerTab("custom");
    }
  }, [props.isOpen]);

  if (!props.isOpen) {
    return null;
  }

  return (
    <>
      <div className="canvas-overlay-backdrop is-strong" onClick={props.onClose} aria-hidden="true" />
      <section className="canvas-mobile-color-sheet" role="dialog" aria-modal="true">
        <div className="canvas-mobile-sheet-header">
          <div>
            <strong>{CANVAS_COPY.paint.pickerGui}</strong>
          </div>
          <button type="button" className="canvas-close-button" onClick={props.onClose} aria-label={CANVAS_COPY.actions.closeColorPicker}>
            ×
          </button>
        </div>

        <div className="canvas-mobile-sheet-body">
          <div className="canvas-popover-tabs is-mobile">
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
            <button type="button" className="canvas-secondary-button" onClick={props.onClose}>
              {CANVAS_COPY.actions.cancel}
            </button>
            <button type="button" className="canvas-primary-button" onClick={props.onApply}>
              {CANVAS_COPY.actions.apply}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default CanvasMobileColorSheet;
