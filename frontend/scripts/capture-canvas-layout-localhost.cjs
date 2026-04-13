const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const frontendDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(frontendDir, "..");
const outputRoot = path.join(rootDir, "artifacts", "layout-check", "viewport-captures");
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const viewports = [
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1536x864", width: 1536, height: 864 },
  { name: "1728x1117", width: 1728, height: 1117 },
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "2560x1440", width: 2560, height: 1440 },
  { name: "3840x2160", width: 3840, height: 2160 }
];

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function paintRect(pixels, size, x, y, width, height, color) {
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      if (row >= 0 && row < size && col >= 0 && col < size) {
        pixels[row * size + col] = color;
      }
    }
  }
}

function paintFrame(pixels, size, x, y, width, height, color) {
  paintRect(pixels, size, x, y, width, 2, color);
  paintRect(pixels, size, x, y + height - 2, width, 2, color);
  paintRect(pixels, size, x, y, 2, height, color);
  paintRect(pixels, size, x + width - 2, y, 2, height, color);
}

function paintDiamond(pixels, size, centerX, centerY, radius, color) {
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (Math.abs(x) + Math.abs(y) <= radius) {
        const targetX = centerX + x;
        const targetY = centerY + y;
        if (targetX >= 0 && targetX < size && targetY >= 0 && targetY < size) {
          pixels[targetY * size + targetX] = color;
        }
      }
    }
  }
}

function createPixels() {
  const size = 512;
  const pixels = new Array(size * size).fill(0xf8f6f0);

  for (let index = 0; index < pixels.length; index += 191) {
    pixels[index] = 0x8bb8ff;
  }

  paintRect(pixels, size, 34, 26, 112, 112, 0xb46a2b);
  paintFrame(pixels, size, 34, 26, 112, 112, 0x5f3310);
  paintDiamond(pixels, size, 272, 92, 36, 0x4dc0ff);
  paintDiamond(pixels, size, 304, 90, 28, 0x7c5cff);
  paintDiamond(pixels, size, 346, 92, 24, 0x444855);
  paintRect(pixels, size, 60, 182, 76, 62, 0xf7c854);
  paintFrame(pixels, size, 60, 182, 76, 62, 0x7c5120);
  paintDiamond(pixels, size, 274, 248, 34, 0xffca3a);
  paintDiamond(pixels, size, 430, 202, 28, 0xd7d9ef);
  paintDiamond(pixels, size, 88, 350, 38, 0xff8b2a);
  paintDiamond(pixels, size, 318, 422, 30, 0x6ac37f);
  paintDiamond(pixels, size, 434, 358, 32, 0x31d0c6);
  paintFrame(pixels, size, 256, 196, 12, 12, 0x3a86ff);

  return pixels;
}

const currentPixels = createPixels();

const historyItems = [
  {
    seasonCode: "2026-03",
    title: "March 2026",
    startsAt: "2026-03-01T00:00:00Z",
    endsAt: "2026-03-31T23:59:59Z",
    archivedAt: "2026-03-31T23:59:59Z",
    width: 64,
    height: 64,
    pixelCount: 8912,
    participantCount: 184,
    dominantColors: [0x3a86ff, 0x8338ec, 0xff4d4f, 0x2ec4b6],
    thumbnailPixels: new Array(64 * 64).fill(0xf8f6f0).map((color, index) => (index % 11 === 0 ? 0x3a86ff : color))
  }
];

function createCurrentState() {
  return {
    season: {
      seasonCode: "2026-04",
      title: "April 2026",
      status: "live",
      startsAt: "2026-04-01T00:00:00Z",
      endsAt: "2026-04-30T23:59:59Z"
    },
    width: 512,
    height: 512,
    pixels: currentPixels,
    serverNow: "2026-04-13T10:00:00Z",
    liveStatus: "LIVE",
    placedCount: 77033,
    latestEventId: 77033
  };
}

function overlaps(a, b) {
  if (!a || !b) {
    return false;
  }

  return !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  );
}

async function mockCanvasApis(page) {
  await page.route("**/api/canvas/**", async (route) => {
    const requestUrl = route.request().url();
    const method = route.request().method();

    if (requestUrl.endsWith("/api/canvas/current")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createCurrentState())
      });
      return;
    }

    if (requestUrl.endsWith("/api/canvas/cooldown")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          canPlace: true,
          remainingSeconds: 0,
          nextPlaceAt: "2026-04-13T10:00:00Z",
          serverNow: "2026-04-13T10:00:00Z"
        })
      });
      return;
    }

    if (/\/api\/canvas\/history(\?.*)?$/.test(requestUrl)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(historyItems)
      });
      return;
    }

    if (/\/api\/canvas\/history\/[^/?]+(\?.*)?$/.test(requestUrl)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...historyItems[0],
          width: 512,
          height: 512,
          timelapseUrl: null,
          pixels: currentPixels
        })
      });
      return;
    }

    if (/\/api\/canvas\/pixel-meta\?x=\d+&y=\d+$/.test(requestUrl)) {
      const parsed = new URL(requestUrl);
      const x = Number(parsed.searchParams.get("x"));
      const y = Number(parsed.searchParams.get("y"));
      const color = currentPixels[y * 512 + x] ?? 0xf8f6f0;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          x,
          y,
          nickname: x % 2 === 0 ? "nahollo" : "PixelMaster",
          color,
          placedAt: "2026-04-13T09:58:12Z",
          overwrittenCount: 2
        })
      });
      return;
    }

    if (/\/api\/canvas\/updates(\?.*)?$/.test(requestUrl)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ latestEventId: 77033, updates: [] })
      });
      return;
    }

    if (/\/api\/canvas\/pixel$/.test(requestUrl) && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          code: "OK",
          remainingSeconds: 30,
          nextPlaceAt: "2026-04-13T10:00:30Z",
          serverNow: "2026-04-13T10:00:00Z",
          update: {
            eventId: 77034,
            type: "pixel_updated",
            seasonCode: "2026-04",
            x: 298,
            y: 211,
            color: 0x3a86ff,
            painter: "nahollo",
            paintedAt: "2026-04-13T10:00:00Z",
            overwrittenCount: 1
          }
        })
      });
      return;
    }

    await route.continue();
  });
}

async function openCanvas(page) {
  try {
    const direct = await page.goto(`${baseUrl}/canvas`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);

    if (direct && direct.status() < 400) {
      await page.waitForSelector(".canvas-layout", { timeout: 10000 });
      await page.waitForTimeout(1000);
      return { openedVia: "direct", directStatus: direct.status() };
    }
  } catch (error) {
    // Fall through to client-side navigation.
  }

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.locator('a[href="/canvas"]').first().click();
  await page.waitForURL("**/canvas", { timeout: 15000 });
  await page.waitForSelector(".canvas-layout", { timeout: 10000 });
  await page.waitForTimeout(1000);

  return { openedVia: "nav", directStatus: 404 };
}

async function collectMetrics(page) {
  const raw = await page.evaluate(() => {
    const getRect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) {
        return null;
      }
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    };

    return {
      header: getRect(".site-header .navbar-shell"),
      layout: getRect(".canvas-layout"),
      left: getRect(".canvas-left"),
      sharedBoard: getRect(".shared-board-panel"),
      history: getRect(".canvas-history-panel"),
      center: getRect(".canvas-center"),
      board: getRect(".canvas-board-frame"),
      info: getRect(".canvas-info-bar"),
      right: getRect(".canvas-right"),
      tools: getRect(".canvas-tool-panel"),
      paint: getRect(".paint-action-area .canvas-paint-panel"),
      paintButton: getRect(".paint-action-area .canvas-paint-launch-button"),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      collapsed: document.querySelector(".paint-action-area .canvas-paint-panel")?.classList.contains("is-collapsed") ?? false,
      customOpen: document.querySelector(".paint-action-area .canvas-color-popover") !== null
    };
  });

  const checks = {
    hasSharedBoard: Boolean(raw.sharedBoard),
    hasHistoryPanel: Boolean(raw.history),
    hasBoard: Boolean(raw.board),
    hasInfoBar: Boolean(raw.info),
    hasToolRail: Boolean(raw.tools),
    hasPaintPanel: Boolean(raw.paint),
    paintStartsCollapsed: raw.collapsed,
    infoBelowBoard: Boolean(raw.board && raw.info && raw.info.top >= raw.board.bottom + 8),
    noBoardOverlapLeft: !(raw.board && (overlaps(raw.board, raw.left) || overlaps(raw.board, raw.history))),
    noBoardOverlapRight: !(raw.board && (overlaps(raw.board, raw.tools) || overlaps(raw.board, raw.paint))),
    noInfoPaintOverlap: !(raw.info && raw.paint && overlaps(raw.info, raw.paint))
  };

  return { metrics: raw, checks };
}

async function captureViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: "light",
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem("nahollo-theme", "light");
    document.documentElement.setAttribute("data-theme", "light");
  });

  await mockCanvasApis(page);
  const openResult = await openCanvas(page);

  const targetPath = path.join(outputRoot, `canvas-${viewport.name}.png`);
  await page.screenshot({ path: targetPath, fullPage: true });

  const report = await collectMetrics(page);

  if (viewport.name === "1366x768") {
    await page.locator(".paint-action-area .canvas-paint-launch-button").click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(outputRoot, "canvas-1366x768-paint-open.png"), fullPage: true });
  }

  await context.close();

  return {
    viewport,
    screenshot: targetPath,
    ...openResult,
    ...report
  };
}

async function run() {
  ensureDir(outputRoot);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const viewport of viewports) {
      const result = await captureViewport(browser, viewport);
      results.push(result);
      console.log(`${viewport.name}: captured`);
    }
  } finally {
    await browser.close();
  }

  const summaryPath = path.join(outputRoot, "verification-report.json");
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`Saved report to ${summaryPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
