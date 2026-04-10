import React, { useEffect, useState } from "react";
import { AiOutlineArrowRight } from "react-icons/ai";
import { Link } from "react-router-dom";
import { gamesCatalog } from "../../data/games";
import { fetchLeaderboard, LeaderboardEntry } from "../../lib/api";
import GamesShell from "./GamesShell";

function GamesPage(): JSX.Element {
  const [leaderboards, setLeaderboards] = useState<Record<string, readonly LeaderboardEntry[]>>({
    typing: [],
    jump: []
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [typing, jump] = await Promise.all([fetchLeaderboard("typing"), fetchLeaderboard("jump")]);

        if (!isMounted) {
          return;
        }

        setLeaderboards({
          typing,
          jump
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLeaderboards({
          typing: [],
          jump: []
        });
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <GamesShell
      title="바로 열고 바로 놀 수 있는 미니 아케이드"
      description="짧게 켜도 재미있고, 다시 들어와도 흔적이 남는 작은 게임들을 모아 두었습니다."
    >
      <div className="games-card-grid">
        {gamesCatalog.map((game) => {
          const board = leaderboards[game.slug] ?? [];
          const destination = game.slug === "adventure" ? "/games/adventure" : `/games/${game.slug}`;

          return (
            <article key={game.slug} className="games-card nahollo-card">
              <div className="games-card-head">
                <span className="section-eyebrow">{game.slug}</span>
                <h2>{game.title}</h2>
                <p>{game.description}</p>
              </div>

              <div className="games-card-preview">
                {game.slug === "typing" && <strong>랜덤 코드 스니펫 · WPM · 정확도</strong>}
                {game.slug === "jump" && <strong>Space / tap to jump · endless run</strong>}
                {game.slug === "adventure" && <strong>선택지 기반 이야기 · 저장 없이 가볍게</strong>}
              </div>

              <div className="games-card-leaderboard">
                <span>{game.leaderboardLabel ?? "Frontend-only"}</span>
                {board.length > 0 ? (
                  <ol>
                    {board.slice(0, 3).map((entry) => (
                      <li key={`${game.slug}-${entry.nickname}-${entry.createdAt}`}>
                        <strong>{entry.nickname}</strong>
                        <span>{entry.score}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>{game.leaderboardLabel ? "첫 기록을 남겨 보세요." : "이 게임은 브라우저 안에서만 진행됩니다."}</p>
                )}
              </div>

              <Link to={destination} className="home-inline-link">
                플레이하러 가기
                <AiOutlineArrowRight />
              </Link>
            </article>
          );
        })}
      </div>
    </GamesShell>
  );
}

export default GamesPage;
