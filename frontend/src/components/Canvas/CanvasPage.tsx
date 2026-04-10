import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { canvasPalette } from "../../data/site";
import {
  ApiError,
  CanvasPixelPlacementResponse,
  CanvasPixelRecord,
  CanvasPixelUpdate,
  CanvasSnapshotResponse,
  fetchCanvasCooldown,
  fetchCanvasHistory,
  fetchCanvasState,
  placeCanvasPixel,
  resolveWebSocketUrl
} from "../../lib/api";

const CANVAS_SIZE = 128;
const COOLDOWN_SECONDS = 300;

interface HoveredPixel {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly clientX: number;
  readonly clientY: number;
}

function createBlankCanvasState(): CanvasPixelRecord[] {
  return Array.from({ length: CANVAS_SIZE * CANVAS_SIZE }, () => ({
    colorIndex: 0,
    painter: null,
    paintedAt: null
  }));
}

function formatCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "아직 그려진 기록이 없습니다.";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function displayPainterName(value: string | null): string {
  if (!value || value.trim() === "" || value === "Anonymous") {
    return "익명";
  }

  return value;
}

function parseHexColor(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((item) => item + item).join("") : normalized;
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ];
}

function applyPixelUpdate(previous: readonly CanvasPixelRecord[], update: CanvasPixelUpdate): CanvasPixelRecord[] {
  const next = previous.slice();
  const index = update.y * CANVAS_SIZE + update.x;
  next[index] = {
    colorIndex: update.colorIndex,
    painter: update.painter,
    paintedAt: update.paintedAt
  };
  return next;
}

function PixelSnapshotPreview({
  pixels,
  className
}: {
  readonly pixels: readonly number[];
  readonly className?: string;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const imageData = context.createImageData(CANVAS_SIZE, CANVAS_SIZE);

    pixels.forEach((colorIndex, index) => {
      const [red, green, blue] = parseHexColor(canvasPalette[colorIndex] ?? canvasPalette[0]);
      const offset = index * 4;
      imageData.data[offset] = red;
      imageData.data[offset + 1] = green;
      imageData.data[offset + 2] = blue;
      imageData.data[offset + 3] = 255;
    });

    context.putImageData(imageData, 0, 0);
  }, [pixels]);

  return <canvas ref={canvasRef} className={className} width={CANVAS_SIZE} height={CANVAS_SIZE} />;
}

function CooldownRing({ cooldownSeconds }: { readonly cooldownSeconds: number }): JSX.Element {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, cooldownSeconds / COOLDOWN_SECONDS));
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={`canvas-cooldown-ring ${cooldownSeconds > 0 ? "is-active" : ""}`}>
      <svg viewBox="0 0 120 120" className="canvas-cooldown-ring-svg" aria-hidden="true">
        <circle className="canvas-cooldown-ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="canvas-cooldown-ring-progress"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="canvas-cooldown-center">
        <strong>{cooldownSeconds > 0 ? formatCountdown(cooldownSeconds) : "READY"}</strong>
        <span>{cooldownSeconds > 0 ? "remaining" : "palette unlocked"}</span>
      </div>
    </div>
  );
}

function CanvasPage(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pixels, setPixels] = useState<CanvasPixelRecord[]>(() => createBlankCanvasState());
  const [history, setHistory] = useState<readonly CanvasSnapshotResponse[]>([]);
  const [selectedColor, setSelectedColor] = useState(9);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [nickname, setNickname] = useState("");
  const [hoveredPixel, setHoveredPixel] = useState<HoveredPixel | null>(null);
  const [statusMessage, setStatusMessage] = useState("실시간 캔버스에 연결하는 중입니다.");
  const [isPainting, setIsPainting] = useState(false);

  const hoveredRecord = hoveredPixel ? pixels[hoveredPixel.index] : null;
  const canPaint = cooldownSeconds <= 0 && !isPainting;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setNickname(window.localStorage.getItem("nahollo-canvas-nickname") ?? "");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("nahollo-canvas-nickname", nickname);
  }, [nickname]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [state, historyResponse, cooldown] = await Promise.all([
          fetchCanvasState(),
          fetchCanvasHistory(),
          fetchCanvasCooldown()
        ]);

        if (!isMounted) {
          return;
        }

        setPixels(state.length ? state.slice() : createBlankCanvasState());
        setHistory(historyResponse);
        setCooldownSeconds(cooldown.remainingSeconds);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatusMessage("캔버스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = new WebSocket(resolveWebSocketUrl("/ws/canvas"));

    socket.onopen = () => {
      setStatusMessage("실시간 픽셀 업데이트를 받고 있습니다.");
    };

    socket.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data) as CanvasPixelUpdate;
        setPixels((previous) => applyPixelUpdate(previous, update));
      } catch (error) {
        setStatusMessage("실시간 메시지를 해석하지 못했습니다.");
      }
    };

    socket.onerror = () => {
      setStatusMessage("실시간 연결이 잠시 불안정합니다. REST 상태는 계속 동작합니다.");
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setCooldownSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [cooldownSeconds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const imageData = context.createImageData(CANVAS_SIZE, CANVAS_SIZE);

    pixels.forEach((pixel, index) => {
      const [red, green, blue] = parseHexColor(canvasPalette[pixel.colorIndex] ?? canvasPalette[0]);
      const offset = index * 4;
      imageData.data[offset] = red;
      imageData.data[offset + 1] = green;
      imageData.data[offset + 2] = blue;
      imageData.data[offset + 3] = 255;
    });

    context.putImageData(imageData, 0, 0);
  }, [pixels]);

  const selectedColorValue = useMemo(() => canvasPalette[selectedColor] ?? canvasPalette[0], [selectedColor]);

  const refreshHistory = async () => {
    try {
      const nextHistory = await fetchCanvasHistory();
      setHistory(nextHistory);
    } catch (error) {
      setStatusMessage("히스토리 갤러리를 새로고침하지 못했습니다.");
    }
  };

  const handleCanvasPointer = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = Math.min(CANVAS_SIZE - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * CANVAS_SIZE)));
    const y = Math.min(CANVAS_SIZE - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * CANVAS_SIZE)));

    setHoveredPixel({
      index: y * CANVAS_SIZE + x,
      x,
      y,
      clientX: event.clientX,
      clientY: event.clientY
    });
  };

  const handlePlacementResult = (result: CanvasPixelPlacementResponse) => {
    if (result.update) {
      setPixels((previous) => applyPixelUpdate(previous, result.update));
    }

    setCooldownSeconds(result.remainingSeconds);
    setStatusMessage(
      result.success
        ? `픽셀을 배치했습니다. 다음 배치까지 ${formatCountdown(result.remainingSeconds)} 기다려 주세요.`
        : "픽셀 배치가 처리되지 않았습니다."
    );
  };

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canPaint) {
      return;
    }

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = Math.min(CANVAS_SIZE - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * CANVAS_SIZE)));
    const y = Math.min(CANVAS_SIZE - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * CANVAS_SIZE)));

    setIsPainting(true);

    try {
      const result = await placeCanvasPixel(x, y, selectedColor, nickname);
      handlePlacementResult(result);
      await refreshHistory();
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        const remaining =
          typeof error.data === "object" &&
          error.data !== null &&
          "remainingSeconds" in error.data &&
          typeof error.data.remainingSeconds === "number"
            ? error.data.remainingSeconds
            : COOLDOWN_SECONDS;

        setCooldownSeconds(remaining);
        setStatusMessage(`쿨다운 중입니다. ${formatCountdown(remaining)} 후에 다시 그릴 수 있습니다.`);
      } else {
        setStatusMessage("픽셀을 배치하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsPainting(false);
    }
  };

  return (
    <section className="playground-page page-canvas">
      <Container className="playground-shell canvas-shell">
        <header className="page-intro canvas-intro">
          <div className="page-intro-head">
            <span className="section-eyebrow">Canvas</span>
            <h1 className="page-title glow-text">128×128 live pixel board</h1>
            <p className="page-intro-description">
              한 번 그리면 5분 동안 기다려야 합니다. 느리지만, 그래서 더 많은 사람의 작은 선택이 선명하게 남습니다.
            </p>
          </div>

          <div className="canvas-status-banner nahollo-card">
            <strong>Realtime status</strong>
            <p>{statusMessage}</p>
          </div>
        </header>

        <div className="canvas-layout">
          <section className="canvas-board-panel nahollo-card">
            <div className="canvas-board-header">
              <div>
                <span className="section-eyebrow">Live board</span>
                <h2>nahollo community canvas</h2>
              </div>
              <div className="canvas-selected-chip">
                <span style={{ backgroundColor: selectedColorValue }} />
                Color {selectedColor.toString().padStart(2, "0")}
              </div>
            </div>

            <div className="canvas-stage">
              <div className="canvas-stage-shell">
                <canvas
                  ref={canvasRef}
                  className="canvas-board"
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  onMouseMove={handleCanvasPointer}
                  onMouseLeave={() => setHoveredPixel(null)}
                  onClick={handleCanvasClick}
                />
              </div>

              {hoveredPixel && hoveredRecord && (
                <div
                  className="canvas-tooltip"
                  style={{
                    top: hoveredPixel.clientY + 18,
                    left: hoveredPixel.clientX + 18
                  }}
                >
                  <strong>
                    ({hoveredPixel.x}, {hoveredPixel.y})
                  </strong>
                  <span>{displayPainterName(hoveredRecord.painter)}</span>
                  <span>{formatTimestamp(hoveredRecord.paintedAt)}</span>
                </div>
              )}
            </div>
          </section>

          <aside className="canvas-controls">
            <section className="canvas-control-panel nahollo-card">
              <div className="canvas-control-head">
                <span className="section-eyebrow">Cooldown</span>
                <h3>5 minute lock</h3>
              </div>
              <CooldownRing cooldownSeconds={cooldownSeconds} />
              <p>{cooldownSeconds > 0 ? "쿨다운이 끝날 때까지 팔레트가 잠깁니다." : "지금 바로 한 칸을 남길 수 있습니다."}</p>
            </section>

            <section className="canvas-control-panel nahollo-card">
              <div className="canvas-control-head">
                <span className="section-eyebrow">Painter</span>
                <h3>닉네임</h3>
              </div>
              <p>비워 두면 익명으로 기록됩니다. 닉네임은 이 브라우저에만 저장됩니다.</p>
              <input
                type="text"
                className="play-input"
                maxLength={20}
                placeholder="익명"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
              />
            </section>

            <section className="canvas-control-panel nahollo-card">
              <div className="canvas-control-head">
                <span className="section-eyebrow">Palette</span>
                <h3>32 colors</h3>
              </div>
              <p>{cooldownSeconds > 0 ? `${formatCountdown(cooldownSeconds)} 동안 팔레트가 비활성화됩니다.` : "색을 고른 뒤 보드를 클릭해 픽셀을 남겨 보세요."}</p>
              <div className={`canvas-palette ${cooldownSeconds > 0 ? "is-disabled" : ""}`}>
                {canvasPalette.map((color, index) => (
                  <button
                    key={color}
                    type="button"
                    className={`palette-swatch ${selectedColor === index ? "selected" : ""}`}
                    style={{ backgroundColor: color }}
                    disabled={!canPaint}
                    onClick={() => setSelectedColor(index)}
                    aria-label={`색상 ${index + 1}`}
                  />
                ))}
              </div>
            </section>

            <section className="canvas-control-panel nahollo-card">
              <div className="canvas-control-head">
                <span className="section-eyebrow">Rules</span>
                <h3>slow mode</h3>
              </div>
              <ul className="playground-note-list compact">
                <li>IP 기준 5분 쿨다운이 백엔드에서 강제됩니다.</li>
                <li>웹소켓으로 다른 사용자의 픽셀도 즉시 반영됩니다.</li>
                <li>저장된 스냅샷은 아래 갤러리에서 다시 볼 수 있습니다.</li>
              </ul>
            </section>
          </aside>
        </div>

        <section className="play-section canvas-history-section">
          <div className="play-section-head">
            <div>
              <span className="section-eyebrow">History</span>
              <h2 className="section-title">지난 캔버스 장면</h2>
            </div>
            <p className="section-lead">자동 저장된 스냅샷을 아래에서 확인할 수 있습니다.</p>
          </div>

          <div className="canvas-history-grid">
            {history.length > 0 ? (
              history.map((snapshot) => (
                <article key={snapshot.id} className="canvas-history-card nahollo-card">
                  <PixelSnapshotPreview pixels={snapshot.pixels} className="canvas-history-preview" />
                  <div className="canvas-history-copy">
                    <strong>{snapshot.label}</strong>
                    <span>{formatTimestamp(snapshot.savedAt)}</span>
                  </div>
                </article>
              ))
            ) : (
              <article className="canvas-history-empty nahollo-card">
                <strong>아직 저장된 캔버스가 없습니다.</strong>
                <p>첫 번째 자동 저장이 생기면 여기에 지난 장면이 쌓입니다.</p>
              </article>
            )}
          </div>
        </section>
      </Container>
    </section>
  );
}

export default CanvasPage;
