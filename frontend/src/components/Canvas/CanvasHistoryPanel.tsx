import React from "react";
import { CANVAS_COPY } from "./canvasCopy";
import { ActivityItem } from "./canvasUtils";

interface CanvasHistoryPanelProps {
  readonly recentActivity: readonly ActivityItem[];
  readonly onOpenHistory: () => void;
}

function CanvasHistoryPanel({ recentActivity, onOpenHistory }: CanvasHistoryPanelProps): JSX.Element {
  return (
    <section className="canvas-history-panel canvas-history-zone">
      <div className="canvas-history-panel-header">
        <div className="canvas-activity-title-row">
          <span className="canvas-chip">{CANVAS_COPY.chips.history}</span>
          <span className="canvas-activity-label">{CANVAS_COPY.sidebar.recentActivity}</span>
        </div>
      </div>

      <ul className="canvas-history-panel-list">
        {recentActivity.length > 0 ? (
          recentActivity.map((item) => <li key={item.id}>{item.text}</li>)
        ) : (
          <li>{CANVAS_COPY.sidebar.emptyActivity}</li>
        )}
      </ul>

      <div className="canvas-history-panel-footer canvas-history-panel-footer--single">
        <button type="button" className="canvas-history-launch is-history" onClick={onOpenHistory}>
          <span>{CANVAS_COPY.chips.archive}</span>
          <strong>캔버스 히스토리 보기</strong>
        </button>
      </div>
    </section>
  );
}

export default CanvasHistoryPanel;