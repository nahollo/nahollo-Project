const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const frontendDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(frontendDir, "..");
const buildDir = path.join(frontendDir, "build");
const outputDir = path.join(rootDir, "artifacts", "screenshots", "canvas-slices");

const port = Number(process.env.CAPTURE_PORT || 3110);
const baseUrl = `http://127.0.0.1:${port}`;
const canvasPath = "/canvas";
const sliceColumns = 2;
const sliceRows = 5;
const viewport = { width: 2200, height: 1800 };

function ensureBuildExists() {
  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build directory not found: ${buildDir}. Run "npm run build" first.`);
  }
}

function createStaticServer() {
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8"
  };

  return http.createServer((request, response) => {
    const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
    const relativePath = requestPath === "/" ? "/index.html" : requestPath;
    const resolvedPath = path.normalize(path.join(buildDir, relativePath));
    const safePath = resolvedPath.startsWith(buildDir) ? resolvedPath : path.join(buildDir, "index.html");

    fs.stat(safePath, (error, stats) => {
      const targetPath = !error && stats.isFile() ? safePath : path.join(buildDir, "index.html");
      const extension = path.extname(targetPath).toLowerCase();

      fs.readFile(targetPath, (readError, content) => {
        if (readError) {
          response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          response.end(`Static file error: ${readError.message}`);
          return;
        }

        response.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream" });
        response.end(content);
      });
    });
  });
}

function createBasePixels() {
  const size = 512;
  const total = size * size;
  const pixels = new Array(total).fill(0xf8f6f0);

  for (let index = 0; index < total; index += 191) {
    pixels[index] = 0x3a86ff;
  }

  pixels[42 * size + 41] = 0x8338ec;
  pixels[265 * size + 242] = 0xff4d4f;
  pixels[120 * size + 188] = 0x2ec4b6;
  return pixels;
}

const basePixels = createBasePixels();

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
  },
  {
    seasonCode: "2026-02",
    title: "February 2026",
    startsAt: "2026-02-01T00:00:00Z",
    endsAt: "2026-02-28T23:59:59Z",
    archivedAt: "2026-02-28T23:59:59Z",
    width: 64,
    height: 64,
    pixelCount: 7714,
    participantCount: 143,
    dominantColors: [0xff9f1c, 0xffd60a, 0x3a86ff, 0x000000],
    thumbnailPixels: new Array(64 * 64).fill(0xf8f6f0).map((color, index) => (index % 13 === 0 ? 0xff9f1c : color))
  }
];

const historyDetail = {
  seasonCode: "2026-03",
  title: "March 2026",
  startsAt: "2026-03-01T00:00:00Z",
  endsAt: "2026-03-31T23:59:59Z",
  archivedAt: "2026-03-31T23:59:59Z",
  width: 512,
  height: 512,
  pixelCount: 8912,
  participantCount: 184,
  dominantColors: [0x3a86ff, 0x8338ec, 0xff4d4f, 0x2ec4b6],
  timelapseUrl: null,
  pixels: basePixels
};

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
    pixels: basePixels,
    serverNow: "2026-04-10T12:00:00Z",
    liveStatus: "LIVE",
    placedCount: 18291,
    latestEventId: 18291
  };
}

function matchesApiPath(urlString, pathExpression) {
  try {
    const url = new URL(urlString);
    return pathExpression.test(url.pathname + url.search);
  } catch (error) {
    return false;
  }
}

async function mockApis(page) {
  await page.route("**/*", async (route) => {
    const url = route.request().url();

    if (matchesApiPath(url, /\/api\/canvas\/current$/)) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(createCurrentState()) });
      return;
    }

    if (matchesApiPath(url, /\/api\/canvas\/cooldown$/)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          canPlace: true,
          remainingSeconds: 0,
          nextPlaceAt: "2026-04-10T12:00:00Z",
          serverNow: "2026-04-10T12:00:00Z"
        })
      });
      return;
    }

    if (matchesApiPath(url, /\/api\/canvas\/history\/[^/?]+(\?.*)?$/)) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(historyDetail) });
      return;
    }

    if (matchesApiPath(url, /\/api\/canvas\/history(\?.*)?$/)) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(historyItems) });
      return;
    }

    if (matchesApiPath(url, /\/api\/canvas\/pixel-meta\?x=\d+&y=\d+$/)) {
      const parsed = new URL(url);
      const x = Number(parsed.searchParams.get("x"));
      const y = Number(parsed.searchParams.get("y"));
      const color = basePixels[y * 512 + x] ?? 0xf8f6f0;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          x,
          y,
          nickname: x % 2 === 0 ? "nahollo" : "Anonymous",
          color,
          placedAt: "2026-04-10T11:57:22Z",
          overwrittenCount: 3
        })
      });
      return;
    }

    if (matchesApiPath(url, /\/api\/canvas\/updates(\?.*)?$/)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ latestEventId: 12, updates: [] })
      });
      return;
    }

    if (matchesApiPath(url, /\/api\/canvas\/pixel$/) && route.request().method() === "POST") {
      const payload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          code: "OK",
          remainingSeconds: 30,
          nextPlaceAt: "2026-04-10T12:00:30Z",
          serverNow: "2026-04-10T12:00:00Z",
          update: {
            eventId: 13,
            type: "pixel_updated",
            seasonCode: "2026-04",
            x: payload.x ?? 0,
            y: payload.y ?? 0,
            color: payload.color ?? 0x3a86ff,
            painter: payload.nickname || "Anonymous",
            paintedAt: "2026-04-10T12:00:00Z",
            overwrittenCount: 4
          }
        })
      });
      return;
    }

    await route.continue();
  });
}

async function mockWebSocket(page) {
  await page.addInitScript(() => {
    class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 0;
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.onclose = null;

        window.setTimeout(() => {
          this.readyState = 1;
          if (typeof this.onopen === "function") {
            this.onopen(new Event("open"));
          }
        }, 60);
      }

      send() {}

      close() {
        this.readyState = 3;
        if (typeof this.onclose === "function") {
          this.onclose(new Event("close"));
        }
      }

      addEventListener(type, handler) {
        this[`on${type}`] = handler;
      }

      removeEventListener(type, handler) {
        if (this[`on${type}`] === handler) {
          this[`on${type}`] = null;
        }
      }
    }

    window.WebSocket = MockWebSocket;
  });
}

async function prepareTheme(page, theme) {
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("nahollo-theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }, theme);
}

function buildSlices(rect) {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const baseSliceWidth = width / sliceColumns;
  const baseSliceHeight = height / sliceRows;
  const slices = [];

  let index = 1;
  for (let row = 0; row < sliceRows; row += 1) {
    for (let col = 0; col < sliceColumns; col += 1) {
      const sliceX = x + Math.floor(col * baseSliceWidth);
      const sliceY = y + Math.floor(row * baseSliceHeight);
      const nextX = col === sliceColumns - 1 ? x + width : x + Math.floor((col + 1) * baseSliceWidth);
      const nextY = row === sliceRows - 1 ? y + height : y + Math.floor((row + 1) * baseSliceHeight);
      const sliceWidth = Math.max(1, nextX - sliceX);
      const sliceHeight = Math.max(1, nextY - sliceY);

      slices.push({
        index,
        row: row + 1,
        column: col + 1,
        clip: {
          x: sliceX,
          y: sliceY,
          width: sliceWidth,
          height: sliceHeight
        }
      });
      index += 1;
    }
  }

  return slices;
}

async function waitForCanvasReady(page, theme) {
  await page.goto(`${baseUrl}${canvasPath}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".canvas-page", { state: "visible", timeout: 30000 });
  await page.waitForSelector(".canvas-board-frame", { state: "visible", timeout: 30000 });
  await page.waitForFunction((selectedTheme) => document.documentElement.getAttribute("data-theme") === selectedTheme, theme, {
    timeout: 30000
  });
  await page.waitForFunction(() => !document.querySelector(".canvas-loading-overlay"), { timeout: 30000 });
  await page.waitForTimeout(900);
}

async function captureTheme(theme, browser, manifest) {
  const themeDir = path.join(outputDir, theme);
  fs.mkdirSync(themeDir, { recursive: true });

  const context = await browser.newContext({
    viewport,
    colorScheme: theme
  });

  const page = await context.newPage();
  await prepareTheme(page, theme);
  await mockWebSocket(page);
  await mockApis(page);
  await waitForCanvasReady(page, theme);

  const canvasPage = page.locator(".canvas-page");
  const rect = await canvasPage.boundingBox();
  if (!rect) {
    throw new Error("Unable to resolve .canvas-page bounding box.");
  }

  const slices = buildSlices(rect);
  for (const slice of slices) {
    const fileName = `canvas-${theme}-part-${String(slice.index).padStart(2, "0")}.png`;
    const filePath = path.join(themeDir, fileName);
    await page.screenshot({ path: filePath, clip: slice.clip });
    manifest.push({
      theme,
      index: slice.index,
      row: slice.row,
      column: slice.column,
      filePath,
      clip: slice.clip
    });
  }

  const fullPath = path.join(themeDir, `canvas-${theme}-full-reference.png`);
  await page.screenshot({ path: fullPath, fullPage: true });
  manifest.push({ theme, index: 0, row: 0, column: 0, filePath: fullPath, type: "full-reference" });

  await context.close();
}

async function run() {
  ensureBuildExists();
  fs.mkdirSync(outputDir, { recursive: true });

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

  const browser = await chromium.launch({ headless: true });
  const manifest = [];

  try {
    await captureTheme("light", browser, manifest);
    await captureTheme("dark", browser, manifest);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        route: canvasPath,
        baseUrl,
        viewport,
        split: { columns: sliceColumns, rows: sliceRows, total: sliceColumns * sliceRows },
        captures: manifest
      },
      null,
      2
    )
  );

  const themeCounts = manifest.reduce((accumulator, item) => {
    if (item.type === "full-reference") {
      return accumulator;
    }
    accumulator[item.theme] = (accumulator[item.theme] || 0) + 1;
    return accumulator;
  }, {});

  console.log(`Saved captures: light=${themeCounts.light || 0}, dark=${themeCounts.dark || 0}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Manifest: ${manifestPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
