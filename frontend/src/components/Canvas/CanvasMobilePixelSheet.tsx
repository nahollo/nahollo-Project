import React from "react";
import { RGBColor, rgbToHex } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";

interface CanvasMobilePixelSheetProps {
  readonly isOpen: boolean;
  readonly selectedLabel: string;
  readonly nickname: string;
  readonly color: RGBColor;
  readonly absoluteTime: string;
  readonly relativeTime: string;
  readonly onClose: () => void;
}

function CanvasMobilePixelSheet(props: CanvasMobilePixelSheetProps): JSX.Element | null {
  if (!props.isOpen) {
    return null;
  }

  return (
    <>
      <div className="canvas-overlay-backdrop" onClick={props.onClose} aria-hidden="true" />
      <section className="canvas-mobile-sheet canvas-mobile-pixel-sheet" role="dialog" aria-modal="true">
        <div className="canvas-mobile-sheet-header">
          <div>
            <span className="canvas-chip">{CANVAS_COPY.status.selectedPixel}</span>
            <strong>{props.selectedLabel}</strong>
          </div>
          <button type="button" className="canvas-close-button" onClick={props.onClose} aria-label={CANVAS_COPY.actions.closePixelInfo}>
            ×
          </button>
        </div>

        <div className="canvas-mobile-sheet-body">
          <article className="canvas-stat-card">
            <span>{CANVAS_COPY.tooltip.placedBy}</span>
            <strong>{props.nickname}</strong>
          </article>
          <article className="canvas-stat-card">
            <span>{CANVAS_COPY.status.selectedColor}</span>
            <strong>{rgbToHex(props.color)}</strong>
          </article>
          <article className="canvas-stat-card">
            <span>배치 시각</span>
            <strong>{props.absoluteTime}</strong>
          </article>
          <article className="canvas-stat-card">
            <span>상대 시간</span>
            <strong>{props.relativeTime}</strong>
          </article>
        </div>
      </section>
    </>
  );
}

export default CanvasMobilePixelSheet;
