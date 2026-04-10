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
  readonly selectedLabel: string;
  readonly selectedColorLabel: string;
  readonly nickname: string;
  readonly onNicknameChange: (value: string) => void;
  readonly recentActivity: readonly string[];
}

function CanvasSidebar({
  season,
  boardSize,
  statusMessage,
  connectionLabel,
  cooldownLabel,
  selectedLabel,
  selectedColorLabel,
  nickname,
  onNicknameChange,
  recentActivity
}: CanvasSidebarProps): JSX.Element {
  return (
    <aside className="canvas-sidebar">
      <div className="canvas-sidebar-card">
        <span className="canvas-chip">{CANVAS_COPY.chips.board}</span>
        <h1>{formatSeasonCode(season?.seasonCode ?? "2026-04")}</h1>
        <strong>{boardSize} × {boardSize}</strong>
        <p className="canvas-sidebar-copy">{statusMessage}</p>

        <div className="canvas-stat-grid">
          <article className="canvas-stat-card is-connection">
            <span>{CANVAS_COPY.status.connection}</span>
            <strong>{connectionLabel}</strong>
          </article>
          <article className="canvas-stat-card is-cooldown">
            <span>{CANVAS_COPY.status.cooldown}</span>
            <strong>{cooldownLabel}</strong>
          </article>
          <article className="canvas-stat-card is-coordinate">
            <span>{CANVAS_COPY.status.selectedPixel}</span>
            <strong>{selectedLabel}</strong>
          </article>
          <article className="canvas-stat-card is-color">
            <span>{CANVAS_COPY.status.selectedColor}</span>
            <strong>{selectedColorLabel}</strong>
          </article>
        </div>

        <label className="canvas-input-group">
          <span>{CANVAS_COPY.sidebar.nickname}</span>
          <input
            type="text"
            maxLength={32}
            placeholder={CANVAS_COPY.sidebar.nicknamePlaceholder}
            value={nickname}
            onChange={(event) => onNicknameChange(event.target.value)}
          />
        </label>

        <p className="canvas-rule-copy">{CANVAS_COPY.sidebar.rule}</p>

        <div className="canvas-activity-block">
          <span className="canvas-activity-label">{CANVAS_COPY.sidebar.recentActivity}</span>
          <ul>
            {recentActivity.length > 0 ? recentActivity.map((item) => <li key={item}>{item}</li>) : <li>{CANVAS_COPY.sidebar.emptyActivity}</li>}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default CanvasSidebar;
