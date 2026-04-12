import { CanvasPixelMetaResponse, CanvasPixelUpdate } from "../../lib/api";
import { CANVAS_SIZE, DEFAULT_CANVAS_COLOR, RGBColor } from "../../data/canvas";
import { CANVAS_COPY, displayNickname } from "./canvasCopy";

export interface PixelPoint {
  readonly x: number;
  readonly y: number;
}

export interface OffsetPoint {
  readonly x: number;
  readonly y: number;
}

export interface ActivityItem {
  readonly id: string;
  readonly text: string;
}

export interface ToastState {
  readonly tone: "info" | "success" | "error";
  readonly text: string;
}

export function createBlankCanvasState(size: number): number[] {
  return Array.from({ length: size * size }, () => DEFAULT_CANVAS_COLOR);
}

export function normalizeCanvasState(
  width: number | undefined,
  pixels: readonly number[] | undefined
): { pixels: number[]; size: number } {
  const size = width ?? CANVAS_SIZE;
  const blank = createBlankCanvasState(size);

  pixels?.slice(0, blank.length).forEach((color, index) => {
    blank[index] = color;
  });

  return { pixels: blank, size };
}

export function formatCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}

export function formatTimestamp(value: string | null): string {
  if (!value) {
    return CANVAS_COPY.tooltip.notPaintedYet;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | null): string {
  if (!value) {
    return CANVAS_COPY.tooltip.freshCanvas;
  }

  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) {
    return `${seconds}초 전`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}분 전`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}시간 전`;
  }
  return `${Math.floor(seconds / 86400)}일 전`;
}

export function applyPixelUpdate(previous: readonly number[], size: number, update: CanvasPixelUpdate): number[] {
  const next = previous.slice();
  const index = update.y * size + update.x;

  if (index < 0 || index >= next.length) {
    return next;
  }

  next[index] = update.color;
  return next;
}

export function clampOffset(offset: OffsetPoint, scale: number, stageSize: number): OffsetPoint {
  const limit = ((scale - 1) * stageSize) / 2;
  return {
    x: Math.max(-limit, Math.min(limit, offset.x)),
    y: Math.max(-limit, Math.min(limit, offset.y))
  };
}

export function pushActivity(previous: readonly ActivityItem[], update: CanvasPixelUpdate): ActivityItem[] {
  const id =
    Number.isFinite(update.eventId) && update.eventId > 0
      ? `event-${update.eventId}`
      : `${update.seasonCode}-${update.x}-${update.y}-${update.paintedAt}`;

  return [
    {
      id,
      text: `${displayNickname(update.painter)} 님이 (${update.x}, ${update.y})에 픽셀을 배치했어요.`
    },
    ...previous
  ].slice(0, 8);
}

export function mergeRecentColor(previous: readonly RGBColor[], nextColor: RGBColor, toHex: (color: RGBColor) => string): RGBColor[] {
  return [nextColor, ...previous.filter((item) => toHex(item) !== toHex(nextColor))].slice(0, 6);
}

export function readRecentColors(fromHex: (hex: string) => RGBColor): RGBColor[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem("nahollo-canvas-recent-colors");
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.slice(0, 6).map(fromHex);
  } catch (error) {
    return [];
  }
}

export function writeRecentColors(colors: readonly RGBColor[], toHex: (color: RGBColor) => string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    "nahollo-canvas-recent-colors",
    JSON.stringify(colors.slice(0, 6).map((item) => toHex(item)))
  );
}

export function cacheMeta(map: Map<string, CanvasPixelMetaResponse>, meta: CanvasPixelMetaResponse): void {
  map.set(`${meta.x}:${meta.y}`, meta);
}

export function getConnectionStatusLabel(status: "CONNECTING" | "LIVE" | "DEGRADED" | "OFFLINE"): string {
  switch (status) {
    case "LIVE":
      return CANVAS_COPY.status.connected;
    case "DEGRADED":
      return CANVAS_COPY.status.degraded;
    case "OFFLINE":
      return CANVAS_COPY.status.offline;
    case "CONNECTING":
    default:
      return CANVAS_COPY.status.connecting;
  }
}
