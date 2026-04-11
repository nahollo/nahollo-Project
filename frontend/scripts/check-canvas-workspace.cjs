const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium, devices } = require("playwright");

const rootDir = path.resolve(__dirname, "..");
const buildDir = path.join(rootDir, "build");
const reportDir = path.join(rootDir, "..", "artifacts", "canvas-workspace");
const screenshotDir = path.join(reportDir, "screenshots");
const reportPath = path.join(reportDir, "latest.json");
const port = 3100;
const frontendUrl = `http://127.0.0.1:${port}/canvas`;

const rounds = [
  { id: 1, mode: "desktop", zoom: 0.8, theme: "light", viewport: { width: 1366, height: 768 } },
  { id: 2, mode: "desktop", zoom: 0.9, theme: "dark", viewport: { width: 1536, height: 864 } },
  { id: 3, mode: "desktop", zoom: 1, theme: "light", viewport: { width: 1728, height: 1117 } },
  { id: 4, mode: "desktop", zoom: 1.1, theme: "dark", viewport: { width: 1920, height: 1080 } },
  { id: 5, mode: "desktop", zoom: 1.25, theme: "light", viewport: { width: 2048, height: 1280 } },
  { id: 6, mode: "mobile", zoom: 1, theme: "light", viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: devices["Pixel 5"].deviceScaleFactor },
  { id: 7, mode: "mobile", zoom: 1, theme: "dark", viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: devices["iPhone 12"].deviceScaleFactor },
  { id: 8, mode: "mobile", zoom: 1, theme: "light", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: devices["iPhone 12"].deviceScaleFactor },
  { id: 9, mode: "mobile", zoom: 1, theme: "dark", viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2.625 },
  { id: 10, mode: "mobile-landscape", zoom: 1, theme: "light", viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: devices["iPhone 12"].deviceScaleFactor }
];

function createPixels() {
  const total = 512 * 512;
  const pixels = new Array(total).fill(0xf8f6f0);
  for (let index = 0; index < total; index += 197) {
    pixels[index] = 0x3a86ff;
  }
  pixels[42 * 512 + 41] = 0x8338ec;
  pixels[265 * 512 + 242] = 0xff4d4f;
  pixels[120 * 512 + 188] = 0x2ec4b6;
  return pixels;
}

const basePixels = createPixels();

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

function serveBuild() {
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

  const server = http.createServer((request, response) => {
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

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

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

async function mockApis(page) {
  await page.route("http://127.0.0.1:18080/api/canvas/current", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(createCurrentState()) });
  });

  await page.route("http://127.0.0.1:18080/api/canvas/cooldown", async (route) => {
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
  });

  await page.route(/http:\/\/127\.0\.0\.1:18080\/api\/canvas\/history(\?.*)?$/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(historyItems) });
  });

  await page.route(/http:\/\/127\.0\.0\.1:18080\/api\/canvas\/history\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(historyDetail) });
  });

  await page.route(/http:\/\/127\.0\.0\.1:18080\/api\/canvas\/pixel-meta\?x=\d+&y=\d+/, async (route) => {
    const url = new URL(route.request().url());
    const x = Number(url.searchParams.get("x"));
    const y = Number(url.searchParams.get("y"));
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
  });

  await page.route(/http:\/\/127\.0\.0\.1:18080\/api\/canvas\/updates(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        latestEventId: 12,
        updates: []
      })
    });
  });

  await page.route("http://127.0.0.1:18080/api/canvas/pixel", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
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
          x: body.x ?? 0,
          y: body.y ?? 0,
          color: body.color ?? 0x3a86ff,
          painter: body.nickname || "Anonymous",
          paintedAt: "2026-04-10T12:00:00Z",
          overwrittenCount: 4
        }
      })
    });
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

          window.setTimeout(() => {
            if (typeof this.onmessage === "function") {
              this.onmessage({
                data: JSON.stringify({
                  eventId: 14,
                  type: "pixel_updated",
                  seasonCode: "2026-04",
                  x: 18,
                  y: 25,
                  color: 0x3a86ff,
                  painter: "nahollo",
                  paintedAt: "2026-04-10T12:01:00Z",
                  overwrittenCount: 2
                })
              });
            }
          }, 300);
        }, 50);
      }

      send() {}

      close() {
        this.readyState = 3;
        if (typeof this.onclose === "function") {
          this.onclose(new CloseEvent("close"));
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

async function setTheme(page, theme) {
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("nahollo-theme", selectedTheme);
  }, theme);
}

async function interact(page, round) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(900);

  await page.evaluate((zoom) => {
    document.documentElement.style.zoom = `${zoom}`;
  }, round.zoom);
  await page.waitForTimeout(200);

  const nicknameInput = page.locator('input[placeholder="닉네임을 입력해 주세요"]').first();
  if (await nicknameInput.count()) {
    await nicknameInput.fill("아주아주길고세부적인한글닉네임테스트용사용자");
  }

  const stage = page.locator(".canvas-board-stage");
  if (await stage.count()) {
    const box = await stage.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.48);
    }
  }

  const themeToggle = page.locator(".theme-toggle").first();
  if (await themeToggle.count()) {
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(200);
      await themeToggle.click();
    } else {
      await page.evaluate(() => {
        const current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", current);
        window.localStorage.setItem("nahollo-theme", current);
      });
      await page.waitForTimeout(150);
      await page.evaluate(() => {
        const current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", current);
        window.localStorage.setItem("nahollo-theme", current);
      });
    }
  }

  if (round.mode === "desktop") {
    const paintTrigger = page.locator(".canvas-paint-dock-trigger").first();
    if (await paintTrigger.count()) {
      await paintTrigger.click();
      await page.waitForTimeout(120);
      await paintTrigger.click();
      await page.waitForTimeout(120);
      await paintTrigger.click();
      await page.waitForTimeout(120);
    }

    const customTrigger = page.locator(".canvas-custom-trigger").first();
    if (await customTrigger.count()) {
      await customTrigger.click();
      await page.waitForTimeout(150);
      await page.keyboard.press("Escape");
    }

    const historyButton = page.locator(".canvas-history-pill").first();
    if (await historyButton.count()) {
      await historyButton.click();
      await page.waitForTimeout(200);
      const firstCard = page.locator(".canvas-history-card").first();
      if (await firstCard.count()) {
        await firstCard.click();
        await page.waitForTimeout(200);
        await page.keyboard.press("Escape");
      } else {
        await page.keyboard.press("Escape");
      }
    }
  } else {
    const infoButton = page.locator(".canvas-mobile-top-button.is-accent").first();
    if (await infoButton.count()) {
      await infoButton.tap();
      await page.waitForTimeout(150);
      await page.keyboard.press("Escape");
    }

    const historyButton = page.locator(".canvas-mobile-top-button").first();
    if (await historyButton.count()) {
      await historyButton.tap();
      await page.waitForTimeout(180);
      await page.keyboard.press("Escape");
    }

    const trayToggle = page.locator(".canvas-mobile-tray-toggle").first();
    if (await trayToggle.count()) {
      await trayToggle.tap();
      await page.waitForTimeout(150);
      const customTrigger = page.locator(".canvas-mobile-tray-sheet .canvas-custom-trigger").first();
      if (await customTrigger.count()) {
        await customTrigger.tap();
        await page.waitForTimeout(180);
        await page.keyboard.press("Escape");
      }
    }
  }

  await page.waitForTimeout(350);
}

async function collectMetrics(page, round) {
  return page.evaluate(({ mode }) => {
    const getRect = (selector) => {
      const node = document.querySelector(selector);
      if (!(node instanceof HTMLElement)) {
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

    const overflowSelectors = [
      ".canvas-sidebar-card",
      ".canvas-paint-panel",
      ".canvas-history-pill",
      ".canvas-status-bar",
      ".canvas-history-drawer",
      ".canvas-history-modal",
      ".canvas-mobile-top-bar",
      ".canvas-mobile-paint-tray",
      ".canvas-mobile-sheet",
      ".canvas-mobile-color-sheet"
    ];

    const overflows = [];
    for (const selector of overflowSelectors) {
      const root = document.querySelector(selector);
      if (!(root instanceof HTMLElement)) {
        continue;
      }

      const nodes = [root, ...root.querySelectorAll("*")];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement)) {
          continue;
        }

        const style = window.getComputedStyle(node);
        const allowsVerticalScroll = style.overflowY === "auto" || style.overflowY === "scroll";
        const horizontalOverflow = node.scrollWidth - node.clientWidth > 6;
        const verticalOverflow = !allowsVerticalScroll && node.scrollHeight - node.clientHeight > 6;
        const isIntrinsicInput = node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement;
        const isIntentionalClip =
          style.textOverflow === "ellipsis" ||
          style.overflowX === "hidden" ||
          style.overflowX === "clip" ||
          style.overflowY === "hidden" ||
          style.overflowY === "clip";

        if (!isIntrinsicInput && !isIntentionalClip && (horizontalOverflow || verticalOverflow)) {
          overflows.push({
            selector,
            tag: node.tagName,
            className: node.className,
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
            scrollHeight: node.scrollHeight,
            clientHeight: node.clientHeight
          });
          break;
        }
      }
    }

    const bannedEnglish = ["History", "Paint", "Open gallery", "Place Pixel", "READY", "LIVE", "Selected", "Hover", "Zoom", "Nickname", "Connection", "Cooldown"];
    const visibleText = document.body.innerText;
    const englishMatches = bannedEnglish.filter((word) => visibleText.includes(word));

    const keyRects = {
      board: getRect(".canvas-board-frame"),
      leftPanel: getRect(".canvas-overlay-slot-left"),
      history: getRect(".canvas-history-pill"),
      paint: getRect(".canvas-paint-panel"),
      mobileTop: getRect(".canvas-mobile-slot-top"),
      mobileBottom: getRect(".canvas-mobile-paint-tray")
    };

    return {
      mode,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
      },
      keyRects,
      overflows,
      englishMatches
    };
  }, round);
}

async function run() {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.mkdirSync(screenshotDir, { recursive: true });

  const server = await serveBuild();
  const browser = await chromium.launch({ headless: true });
  const report = { generatedAt: new Date().toISOString(), frontendUrl, rounds: [] };

  try {
    for (const round of rounds) {
      const context = await browser.newContext({
        viewport: round.viewport,
        colorScheme: round.theme,
        hasTouch: Boolean(round.hasTouch),
        isMobile: Boolean(round.isMobile),
        deviceScaleFactor: round.deviceScaleFactor || 1
      });

      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];

      page.on("console", (message) => {
        if (message.type() === "error" || /ResizeObserver/i.test(message.text())) {
          consoleErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => pageErrors.push(String(error)));

      await setTheme(page, round.theme);
      await mockWebSocket(page);
      await mockApis(page);

      await page.goto(frontendUrl, { waitUntil: "networkidle" });
      await interact(page, round);
      const metrics = await collectMetrics(page, round);

      const screenshotPath = path.join(screenshotDir, `round-${String(round.id).padStart(2, "0")}-${round.mode}-${round.theme}.png`);
      await page.screenshot({ path: screenshotPath });

      report.rounds.push({
        ...round,
        screenshotPath,
        consoleErrors,
        pageErrors,
        metrics
      });

      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
