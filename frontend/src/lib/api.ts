import { RGBColor } from "../data/canvas";

export interface CanvasSeasonSummary {
  readonly seasonCode: string;
  readonly title: string;
  readonly status: string;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface CanvasStateResponse {
  readonly season: CanvasSeasonSummary;
  readonly width: number;
  readonly height: number;
  readonly pixels: readonly number[];
  readonly serverNow: string;
  readonly liveStatus: string;
  readonly placedCount: number;
  readonly latestEventId: number;
}

export interface CanvasPixelUpdate {
  readonly eventId: number;
  readonly type: string;
  readonly seasonCode: string;
  readonly x: number;
  readonly y: number;
  readonly color: number;
  readonly painter: string | null;
  readonly paintedAt: string;
  readonly overwrittenCount: number;
}

export interface CanvasCooldownResponse {
  readonly canPlace: boolean;
  readonly remainingSeconds: number;
  readonly nextPlaceAt: string;
  readonly serverNow: string;
}

export interface CanvasPixelPlacementResponse {
  readonly success: boolean;
  readonly code: string;
  readonly remainingSeconds: number;
  readonly nextPlaceAt: string;
  readonly serverNow: string;
  readonly update: CanvasPixelUpdate | null;
}

export interface CanvasPixelMetaResponse {
  readonly x: number;
  readonly y: number;
  readonly nickname: string;
  readonly color: number;
  readonly placedAt: string | null;
  readonly overwrittenCount: number;
}

export interface CanvasSnapshotResponse {
  readonly seasonCode: string;
  readonly title: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly archivedAt: string | null;
  readonly width: number;
  readonly height: number;
  readonly pixelCount: number;
  readonly participantCount: number;
  readonly dominantColors: readonly number[];
  readonly thumbnailPixels: readonly number[];
}

export interface CanvasHistoryDetailResponse {
  readonly seasonCode: string;
  readonly title: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly archivedAt: string | null;
  readonly width: number;
  readonly height: number;
  readonly pixelCount: number;
  readonly participantCount: number;
  readonly dominantColors: readonly number[];
  readonly timelapseUrl: string | null;
  readonly pixels: readonly number[];
}

export interface CanvasUpdatesResponse {
  readonly latestEventId: number;
  readonly updates: readonly CanvasPixelUpdate[];
}

export class ApiError<TData = unknown> extends Error {
  readonly status: number;
  readonly data: TData | null;

  constructor(message: string, status: number, data: TData | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getApiBaseUrl(): string {
  const configured = process.env.REACT_APP_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (typeof window === "undefined") {
    return "";
  }

  if (/^300\d*$/.test(window.location.port)) {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }

  return "";
}

function resolveApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path}`;
}

export function resolveWebSocketUrl(path: string): string {
  const baseUrl = getApiBaseUrl();

  if (baseUrl) {
    const url = new URL(path, `${baseUrl}/`);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString();
  }

  if (typeof window === "undefined") {
    return path;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiError("응답을 JSON으로 해석하지 못했습니다.", response.status, text);
  }
}

async function requestJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(resolveApiUrl(path), {
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {})
    },
    ...init
  });

  const data = (await parseJson(response)) as TResponse | null;

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
        ? data.message
        : `요청이 실패했습니다. (${response.status})`;

    throw new ApiError(message, response.status, data);
  }

  return data as TResponse;
}

export function fetchCanvasState(): Promise<CanvasStateResponse> {
  return requestJson<CanvasStateResponse>("/api/canvas/current");
}

export function fetchCanvasCooldown(): Promise<CanvasCooldownResponse> {
  return requestJson<CanvasCooldownResponse>("/api/canvas/cooldown");
}

export function fetchCanvasHistory(page = 0, size = 12): Promise<readonly CanvasSnapshotResponse[]> {
  return requestJson<readonly CanvasSnapshotResponse[]>(`/api/canvas/history?page=${page}&size=${size}`);
}

export function fetchCanvasHistoryDetail(seasonCode: string): Promise<CanvasHistoryDetailResponse> {
  return requestJson<CanvasHistoryDetailResponse>(`/api/canvas/history/${encodeURIComponent(seasonCode)}`);
}

export function fetchCanvasPixelMeta(x: number, y: number): Promise<CanvasPixelMetaResponse> {
  return requestJson<CanvasPixelMetaResponse>(`/api/canvas/pixel-meta?x=${x}&y=${y}`);
}

export function fetchCanvasUpdates(sinceEventId: number, limit = 200): Promise<CanvasUpdatesResponse> {
  return requestJson<CanvasUpdatesResponse>(
    `/api/canvas/updates?sinceEventId=${encodeURIComponent(String(sinceEventId))}&limit=${encodeURIComponent(String(limit))}`
  );
}

export function placeCanvasPixel(
  x: number,
  y: number,
  color: RGBColor,
  nickname: string
): Promise<CanvasPixelPlacementResponse> {
  return requestJson<CanvasPixelPlacementResponse>("/api/canvas/pixel", {
    method: "POST",
    body: JSON.stringify({
      x,
      y,
      color: (color.red << 16) | (color.green << 8) | color.blue,
      nickname: nickname.trim()
    })
  });
}
