import React from "react";
import { CANVAS_COPY } from "./canvasCopy";
import { ActivityItem } from "./canvasUtils";

interface CanvasHistoryPanelProps {
  readonly recentActivity: readonly ActivityItem[];
  readonly isActivityPaused: boolean;
  readonly pendingActivityCount: number;
  readonly onOpenHistory: () => void;
  readonly onToggleActivityPause: () => void;
  readonly onClearActivity: () => void;
}

function CanvasHistoryPanel({
  recentActivity,
  isActivityPaused,
  pendingActivityCount,
  onOpenHistory,
  onToggleActivityPause,
  onClearActivity
}: CanvasHistoryPanelProps): JSX.Element {
  const pausedHint =
    pendingActivityCount > 0
      ? CANVAS_COPY.sidebar.pausedWithCount.replace("{count}", String(pendingActivityCount))
      : CANVAS_COPY.sidebar.pausedNoPending;

  return (
    <section className="canvas-history-panel canvas-history-zone">
      <div className="canvas-history-panel-header">
        <div className="canvas-activity-title-row">
          <span className="canvas-chip">{CANVAS_COPY.chips.history}</span>
          <span className="canvas-activity-label">{CANVAS_COPY.sidebar.recentActivity}</span>
        </div>
        <div className="canvas-activity-controls">
          <button
            type="button"
            className={`canvas-activity-control ${isActivityPaused ? "is-active" : ""}`}
            onClick={onToggleActivityPause}
          >
            {isActivityPaused ? CANVAS_COPY.actions.resumeActivity : CANVAS_COPY.actions.pauseActivity}
          </button>
          <button type="button" className="canvas-activity-control is-destructive" onClick={onClearActivity}>
            {CANVAS_COPY.actions.clearActivity}
          </button>
        </div>
      </div>

      {isActivityPaused && <p className="canvas-activity-hint">{pausedHint}</p>}

      <ul className="canvas-history-panel-list">
        {recentActivity.length > 0
          ? recentActivity.map((item) => <li key={item.id}>{item.text}</li>)
          : <li>{CANVAS_COPY.sidebar.emptyActivity}</li>}
      </ul>

      <div className="canvas-history-panel-footer">
        <button type="button" className="canvas-history-launch is-archive" onClick={onOpenHistory}>
          <span>{CANVAS_COPY.chips.history}</span>
          <strong>{CANVAS_COPY.actions.openHistoryCompact}</strong>
        </button>
        <button type="button" className="canvas-history-launch is-gallery" onClick={onOpenHistory}>
          <span>{CANVAS_COPY.chips.archive}</span>
          <strong>{CANVAS_COPY.actions.openGallery}</strong>
        </button>
      </div>
    </section>
  );
}

export default CanvasHistoryPanel;
