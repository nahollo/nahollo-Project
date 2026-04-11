const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium, devices } = require("playwright");

const phase = process.argv[2] || process.env.CAPTURE_PHASE || "after";
const baseUrlFromEnv = process.env.BASE_URL || "";
const localPort = Number(process.env.CAPTURE_PORT || 3100);
const activeBaseUrl = baseUrlFromEnv || `http://127.0.0.1:${localPort}`;
const rootDir = path.resolve(__dirname, "..", "..");
const frontendDir = path.resolve(__dirname, "..");
const buildDir = path.join(frontendDir, "build");
const outputRoot = path.join(rootDir, "artifacts", "screenshots", "final-pass", phase);

const routes = [
  { name: "home", path: "/" },
  { name: "projects", path: "/project" },
  { name: "canvas", path: "/canvas" },
  { name: "resume", path: "/resume" }
];

const themes = ["light", "dark"];
const viewports = [
  { name: "desktop", viewport: { width: 1440, height: 1200 }, mobile: false },
  {
    name: "mobile",
    viewport: { width: 390, height: 844 },
    mobile: true,
    deviceScaleFactor: devices["iPhone 12"].deviceScaleFactor,
    hasTouch: true,
    isMobile: true
  }
];

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

async function preparePage(page, theme) {
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("nahollo-theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }, theme);
}

async function captureRoute(page, route, theme, viewport) {
  await page.goto(`${activeBaseUrl}${route.path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const targetDir = path.join(outputRoot, theme);
  fs.mkdirSync(targetDir, { recursive: true });

  const firstPath = path.join(targetDir, `${route.name}-${viewport.name}-first.png`);
  const fullPath = path.join(targetDir, `${route.name}-${viewport.name}-full.png`);

  await page.screenshot({ path: firstPath });
  await page.screenshot({ path: fullPath, fullPage: true });
}

async function run() {
  let server = null;

  if (!baseUrlFromEnv) {
    if (!fs.existsSync(buildDir)) {
      throw new Error(`Build directory not found: ${buildDir}. Run "npm run build" first or set BASE_URL.`);
    }

    server = createStaticServer();
    await new Promise((resolve) => server.listen(localPort, "127.0.0.1", resolve));
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const theme of themes) {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          viewport: viewport.viewport,
          colorScheme: theme,
          hasTouch: viewport.hasTouch || false,
          isMobile: viewport.isMobile || false,
          deviceScaleFactor: viewport.deviceScaleFactor || 1
        });

        const page = await context.newPage();
        await preparePage(page, theme);

        for (const route of routes) {
          await captureRoute(page, route, theme, viewport);
        }

        await context.close();
      }
    }
  } finally {
    await browser.close();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
