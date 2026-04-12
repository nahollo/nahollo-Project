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

export const BASIC_PICKER_PALETTE: readonly {
  readonly label: string;
  readonly colors: readonly RGBColor[];
}[] = [
  {
    label: "기본",
    colors: [
      { red: 0, green: 0, blue: 0 },
      { red: 255, green: 255, blue: 255 },
      { red: 255, green: 69, blue: 83 },
      { red: 255, green: 159, blue: 28 },
      { red: 255, green: 214, blue: 10 },
      { red: 51, green: 204, blue: 112 },
      { red: 59, green: 130, blue: 246 },
      { red: 124, green: 58, blue: 237 },
      { red: 15, green: 118, blue: 110 },
      { red: 12, green: 74, blue: 110 },
      { red: 17, green: 24, blue: 39 },
      { red: 236, green: 72, blue: 153 }
    ]
  },
  {
    label: "파스텔",
    colors: [
      { red: 252, green: 165, blue: 165 },
      { red: 253, green: 186, blue: 116 },
      { red: 253, green: 224, blue: 71 },
      { red: 134, green: 239, blue: 172 },
      { red: 125, green: 211, blue: 252 },
      { red: 196, green: 181, blue: 253 },
      { red: 251, green: 207, blue: 232 },
      { red: 203, green: 213, blue: 225 },
      { red: 255, green: 241, blue: 118 },
      { red: 167, green: 243, blue: 208 },
      { red: 147, green: 197, blue: 253 },
      { red: 254, green: 205, blue: 211 }
    ]
  },
  {
    label: "다크",
    colors: [
      { red: 30, green: 41, blue: 59 },
      { red: 31, green: 41, blue: 55 },
      { red: 68, green: 64, blue: 60 },
      { red: 91, green: 33, blue: 182 },
      { red: 30, green: 64, blue: 175 },
      { red: 21, green: 128, blue: 61 },
      { red: 161, green: 98, blue: 7 },
      { red: 153, green: 27, blue: 27 },
      { red: 69, green: 26, blue: 3 },
      { red: 26, green: 46, blue: 5 },
      { red: 8, green: 47, blue: 73 },
      { red: 67, green: 20, blue: 7 }
    ]
  }
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
  if (!Number.isFinite(monthNumber)) {
    return seasonCode;
  }

  return `${year}년 ${monthNumber}월`;
}
