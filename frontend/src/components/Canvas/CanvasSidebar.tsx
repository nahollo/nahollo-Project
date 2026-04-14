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
  nickname,
  onNicknameChange
}: CanvasSidebarProps): JSX.Element {
  return (
    <section className="canvas-sidebar shared-board-panel">
      <div className="canvas-sidebar-card canvas-sidebar-card--minimal">
        <section className="canvas-sidebar-section canvas-sidebar-section-meta canvas-sidebar-section-meta--minimal">
          <span className="canvas-chip">{CANVAS_COPY.chips.board}</span>
          <h1>{formatSeasonCode(season?.seasonCode ?? "2026-04")}</h1>
          <p className="canvas-sidebar-copy">{CANVAS_COPY.status.liveDescription}</p>
        </section>

        <section className="canvas-sidebar-section canvas-sidebar-section-profile canvas-sidebar-section-profile--minimal">
          <label className="canvas-input-group">
            <span>{CANVAS_COPY.sidebar.nickname}</span>
            <input
              type="text"
              maxLength={32}
              placeholder={CANVAS_COPY.sidebar.nicknamePlaceholder}
              value={nickname}
              onChange={(event) => onNicknameChange(event.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        </section>
      </div>
    </section>
  );
}

export default CanvasSidebar;