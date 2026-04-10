import React, { useEffect, useMemo, useState } from "react";
import { typingSnippets } from "../../data/games";
import { fetchLeaderboard, LeaderboardEntry, submitLeaderboard } from "../../lib/api";
import GamesShell from "./GamesShell";

interface ResultState {
  readonly accuracy: number;
  readonly score: number;
  readonly wpm: number;
}

function pickRandomSnippet(currentId?: string): (typeof typingSnippets)[number] {
  const candidates = currentId ? typingSnippets.filter((snippet) => snippet.id !== currentId) : typingSnippets;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? typingSnippets[0];
}

function calculateAccuracy(input: string, target: string): number {
  if (!target.length) {
    return 100;
  }

  let correct = 0;

  for (let index = 0; index < Math.max(input.length, target.length); index += 1) {
    if (input[index] === target[index]) {
      correct += 1;
    }
  }

  return (correct / target.length) * 100;
}

function TypingGamePage(): JSX.Element {
  const [snippet, setSnippet] = useState(() => pickRandomSnippet());
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [nickname, setNickname] = useState("");
  const [leaderboard, setLeaderboard] = useState<readonly LeaderboardEntry[]>([]);
  const [submitMessage, setSubmitMessage] = useState("");

  const target = useMemo(() => snippet.lines.join("\n"), [snippet]);
  const liveAccuracy = useMemo(() => calculateAccuracy(input, target), [input, target]);

  const loadLeaderboard = async () => {
    try {
      const ranking = await fetchLeaderboard("typing");
      setLeaderboard(ranking);
    } catch (error) {
      setLeaderboard([]);
    }
  };

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  const finishRound = (value: string, finishedTimestamp: number) => {
    if (!startedAt || result) {
      return;
    }

    const durationMinutes = Math.max((finishedTimestamp - startedAt) / 60000, 1 / 60);
    const accuracy = calculateAccuracy(value, target);
    const correctCharacters = target.length * (accuracy / 100);
    const wpm = correctCharacters / 5 / durationMinutes;
    const score = Math.max(0, Math.round(wpm * (accuracy / 100)));

    setFinishedAt(finishedTimestamp);
    setResult({
      accuracy,
      score,
      wpm
    });
  };

  const handleChange = (value: string) => {
    const now = Date.now();

    if (!startedAt) {
      setStartedAt(now);
    }

    setInput(value);

    if (value.length >= target.length) {
      finishRound(value, now);
    }
  };

  const handleRestart = () => {
    setSnippet((previous) => pickRandomSnippet(previous.id));
    setInput("");
    setStartedAt(null);
    setFinishedAt(null);
    setResult(null);
    setNickname("");
    setSubmitMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!result) {
      return;
    }

    try {
      const ranking = await submitLeaderboard("typing", nickname.trim() || "Anonymous", result.score);
      setLeaderboard(ranking);
      setSubmitMessage("점수를 기록했습니다.");
    } catch (error) {
      setSubmitMessage("점수 저장에 실패했습니다.");
    }
  };

  return (
    <GamesShell
      title="코드 타이핑"
      description="랜덤 코드 스니펫을 줄 단위로 보여 주고, 끝까지 입력하면 WPM과 정확도를 계산합니다."
    >
      <div className="game-detail-grid">
        <section className="typing-panel nahollo-card">
          <div className="typing-header">
            <div>
              <span className="section-eyebrow">{snippet.language}</span>
              <h2>{snippet.title}</h2>
            </div>
            <div className="typing-header-actions">
              <span className="typing-caret" aria-hidden="true"></span>
              <button type="button" className="header-link" onClick={handleRestart}>
                새 라운드
              </button>
            </div>
          </div>

          <div className="typing-code-surface">
            {snippet.lines.map((line, index) => (
              <div key={`${snippet.id}-${index}`} className="typing-code-line">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <code>{line}</code>
              </div>
            ))}
          </div>

          <label className="typing-input-wrap">
            <span className="section-eyebrow">Type here</span>
            <textarea
              className="play-textarea typing-textarea"
              value={input}
              onChange={(event) => handleChange(event.target.value)}
              disabled={Boolean(result)}
              spellCheck={false}
              placeholder="코드를 그대로 입력해 보세요."
            />
          </label>

          <div className="typing-live-stats">
            <article className="play-metric-card compact">
              <span className="play-metric-label">Live accuracy</span>
              <strong>{liveAccuracy.toFixed(1)}%</strong>
            </article>
            <article className="play-metric-card compact">
              <span className="play-metric-label">Characters</span>
              <strong>
                {input.length} / {target.length}
              </strong>
            </article>
            <article className="play-metric-card compact">
              <span className="play-metric-label">Duration</span>
              <strong>{startedAt && finishedAt ? `${((finishedAt - startedAt) / 1000).toFixed(1)}s` : "running"}</strong>
            </article>
          </div>

          {result && (
            <div className="typing-result-panel">
              <div className="typing-result-summary">
                <article className="play-metric-card compact">
                  <span className="play-metric-label">WPM</span>
                  <strong className="typing-score-value">{result.wpm.toFixed(1)}</strong>
                </article>
                <article className="play-metric-card compact">
                  <span className="play-metric-label">Accuracy</span>
                  <strong>{result.accuracy.toFixed(1)}%</strong>
                </article>
                <article className="play-metric-card compact">
                  <span className="play-metric-label">Score</span>
                  <strong>{result.score}</strong>
                </article>
              </div>

              <form className="game-submit-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="play-input"
                  maxLength={20}
                  value={nickname}
                  placeholder="닉네임"
                  onChange={(event) => setNickname(event.target.value)}
                />
                <button type="submit" className="hero-button hero-button-primary">
                  점수 등록
                </button>
              </form>
              {submitMessage ? <p className="game-helper-text">{submitMessage}</p> : null}
            </div>
          )}
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
            <p className="game-helper-text">아직 등록된 기록이 없습니다.</p>
          )}
        </aside>
      </div>
    </GamesShell>
  );
}

export default TypingGamePage;
