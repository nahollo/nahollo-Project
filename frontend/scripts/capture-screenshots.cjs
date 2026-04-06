const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("playwright");

const phase = process.argv[2] || process.env.CAPTURE_PHASE || "after";
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const rootDir = path.resolve(__dirname, "..", "..");
const outputRoot = path.join(rootDir, "artifacts", "screenshots", "final-pass", phase);

const routes = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "projects", path: "/project" },
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

async function preparePage(page, theme) {
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("nahollo-theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }, theme);
}

async function captureRoute(page, route, theme, viewport) {
  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
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
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
