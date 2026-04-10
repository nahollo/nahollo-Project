export interface VisitorStatsResponse {
  readonly today: number;
  readonly total: number;
}

export interface DatabaseStatusResponse {
  readonly connected: boolean;
  readonly databaseName: string;
  readonly currentUser: string;
  readonly serverAddress: string;
  readonly serverPort: number | null;
  readonly errorMessage: string | null;
}

export interface AppStatusResponse {
  readonly applicationName: string;
  readonly environment: string;
  readonly status: string;
  readonly serverTime: string;
  readonly database: DatabaseStatusResponse;
}

export interface SystemStatusResponse {
  readonly cpu: number;
  readonly ram: number;
  readonly disk: number;
  readonly temperature: number | null;
}

export interface UptimeResponse {
  readonly seconds: number;
}

export interface DeploymentLogEntry {
  readonly id: string;
  readonly workflowName: string;
  readonly conclusion: string;
  readonly branch: string;
  readonly repository: string;
  readonly finishedAt: string;
  readonly url: string | null;
}

export interface CanvasPixelRecord {
  readonly colorIndex: number;
  readonly painter: string | null;
  readonly paintedAt: string | null;
}

export interface CanvasPixelUpdate {
  readonly x: number;
  readonly y: number;
  readonly colorIndex: number;
  readonly painter: string | null;
  readonly paintedAt: string;
}

export interface CanvasCooldownResponse {
  readonly remainingSeconds: number;
}

export interface CanvasPixelPlacementResponse {
  readonly success: boolean;
  readonly remainingSeconds: number;
  readonly update: CanvasPixelUpdate | null;
}

export interface CanvasSnapshotResponse {
  readonly id: string;
  readonly label: string;
  readonly savedAt: string;
  readonly pixels: readonly number[];
}

export interface LeaderboardEntry {
  readonly nickname: string;
  readonly score: number;
  readonly createdAt: string;
}

export type RankingType = "typing" | "jump";

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

const VISITOR_STORAGE_KEY = "nahollo-visitor-id";

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

export function resolveApiUrl(path: string): string {
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
        : `요청에 실패했습니다. (${response.status})`;

    throw new ApiError(message, response.status, data);
  }

  return data as TResponse;
}

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") {
    return "server-render";
  }

  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(VISITOR_STORAGE_KEY, created);
  return created;
}

export async function registerVisitorHit(): Promise<VisitorStatsResponse> {
  return requestJson<VisitorStatsResponse>("/api/stats/visitors/hit", {
    method: "POST",
    body: JSON.stringify({
      clientId: getOrCreateVisitorId()
    })
  });
}

export function fetchVisitorStats(): Promise<VisitorStatsResponse> {
  return requestJson<VisitorStatsResponse>("/api/stats/visitors");
}

export function fetchAppStatus(): Promise<AppStatusResponse> {
  return requestJson<AppStatusResponse>("/api/status");
}

export function fetchSystemStatus(): Promise<SystemStatusResponse> {
  return requestJson<SystemStatusResponse>("/api/status/system");
}

export function fetchUptime(): Promise<UptimeResponse> {
  return requestJson<UptimeResponse>("/api/status/uptime");
}

export function fetchDeployments(): Promise<readonly DeploymentLogEntry[]> {
  return requestJson<readonly DeploymentLogEntry[]>("/api/status/deployments");
}

export function fetchCanvasState(): Promise<readonly CanvasPixelRecord[]> {
  return requestJson<readonly CanvasPixelRecord[]>("/api/canvas");
}

export function fetchCanvasCooldown(): Promise<CanvasCooldownResponse> {
  return requestJson<CanvasCooldownResponse>("/api/canvas/cooldown");
}

export function fetchCanvasHistory(): Promise<readonly CanvasSnapshotResponse[]> {
  return requestJson<readonly CanvasSnapshotResponse[]>("/api/canvas/history");
}

export function placeCanvasPixel(
  x: number,
  y: number,
  colorIndex: number,
  nickname: string
): Promise<CanvasPixelPlacementResponse> {
  const headers: HeadersInit = {};

  if (nickname.trim()) {
    headers["X-Canvas-Nickname"] = nickname.trim();
  }

  return requestJson<CanvasPixelPlacementResponse>("/api/canvas/pixel", {
    method: "POST",
    headers,
    body: JSON.stringify({ x, y, colorIndex })
  });
}

export function fetchLeaderboard(type: RankingType): Promise<readonly LeaderboardEntry[]> {
  return requestJson<readonly LeaderboardEntry[]>(`/api/game/ranking/${type}`);
}

export function submitLeaderboard(type: RankingType, nickname: string, score: number): Promise<readonly LeaderboardEntry[]> {
  return requestJson<readonly LeaderboardEntry[]>(`/api/game/ranking/${type}`, {
    method: "POST",
    body: JSON.stringify({ nickname, score })
  });
}
