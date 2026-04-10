import React, { useEffect, useRef, useState } from "react";
import { fetchLeaderboard, LeaderboardEntry, submitLeaderboard } from "../../lib/api";
import GamesShell from "./GamesShell";

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: "bug" | "server";
}

interface GameState {
  readonly playerY: number;
  readonly playerVelocity: number;
  readonly obstacles: readonly Obstacle[];
  readonly score: number;
  readonly speed: number;
  readonly lastSpawnAt: number;
}

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 280;
const GROUND_Y = 210;
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 30;
const BASE_SPEED = 5.2;
const GRAVITY = 0.9;
const JUMP_POWER = -12.8;

function createInitialState(): GameState {
  return {
    playerY: GROUND_Y,
    playerVelocity: 0,
    obstacles: [],
    score: 0,
    speed: BASE_SPEED,
    lastSpawnAt: 0
  };
}

function JumpGamePage(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const gameStateRef = useRef<GameState>(createInitialState());
  const [phase, setPhase] = useState<"idle" | "running" | "finished">("idle");
  const [score, setScore] = useState(0);
  const [nickname, setNickname] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [leaderboard, setLeaderboard] = useState<readonly LeaderboardEntry[]>([]);

  const loadLeaderboard = async () => {
    try {
      const ranking = await fetchLeaderboard("jump");
      setLeaderboard(ranking);
    } catch (error) {
      setLeaderboard([]);
    }
  };

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  const drawScene = (state: GameState) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gradient = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#13291a");
    gradient.addColorStop(1, "#07130b");
    context.fillStyle = gradient;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.fillStyle = "#0f1f16";
    context.fillRect(0, GROUND_Y + PLAYER_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    context.fillStyle = "#1f5f2f";
    context.fillRect(0, GROUND_Y + PLAYER_HEIGHT, CANVAS_WIDTH, 4);

    context.fillStyle = "#d7ffe1";
    context.font = "700 18px JetBrains Mono, monospace";
    context.fillText(`Score ${Math.floor(state.score)}`, 24, 32);

    const playerX = 80;
    const playerY = state.playerY;

    context.fillStyle = "#9bf7b0";
    context.fillRect(playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
    context.fillStyle = "#08100b";
    context.fillRect(playerX + 5, playerY + 6, 5, 5);
    context.fillRect(playerX + 14, playerY + 6, 5, 5);
    context.fillRect(playerX + 8, playerY + 18, 8, 6);

    state.obstacles.forEach((obstacle) => {
      if (obstacle.type === "server") {
        context.fillStyle = "#6d9bff";
        context.fillRect(obstacle.x, GROUND_Y + PLAYER_HEIGHT - obstacle.height, obstacle.width, obstacle.height);
        context.fillStyle = "#ebf2ff";
        context.fillRect(obstacle.x + 4, GROUND_Y + PLAYER_HEIGHT - obstacle.height + 5, obstacle.width - 8, 4);
        context.fillRect(obstacle.x + 4, GROUND_Y + PLAYER_HEIGHT - obstacle.height + 14, obstacle.width - 8, 4);
      } else {
        context.fillStyle = "#ff6b9d";
        context.fillRect(obstacle.x, GROUND_Y + PLAYER_HEIGHT - obstacle.height, obstacle.width, obstacle.height);
        context.fillStyle = "#290d1a";
        context.fillRect(obstacle.x + 4, GROUND_Y + PLAYER_HEIGHT - obstacle.height + 4, 4, 4);
        context.fillRect(obstacle.x + obstacle.width - 8, GROUND_Y + PLAYER_HEIGHT - obstacle.height + 4, 4, 4);
      }
    });
  };

  const jump = () => {
    if (phase === "idle") {
      setPhase("running");
      gameStateRef.current = createInitialState();
      previousTimeRef.current = null;
      return;
    }

    if (phase !== "running") {
      return;
    }

    const current = gameStateRef.current;
    if (current.playerY >= GROUND_Y) {
      gameStateRef.current = {
        ...current,
        playerVelocity: JUMP_POWER
      };
    }
  };

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();

        if (phase === "idle") {
          setPhase("running");
          gameStateRef.current = createInitialState();
          previousTimeRef.current = null;
          return;
        }

        if (phase !== "running") {
          return;
        }

        const current = gameStateRef.current;
        if (current.playerY >= GROUND_Y) {
          gameStateRef.current = {
            ...current,
            playerVelocity: JUMP_POWER
          };
        }
      }
    };

    window.addEventListener("keydown", keyHandler);

    return () => {
      window.removeEventListener("keydown", keyHandler);
    };
  }, [phase]);

  useEffect(() => {
    drawScene(gameStateRef.current);
  }, []);

  useEffect(() => {
    if (phase !== "running") {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }

      return;
    }

    const tick = (timestamp: number) => {
      const previousTimestamp = previousTimeRef.current ?? timestamp;
      const delta = Math.min((timestamp - previousTimestamp) / 16.6667, 2);
      previousTimeRef.current = timestamp;

      const current = gameStateRef.current;
      const nextVelocity = current.playerVelocity + GRAVITY * delta;
      const nextPlayerY = Math.min(GROUND_Y, current.playerY + nextVelocity * delta);
      const shouldSpawn = timestamp - current.lastSpawnAt > Math.max(680, 1180 - current.score * 2.5);

      const nextObstacles = current.obstacles
        .map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - current.speed * delta
        }))
        .filter((obstacle) => obstacle.x + obstacle.width > -20);

      if (shouldSpawn) {
        nextObstacles.push({
          x: CANVAS_WIDTH + 20,
          width: Math.random() > 0.5 ? 26 : 32,
          height: Math.random() > 0.5 ? 34 : 46,
          type: Math.random() > 0.5 ? "server" : "bug"
        });
      }

      const nextState: GameState = {
        playerY: nextPlayerY,
        playerVelocity: nextPlayerY >= GROUND_Y ? 0 : nextVelocity,
        obstacles: nextObstacles,
        score: current.score + delta * 0.8,
        speed: current.speed + delta * 0.008,
        lastSpawnAt: shouldSpawn ? timestamp : current.lastSpawnAt
      };

      const playerBox = {
        left: 80,
        right: 80 + PLAYER_WIDTH,
        top: nextState.playerY,
        bottom: nextState.playerY + PLAYER_HEIGHT
      };

      const collided = nextState.obstacles.some((obstacle) => {
        const obstacleTop = GROUND_Y + PLAYER_HEIGHT - obstacle.height;
        return (
          playerBox.right > obstacle.x &&
          playerBox.left < obstacle.x + obstacle.width &&
          playerBox.bottom > obstacleTop &&
          playerBox.top < obstacleTop + obstacle.height
        );
      });

      gameStateRef.current = nextState;
      drawScene(nextState);
      setScore(Math.floor(nextState.score));

      if (collided) {
        setPhase("finished");
        setSubmitMessage("");
        return;
      }

      animationRef.current = window.requestAnimationFrame(tick);
    };

    animationRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase]);

  const handleRestart = () => {
    gameStateRef.current = createInitialState();
    previousTimeRef.current = null;
    setScore(0);
    setNickname("");
    setSubmitMessage("");
    setPhase("idle");
    drawScene(gameStateRef.current);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const ranking = await submitLeaderboard("jump", nickname.trim() || "Anonymous", score);
      setLeaderboard(ranking);
      setSubmitMessage("점수를 기록했습니다.");
    } catch (error) {
      setSubmitMessage("점수 저장에 실패했습니다.");
    }
  };

  const phaseLabel = phase === "idle" ? "ready" : phase === "running" ? "running" : "game over";

  return (
    <GamesShell
      title="서버 점프"
      description="Space 또는 화면 탭으로 점프합니다. 버그와 서버 장애물을 피하면서 얼마나 오래 버티는지 겨룹니다."
    >
      <div className="game-detail-grid">
        <section className="jump-panel nahollo-card">
          <div className="jump-header">
            <div>
              <span className="section-eyebrow">runner</span>
              <h2>Space or tap to jump</h2>
            </div>
            <div className="jump-actions">
              <button type="button" className="header-link" onClick={jump}>
                {phase === "running" ? "점프" : "시작"}
              </button>
              <button type="button" className="header-link" onClick={handleRestart}>
                리셋
              </button>
            </div>
          </div>

          <canvas ref={canvasRef} className="jump-canvas" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onClick={jump} />

          <div className="typing-live-stats">
            <article className="play-metric-card compact">
              <span className="play-metric-label">Phase</span>
              <strong>{phaseLabel}</strong>
            </article>
            <article className="play-metric-card compact">
              <span className="play-metric-label">Score</span>
              <strong className="typing-score-value">{score}</strong>
            </article>
          </div>

          {phase === "finished" && (
            <form className="game-submit-form" onSubmit={handleSubmit}>
              <input
                type="text"
                className="play-input"
                value={nickname}
                maxLength={20}
                placeholder="닉네임"
                onChange={(event) => setNickname(event.target.value)}
              />
              <button type="submit" className="hero-button hero-button-primary">
                점수 등록
              </button>
            </form>
          )}

          {submitMessage ? <p className="game-helper-text">{submitMessage}</p> : null}
        </section>

        <aside className="leaderboard-panel nahollo-card">
          <div className="leaderboard-head">
            <span className="section-eyebrow">Leaderboard</span>
            <h2>Top 10</h2>
          </div>

          {leaderboard.length > 0 ? (
            <ol className="leaderboard-list">
              {leaderboard.map((entry, index) => (
                <li key={`${entry.nickname}-${entry.createdAt}-${index}`}>
                  <span>{index + 1}.</span>
                  <strong>{entry.nickname}</strong>
                  <em>{entry.score}</em>
                </li>
              ))}
            </ol>
          ) : (
            <p className="game-helper-text">첫 기록을 남겨 보세요.</p>
          )}
        </aside>
      </div>
    </GamesShell>
  );
}

export default JumpGamePage;
