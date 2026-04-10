import React from "react";
import { CanvasHistoryDetailResponse, CanvasSnapshotResponse } from "../../lib/api";
import { CANVAS_HISTORY_THUMBNAIL_SIZE, formatSeasonCode, rgbToHex, unpackRgb } from "../../data/canvas";
import CanvasPreview from "./CanvasPreview";
import { CANVAS_COPY } from "./canvasCopy";
import { formatTimestamp } from "./canvasUtils";

interface CanvasHistoryOverlayProps {
  readonly isOpen: boolean;
  readonly history: readonly CanvasSnapshotResponse[];
  readonly selectedHistoryCode: string | null;
  readonly historyDetail: CanvasHistoryDetailResponse | null;
  readonly isHistoryLoading: boolean;
  readonly onCloseDrawer: () => void;
  readonly onOpenDetail: (seasonCode: string) => void;
  readonly onCloseDetail: () => void;
}

function CanvasHistoryOverlay(props: CanvasHistoryOverlayProps): JSX.Element {
  return (
    <>
      {props.isOpen && (
        <>
          <div className="canvas-overlay-backdrop" onClick={props.onCloseDrawer} aria-hidden="true" />
          <aside className="canvas-history-drawer">
            <div className="canvas-drawer-header">
              <div>
                <span className="canvas-chip">{CANVAS_COPY.chips.history}</span>
                <strong>{CANVAS_COPY.history.title}</strong>
              </div>
              <button type="button" className="canvas-close-button" onClick={props.onCloseDrawer} aria-label={CANVAS_COPY.actions.closeHistory}>
                ×
              </button>
            </div>

            <div className="canvas-history-list">
              {props.history.length > 0 ? (
                props.history.map((item) => (
                  <button
                    key={item.seasonCode}
                    type="button"
                    className="canvas-history-card"
                    onClick={() => props.onOpenDetail(item.seasonCode)}
                  >
                    <CanvasPreview pixels={item.thumbnailPixels} size={CANVAS_HISTORY_THUMBNAIL_SIZE} className="canvas-history-preview" />
                    <div className="canvas-history-copy">
                      <strong>{formatSeasonCode(item.seasonCode)}</strong>
                      <span>{formatTimestamp(item.startsAt)} — {formatTimestamp(item.endsAt)}</span>
                      <span>{CANVAS_COPY.history.totalPixels} {item.pixelCount} · {CANVAS_COPY.history.participants} {item.participantCount}</span>
                      <div className="canvas-dominant-colors">
                        {item.dominantColors.slice(0, 4).map((color) => (
                          <span key={`${item.seasonCode}-${color}`} style={{ backgroundColor: rgbToHex(unpackRgb(color)) }} />
                        ))}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <article className="canvas-empty-card">
                  <strong>{CANVAS_COPY.history.emptyTitle}</strong>
                  <p>{CANVAS_COPY.history.emptyBody}</p>
                </article>
              )}
            </div>
          </aside>
        </>
      )}

      {props.selectedHistoryCode && (
        <>
          <div className="canvas-overlay-backdrop is-strong" onClick={props.onCloseDetail} aria-hidden="true" />
          <div className="canvas-history-modal" role="dialog" aria-modal="true">
            <div className="canvas-modal-header">
              <div>
                <span className="canvas-chip">{CANVAS_COPY.chips.archive}</span>
                <strong>{props.historyDetail ? formatSeasonCode(props.historyDetail.seasonCode) : props.selectedHistoryCode}</strong>
                <p>{props.historyDetail ? `${formatTimestamp(props.historyDetail.startsAt)} — ${formatTimestamp(props.historyDetail.endsAt)}` : "불러오는 중..."}</p>
              </div>
              <button type="button" className="canvas-close-button" onClick={props.onCloseDetail} aria-label={CANVAS_COPY.actions.closeHistoryDetail}>
                ×
              </button>
            </div>

            {props.isHistoryLoading || !props.historyDetail ? (
              <div className="canvas-modal-loading">{CANVAS_COPY.history.loadingDetail}</div>
            ) : (
              <div className="canvas-modal-body">
                <div className="canvas-modal-preview-frame">
                  <CanvasPreview pixels={props.historyDetail.pixels} size={props.historyDetail.width} className="canvas-modal-preview" />
                </div>
                <div className="canvas-modal-side">
                  <article>
                    <span>{CANVAS_COPY.history.totalPixels}</span>
                    <strong>{props.historyDetail.pixelCount}</strong>
                  </article>
                  <article>
                    <span>{CANVAS_COPY.history.participants}</span>
                    <strong>{props.historyDetail.participantCount}</strong>
                  </article>
                  <article>
                    <span>{CANVAS_COPY.history.dominantColors}</span>
                    <div className="canvas-dominant-colors is-large">
                      {props.historyDetail.dominantColors.map((color) => (
                        <span key={`modal-${color}`} style={{ backgroundColor: rgbToHex(unpackRgb(color)) }} />
                      ))}
                    </div>
                  </article>
                  <article>
                    <span>{CANVAS_COPY.history.seasonStatus}</span>
                    <strong>{CANVAS_COPY.history.archived}</strong>
                  </article>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default CanvasHistoryOverlay;
