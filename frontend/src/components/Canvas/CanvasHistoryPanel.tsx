import React from "react";
import { CANVAS_COPY } from "./canvasCopy";
import { ActivityItem, formatRelativeTime } from "./canvasUtils";

interface CanvasHistoryPanelProps {
  readonly recentActivity: readonly ActivityItem[];
  readonly onOpenHistory: () => void;
  readonly onActivitySelect?: (item: ActivityItem) => void;
}

function CanvasHistoryPanel({
  recentActivity,
  onOpenHistory,
  onActivitySelect
}: CanvasHistoryPanelProps): JSX.Element {
  return (
    <section className="canvas-history-panel canvas-history-zone">
      <div className="canvas-history-panel-header">
        <div className="canvas-history-panel-header-copy">
          <span className="canvas-chip">{CANVAS_COPY.sidebar.recentActivity}</span>
          <strong className="canvas-history-panel-title">{CANVAS_COPY.sidebar.recentActivity}</strong>
        </div>

        <span className="canvas-history-live-chip">
          <span className="canvas-history-live-dot" aria-hidden="true" />
          실시간
        </span>
      </div>

      <div className="canvas-history-panel-scroll">
        <ul className="canvas-history-panel-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((item) => {
              const username = item.nickname || CANVAS_COPY.tooltip.anonymous;
              const coordinates = `(${item.x}, ${item.y})`;
              const relativeTime = formatRelativeTime(item.paintedAt);

              return (
                <li
                  key={item.id}
                  className="canvas-history-panel-item"
                  onClick={() => onActivitySelect?.(item)}
                >
                  <div className="canvas-history-panel-item-avatar" aria-hidden="true">
                    {username.charAt(0).toUpperCase() || "?"}
                  </div>

                  <div className="canvas-history-panel-item-body">
                    <div className="canvas-history-panel-item-row">
                      <strong className="canvas-history-panel-item-name">{username}</strong>
                      <span className="canvas-history-panel-item-time">{relativeTime}</span>
                    </div>

                    <div className="canvas-history-panel-item-row canvas-history-panel-item-row--meta">
                      <span className="canvas-history-panel-item-coords">{coordinates}</span>
                      <span className="canvas-history-panel-item-action">{CANVAS_COPY.actions.placePixel}</span>
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="canvas-history-panel-empty">
              <strong>{CANVAS_COPY.history.emptyTitle}</strong>
              <span>{CANVAS_COPY.history.emptyBody}</span>
            </li>
          )}
        </ul>
      </div>

      <div className="canvas-history-panel-footer canvas-history-panel-footer--single">
        <button type="button" className="canvas-history-launch is-history" onClick={onOpenHistory}>
          <span className="canvas-history-launch-label">캔버스 히스토리</span>
          <strong>열기</strong>
        </button>
      </div>
    </section>
  );
}

export default CanvasHistoryPanel;
