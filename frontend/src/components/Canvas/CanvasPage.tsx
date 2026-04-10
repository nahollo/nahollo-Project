import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ApiError,
  CanvasHistoryDetailResponse,
  CanvasPixelMetaResponse,
  CanvasPixelUpdate,
  CanvasSnapshotResponse,
  CanvasStateResponse,
  fetchCanvasCooldown,
  fetchCanvasHistory,
  fetchCanvasHistoryDetail,
  fetchCanvasPixelMeta,
  fetchCanvasState,
  placeCanvasPixel,
  resolveWebSocketUrl
} from "../../lib/api";
import {
  CANVAS_SIZE,
  clampChannel,
  DEFAULT_SELECTED_COLOR,
  hexToRgb,
  normalizeHex,
  RGBColor,
  rgbToHex,
  unpackRgb,
  formatSeasonCode
} from "../../data/canvas";
import CanvasHistoryOverlay from "./CanvasHistoryOverlay";
import CanvasMobileColorSheet from "./CanvasMobileColorSheet";
import CanvasMobileInfoSheet from "./CanvasMobileInfoSheet";
import CanvasMobilePaintTray from "./CanvasMobilePaintTray";
import CanvasMobilePixelSheet from "./CanvasMobilePixelSheet";
import CanvasMobileTopBar from "./CanvasMobileTopBar";
import CanvasPaintPanel from "./CanvasPaintPanel";
import CanvasSidebar from "./CanvasSidebar";
import { CANVAS_COPY, displayNickname } from "./canvasCopy";
import "./canvas.css";
import {
  ActivityItem,
  applyPixelUpdate,
  cacheMeta,
  clampOffset,
  createBlankCanvasState,
  formatCountdown,
  formatRelativeTime,
  formatTimestamp,
  getConnectionStatusLabel,
  mergeRecentColor,
  normalizeCanvasState,
  OffsetPoint,
  PixelPoint,
  pushActivity,
  readRecentColors,
  ToastState,
  writeRecentColors
} from "./canvasUtils";

const COOLDOWN_SECONDS = 300;
const MAX_ZOOM = 24;
const NICKNAME_STORAGE_KEY = "nahollo-canvas-nickname";
const MOBILE_BREAKPOINT = "(max-width: 991px)";

function CanvasPage(): JSX.Element {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const metaCacheRef = useRef<Map<string, CanvasPixelMetaResponse>>(new Map());
  const stageSizeRef = useRef(0);
  const scaleRef = useRef(1);
  const resizeFrameRef = useRef<number | null>(null);

  const [state, setState] = useState<CanvasStateResponse | null>(null);
  const [pixels, setPixels] = useState<number[]>(() => createBlankCanvasState(CANVAS_SIZE));
  const [boardSize, setBoardSize] = useState(CANVAS_SIZE);
  const [history, setHistory] = useState<readonly CanvasSnapshotResponse[]>([]);
  const [historyDetail, setHistoryDetail] = useState<CanvasHistoryDetailResponse | null>(null);
  const [selectedHistoryCode, setSelectedHistoryCode] = useState<string | null>(null);
  const [placedCount, setPlacedCount] = useState(0);
  const [selectedColor, setSelectedColor] = useState<RGBColor>(DEFAULT_SELECTED_COLOR);
  const [customColorDraft, setCustomColorDraft] = useState<RGBColor>(DEFAULT_SELECTED_COLOR);
  const [recentColors, setRecentColors] = useState<RGBColor[]>(() => readRecentColors(hexToRgb));
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [nickname, setNickname] = useState("");
  const [selectedPixel, setSelectedPixel] = useState<PixelPoint | null>(null);
  const [hoveredPixel, setHoveredPixel] = useState<PixelPoint | null>(null);
  const [hoveredMeta, setHoveredMeta] = useState<CanvasPixelMetaResponse | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<CanvasPixelMetaResponse | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [connectionState, setConnectionState] = useState<"CONNECTING" | "LIVE" | "DEGRADED" | "OFFLINE">("CONNECTING");
  const [statusMessage, setStatusMessage] = useState(CANVAS_COPY.status.liveDescription);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isCustomColorOpen, setIsCustomColorOpen] = useState(false);
  const [isPaintExpanded, setIsPaintExpanded] = useState(false);
  const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false);
  const [isMobilePixelInfoOpen, setIsMobilePixelInfoOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<OffsetPoint>({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState(0);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_BREAKPOINT).matches : false
  );

  const isTouchMode = useMemo(
    () => (typeof window !== "undefined" ? window.matchMedia("(hover: none), (pointer: coarse)").matches : false),
    []
  );
  const selectedColorHex = useMemo(() => rgbToHex(selectedColor), [selectedColor]);
  const canPlace = cooldownSeconds <= 0 && !isPlacing;
  const placementProgress = `${Math.max(0, Math.min(100, ((COOLDOWN_SECONDS - cooldownSeconds) / COOLDOWN_SECONDS) * 100))}%`;
  const connectionLabel = getConnectionStatusLabel(connectionState);
  const cooldownLabel = canPlace ? CANVAS_COPY.status.ready : `${formatCountdown(cooldownSeconds)} 남음`;
  const selectedLabel = selectedPixel ? `(${selectedPixel.x}, ${selectedPixel.y})` : CANVAS_COPY.status.notSelected;
  const selectedColorLabel = selectedMeta ? rgbToHex(unpackRgb(selectedMeta.color)) : selectedColorHex;
  const seasonLabel = formatSeasonCode(state?.season.seasonCode ?? "2026-04");

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNickname(window.localStorage.getItem(NICKNAME_STORAGE_KEY) ?? "");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
    }
  }, [nickname]);

  useEffect(() => {
    writeRecentColors(recentColors, rgbToHex);
  }, [recentColors]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = "matches" in event ? event.matches : mediaQuery.matches;
      setIsMobileLayout(matches);
      if (!matches) {
        setIsMobileInfoOpen(false);
        setIsMobilePixelInfoOpen(false);
      }
    };

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.round(entries[0]?.contentRect.width ?? 0);
      if (!nextWidth || nextWidth === stageSizeRef.current) {
        return;
      }

      stageSizeRef.current = nextWidth;

      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        setStageSize((previous) => (previous === nextWidth ? previous : nextWidth));
        setOffset((previous) => {
          const clamped = clampOffset(previous, scaleRef.current, nextWidth);
          return clamped.x === previous.x && clamped.y === previous.y ? previous : clamped;
        });
      });
    });

    observer.observe(stage);

    return () => {
      observer.disconnect();
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [stateResult, historyResult, cooldownResult] = await Promise.allSettled([
        fetchCanvasState(),
        fetchCanvasHistory(),
        fetchCanvasCooldown()
      ]);

      if (!mounted) {
        return;
      }

      if (stateResult.status === "fulfilled") {
        const normalized = normalizeCanvasState(stateResult.value.width, stateResult.value.pixels);
        setState(stateResult.value);
        setPlacedCount(stateResult.value.placedCount);
        setPixels(normalized.pixels);
        setBoardSize(normalized.size);
        setStatusMessage(CANVAS_COPY.status.liveDescription);
      } else {
        setToast({ tone: "error", text: CANVAS_COPY.toast.boardLoadError });
      }

      if (historyResult.status === "fulfilled") {
        setHistory(historyResult.value);
      }

      if (cooldownResult.status === "fulfilled") {
        setCooldownSeconds(cooldownResult.value.remainingSeconds);
      }

      setIsLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = new WebSocket(resolveWebSocketUrl("/ws/canvas"));
    socket.onopen = () => setConnectionState("LIVE");
    socket.onerror = () => setConnectionState("DEGRADED");
    socket.onclose = () => setConnectionState("OFFLINE");
    socket.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data) as CanvasPixelUpdate;
        setPixels((previous) => applyPixelUpdate(previous, boardSize, update));
        setPlacedCount((previous) => previous + 1);
        setRecentActivity((previous) => pushActivity(previous, update));
        cacheMeta(metaCacheRef.current, {
          x: update.x,
          y: update.y,
          nickname: update.painter ?? CANVAS_COPY.tooltip.anonymous,
          color: update.color,
          placedAt: update.paintedAt,
          overwrittenCount: update.overwrittenCount
        });
      } catch (error) {
        setConnectionState("DEGRADED");
      }
    };
    return () => socket.close();
  }, [boardSize]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => setCooldownSeconds((previous) => Math.max(0, previous - 1)), 1000);
    return () => window.clearInterval(interval);
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

    const imageData = context.createImageData(boardSize, boardSize);
    pixels.forEach((color, index) => {
      const { red, green, blue } = unpackRgb(color);
      const offsetIndex = index * 4;
      imageData.data[offsetIndex] = red;
      imageData.data[offsetIndex + 1] = green;
      imageData.data[offsetIndex + 2] = blue;
      imageData.data[offsetIndex + 3] = 255;
    });
    context.putImageData(imageData, 0, 0);
  }, [boardSize, pixels]);

  useEffect(() => {
    const target = isTouchMode ? selectedPixel : hoveredPixel;
    if (!target) {
      if (!isTouchMode) {
        setHoveredMeta(null);
      }
      return;
    }

    const cached = metaCacheRef.current.get(`${target.x}:${target.y}`);
    if (cached) {
      if (isTouchMode) {
        setSelectedMeta(cached);
      } else {
        setHoveredMeta(cached);
      }
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const meta = await fetchCanvasPixelMeta(target.x, target.y);
        cacheMeta(metaCacheRef.current, meta);
        if (isTouchMode) {
          setSelectedMeta(meta);
        } else {
          setHoveredMeta(meta);
        }
      } catch (error) {
        if (!isTouchMode) {
          setHoveredMeta(null);
        }
      }
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [hoveredPixel, isTouchMode, selectedPixel]);

  useEffect(() => {
    if (!selectedHistoryCode) {
      setHistoryDetail(null);
      return;
    }

    let mounted = true;
    setIsHistoryLoading(true);

    void fetchCanvasHistoryDetail(selectedHistoryCode)
      .then((detail) => mounted && setHistoryDetail(detail))
      .catch(() => mounted && setToast({ tone: "error", text: CANVAS_COPY.toast.historyDetailError }))
      .finally(() => mounted && setIsHistoryLoading(false));

    return () => {
      mounted = false;
    };
  }, [selectedHistoryCode]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsCustomColorOpen(false);
      setSelectedHistoryCode(null);
      setIsHistoryOpen(false);
      setIsMobileInfoOpen(false);
      setIsMobilePixelInfoOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const resolvePixelFromClient = (clientX: number, clientY: number): PixelPoint | null => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || stageSize <= 0) {
      return null;
    }

    const canvasLeft = rect.left + stageSize / 2 + offset.x - (stageSize * scale) / 2;
    const canvasTop = rect.top + stageSize / 2 + offset.y - (stageSize * scale) / 2;
    const cellSize = (stageSize * scale) / boardSize;
    const x = Math.floor((clientX - canvasLeft) / cellSize);
    const y = Math.floor((clientY - canvasTop) / cellSize);
    return x >= 0 && y >= 0 && x < boardSize && y < boardSize ? { x, y } : null;
  };

  const handlePlace = async () => {
    if (!selectedPixel || !canPlace) {
      return;
    }

    setIsPlacing(true);
    try {
      const result = await placeCanvasPixel(selectedPixel.x, selectedPixel.y, selectedColor, nickname);
      if (result.update) {
        setPixels((previous) => applyPixelUpdate(previous, boardSize, result.update));
        setPlacedCount((previous) => previous + 1);
        setRecentActivity((previous) => pushActivity(previous, result.update));
        cacheMeta(metaCacheRef.current, {
          x: result.update.x,
          y: result.update.y,
          nickname: result.update.painter ?? CANVAS_COPY.tooltip.anonymous,
          color: result.update.color,
          placedAt: result.update.paintedAt,
          overwrittenCount: result.update.overwrittenCount
        });
      }
      setCooldownSeconds(result.remainingSeconds);
      setToast({ tone: "success", text: CANVAS_COPY.toast.placeSuccess });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        const remaining =
          typeof error.data === "object" && error.data && "remainingSeconds" in error.data
            ? Number((error.data as { remainingSeconds: number }).remainingSeconds)
            : COOLDOWN_SECONDS;

        setCooldownSeconds(remaining);
      }
      setToast({ tone: "error", text: CANVAS_COPY.toast.placeError });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleStageWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextScale = Math.max(1, Math.min(MAX_ZOOM, scale * (event.deltaY > 0 ? 0.92 : 1.08)));
    setScale(nextScale);
    setOffset((previous) => clampOffset(previous, nextScale, stageSizeRef.current));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
      moved: false
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = resolvePixelFromClient(event.clientX, event.clientY);
    if (!isTouchMode) {
      setHoveredPixel(point);
    }

    if (!dragRef.current) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragRef.current.moved = true;
      setOffset(
        clampOffset(
          { x: dragRef.current.offsetX + deltaX, y: dragRef.current.offsetY + deltaY },
          scale,
          stageSizeRef.current
        )
      );
    }
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const moved = dragRef.current?.moved ?? false;
    dragRef.current = null;
    if (moved) {
      return;
    }

    const point = resolvePixelFromClient(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    setSelectedPixel(point);
    if (isTouchMode) {
      setSelectedMeta(metaCacheRef.current.get(`${point.x}:${point.y}`) ?? null);
      setIsMobilePixelInfoOpen(true);
    }
  };

  const computeBounds = (point: PixelPoint | null) => {
    if (!point || stageSize <= 0) {
      return undefined;
    }

    const cellSize = (stageSize * scale) / boardSize;
    return {
      left: stageSize / 2 + offset.x - (stageSize * scale) / 2 + point.x * cellSize,
      top: stageSize / 2 + offset.y - (stageSize * scale) / 2 + point.y * cellSize,
      width: cellSize,
      height: cellSize
    };
  };

  const hoveredBounds = computeBounds(hoveredPixel);
  const selectedBounds = computeBounds(selectedPixel);
  const activeMeta = isTouchMode ? selectedMeta : hoveredMeta;
  const stageRect = stageRef.current?.getBoundingClientRect();

  const tooltipStyle = (() => {
    const bounds = computeBounds(isTouchMode ? selectedPixel : hoveredPixel);
    if (!bounds || !stageRect) {
      return undefined;
    }

    const width = Math.min(stageSize * 0.28, 260);
    let left = stageRect.left + bounds.left + bounds.width + 12;
    let top = stageRect.top + bounds.top - 12;
    if (left + width > window.innerWidth - 16) {
      left = stageRect.left + bounds.left - width - 12;
    }
    if (top < 12) {
      top = stageRect.top + bounds.top + bounds.height + 12;
    }
    return { left, top };
  })();

  return (
    <section className="canvas-page">
      <div className="canvas-stage-layer">
        <div className="canvas-stage-shell">
          <div className="canvas-center-column">
            <div className="canvas-board-frame">
              <div
                ref={stageRef}
                className="canvas-board-stage"
                onWheel={handleStageWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishPointer}
                onPointerLeave={() => !isTouchMode && setHoveredPixel(null)}
              >
                <canvas
                  ref={canvasRef}
                  className="canvas-board"
                  width={boardSize}
                  height={boardSize}
                  style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
                />
                {scale >= 8 && (
                  <div className="canvas-grid-overlay" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }} />
                )}
                {hoveredBounds && !isTouchMode && <span className="canvas-hover-outline" style={hoveredBounds} aria-hidden="true" />}
                {selectedBounds && <span className="canvas-selected-outline" style={selectedBounds} aria-hidden="true" />}
              </div>
            </div>

            <div className="canvas-status-bar">
              <span>{CANVAS_COPY.status.hover}: {hoveredPixel ? `(${hoveredPixel.x}, ${hoveredPixel.y})` : "—"}</span>
              <span>{CANVAS_COPY.status.selected}: {selectedPixel ? `(${selectedPixel.x}, ${selectedPixel.y})` : "—"}</span>
              <span>{CANVAS_COPY.status.zoom}: {Math.round(scale * 100)}%</span>
              <span>{CANVAS_COPY.status.placedPixels}: {placedCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="canvas-overlay-root">
        {!isMobileLayout && (
          <>
            <div className="canvas-overlay-slot canvas-overlay-slot-left">
              <CanvasSidebar
                season={state?.season ?? null}
                boardSize={boardSize}
                statusMessage={statusMessage}
                connectionLabel={connectionLabel}
                cooldownLabel={cooldownLabel}
                selectedLabel={selectedLabel}
                selectedColorLabel={selectedColorLabel}
                nickname={nickname}
                onNicknameChange={setNickname}
                recentActivity={recentActivity.map((item) => item.text)}
              />
            </div>

            <button type="button" className="canvas-history-pill" onClick={() => setIsHistoryOpen(true)}>
              <span className="canvas-chip">{CANVAS_COPY.chips.history}</span>
              <span className="canvas-history-copy">
                <strong>{CANVAS_COPY.actions.openGallery}</strong>
              </span>
            </button>

            <div className="canvas-overlay-slot canvas-overlay-slot-right">
              <CanvasPaintPanel
                selectedColor={selectedColor}
                customColorDraft={customColorDraft}
                recentColors={recentColors}
                isExpanded={isPaintExpanded}
                canPlace={canPlace}
                isPlacing={isPlacing}
                cooldownLabel={formatCountdown(cooldownSeconds)}
                placementProgress={placementProgress}
                isCustomColorOpen={isCustomColorOpen}
                onToggleExpanded={() => setIsPaintExpanded((previous) => !previous)}
                onPlace={handlePlace}
                onPresetClick={setSelectedColor}
                onToggleCustom={() => setIsCustomColorOpen((previous) => !previous)}
                onCloseCustom={() => setIsCustomColorOpen(false)}
                onCustomHexChange={(value) => setCustomColorDraft(hexToRgb(normalizeHex(value)))}
                onCustomPickerChange={(value) => setCustomColorDraft(hexToRgb(value))}
                onCustomChannelChange={(channel, value) =>
                  setCustomColorDraft((previous) => ({ ...previous, [channel]: clampChannel(value) }))
                }
                onApplyCustom={() => {
                  setSelectedColor(customColorDraft);
                  setRecentColors((previous) => mergeRecentColor(previous, customColorDraft, rgbToHex));
                  setIsCustomColorOpen(false);
                }}
                onPickRecent={setCustomColorDraft}
              />
            </div>
          </>
        )}

        {isMobileLayout && (
          <>
            <div className="canvas-overlay-slot canvas-mobile-slot-top">
              <CanvasMobileTopBar
                seasonLabel={seasonLabel}
                connectionLabel={connectionLabel}
                cooldownLabel={cooldownLabel}
                onOpenInfo={() => setIsMobileInfoOpen(true)}
                onOpenHistory={() => setIsHistoryOpen(true)}
              />
            </div>

            <div className="canvas-overlay-slot canvas-mobile-slot-bottom">
              <CanvasMobilePaintTray
                selectedColor={selectedColor}
                isExpanded={isPaintExpanded}
                canPlace={canPlace}
                isPlacing={isPlacing}
                cooldownLabel={formatCountdown(cooldownSeconds)}
                placementProgress={placementProgress}
                onToggleExpanded={() => setIsPaintExpanded((previous) => !previous)}
                onPlace={handlePlace}
                onPresetClick={setSelectedColor}
                onToggleCustom={() => setIsCustomColorOpen((previous) => !previous)}
              />
            </div>
          </>
        )}
      </div>

      <div className="canvas-floating-root">
        {!isMobileLayout && activeMeta && tooltipStyle && (
          <div className="canvas-tooltip" style={tooltipStyle}>
            <strong>({activeMeta.x}, {activeMeta.y})</strong>
            <span>{CANVAS_COPY.tooltip.placedBy} {displayNickname(activeMeta.nickname)}</span>
            <span>{rgbToHex(unpackRgb(activeMeta.color))}</span>
            <span>{formatTimestamp(activeMeta.placedAt)}</span>
            <span>{formatRelativeTime(activeMeta.placedAt)}</span>
          </div>
        )}

        <CanvasHistoryOverlay
          isOpen={isHistoryOpen}
          history={history}
          selectedHistoryCode={selectedHistoryCode}
          historyDetail={historyDetail}
          isHistoryLoading={isHistoryLoading}
          onCloseDrawer={() => setIsHistoryOpen(false)}
          onOpenDetail={setSelectedHistoryCode}
          onCloseDetail={() => setSelectedHistoryCode(null)}
        />

        <CanvasMobileInfoSheet
          isOpen={isMobileLayout && isMobileInfoOpen}
          seasonLabel={seasonLabel}
          boardSize={boardSize}
          statusMessage={statusMessage}
          connectionLabel={connectionLabel}
          cooldownLabel={cooldownLabel}
          selectedLabel={selectedLabel}
          selectedColorLabel={selectedColorLabel}
          nickname={nickname}
          onNicknameChange={setNickname}
          recentActivity={recentActivity.map((item) => item.text)}
          onClose={() => setIsMobileInfoOpen(false)}
        />

        <CanvasMobilePixelSheet
          isOpen={isMobileLayout && isMobilePixelInfoOpen && !!selectedMeta}
          selectedLabel={selectedLabel}
          nickname={displayNickname(selectedMeta?.nickname)}
          color={selectedMeta ? unpackRgb(selectedMeta.color) : selectedColor}
          absoluteTime={formatTimestamp(selectedMeta?.placedAt ?? null)}
          relativeTime={formatRelativeTime(selectedMeta?.placedAt ?? null)}
          onClose={() => setIsMobilePixelInfoOpen(false)}
        />

        <CanvasMobileColorSheet
          isOpen={isMobileLayout && isCustomColorOpen}
          customColorDraft={customColorDraft}
          recentColors={recentColors}
          onClose={() => setIsCustomColorOpen(false)}
          onCustomHexChange={(value) => setCustomColorDraft(hexToRgb(normalizeHex(value)))}
          onCustomPickerChange={(value) => setCustomColorDraft(hexToRgb(value))}
          onCustomChannelChange={(channel, value) =>
            setCustomColorDraft((previous) => ({ ...previous, [channel]: clampChannel(value) }))
          }
          onApply={() => {
            setSelectedColor(customColorDraft);
            setRecentColors((previous) => mergeRecentColor(previous, customColorDraft, rgbToHex));
            setIsCustomColorOpen(false);
          }}
          onPickRecent={setCustomColorDraft}
        />

        {toast && <div className={`canvas-toast is-${toast.tone}`}>{toast.text}</div>}
        {isLoading && <div className="canvas-loading-overlay">{CANVAS_COPY.status.loadingBoard}</div>}
      </div>
    </section>
  );
}

export default CanvasPage;
