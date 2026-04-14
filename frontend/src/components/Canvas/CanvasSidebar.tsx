import React, { useEffect, useRef, useState } from "react";
import { CanvasSeasonSummary } from "../../lib/api";
import { formatSeasonCode } from "../../data/canvas";
import { CANVAS_COPY } from "./canvasCopy";

interface CanvasSidebarProps {
  readonly season: CanvasSeasonSummary | null;
  readonly nickname: string;
  readonly onNicknameChange: (value: string) => void;
}

function CanvasSidebar({
  season,
  nickname,
  onNicknameChange
}: CanvasSidebarProps): JSX.Element {
  const nicknameInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  const boardTitle = formatSeasonCode(season?.seasonCode ?? "2026-04");
  const nicknameLabel = nickname.trim() || "nahollo";

  useEffect(() => {
    if (!isEditingNickname) {
      return;
    }

    const input = nicknameInputRef.current;
    if (!input) {
      return;
    }

    input.focus();
    input.select();
  }, [isEditingNickname]);

  const handleEditClick = (): void => {
    setIsEditingNickname(true);
  };

  const handleNicknameBlur = (): void => {
    if (!nickname.trim()) {
      onNicknameChange("nahollo");
    }
    setIsEditingNickname(false);
  };

  return (
    <section className="canvas-sidebar shared-board-panel">
      <div className="canvas-sidebar-card canvas-sidebar-card--reference">
        <section className="canvas-sidebar-section canvas-sidebar-section-meta canvas-sidebar-section-meta--reference">
          <span className="canvas-chip">{CANVAS_COPY.chips.board}</span>
          <h1>{boardTitle}</h1>
          <p className="canvas-sidebar-copy">{CANVAS_COPY.status.liveDescription}</p>
        </section>

        <section className="canvas-sidebar-section canvas-sidebar-section-profile canvas-sidebar-section-profile--reference">
          <div className="canvas-user-card">
            <div className="canvas-user-card-main">
              <div className="canvas-user-avatar" aria-hidden="true">
                {nicknameLabel.charAt(0).toUpperCase()}
              </div>

              <div className="canvas-user-card-copy">
                <strong className="canvas-user-card-name">{nicknameLabel}</strong>
                <span className="canvas-user-card-status">
                  <span className="canvas-user-card-status-dot" aria-hidden="true" />
                  함께 하고 있어요!
                </span>
              </div>
            </div>

            <button type="button" className="canvas-user-card-edit" onClick={handleEditClick}>
              수정
            </button>
          </div>

          <div className={`canvas-user-editor ${isEditingNickname ? "is-open" : "is-hidden"}`}>
            <label className="canvas-input-group">
              <span>{CANVAS_COPY.sidebar.nickname}</span>
              <input
                ref={nicknameInputRef}
                type="text"
                maxLength={32}
                placeholder={CANVAS_COPY.sidebar.nicknamePlaceholder}
                value={nickname}
                onChange={(event) => onNicknameChange(event.target.value)}
                onBlur={handleNicknameBlur}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "Escape") {
                    (event.currentTarget as HTMLInputElement).blur();
                  }
                }}
                spellCheck={false}
                autoComplete="off"
              />
            </label>
          </div>
        </section>
      </div>
    </section>
  );
}

export default CanvasSidebar;
