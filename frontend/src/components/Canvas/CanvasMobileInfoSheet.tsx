import React from "react";
import { CANVAS_COPY } from "./canvasCopy";

interface CanvasMobileInfoSheetProps {
  readonly isOpen: boolean;
  readonly seasonLabel: string;
  readonly boardSize: number;
  readonly statusMessage: string;
  readonly connectionLabel: string;
  readonly cooldownLabel: string;
  readonly selectedColorLabel: string;
  readonly selectedUserLabel: string;
  readonly cooldownRuleText: string;
  readonly nickname: string;
  readonly onNicknameChange: (value: string) => void;
  readonly recentActivity: readonly string[];
  readonly onClose: () => void;
}

function CanvasMobileInfoSheet(props: CanvasMobileInfoSheetProps): JSX.Element | null {
  if (!props.isOpen) {
    return null;
  }

  return (
    <>
      <div className="canvas-overlay-backdrop is-strong" onClick={props.onClose} aria-hidden="true" />
      <section className="canvas-mobile-sheet canvas-mobile-info-sheet" role="dialog" aria-modal="true">
        <div className="canvas-mobile-sheet-header">
          <div>
            <span className="canvas-chip">{CANVAS_COPY.chips.board}</span>
            <strong>{props.seasonLabel}</strong>
          </div>
          <button type="button" className="canvas-close-button" onClick={props.onClose} aria-label={CANVAS_COPY.actions.closeInfo}>
            ×
          </button>
        </div>

        <div className="canvas-mobile-sheet-body">
          <strong className="canvas-mobile-board-size">{props.boardSize} × {props.boardSize}</strong>
          <p className="canvas-sidebar-copy">{props.statusMessage}</p>

          <div className="canvas-stat-grid">
            <article className="canvas-stat-card">
              <span>{CANVAS_COPY.status.connection}</span>
              <strong>{props.connectionLabel}</strong>
            </article>
            <article className="canvas-stat-card">
              <span>{CANVAS_COPY.status.cooldown}</span>
              <strong>{props.cooldownLabel}</strong>
            </article>
            <article className="canvas-stat-card">
              <span>{CANVAS_COPY.status.selectedUser}</span>
              <strong>{props.selectedUserLabel}</strong>
            </article>
            <article className="canvas-stat-card">
              <span>{CANVAS_COPY.status.selectedColor}</span>
              <strong>{props.selectedColorLabel}</strong>
            </article>
          </div>

          <label className="canvas-input-group">
            <span>{CANVAS_COPY.sidebar.nickname}</span>
            <input
              type="text"
              maxLength={32}
              placeholder={CANVAS_COPY.sidebar.nicknamePlaceholder}
              value={props.nickname}
              onChange={(event) => props.onNicknameChange(event.target.value)}
            />
          </label>

          <p className="canvas-rule-copy">{props.cooldownRuleText}</p>

          <div className="canvas-activity-block">
            <span className="canvas-activity-label">{CANVAS_COPY.sidebar.recentActivity}</span>
            <ul>
              {props.recentActivity.length > 0
                ? props.recentActivity.map((item) => <li key={item}>{item}</li>)
                : <li>{CANVAS_COPY.sidebar.emptyActivity}</li>}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

export default CanvasMobileInfoSheet;
