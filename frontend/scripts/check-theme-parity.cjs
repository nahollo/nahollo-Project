const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const rootDir = path.resolve(__dirname, "..", "..");
const reportDir = path.join(rootDir, "artifacts", "theme-parity");
const reportPath = path.join(reportDir, "latest.json");

const routes = [
  {
    name: "home",
    path: "/",
    singles: [
      ".hero-heading",
      ".hero-description",
      ".hero-role-list",
      ".hero-actions",
      ".hero-summary-card",
      ".summary-title",
      ".summary-chip-list",
      ".hero-value-grid"
    ],
    collections: [".hero-role-chip", ".summary-chip", ".hero-value-card"]
  },
  {
    name: "about",
    path: "/about",
    singles: [
      ".about-title",
      ".about-intro-description",
      ".about-intro-grid",
      ".about-main-card",
      ".about-side-panel",
      ".about-focus-grid"
    ],
    collections: [".about-card-label", ".about-focus-card", ".about-side-item", ".about-side-tags span"]
  },
  {
    name: "projects",
    path: "/project",
    singles: [
      ".project-heading",
      ".project-description",
      ".project-intro-controls",
      ".project-utility-row",
      ".project-filter-row",
      ".project-results-meta",
      ".project-showcase-card"
    ],
    collections: [".project-filter-tab", ".project-card-chip", ".project-action-link"]
  },
  {
    name: "resume",
    path: "/resume",
    singles: [
      ".resume-title",
      ".resume-intro-description",
      ".resume-actions",
      ".resume-highlight-grid",
      ".resume-panel",
      ".resume-summary-flow"
    ],
    collections: [".resume-action", ".resume-highlight-card", ".resume-summary-tag", ".resume-project-chip", ".resume-focus-chip"]
  }
];

const viewports = [
  { name: "desktop", viewport: { width: 1440, height: 1200 } },
  {
    name: "mobile",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: devices["iPhone 12"].deviceScaleFactor,
    hasTouch: true,
    isMobile: true
  }
];

function round(value) {
  return Math.round(value * 100) / 100;
}

async function setInitialTheme(page, theme) {
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("nahollo-theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }, theme);
}

async function applyTheme(page, theme) {
  await page.evaluate((selectedTheme) => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === selectedTheme) {
      window.localStorage.setItem("nahollo-theme", selectedTheme);
      return;
    }

    const toggle = document.querySelector(".theme-toggle");
    if (toggle instanceof HTMLButtonElement) {
      toggle.click();
      return;
    }

    window.localStorage.setItem("nahollo-theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }, theme);
  await page.waitForFunction((selectedTheme) => document.documentElement.getAttribute("data-theme") === selectedTheme, theme);
}

async function waitForStablePage(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => (document.fonts ? document.fonts.status === "loaded" : true));
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
  await page.waitForTimeout(700);
}

async function waitForRouteReady(page, routeName) {
  if (routeName !== "about") {
    return;
  }

  await page.waitForFunction(() => {
    const calendar = document.querySelector(".react-activity-calendar");
    if (!calendar) {
      return false;
    }

    const hasMonthLabels = calendar.querySelectorAll("text").length > 0;
    const hasErrorMessage = /Unable to fetch contribution data/i.test(document.body.textContent || "");
    return hasMonthLabels || hasErrorMessage;
  }, null, { timeout: 20000 });
}

async function collectMetrics(page, config) {
  return page.evaluate(({ singles, collections }) => {
    const toNumber = (value) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const collectBox = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const lineHeight = toNumber(style.lineHeight);
      const height = rect.height;

      return {
        x: Math.round(rect.x * 100) / 100,
        y: Math.round(rect.y * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(height * 100) / 100,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        lineHeight: style.lineHeight,
        lines: lineHeight ? Math.round((height / lineHeight) * 100) / 100 : null,
        textLength: (element.textContent || "").trim().length
      };
    };

    const results = {
      document: {
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight
      },
      singles: {},
      collections: {}
    };

    for (const selector of singles) {
      const element = document.querySelector(selector);
      results.singles[selector] = element ? collectBox(element) : { missing: true };
    }

    for (const selector of collections) {
      const elements = Array.from(document.querySelectorAll(selector));
      const tops = [...new Set(elements.map((element) => Math.round(element.getBoundingClientRect().top * 100) / 100))];
      results.collections[selector] = {
        count: elements.length,
        rowCount: tops.length,
        topPositions: tops,
        first: elements[0] ? collectBox(elements[0]) : null
      };
    }

    return results;
  }, config);
}

function pushDiff(diffs, routeName, viewportName, type, selector, field, lightValue, darkValue) {
  diffs.push({
    route: routeName,
    viewport: viewportName,
    type,
    selector,
    field,
    light: lightValue,
    dark: darkValue
  });
}

function compareMetrics(routeName, viewportName, light, dark) {
  const diffs = [];
  const numericTolerance = 0.5;

  for (const [selector, lightValue] of Object.entries(light.singles)) {
    const darkValue = dark.singles[selector];

    if (!darkValue || lightValue.missing || darkValue.missing) {
      continue;
    }

    for (const field of ["x", "y", "width", "height", "lines"]) {
      if (lightValue[field] === null || darkValue[field] === null) {
        continue;
      }

      if (Math.abs(lightValue[field] - darkValue[field]) > numericTolerance) {
        pushDiff(diffs, routeName, viewportName, "single", selector, field, lightValue[field], darkValue[field]);
      }
    }

    for (const field of ["fontSize", "fontWeight", "letterSpacing", "lineHeight"]) {
      if (lightValue[field] !== darkValue[field]) {
        pushDiff(diffs, routeName, viewportName, "single", selector, field, lightValue[field], darkValue[field]);
      }
    }
  }

  for (const [selector, lightValue] of Object.entries(light.collections)) {
    const darkValue = dark.collections[selector];
    if (!darkValue) {
      continue;
    }

    if (lightValue.rowCount !== darkValue.rowCount) {
      pushDiff(diffs, routeName, viewportName, "collection", selector, "rowCount", lightValue.rowCount, darkValue.rowCount);
    }

    if (lightValue.count !== darkValue.count) {
      pushDiff(diffs, routeName, viewportName, "collection", selector, "count", lightValue.count, darkValue.count);
    }

    if (lightValue.first && darkValue.first) {
      for (const field of ["width", "height", "lines"]) {
        if (Math.abs(lightValue.first[field] - darkValue.first[field]) > numericTolerance) {
          pushDiff(diffs, routeName, viewportName, "collection-item", selector, field, lightValue.first[field], darkValue.first[field]);
        }
      }

      for (const field of ["fontSize", "fontWeight", "letterSpacing", "lineHeight"]) {
        if (lightValue.first[field] !== darkValue.first[field]) {
          pushDiff(diffs, routeName, viewportName, "collection-item", selector, field, lightValue.first[field], darkValue.first[field]);
        }
      }
    }
  }

  for (const field of ["scrollHeight", "scrollWidth", "clientWidth", "clientHeight"]) {
    if (light.document[field] !== dark.document[field]) {
      pushDiff(diffs, routeName, viewportName, "document", "document", field, light.document[field], dark.document[field]);
    }
  }

  return diffs;
}

async function run() {
  fs.mkdirSync(reportDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    results: []
  };

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: viewport.viewport,
        hasTouch: viewport.hasTouch || false,
        isMobile: viewport.isMobile || false,
        deviceScaleFactor: viewport.deviceScaleFactor || 1,
        colorScheme: "light"
      });

      const page = await context.newPage();
      await setInitialTheme(page, "light");

      for (const route of routes) {
        await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
        await page.waitForFunction(() => document.documentElement.getAttribute("data-theme") === "light");
        await waitForStablePage(page);
        await waitForRouteReady(page, route.name);

        const lightMetrics = await collectMetrics(page, route);

        await applyTheme(page, "dark");
        await waitForStablePage(page);
        await waitForRouteReady(page, route.name);

        const darkMetrics = await collectMetrics(page, route);
        const diffs = compareMetrics(route.name, viewport.name, lightMetrics, darkMetrics);

        report.results.push({
          route: route.name,
          viewport: viewport.name,
          diffCount: diffs.length,
          diffs
        });

        await applyTheme(page, "light");
        await waitForStablePage(page);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const totalDiffs = report.results.reduce((sum, result) => sum + result.diffCount, 0);
  console.log(`Theme parity diff count: ${totalDiffs}`);

  for (const result of report.results) {
    console.log(`${result.route} [${result.viewport}] -> ${result.diffCount}`);
    for (const diff of result.diffs.slice(0, 8)) {
      console.log(`  - ${diff.selector} :: ${diff.field} (${diff.light} -> ${diff.dark})`);
    }
    if (result.diffs.length > 8) {
      console.log(`  ... ${result.diffs.length - 8} more`);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
