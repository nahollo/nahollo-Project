import React from "react";
import { CanvasSeasonSummary } from "../../lib/api";
import { formatSeasonCode } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";

interface CanvasSidebarProps {
  readonly season: CanvasSeasonSummary | null;
  readonly boardSize: number;
  readonly statusMessage: string;
  readonly connectionLabel: string;
  readonly cooldownLabel: string;
  readonly selectedColorLabel: string;
  readonly selectedUserLabel: string;
  readonly cooldownRuleText: string;
  readonly nickname: string;
  readonly onNicknameChange: (value: string) => void;
}

function CanvasSidebar({
  season,
  boardSize,
  statusMessage,
  connectionLabel,
  cooldownLabel,
  selectedColorLabel,
  selectedUserLabel,
  cooldownRuleText,
  nickname,
  onNicknameChange
}: CanvasSidebarProps): JSX.Element {
  return (
    <section className="canvas-sidebar shared-board-panel">
      <div className="canvas-sidebar-card">
        <section className="canvas-sidebar-section canvas-sidebar-section-meta">
          <span className="canvas-chip">{CANVAS_COPY.chips.board}</span>
          <h1>{formatSeasonCode(season?.seasonCode ?? "2026-04")}</h1>
          <strong>{boardSize} x {boardSize}</strong>
          <p className="canvas-sidebar-copy">{statusMessage}</p>
        </section>

        <section className="canvas-sidebar-section canvas-sidebar-section-stats">
          <div className="canvas-stat-grid">
            <article className="canvas-stat-card">
              <span>{CANVAS_COPY.status.connection}</span>
              <strong>{connectionLabel}</strong>
            </article>
            <article className="canvas-stat-card">
              <span>{CANVAS_COPY.status.cooldown}</span>
              <strong>{cooldownLabel}</strong>
            </article>
            <article className="canvas-stat-card">
              <span>{CANVAS_COPY.status.selectedUser}</span>
              <strong>{selectedUserLabel}</strong>
            </article>
            <article className="canvas-stat-card is-color">
              <span>{CANVAS_COPY.status.selectedColor}</span>
              <strong>{selectedColorLabel}</strong>
            </article>
          </div>
        </section>

        <section className="canvas-sidebar-section canvas-sidebar-section-profile">
          <label className="canvas-input-group">
            <span>{CANVAS_COPY.sidebar.nickname}</span>
            <input
              type="text"
              maxLength={32}
              placeholder={CANVAS_COPY.sidebar.nicknamePlaceholder}
              value={nickname}
              onChange={(event) => onNicknameChange(event.target.value)}
              spellCheck={false}
            />
          </label>

          <p className="canvas-rule-copy">{cooldownRuleText}</p>
        </section>
      </div>
    </section>
  );
}

export default CanvasSidebar;
