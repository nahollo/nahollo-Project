import React, { useState } from "react";
import { adventureNodes } from "../../data/games";
import GamesShell from "./GamesShell";

function AdventureGamePage(): JSX.Element {
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const currentNode = adventureNodes[currentNodeId];

  return (
    <GamesShell
      title="서버룸 어드벤처"
      description="백엔드 없이 브라우저 상태만으로 진행되는 선택지 기반의 짧은 이야기입니다."
    >
      <section className="adventure-shell nahollo-card">
        <div className="adventure-header">
          <span className="section-eyebrow">text adventure</span>
          <h2>{currentNode.title}</h2>
        </div>

        <div className="adventure-log">
          {currentNode.text.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="adventure-choice-list">
          {currentNode.choices.map((choice) => (
            <button
              key={`${currentNode.id}-${choice.next}-${choice.label}`}
              type="button"
              className="hero-button hero-button-secondary"
              onClick={() => setCurrentNodeId(choice.next)}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <button type="button" className="header-link" onClick={() => setCurrentNodeId("start")}>
          처음으로
        </button>
      </section>
    </GamesShell>
  );
}

export default AdventureGamePage;
