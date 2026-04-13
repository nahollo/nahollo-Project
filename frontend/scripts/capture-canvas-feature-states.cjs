const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium, devices } = require("playwright");

const frontendDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(frontendDir, "..");
const buildDir = path.join(frontendDir, "build");
const outputRoot = path.join(rootDir, "artifacts", "screenshots", "canvas-features");
const port = Number(process.env.CAPTURE_PORT || 3111);
const baseUrl = `http://127.0.0.1:${port}`;
const routePath = "/canvas";

const scenarios = [
  {
    mode: "desktop",
    theme: "light",
    viewport: { width: 1728, height: 1117 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1
  },
  {
    mode: "desktop",
    theme: "dark",
    viewport: { width: 1728, height: 1117 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1
  },
  {
    mode: "mobile",
    theme: "light",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: devices["iPhone 12"].deviceScaleFactor
  },
  {
    mode: "mobile",
    theme: "dark",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: devices["iPhone 12"].deviceScaleFactor
  }
];

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

function matchesApiPath(urlString, expression) {
  try {
    const parsed = new URL(urlString);
    return expression.test(parsed.pathname + parsed.search);
  } catch (error) {
    return false;
  }
}

async function mockApis(page) {
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

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

    if (matchesApiPath(url, /\/api\/canvas\/pixel$/) && method === "POST") {
      const payload = JSON.parse(route.request().postData() || "{}");
      await new Promise((resolve) => setTimeout(resolve, 220));
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

async function mockWebsocketAndEyedropper(page) {
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

    class MockEyeDropper {
      async open() {
        return { sRGBHex: "#3a86ff" };
      }
    }

    window.WebSocket = MockWebSocket;
    window.EyeDropper = MockEyeDropper;
  });
}

async function setTheme(page, theme) {
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("nahollo-theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }, theme);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeCaptureApi(scenario, manifest) {
  const folder = path.join(outputRoot, scenario.mode, scenario.theme);
  fs.mkdirSync(folder, { recursive: true });
  let step = 1;

  return async function capture(page, label, options = {}) {
    const fileName = `${String(step).padStart(2, "0")}-${slugify(label)}.png`;
    const filePath = path.join(folder, fileName);
    await page.screenshot({
      path: filePath,
      fullPage: Boolean(options.fullPage)
    });
    manifest.push({
      mode: scenario.mode,
      theme: scenario.theme,
      step,
      label,
      filePath
    });
    step += 1;
  };
}

async function waitForBaseReady(page, theme) {
  await page.goto(`${baseUrl}${routePath}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#preloader-none", { state: "attached", timeout: 30000 });
  await page.waitForSelector(".canvas-page", { state: "visible", timeout: 30000 });
  await page.waitForSelector(".canvas-board-frame", { state: "visible", timeout: 30000 });
  await page.waitForFunction((selectedTheme) => document.documentElement.getAttribute("data-theme") === selectedTheme, theme, {
    timeout: 30000
  });
  await page.waitForFunction(() => !document.querySelector(".canvas-loading-overlay"), { timeout: 30000 });
  await page.waitForTimeout(750);
}

async function clickBoardCenter(page) {
  const stage = page.locator(".canvas-board-stage").first();
  await stage.waitFor({ state: "visible", timeout: 30000 });
  const box = await stage.boundingBox();
  if (!box) {
    throw new Error("Cannot resolve canvas board stage bounding box.");
  }

  await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.48);
  await page.waitForTimeout(180);
}

async function hoverBoard(page) {
  const stage = page.locator(".canvas-board-stage").first();
  const box = await stage.boundingBox();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + box.width * 0.34, box.y + box.height * 0.28);
  await page.waitForTimeout(160);
}

async function closeIfVisible(page, selector) {
  const node = page.locator(selector).first();
  if ((await node.count()) > 0 && (await node.isVisible())) {
    try {
      await node.click({ timeout: 1200 });
    } catch (error) {
      try {
        await node.click({ force: true, timeout: 1200 });
      } catch (forceError) {
        await page.evaluate((query) => {
          const target = document.querySelector(query);
          if (target instanceof HTMLElement) {
            target.click();
          }
        }, selector);
      }
    }
    await page.waitForTimeout(180);
  }
}

async function clickRobust(page, selector, index = 0) {
  const node = page.locator(selector).nth(index);
  await node.waitFor({ state: "visible", timeout: 30000 });
  try {
    await node.click({ timeout: 1200 });
  } catch (error) {
    try {
      await node.click({ force: true, timeout: 1200 });
    } catch (forceError) {
      await page.evaluate(
        ({ query, index: targetIndex }) => {
          const target = document.querySelectorAll(query).item(targetIndex);
          if (target instanceof HTMLElement) {
            target.click();
          }
        },
        { query: selector, index }
      );
    }
  }
  await page.waitForTimeout(140);
}

async function clickOptional(page, selector, index = 0) {
  try {
    await clickRobust(page, selector, index);
    return true;
  } catch (error) {
    return false;
  }
}

async function openHistoryDetail(page) {
  await page.locator(".canvas-history-drawer .canvas-history-card").first().waitFor({ state: "visible", timeout: 30000 });
  await page.evaluate(() => {
    const target = document.querySelector(".canvas-history-drawer .canvas-history-card");
    if (target instanceof HTMLElement) {
      target.click();
    }
  });
  try {
    await page.locator(".canvas-history-modal").first().waitFor({ state: "attached", timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function captureDesktopScenario(page, capture) {
  await capture(page, "overview-fullpage", { fullPage: true });
  await capture(page, "overview-default");

  await clickBoardCenter(page);
  await capture(page, "pixel-selected-on-board");

  await hoverBoard(page);
  await capture(page, "hover-tooltip-visible");

  const controls = page.locator(".canvas-controls-cluster .canvas-icon-button");
  await controls.nth(0).click();
  await page.waitForTimeout(150);
  await capture(page, "zoom-in");

  await controls.nth(1).click();
  await page.waitForTimeout(150);
  await capture(page, "zoom-out");

  await controls.nth(2).click();
  await page.waitForTimeout(150);
  await capture(page, "zoom-reset");

  await controls.nth(3).click();
  await page.waitForTimeout(150);
  await capture(page, "grid-overlay-enabled");

  const activityControls = page.locator(".canvas-activity-controls .canvas-activity-control");
  await activityControls.nth(0).click();
  await page.waitForTimeout(150);
  await capture(page, "activity-paused");

  await activityControls.nth(1).click();
  await page.waitForTimeout(150);
  await capture(page, "activity-cleared");

  await clickRobust(page, ".canvas-history-pill");
  await page.locator(".canvas-history-drawer").first().waitFor({ state: "visible", timeout: 30000 });
  await capture(page, "history-drawer-open");

  const desktopHistoryDetailOpened = await openHistoryDetail(page);
  if (desktopHistoryDetailOpened) {
    await page.waitForTimeout(140);
    await capture(page, "history-detail-modal-open");
  } else {
    await capture(page, "history-detail-modal-open-failed");
  }

  await closeIfVisible(page, ".canvas-history-modal .canvas-close-button");
  await closeIfVisible(page, ".canvas-history-drawer .canvas-close-button");
  await page.waitForTimeout(120);

  await clickRobust(page, ".canvas-paint-launch-button");
  await page.locator(".canvas-paint-panel.is-expanded").first().waitFor({ state: "visible", timeout: 30000 });
  await capture(page, "paint-panel-expanded");

  await clickRobust(page, ".canvas-paint-panel .canvas-custom-trigger");
  await page.locator(".canvas-color-popover").first().waitFor({ state: "visible", timeout: 30000 });
  await capture(page, "custom-color-open-via-plus");

  await closeIfVisible(page, ".canvas-color-popover .canvas-close-button");
  await clickRobust(page, ".canvas-current-color-trigger");
  await page.locator(".canvas-color-popover").first().waitFor({ state: "visible", timeout: 30000 });
  await capture(page, "custom-color-open-via-current-color");

  await clickRobust(page, ".canvas-popover-tabs button", 1);
  await capture(page, "custom-color-palette-tab");

  await clickRobust(page, ".canvas-palette-library .canvas-picker-swatch");
  await capture(page, "custom-color-palette-selected");

  await clickRobust(page, ".canvas-popover-actions .canvas-primary-button");
  await capture(page, "custom-color-applied");

  await clickRobust(page, ".canvas-paint-launch-button");
  await page.waitForTimeout(260);
  await capture(page, "place-pixel-after-click");

  await closeIfVisible(page, ".canvas-paint-popup-header .canvas-close-button");
  await capture(page, "paint-panel-collapsed");
}

async function captureMobileScenario(page, capture) {
  await capture(page, "overview-fullpage", { fullPage: true });
  await capture(page, "overview-default");

  await clickBoardCenter(page);
  await page.locator(".canvas-mobile-pixel-sheet").first().waitFor({ state: "visible", timeout: 30000 });
  await capture(page, "pixel-info-sheet-open");
  await closeIfVisible(page, ".canvas-mobile-pixel-sheet .canvas-close-button");

  await clickRobust(page, ".canvas-mobile-top-bar .canvas-mobile-top-button");
  await page.locator(".canvas-history-drawer").first().waitFor({ state: "visible", timeout: 30000 });
  await capture(page, "history-drawer-open");

  const mobileHistoryDetailOpened = await openHistoryDetail(page);
  if (mobileHistoryDetailOpened) {
    await page.waitForTimeout(140);
    await capture(page, "history-detail-modal-open");
  } else {
    await capture(page, "history-detail-modal-open-failed");
  }
  await closeIfVisible(page, ".canvas-history-modal .canvas-close-button");
  await closeIfVisible(page, ".canvas-history-drawer .canvas-close-button");

  await clickRobust(page, ".canvas-mobile-top-button.is-accent");
  await page.locator(".canvas-mobile-info-sheet").first().waitFor({ state: "visible", timeout: 30000 });
  await capture(page, "info-sheet-open");
  await closeIfVisible(page, ".canvas-mobile-info-sheet .canvas-close-button");

  await clickRobust(page, ".canvas-mobile-tray-toggle");
  await page.locator(".canvas-mobile-tray-sheet.is-open").first().waitFor({ state: "visible", timeout: 30000 });
  await capture(page, "paint-tray-expanded");

  await clickRobust(page, ".canvas-mobile-tray-sheet .canvas-custom-trigger");
  await page.locator(".canvas-mobile-color-sheet").first().waitFor({ state: "visible", timeout: 30000 });
  await capture(page, "color-sheet-open-via-plus");

  await page.evaluate(() => {
    const tabs = document.querySelectorAll(".canvas-mobile-color-sheet .canvas-popover-tabs button");
    const paletteTab = tabs.item(1);
    if (paletteTab instanceof HTMLElement) {
      paletteTab.click();
    }
  });
  await page.waitForTimeout(180);
  await capture(page, "color-sheet-palette-tab");

  const mobilePaletteSwatchClicked = await page.evaluate(() => {
    const swatch = document.querySelector(".canvas-mobile-color-sheet .canvas-picker-swatch");
    if (swatch instanceof HTMLElement) {
      swatch.click();
      return true;
    }
    return false;
  });
  await page.waitForTimeout(160);

  if (mobilePaletteSwatchClicked) {
    await capture(page, "color-sheet-palette-selected");
  } else {
    await capture(page, "color-sheet-palette-selected-failed");
  }

  const mobileApplyClicked = await page.evaluate(() => {
    const applyButton = document.querySelector(".canvas-mobile-color-sheet .canvas-primary-button");
    if (applyButton instanceof HTMLElement) {
      applyButton.click();
      return true;
    }
    return false;
  });
  await page.waitForTimeout(180);

  if (mobileApplyClicked) {
    await capture(page, "color-sheet-applied");
  } else {
    await capture(page, "color-sheet-applied-failed");
  }

  const mobilePlaceClicked = await clickOptional(page, ".canvas-place-button");
  if (mobilePlaceClicked) {
    await page.waitForTimeout(260);
    await capture(page, "mobile-place-pixel-after-click");
  } else {
    await capture(page, "mobile-place-pixel-after-click-failed");
  }
}

async function runScenario(browser, scenario, manifest) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    colorScheme: scenario.theme,
    isMobile: scenario.isMobile,
    hasTouch: scenario.hasTouch,
    deviceScaleFactor: scenario.deviceScaleFactor
  });

  const page = await context.newPage();
  await setTheme(page, scenario.theme);
  await mockWebsocketAndEyedropper(page);
  await mockApis(page);
  await waitForBaseReady(page, scenario.theme);

  const capture = makeCaptureApi(scenario, manifest);
  if (scenario.mode === "desktop") {
    await captureDesktopScenario(page, capture);
  } else {
    await captureMobileScenario(page, capture);
  }

  await context.close();
}

async function run() {
  ensureBuildExists();
  fs.mkdirSync(outputRoot, { recursive: true });

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  const manifest = [];

  try {
    for (const scenario of scenarios) {
      await runScenario(browser, scenario, manifest);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  const manifestPath = path.join(outputRoot, "manifest.json");
  const summary = manifest.reduce((accumulator, item) => {
    const key = `${item.mode}-${item.theme}`;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        route: routePath,
        scenarios,
        summary,
        captures: manifest
      },
      null,
      2
    )
  );

  console.log("Capture completed");
  Object.entries(summary).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}`);
  });
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Output: ${outputRoot}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
