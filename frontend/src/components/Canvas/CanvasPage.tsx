import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  fetchCanvasUpdates,
  placeCanvasPixel,
  resolveWebSocketUrl
} from "../../lib/api";
import {
  BASIC_PICKER_PALETTE,
  CANVAS_SIZE,
  clampChannel,
  DEFAULT_SELECTED_COLOR,
  hexToRgb,
  packRgb,
  RGBColor,
  rgbToHex,
  unpackRgb,
  formatSeasonCode
} from "../../data/canvas";
import CanvasHistoryPanel from "./CanvasHistoryPanel";
import CanvasHistoryOverlay from "./CanvasHistoryOverlay";
import CanvasMobileColorSheet from "./CanvasMobileColorSheet";
import CanvasMobileInfoSheet from "./CanvasMobileInfoSheet";
import CanvasMobilePaintTray from "./CanvasMobilePaintTray";
import CanvasMobilePixelSheet from "./CanvasMobilePixelSheet";
import CanvasMobileTopBar from "./CanvasMobileTopBar";
import CanvasPaintPanel, { PlaceActionState } from "./CanvasPaintPanel";
import CanvasSidebar from "./CanvasSidebar";
import CanvasViewportInspector from "./CanvasViewportInspector";
import { CANVAS_COPY, displayNickname } from "./canvasCopy";
import "./canvas.css";
import {
  ActivityItem,
  applyPixelUpdate,
  cacheMeta,
  clampOffset,
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

const DEFAULT_COOLDOWN_SECONDS = 30;
const MAX_ZOOM = 24;
const UPDATE_DEDUP_WINDOW_MS = 15000;
const UPDATE_SYNC_LIVE_INTERVAL_MS = 12000;
const UPDATE_SYNC_OFFLINE_INTERVAL_MS = 2500;
const WS_RECONNECT_MIN_DELAY_MS = 800;
const WS_RECONNECT_MAX_DELAY_MS = 12000;
const NICKNAME_STORAGE_KEY = "nahollo-canvas-nickname";
const MOBILE_BREAKPOINT = "(max-width: 991px)";

type EyeDropperOpenResult = {
  sRGBHex: string;
};

type EyeDropperLike = {
  open: () => Promise<EyeDropperOpenResult>;
};

type EyeDropperConstructor = new () => EyeDropperLike;

function resolveEyeDropper(): EyeDropperConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate = (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
  return typeof candidate === "function" ? candidate : null;
}

function buildUpdateKey(update: CanvasPixelUpdate): string {
  if (Number.isFinite(update.eventId) && update.eventId > 0) {
    return `event:${update.eventId}`;
  }

  return `${update.seasonCode}:${update.x}:${update.y}:${update.color}:${update.paintedAt}:${update.painter ?? ""}`;
}

function pruneDedupCache(cache: Map<string, number>, now: number): void {
  cache.forEach((timestamp, key) => {
    if (now - timestamp > UPDATE_DEDUP_WINDOW_MS) {
      cache.delete(key);
    }
  });
}

function CanvasPage(): JSX.Element {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const metaCacheRef = useRef<Map<string, CanvasPixelMetaResponse>>(new Map());
  const dedupUpdateCacheRef = useRef<Map<string, number>>(new Map());
  const stageSizeRef = useRef(0);
  const scaleRef = useRef(1);
  const boardSizeRef = useRef(CANVAS_SIZE);
  const resizeFrameRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastEventIdRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const syncInFlightRef = useRef(false);
  const hoverMetaRequestRef = useRef(0);

  const [state, setState] = useState<CanvasStateResponse | null>(null);
  const [pixels, setPixels] = useState<number[]>([]);
  const [boardSize, setBoardSize] = useState(CANVAS_SIZE);
  const [history, setHistory] = useState<readonly CanvasSnapshotResponse[]>([]);
  const [historyDetail, setHistoryDetail] = useState<CanvasHistoryDetailResponse | null>(null);
  const [selectedHistoryCode, setSelectedHistoryCode] = useState<string | null>(null);
  const [placedCount, setPlacedCount] = useState(0);
  const [selectedColor, setSelectedColor] = useState<RGBColor>(DEFAULT_SELECTED_COLOR);
  const [customColorDraft, setCustomColorDraft] = useState<RGBColor>(DEFAULT_SELECTED_COLOR);
  const [recentColors, setRecentColors] = useState<RGBColor[]>(() => readRecentColors(hexToRgb));
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [cooldownDurationSeconds, setCooldownDurationSeconds] = useState(DEFAULT_COOLDOWN_SECONDS);
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
  const [hasPlaceError, setHasPlaceError] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isCustomColorOpen, setIsCustomColorOpen] = useState(false);
  // 플로팅 컬러 피커 모달 전용 로컬 상태
  const [pickerHexInput, setPickerHexInput] = useState(() => rgbToHex(DEFAULT_SELECTED_COLOR));
  const [pickerTab, setPickerTab] = useState<"custom" | "palette">("custom");
  const [isPaintExpanded, setIsPaintExpanded] = useState(false);
  const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false);
  const [isMobilePixelInfoOpen, setIsMobilePixelInfoOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<OffsetPoint>({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState(0);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_BREAKPOINT).matches : false
  );
  const [isEyedropperAvailable] = useState<boolean>(() => resolveEyeDropper() !== null);
  const placeErrorTimeoutRef = useRef<number | null>(null);

  const isTouchMode = useMemo(
    () => (typeof window !== "undefined" ? window.matchMedia("(hover: none), (pointer: coarse)").matches : false),
    []
  );
  const selectedColorHex = useMemo(() => rgbToHex(selectedColor), [selectedColor]);
  const hasValidSelectedColor =
    Number.isInteger(selectedColor.red) &&
    Number.isInteger(selectedColor.green) &&
    Number.isInteger(selectedColor.blue) &&
    selectedColor.red >= 0 &&
    selectedColor.red <= 255 &&
    selectedColor.green >= 0 &&
    selectedColor.green <= 255 &&
    selectedColor.blue >= 0 &&
    selectedColor.blue <= 255;
  const isConnectionUnavailable = connectionState === "OFFLINE" || connectionState === "DEGRADED";
  const hasSelection = selectedPixel !== null;
  const placeState: PlaceActionState = !hasSelection
    ? "no-selection"
    : isConnectionUnavailable
      ? "offline"
      : isPlacing
        ? "loading"
        : cooldownSeconds > 0
          ? "cooldown"
          : "ready";
  const isPlaceDisabled = placeState !== "ready";
  const cooldownWindowSeconds = Math.max(1, cooldownDurationSeconds);
  const placementProgress = `${Math.max(0, Math.min(100, ((cooldownWindowSeconds - cooldownSeconds) / cooldownWindowSeconds) * 100))}%`;
  const connectionLabel = getConnectionStatusLabel(connectionState);
  const actionCooldownLabel = formatCountdown(Math.max(0, cooldownSeconds));
  const cooldownLabel = placeState === "ready" ? CANVAS_COPY.status.ready : actionCooldownLabel;
  const cooldownRuleText = `픽셀 배치 후 ${formatCountdown(cooldownWindowSeconds)} 동안 다음 배치를 기다려야 합니다.`;
  const selectedLabel = selectedPixel ? `(${selectedPixel.x}, ${selectedPixel.y})` : "좌표를 선택하세요";
  const selectedColorLabel = selectedMeta ? rgbToHex(unpackRgb(selectedMeta.color)) : selectedColorHex;
  const selectedUserLabel = selectedMeta ? displayNickname(selectedMeta.nickname) : CANVAS_COPY.status.notSelected;
  const placementHelperText =
    placeState === "ready"
      ? CANVAS_COPY.paint.readyHint
      : placeState === "cooldown"
        ? CANVAS_COPY.paint.cooldownHint
        : placeState === "loading"
          ? CANVAS_COPY.paint.loadingHint
          : placeState === "offline"
            ? CANVAS_COPY.paint.offlineHint
            : CANVAS_COPY.paint.noSelectionHint;
  const seasonLabel = formatSeasonCode(state?.season.seasonCode ?? "2026-04");
  const axisMarks = useMemo(() => {
    const marks: number[] = [];
    for (let value = 0; value < boardSize; value += 50) {
      marks.push(value);
    }
    return marks;
  }, [boardSize]);

  const handlePresetColorPick = useCallback((color: RGBColor) => {
    setSelectedColor(color);
    setCustomColorDraft(color);
  }, []);

  const handleToggleCustomPicker = useCallback(() => {
    setIsCustomColorOpen((previous) => {
      const next = !previous;
      if (next) {
        setCustomColorDraft(selectedColor);
      }
      return next;
    });
  }, [selectedColor]);

  const handleCustomHexChange = useCallback((value: string) => {
    const normalized = value.replace(/[^0-9a-fA-F]/g, "");
    if (normalized.length !== 3 && normalized.length !== 6) {
      return;
    }

    const next = hexToRgb(`#${normalized}`);
    setCustomColorDraft(next);
    setSelectedColor(next);
  }, []);

  const handlePickEyedropper = useCallback(async () => {
    const EyeDropperCtor = resolveEyeDropper();
    if (!EyeDropperCtor) {
      return;
    }

    try {
      const picker = new EyeDropperCtor();
      const result = await picker.open();
      if (result?.sRGBHex) {
        const next = hexToRgb(result.sRGBHex);
        setCustomColorDraft(next);
        setSelectedColor(next);
      }
    } catch (error) {
      // EyeDropper can throw when canceled. Ignore quietly.
    }
  }, []);

  const handleCopySelectedCoordinates = useCallback(async () => {
    if (!selectedPixel || typeof navigator === "undefined" || !navigator.clipboard) {
      setToast({ tone: "error", text: "蹂듭궗??醫뚰몴媛 ?놁뼱??" });
      return;
    }

    try {
      await navigator.clipboard.writeText(`(${selectedPixel.x}, ${selectedPixel.y})`);
      setToast({ tone: "success", text: "醫뚰몴瑜?蹂듭궗?덉뼱??" });
    } catch (error) {
      setToast({ tone: "error", text: "醫뚰몴 蹂듭궗???ㅽ뙣?덉뼱??" });
    }
  }, [selectedPixel]);

  const handleActivitySelect = useCallback((item: ActivityItem) => {
    const point = { x: item.x, y: item.y };
    setSelectedPixel(point);
    const cached = metaCacheRef.current.get(`${point.x}:${point.y}`);
    if (cached) {
      setSelectedMeta(cached);
    }
  }, []);

  const zoomToScale = useCallback(
    (nextScale: number, anchor?: { x: number; y: number }) => {
      const size = stageSizeRef.current;
      if (size <= 0) {
        return;
      }

      const clampedScale = Math.max(1, Math.min(MAX_ZOOM, nextScale));
      const anchorPoint = anchor ?? { x: size / 2, y: size / 2 };
      const originX = size / 2 + offset.x - (size * scale) / 2;
      const originY = size / 2 + offset.y - (size * scale) / 2;
      const canvasX = (anchorPoint.x - originX) / scale;
      const canvasY = (anchorPoint.y - originY) / scale;

      setScale(clampedScale);
      setOffset(
        clampOffset(
          {
            x: anchorPoint.x - size / 2 + (size * clampedScale) / 2 - canvasX * clampedScale,
            y: anchorPoint.y - size / 2 + (size * clampedScale) / 2 - canvasY * clampedScale
          },
          clampedScale,
          size
        )
      );
    },
    [offset.x, offset.y, scale]
  );

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    boardSizeRef.current = boardSize;
  }, [boardSize]);

  useEffect(() => {
    isUnmountedRef.current = false;

    return () => {
      isUnmountedRef.current = true;
      if (placeErrorTimeoutRef.current !== null) {
        window.clearTimeout(placeErrorTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (websocketRef.current && websocketRef.current.readyState <= WebSocket.OPEN) {
        websocketRef.current.close();
      }
    };
  }, []);

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
    if (!stage) {
      return;
    }

    const measureStage = () => {
      const nextWidth = Math.round(stage.getBoundingClientRect().width);
      if (!nextWidth || nextWidth === stageSizeRef.current) {
        return;
      }

      stageSizeRef.current = nextWidth;
      setStageSize((previous) => (previous === nextWidth ? previous : nextWidth));
      setOffset((previous) => {
        const clamped = clampOffset(previous, scaleRef.current, nextWidth);
        return clamped.x === previous.x && clamped.y === previous.y ? previous : clamped;
      });
    };

    const scheduleMeasure = () => {
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        measureStage();
      });
    };

    scheduleMeasure();
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    window.addEventListener("orientationchange", scheduleMeasure, { passive: true });

    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
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
        const latestEventId = Number.isFinite(stateResult.value.latestEventId)
          ? stateResult.value.latestEventId
          : stateResult.value.placedCount;
        lastEventIdRef.current = Math.max(lastEventIdRef.current, latestEventId);
        setStatusMessage(CANVAS_COPY.status.liveDescription);
      } else {
        setToast({ tone: "error", text: CANVAS_COPY.toast.boardLoadError });
      }

      if (historyResult.status === "fulfilled") {
        setHistory(historyResult.value);
      }

      if (cooldownResult.status === "fulfilled") {
        if (cooldownResult.value.remainingSeconds > 0) {
          setCooldownDurationSeconds(cooldownResult.value.remainingSeconds);
        }
        setCooldownSeconds(cooldownResult.value.remainingSeconds);
      }

      setIsLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const applyIncomingUpdate = useCallback((update: CanvasPixelUpdate): boolean => {
    if (update.eventId > 0 && update.eventId <= lastEventIdRef.current) {
      return false;
    }

    const now = Date.now();
    const dedupKey = buildUpdateKey(update);
    pruneDedupCache(dedupUpdateCacheRef.current, now);

    if (dedupUpdateCacheRef.current.has(dedupKey)) {
      return false;
    }

    dedupUpdateCacheRef.current.set(dedupKey, now);
    if (update.eventId > 0) {
      lastEventIdRef.current = Math.max(lastEventIdRef.current, update.eventId);
    }

    setPixels((previous) => applyPixelUpdate(previous, boardSizeRef.current, update));
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

    return true;
  }, []);

  const syncMissedUpdates = useCallback(async () => {
    if (syncInFlightRef.current || isUnmountedRef.current) {
      return;
    }

    syncInFlightRef.current = true;
    try {
      const response = await fetchCanvasUpdates(lastEventIdRef.current, 200);
      response.updates.forEach((update) => applyIncomingUpdate(update));
      lastEventIdRef.current = Math.max(lastEventIdRef.current, response.latestEventId);
    } catch (error) {
      if (!isUnmountedRef.current) {
        setConnectionState((previous) => (previous === "LIVE" ? "DEGRADED" : previous));
      }
    } finally {
      syncInFlightRef.current = false;
    }
  }, [applyIncomingUpdate]);

  useEffect(() => {
    let disposed = false;

    const scheduleReconnect = () => {
      if (disposed || isUnmountedRef.current) {
        return;
      }

      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }

      const attempt = reconnectAttemptRef.current;
      const exponentialDelay = Math.min(
        WS_RECONNECT_MAX_DELAY_MS,
        WS_RECONNECT_MIN_DELAY_MS * Math.pow(2, Math.min(6, attempt))
      );
      const jitter = Math.floor(Math.random() * 250);
      reconnectTimeoutRef.current = window.setTimeout(connect, exponentialDelay + jitter);
      reconnectAttemptRef.current += 1;
    };

    const connect = () => {
      if (disposed || isUnmountedRef.current) {
        return;
      }

      setConnectionState("CONNECTING");
      const socket = new WebSocket(resolveWebSocketUrl("/ws/canvas"));
      websocketRef.current = socket;

      socket.onopen = () => {
        if (disposed || isUnmountedRef.current) {
          socket.close();
          return;
        }

        reconnectAttemptRef.current = 0;
        setConnectionState("LIVE");
        void syncMissedUpdates();
      };

      socket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data) as CanvasPixelUpdate;
          applyIncomingUpdate(update);
        } catch (error) {
          setConnectionState("DEGRADED");
        }
      };

      socket.onerror = () => {
        setConnectionState("DEGRADED");
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };

      socket.onclose = () => {
        if (websocketRef.current === socket) {
          websocketRef.current = null;
        }
        if (disposed || isUnmountedRef.current) {
          return;
        }
        setConnectionState("OFFLINE");
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      const socket = websocketRef.current;
      websocketRef.current = null;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };
  }, [applyIncomingUpdate, syncMissedUpdates]);

  useEffect(() => {
    const interval = window.setInterval(
      () => void syncMissedUpdates(),
      connectionState === "LIVE" ? UPDATE_SYNC_LIVE_INTERVAL_MS : UPDATE_SYNC_OFFLINE_INTERVAL_MS
    );

    return () => window.clearInterval(interval);
  }, [connectionState, syncMissedUpdates]);

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

    context.clearRect(0, 0, boardSize, boardSize);

    if (!state || pixels.length !== boardSize * boardSize) {
      return;
    }

    const imageData = context.createImageData(boardSize, boardSize);

    pixels.forEach((color, index) => {
      const offsetIndex = index * 4;

      if (!Number.isFinite(color) || color === 0) {
        imageData.data[offsetIndex] = 0;
        imageData.data[offsetIndex + 1] = 0;
        imageData.data[offsetIndex + 2] = 0;
        imageData.data[offsetIndex + 3] = 0;
        return;
      }

      const { red, green, blue } = unpackRgb(color);
      imageData.data[offsetIndex] = red;
      imageData.data[offsetIndex + 1] = green;
      imageData.data[offsetIndex + 2] = blue;
      imageData.data[offsetIndex + 3] = 255;
    });

    context.putImageData(imageData, 0, 0);
  }, [boardSize, pixels, state]);

  useEffect(() => {
    const target = isTouchMode ? selectedPixel : hoveredPixel;
    const requestToken = hoverMetaRequestRef.current + 1;
    hoverMetaRequestRef.current = requestToken;

    const commitMeta = (meta: CanvasPixelMetaResponse | null) => {
      if (isTouchMode) {
        setSelectedMeta(meta);
      } else {
        setHoveredMeta(meta);
      }
    };

    if (!target) {
      commitMeta(null);
      return;
    }

    const cached = metaCacheRef.current.get(`${target.x}:${target.y}`);
    if (cached) {
      commitMeta(cached);
      return;
    }

    commitMeta(null);

    const timeout = window.setTimeout(async () => {
      try {
        const meta = await fetchCanvasPixelMeta(target.x, target.y);
        if (hoverMetaRequestRef.current !== requestToken) {
          return;
        }
        if (meta.x !== target.x || meta.y !== target.y) {
          return;
        }
        cacheMeta(metaCacheRef.current, meta);
        commitMeta(meta);
      } catch (error) {
        if (hoverMetaRequestRef.current !== requestToken) {
          return;
        }
        commitMeta(null);
      }
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [hoveredPixel, isTouchMode, selectedPixel]);

  useEffect(() => {
    if (!selectedPixel) {
      setSelectedMeta(null);
      return;
    }

    const key = `${selectedPixel.x}:${selectedPixel.y}`;
    const cached = metaCacheRef.current.get(key);
    if (cached) {
      setSelectedMeta(cached);
      return;
    }

    let mounted = true;
    void fetchCanvasPixelMeta(selectedPixel.x, selectedPixel.y)
      .then((meta) => {
        if (!mounted || meta.x !== selectedPixel.x || meta.y !== selectedPixel.y) {
          return;
        }
        cacheMeta(metaCacheRef.current, meta);
        setSelectedMeta(meta);
      })
      .catch(() => mounted && setSelectedMeta(null));

    return () => {
      mounted = false;
    };
  }, [selectedPixel]);

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

  // pickerHexInput → customColorDraft와 동기화
  useEffect(() => {
    setPickerHexInput(rgbToHex(customColorDraft));
  }, [customColorDraft, isCustomColorOpen]);

  // 피커 열릴 때 탭 초기화
  useEffect(() => {
    if (isCustomColorOpen) {
      setPickerTab("custom");
    }
  }, [isCustomColorOpen]);

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

    const { cellSize, originX, originY } = getCanvasMetrics();
    const x = Math.floor((clientX - rect.left - originX) / cellSize);
    const y = Math.floor((clientY - rect.top - originY) / cellSize);
    return x >= 0 && y >= 0 && x < boardSize && y < boardSize ? { x, y } : null;
  };

  const triggerPlaceError = (text: string) => {
    setToast({ tone: "error", text });
    if (placeErrorTimeoutRef.current !== null) {
      window.clearTimeout(placeErrorTimeoutRef.current);
    }
    setHasPlaceError(true);
    placeErrorTimeoutRef.current = window.setTimeout(() => {
      setHasPlaceError(false);
      placeErrorTimeoutRef.current = null;
    }, 420);
  };

  const handlePlace = async () => {
    if (placeState !== "ready") {
      if (placeState === "offline") {
        triggerPlaceError(CANVAS_COPY.toast.connectionLost);
      }
      return;
    }

    if (!selectedPixel) {
      triggerPlaceError(CANVAS_COPY.toast.selectPixelFirst);
      return;
    }

    if (!hasValidSelectedColor) {
      triggerPlaceError(CANVAS_COPY.toast.selectColorFirst);
      return;
    }

    if (isTouchMode && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(15);
    }

    const pixelIndex = selectedPixel.y * boardSize + selectedPixel.x;
    const optimisticColor = packRgb(selectedColor);
    const previousColor = pixelIndex >= 0 && pixelIndex < pixels.length ? pixels[pixelIndex] : null;
    const shouldApplyOptimistic = previousColor !== null && previousColor !== optimisticColor;

    if (shouldApplyOptimistic) {
      setPixels((previous) => {
        if (pixelIndex < 0 || pixelIndex >= previous.length) {
          return previous;
        }
        if (previous[pixelIndex] === optimisticColor) {
          return previous;
        }
        const next = [...previous];
        next[pixelIndex] = optimisticColor;
        return next;
      });
    }

    if (placeErrorTimeoutRef.current !== null) {
      window.clearTimeout(placeErrorTimeoutRef.current);
      placeErrorTimeoutRef.current = null;
    }
    setHasPlaceError(false);
    setIsPlacing(true);
    try {
      const result = await placeCanvasPixel(selectedPixel.x, selectedPixel.y, selectedColor, nickname);
      if (result.update) {
        applyIncomingUpdate(result.update);
      }
      if (result.remainingSeconds > 0) {
        setCooldownDurationSeconds(result.remainingSeconds);
      }
      setCooldownSeconds(result.remainingSeconds);
      setRecentColors((previous) => mergeRecentColor(previous, selectedColor, rgbToHex));
      setToast({ tone: "success", text: CANVAS_COPY.toast.placeSuccess });
    } catch (error) {
      if (shouldApplyOptimistic && previousColor !== null) {
        setPixels((previous) => {
          if (pixelIndex < 0 || pixelIndex >= previous.length) {
            return previous;
          }
          if (previous[pixelIndex] !== optimisticColor) {
            return previous;
          }
          const next = [...previous];
          next[pixelIndex] = previousColor;
          return next;
        });
      }

      if (error instanceof ApiError && error.status === 429) {
        const remaining =
          typeof error.data === "object" && error.data && "remainingSeconds" in error.data
            ? Number((error.data as { remainingSeconds: number }).remainingSeconds)
            : DEFAULT_COOLDOWN_SECONDS;

        if (remaining > 0) {
          setCooldownDurationSeconds(remaining);
        }
        setCooldownSeconds(remaining);
      }

      if (error instanceof ApiError && error.status >= 500) {
        setConnectionState("DEGRADED");
        triggerPlaceError(CANVAS_COPY.toast.connectionLost);
      } else {
        triggerPlaceError(CANVAS_COPY.toast.placeError);
      }
    } finally {
      setIsPlacing(false);
    }
  };

  const handleStageWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextScale = Math.max(1, Math.min(MAX_ZOOM, scale * (event.deltaY > 0 ? 0.92 : 1.08)));

    if (nextScale === scale || stageSizeRef.current <= 0) {
      return;
    }

    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) {
      setScale(nextScale);
      setOffset((previous) => clampOffset(previous, nextScale, stageSizeRef.current));
      return;
    }

    const size = stageSizeRef.current;
    const localX = event.clientX - stageRect.left;
    const localY = event.clientY - stageRect.top;
    const originX = size / 2 + offset.x - (size * scale) / 2;
    const originY = size / 2 + offset.y - (size * scale) / 2;
    const canvasX = (localX - originX) / scale;
    const canvasY = (localY - originY) / scale;

    const nextOffset = clampOffset(
      {
        x: localX - size / 2 + (size * nextScale) / 2 - canvasX * nextScale,
        y: localY - size / 2 + (size * nextScale) / 2 - canvasY * nextScale
      },
      nextScale,
      size
    );

    setScale(nextScale);
    setOffset(nextOffset);
  };

  const handleZoomOut = useCallback(() => {
    zoomToScale(scale * 0.86);
  }, [scale, zoomToScale]);

  const handleZoomIn = useCallback(() => {
    zoomToScale(scale * 1.14);
  }, [scale, zoomToScale]);

  const handleFitZoom = useCallback(() => {
    zoomToScale(1, stageSizeRef.current > 0 ? { x: stageSizeRef.current / 2, y: stageSizeRef.current / 2 } : undefined);
  }, [zoomToScale]);


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
    setSelectedMeta(metaCacheRef.current.get(`${point.x}:${point.y}`) ?? null);
    if (isTouchMode) {
      setIsMobilePixelInfoOpen(true);
    }
  };

  const getCanvasMetrics = () => {
    const scaledSize = stageSize * scale;
    const cellSize = scaledSize / boardSize;
    const originX = stageSize / 2 + offset.x - scaledSize / 2;
    const originY = stageSize / 2 + offset.y - scaledSize / 2;
    return { cellSize, originX, originY };
  };

  const snapToDevicePixel = (value: number) => {
    if (typeof window === "undefined") {
      return value;
    }

    const ratio = window.devicePixelRatio || 1;
    return Math.round(value * ratio) / ratio;
  };

  const computeBounds = (point: PixelPoint | null) => {
    if (!point || stageSize <= 0) {
      return undefined;
    }

    const { cellSize, originX, originY } = getCanvasMetrics();
    const left = originX + point.x * cellSize;
    const top = originY + point.y * cellSize;
    const right = left + cellSize;
    const bottom = top + cellSize;
    const snappedLeft = snapToDevicePixel(left);
    const snappedTop = snapToDevicePixel(top);
    const snappedRight = snapToDevicePixel(right);
    const snappedBottom = snapToDevicePixel(bottom);
    const minSize = typeof window === "undefined" ? 1 : 1 / Math.max(1, window.devicePixelRatio || 1);

    return {
      left: snappedLeft,
      top: snappedTop,
      width: Math.max(minSize, snappedRight - snappedLeft),
      height: Math.max(minSize, snappedBottom - snappedTop)
    };
  };

  const hoveredBounds = computeBounds(hoveredPixel);
  const selectedBounds = computeBounds(selectedPixel);
  const shouldShowGrid = false;
  const hoverOutlineWidth = Math.max(1, Math.min(2, 1.6 / Math.sqrt(scale)));
  const selectedOutlineWidth = Math.max(1.5, Math.min(2.8, 2.4 / Math.sqrt(scale)));
  const activeMeta = isTouchMode ? selectedMeta : hoveredMeta;
  const tooltipPoint = isTouchMode ? selectedPixel : hoveredPixel;
  const stageRect = stageRef.current?.getBoundingClientRect();
  const canvasMetrics = stageSize > 0 ? getCanvasMetrics() : null;
  const fallbackTooltipColor = (() => {
    if (!tooltipPoint) {
      return null;
    }

    const index = tooltipPoint.y * boardSize + tooltipPoint.x;
    if (index < 0 || index >= pixels.length) {
      return null;
    }

    return pixels[index];
  })();
  const tooltipColor = activeMeta?.color ?? fallbackTooltipColor ?? packRgb(selectedColor);
  const tooltipNickname = displayNickname(activeMeta?.nickname);
  const tooltipPlacedAt = activeMeta?.placedAt ?? null;

  const tooltipStyle = (() => {
    const bounds = computeBounds(tooltipPoint);
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

  const boardStage = (
    <div className="canvas-board-shell">
      <div className="canvas-axis-corner">x</div>

      {/* 눈금자 — canvasMetrics 기반으로 줌/패닝에 동기화 */}
      <div className="canvas-axis-strip canvas-axis-strip--top" aria-hidden="true">
        {axisMarks.map((value) => {
          // board-frame에 padding이 없으므로 stageSize = frame width
          const left = canvasMetrics
            ? canvasMetrics.originX + value * canvasMetrics.cellSize
            : (value / boardSize) * stageSize;
          // 화면 밖이면 렌더링 생략
          if (canvasMetrics && (left < -24 || left > stageSize + 24)) return null;
          return (
            <span
              key={`axis-top-${value}`}
              className="canvas-axis-label canvas-axis-label--top"
              style={{ left: `${left}px` }}
            >
              {value}
            </span>
          );
        })}
      </div>

      <div className="canvas-axis-strip canvas-axis-strip--left" aria-hidden="true">
        {axisMarks.map((value) => {
          const top = canvasMetrics
            ? canvasMetrics.originY + value * canvasMetrics.cellSize
            : (value / boardSize) * stageSize;
          if (canvasMetrics && (top < -24 || top > stageSize + 24)) return null;
          return (
            <span
              key={`axis-left-${value}`}
              className="canvas-axis-label canvas-axis-label--left"
              style={{ top: `${top}px` }}
            >
              {value}
            </span>
          );
        })}
      </div>

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
            style={{
              /* 픽셀 정렬: 정수 px로 반올림하여 sub-pixel blur 방지 */
              transform: `translate(${Math.round(offset.x)}px, ${Math.round(offset.y)}px) scale(${scale})`
            }}
          />
          {shouldShowGrid && (
            <div
              className="canvas-grid-overlay"
              style={
                {
                  ["--canvas-grid-cell-size" as any]: `${canvasMetrics?.cellSize ?? 0}px`,
                  ["--canvas-grid-offset-x" as any]: `${canvasMetrics?.originX ?? 0}px`,
                  ["--canvas-grid-offset-y" as any]: `${canvasMetrics?.originY ?? 0}px`
                } as React.CSSProperties
              }
            />
          )}
          {hoveredBounds && !isTouchMode && (
            <span
              className="canvas-hover-outline"
              style={{
                ...hoveredBounds,
                borderWidth: hoverOutlineWidth,
                borderColor: "rgba(255,255,255,0.98)",
                background: "rgba(122, 131, 255, 0.08)",
                boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.28), 0 0 0 4px rgba(122, 131, 255, 0.14)"
              }}
              aria-hidden="true"
            />
          )}
          {selectedBounds && (
            <span
              className="canvas-selected-outline"
              style={{
                ...selectedBounds,
                borderWidth: selectedOutlineWidth,
                borderColor: "var(--canvas-accent-strong)",
                background: "rgba(91, 99, 246, 0.1)",
                boxShadow:
                  "0 0 0 1px rgba(255, 255, 255, 0.98), 0 0 0 5px rgba(91, 99, 246, 0.28), 0 0 18px rgba(91, 99, 246, 0.22)"
              }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );

  const canvasInfoBar = (
    <CanvasViewportInspector
      boardSize={boardSize}
      pixels={pixels}
      scale={scale}
      offset={offset}
      stageSize={stageSize}
      selectedPixel={selectedPixel}
      hoveredPixel={hoveredPixel}
      selectedLabel={selectedLabel}
      connectionLabel={connectionLabel}
      placedCount={placedCount}
      onZoomOut={handleZoomOut}
      onZoomIn={handleZoomIn}
      onFit={handleFitZoom}
    />
  );


  return (
    <section className="canvas-page">
      <main className="canvas-main canvas-page-shell page-shell">
        {!isMobileLayout ? (
          <div className="canvas-main-layout canvas-layout canvas-layout--desktop">
            <aside className="canvas-left-column canvas-left canvas-workspace-column">
              <section className="canvas-left-upper shared-board-panel canvas-workspace-panel">
                <CanvasSidebar
                  season={state?.season ?? null}
                  nickname={nickname}
                  onNicknameChange={setNickname}
                />
              </section>

              <section className="canvas-left-lower canvas-history-region canvas-workspace-panel">
                <CanvasHistoryPanel
                  recentActivity={recentActivity}
                  onOpenHistory={() => setIsHistoryOpen(true)}
                  onActivitySelect={handleActivitySelect}
                />
              </section>
            </aside>

            <section className="canvas-center-column canvas-center canvas-center-column--desktop canvas-workspace-column">
              <section className="canvas-center-upper canvas-board-region canvas-workspace-panel">
                <div className="canvas-stage-stack">
                  <div className="canvas-board-stage-area">
                    <div className="canvas-board-stage-inner">{boardStage}</div>
                  </div>
                </div>
              </section>

              <section className="canvas-center-lower canvas-status-region canvas-workspace-panel">
                {canvasInfoBar}
              </section>
            </section>

            <aside className="canvas-right-column canvas-right canvas-right-column--desktop canvas-workspace-column">

              <section className="canvas-right-lower paint-action-area canvas-paint-dock-shell canvas-workspace-panel">
                <CanvasPaintPanel
                  selectedColor={selectedColor}
                  customColorDraft={customColorDraft}
                  recentColors={recentColors}
                  isExpanded={!isMobileLayout || isPaintExpanded}
                  isDocked={true}
                  cooldownLabel={actionCooldownLabel}
                  placementProgress={placementProgress}
                  isCustomColorOpen={isCustomColorOpen}
                  placeState={placeState}
                  isPlaceDisabled={isPlaceDisabled}
                  hasPlaceError={hasPlaceError}
                  selectedPixelLabel={selectedLabel}
                  canCopyCoordinates={hasSelection}
                  helperText={placementHelperText}
                  onToggleExpanded={() => setIsPaintExpanded((previous) => !previous)}
                  onPlace={handlePlace}
                  onCopyCoordinates={handleCopySelectedCoordinates}
                  onPresetClick={handlePresetColorPick}
                  onToggleCustom={handleToggleCustomPicker}
                  onCloseCustom={() => setIsCustomColorOpen(false)}
                  onCustomHexChange={handleCustomHexChange}
                  onCustomPickerChange={(value) => {
                    const next = hexToRgb(value);
                    setCustomColorDraft(next);
                    setSelectedColor(next);
                  }}
                  onCustomChannelChange={(channel, value) =>
                    setCustomColorDraft((previous) => {
                      const next = { ...previous, [channel]: clampChannel(value) };
                      setSelectedColor(next);
                      return next;
                    })
                  }
                  isEyedropperAvailable={isEyedropperAvailable}
                  onPickEyedropper={handlePickEyedropper}
                  onApplyCustom={() => {
                    setSelectedColor(customColorDraft);
                    setRecentColors((previous) => mergeRecentColor(previous, customColorDraft, rgbToHex));
                    setIsCustomColorOpen(false);
                  }}
                  onPickRecent={(color) => {
                    setCustomColorDraft(color);
                    setSelectedColor(color);
                  }}
                />
              </section>
            </aside>
          </div>
        ) : (
          <>
            <div className="canvas-stage-layer">
              <div className="canvas-stage-shell">
                <div className="canvas-center-column">{boardStage}</div>
              </div>
            </div>

            <div className="canvas-overlay-root">
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
                  cooldownLabel={actionCooldownLabel}
                  placementProgress={placementProgress}
                  placeState={placeState}
                  isPlaceDisabled={isPlaceDisabled}
                  hasPlaceError={hasPlaceError}
                  onToggleExpanded={() => setIsPaintExpanded((previous) => !previous)}
                  onPlace={handlePlace}
                  onPresetClick={handlePresetColorPick}
                  onToggleCustom={handleToggleCustomPicker}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <div className="canvas-floating-root">
        {/* ── 플로팅 컬러 피커 모달 (데스크톱 전용) ────────── */}
        {!isMobileLayout && isCustomColorOpen && (() => {
          const customHex = rgbToHex(customColorDraft);
          return (
            <>
              {/* 백드롭 클릭 → 닫기 */}
              <div
                className="canvas-color-picker-backdrop"
                onClick={() => setIsCustomColorOpen(false)}
              />
              <div className="canvas-color-picker-modal">
                <div className="canvas-inline-custom-header">
                  <strong>{CANVAS_COPY.paint.pickerGui}</strong>
                  <button
                    type="button"
                    className="canvas-close-button"
                    onClick={() => setIsCustomColorOpen(false)}
                    aria-label={CANVAS_COPY.actions.closeColorPicker}
                  >×</button>
                </div>

                <div className="canvas-popover-tabs">
                  <button
                    type="button"
                    className={pickerTab === "custom" ? "is-active" : ""}
                    onClick={() => setPickerTab("custom")}
                  >{CANVAS_COPY.paint.pickerTabCustom}</button>
                  <button
                    type="button"
                    className={pickerTab === "palette" ? "is-active" : ""}
                    onClick={() => setPickerTab("palette")}
                  >{CANVAS_COPY.paint.pickerTabPalette}</button>
                </div>

                <div className={`canvas-picker-tab-content is-${pickerTab}`}>
                  {pickerTab === "custom" ? (
                    <div className="canvas-picker-tab-panel">
                      <div className="canvas-hex-row">
                        <label className="canvas-color-button" title={CANVAS_COPY.paint.pickerGui} style={{ backgroundColor: customHex }}>
                          <input
                            type="color"
                            value={customHex}
                            onChange={(e) => {
                              const next = hexToRgb(e.target.value);
                              setCustomColorDraft(next);
                              setSelectedColor(next);
                            }}
                          />
                        </label>

                        <label className="canvas-text-field canvas-hex-field">
                          <span>{CANVAS_COPY.paint.hex}</span>
                          <input
                            type="text"
                            value={pickerHexInput}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPickerHexInput(v);
                              handleCustomHexChange(v);
                            }}
                            onBlur={() => setPickerHexInput(customHex)}
                          />
                        </label>

                        <button
                          type="button"
                          className="canvas-eyedropper-button"
                          onClick={handlePickEyedropper}
                          disabled={!isEyedropperAvailable}
                          aria-label={CANVAS_COPY.paint.pickScreenColor}
                          title={isEyedropperAvailable ? CANVAS_COPY.paint.pickScreenColor : CANVAS_COPY.paint.eyedropperUnsupported}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M13.6 3.3a1.5 1.5 0 0 1 2.1 0l5 5a1.5 1.5 0 0 1 0 2.1l-1.9 1.9-2.8-2.8-1.8 1.8 2.8 2.8-5.1 5.1a2.5 2.5 0 0 1-1.1.6l-4.3 1.1a1 1 0 0 1-1.2-1.2l1.1-4.3a2.5 2.5 0 0 1 .6-1.1l5.1-5.1 2.8 2.8 1.8-1.8-2.8-2.8 1.9-1.9Z" fill="currentColor" />
                          </svg>
                        </button>
                      </div>

                      <div className="canvas-rgb-fields">
                        {(["red", "green", "blue"] as const).map((channel) => (
                          <label key={channel} className="canvas-rgb-field">
                            <span>{channel === "red" ? CANVAS_COPY.paint.channelRed : channel === "green" ? CANVAS_COPY.paint.channelGreen : CANVAS_COPY.paint.channelBlue}</span>
                            <input
                              type="range"
                              min={0}
                              max={255}
                              value={customColorDraft[channel]}
                              onChange={(e) => {
                                const next = { ...customColorDraft, [channel]: clampChannel(Number(e.target.value)) };
                                setCustomColorDraft(next);
                                setSelectedColor(next);
                              }}
                            />
                            <input
                              type="number"
                              min={0}
                              max={255}
                              value={customColorDraft[channel]}
                              onChange={(e) => {
                                const next = { ...customColorDraft, [channel]: clampChannel(Number(e.target.value)) };
                                setCustomColorDraft(next);
                                setSelectedColor(next);
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="canvas-palette-library">
                      {BASIC_PICKER_PALETTE.map((group) => (
                        <section key={group.label} className="canvas-palette-group">
                          <strong className="canvas-palette-group-title">{group.label}</strong>
                          <div className="canvas-palette-bank">
                            {group.colors.map((color) => {
                              const hex = rgbToHex(color);
                              return (
                                <button
                                  key={hex}
                                  type="button"
                                  className={`canvas-picker-swatch ${hex === customHex ? "is-active" : ""}`}
                                  style={{ backgroundColor: hex }}
                                  onClick={() => {
                                    const next = hexToRgb(hex);
                                    setCustomColorDraft(next);
                                    setSelectedColor(next);
                                  }}
                                  aria-label={`palette color ${hex}`}
                                />
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </div>

                <div className="canvas-popover-actions">
                  <button type="button" className="canvas-secondary-button" onClick={() => setIsCustomColorOpen(false)}>
                    {CANVAS_COPY.actions.cancel}
                  </button>
                  <button
                    type="button"
                    className="canvas-primary-button"
                    onClick={() => {
                      setSelectedColor(customColorDraft);
                      setRecentColors((prev) => mergeRecentColor(prev, customColorDraft, rgbToHex));
                      setIsCustomColorOpen(false);
                    }}
                  >
                    {CANVAS_COPY.actions.apply}
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {!isMobileLayout && tooltipPoint && tooltipStyle && (
          <div className="canvas-tooltip" style={tooltipStyle}>
            <strong>({tooltipPoint.x}, {tooltipPoint.y})</strong>
            <span>{CANVAS_COPY.tooltip.placedBy} {tooltipNickname}</span>
            <span>{rgbToHex(unpackRgb(tooltipColor))}</span>
            <span>{formatTimestamp(tooltipPlacedAt)}</span>
            <span>{formatRelativeTime(tooltipPlacedAt)}</span>
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
          selectedColorLabel={selectedColorLabel}
          selectedUserLabel={selectedUserLabel}
          cooldownRuleText={cooldownRuleText}
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
          onCustomHexChange={handleCustomHexChange}
          onCustomPickerChange={(value) => {
            const next = hexToRgb(value);
            setCustomColorDraft(next);
            setSelectedColor(next);
          }}
          onCustomChannelChange={(channel, value) =>
            setCustomColorDraft((previous) => {
              const next = { ...previous, [channel]: clampChannel(value) };
              setSelectedColor(next);
              return next;
            })
          }
          isEyedropperAvailable={isEyedropperAvailable}
          onPickEyedropper={handlePickEyedropper}
          onApply={() => {
            setSelectedColor(customColorDraft);
            setRecentColors((previous) => mergeRecentColor(previous, customColorDraft, rgbToHex));
            setIsCustomColorOpen(false);
          }}
          onPickRecent={(color) => {
            setCustomColorDraft(color);
            setSelectedColor(color);
          }}
        />

        {toast && <div className={`canvas-toast is-${toast.tone}`}>{toast.text}</div>}
        {isLoading && <div className="canvas-loading-overlay">{CANVAS_COPY.status.loadingBoard}</div>}
      </div>
    </section>
  );
}

export default CanvasPage;

