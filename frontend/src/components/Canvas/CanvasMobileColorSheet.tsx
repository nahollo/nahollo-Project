import React from "react";
import { RGBColor, rgbToHex } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";

interface CanvasMobileColorSheetProps {
  readonly isOpen: boolean;
  readonly customColorDraft: RGBColor;
  readonly recentColors: readonly RGBColor[];
  readonly onClose: () => void;
  readonly onCustomHexChange: (value: string) => void;
  readonly onCustomPickerChange: (value: string) => void;
  readonly onCustomChannelChange: (channel: keyof RGBColor, value: number) => void;
  readonly onApply: () => void;
  readonly onPickRecent: (color: RGBColor) => void;
}

function CanvasMobileColorSheet(props: CanvasMobileColorSheetProps): JSX.Element | null {
  if (!props.isOpen) {
    return null;
  }

  const customHex = rgbToHex(props.customColorDraft);

  return (
    <>
      <div className="canvas-overlay-backdrop is-strong" onClick={props.onClose} aria-hidden="true" />
      <section className="canvas-mobile-color-sheet" role="dialog" aria-modal="true">
        <div className="canvas-mobile-sheet-header">
          <div>
            <span className="canvas-chip">{CANVAS_COPY.chips.custom}</span>
            <strong>{CANVAS_COPY.paint.pickerTitle}</strong>
          </div>
          <button type="button" className="canvas-close-button" onClick={props.onClose} aria-label={CANVAS_COPY.actions.closeColorPicker}>
            ×
          </button>
        </div>

        <div className="canvas-mobile-sheet-body">
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
              ["red", "빨강"],
              ["green", "초록"],
              ["blue", "파랑"]
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
