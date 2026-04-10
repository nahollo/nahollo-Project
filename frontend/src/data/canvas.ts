export interface RGBColor {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

export const CANVAS_SIZE = 512;
export const CANVAS_HISTORY_THUMBNAIL_SIZE = 64;
export const DEFAULT_CANVAS_COLOR = 0xf8f6f0;
export const DEFAULT_SELECTED_COLOR: RGBColor = {
  red: 58,
  green: 134,
  blue: 255
};
export const FIXED_CANVAS_PALETTE: readonly RGBColor[] = [
  { red: 0, green: 0, blue: 0 },
  { red: 255, green: 255, blue: 255 },
  { red: 255, green: 77, blue: 79 },
  { red: 255, green: 159, blue: 28 },
  { red: 255, green: 214, blue: 10 },
  { red: 46, green: 196, blue: 182 },
  { red: 58, green: 134, blue: 255 },
  { red: 131, green: 56, blue: 236 }
] as const;

export function clampChannel(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(255, Math.round(value)));
}

export function packRgb(color: RGBColor): number {
  return (clampChannel(color.red) << 16) | (clampChannel(color.green) << 8) | clampChannel(color.blue);
}

export function unpackRgb(color: number): RGBColor {
  return {
    red: (color >> 16) & 255,
    green: (color >> 8) & 255,
    blue: color & 255
  };
}

export function rgbToHex(color: RGBColor): string {
  return `#${[color.red, color.green, color.blue]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function hexToRgb(hex: string): RGBColor {
  const normalized = normalizeHex(hex);
  const value = normalized.replace("#", "");

  return {
    red: Number.parseInt(value.slice(0, 2), 16),
    green: Number.parseInt(value.slice(2, 4), 16),
    blue: Number.parseInt(value.slice(4, 6), 16)
  };
}

export function normalizeHex(hex: string): string {
  const normalized = hex.replace(/[^0-9a-fA-F]/g, "").trim();

  if (normalized.length === 3) {
    return `#${normalized
      .split("")
      .map((item) => item + item)
      .join("")
      .toUpperCase()}`;
  }

  const padded = normalized.padEnd(6, "0").slice(0, 6);
  return `#${padded.toUpperCase()}`;
}

export function formatSeasonCode(seasonCode: string): string {
  const [year, month] = seasonCode.split("-");
  if (!year || !month) {
    return seasonCode;
  }

  const monthNumber = Number(month);
  return Number.isFinite(monthNumber) ? `${year}년 ${monthNumber}월` : seasonCode;
}
