import React from "react";
import { CanvasSeasonSummary } from "../../lib/api";
import { formatSeasonCode } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";
import { ActivityItem } from "./canvasUtils";

interface CanvasSidebarProps {
  readonly season: CanvasSeasonSummary | null;
  readonly boardSize: number;
  readonly nickname: string;
  readonly onNicknameChange: (value: string) => void;
  readonly recentActivity: readonly ActivityItem[];
}

function CanvasSidebar({
  season,
  boardSize,
  nickname,
  onNicknameChange,
  recentActivity
}: CanvasSidebarProps): JSX.Element {
  return (
    <aside className="canvas-sidebar">
      <div className="canvas-sidebar-card">
        <span className="canvas-chip">{CANVAS_COPY.chips.board}</span>
        <h1>{formatSeasonCode(season?.seasonCode ?? "2026-04")}</h1>
        <strong>{boardSize} x {boardSize}</strong>
        <p className="canvas-sidebar-copy">닉네임을 정하고, 최근 활동을 실시간으로 확인해보세요.</p>

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

        <div className="canvas-activity-block">
          <span className="canvas-activity-label">{CANVAS_COPY.sidebar.recentActivity}</span>
          <ul>
            {recentActivity.length > 0
              ? recentActivity.map((item) => <li key={item.id}>{item.text}</li>)
              : <li>{CANVAS_COPY.sidebar.emptyActivity}</li>}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default CanvasSidebar;
