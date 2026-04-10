import React from "react";
import { CANVAS_COPY } from "./canvasCopy";

interface CanvasMobileTopBarProps {
  readonly seasonLabel: string;
  readonly connectionLabel: string;
  readonly cooldownLabel: string;
  readonly onOpenInfo: () => void;
  readonly onOpenHistory: () => void;
}

function CanvasMobileTopBar({
  seasonLabel,
  connectionLabel,
  cooldownLabel,
  onOpenInfo,
  onOpenHistory
}: CanvasMobileTopBarProps): JSX.Element {
  return (
    <div className="canvas-mobile-top-bar">
      <div className="canvas-mobile-top-copy">
        <strong>{seasonLabel}</strong>
        <span>
          {connectionLabel} · {cooldownLabel}
        </span>
      </div>

      <div className="canvas-mobile-top-actions">
        <button type="button" className="canvas-mobile-top-button" onClick={onOpenHistory}>
          {CANVAS_COPY.actions.openHistoryCompact}
        </button>
        <button type="button" className="canvas-mobile-top-button is-accent" onClick={onOpenInfo}>
          {CANVAS_COPY.actions.openInfo}
        </button>
      </div>
    </div>
  );
}

export default CanvasMobileTopBar;
