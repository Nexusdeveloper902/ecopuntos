/**
 * Records a click-through of the EcoPuntos app: one continuous take, no
 * captions, no title cards. Driver ported from the MoodBox demo technique:
 *
 * - dot cursor injected via addInitScript, position persisted across pages
 *   in sessionStorage so it never snaps back to the corner,
 * - every click is show (smooth scrollIntoView, centered) → 18-step mouse
 *   move → click → pause,
 * - all scrolling is native smooth scrollBy/scrollIntoView (renders as one
 *   continuous motion on video, unlike wheel ticks),
 * - fixed unhurried pauses instead of random jitter.
 *
 * Dev-only utility: reuses the machine's Playwright + cached Chromium, neither
 * of which is a project dependency. Record against the production server:
 *
 *   npm run build && (npm start -- --port 3000 &)
 *   node scripts/record-casual.mjs
 *
 * Env: BASE_URL (default http://localhost:3000), OUT_DIR (default demo-out),
 * PW_CORE (absolute path to a playwright-core install).
 * Writes OUT_DIR/raw/casual-<ts>.webm; encode with:
 *   ffmpeg -i <raw> -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
 *     -movflags +faststart docs/demo.mp4
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const PW_CORE =
  process.env.PW_CORE ??
  "/home/jperez/Documents/NEXO/node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/";
const require = createRequire(`${PW_CORE}package.json`);
const { chromium } = require("playwright-core");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "demo-out";
const CHROME =
  "/home/jperez/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";

mkdirSync(`${OUT}/raw`, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: `${OUT}/raw`, size: { width: 1440, height: 900 } },
});

// Visible cursor so viewers can follow the clicks.
await context.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.style.cssText =
      "position:fixed;left:-40px;top:-40px;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(5,150,105,.55);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:2147483647;pointer-events:none;transition:transform .12s";
    document.body.appendChild(c);
    const saved = sessionStorage.getItem("cursor");
    if (saved) {
      const [x, y] = saved.split(",");
      c.style.left = x + "px";
      c.style.top = y + "px";
    }
    addEventListener(
      "mousemove",
      (e) => {
        c.style.left = e.clientX + "px";
        c.style.top = e.clientY + "px";
        sessionStorage.setItem("cursor", `${e.clientX},${e.clientY}`);
      },
      true
    );
    addEventListener("mousedown", () => (c.style.transform = "scale(.7)"), true);
    addEventListener("mouseup", () => (c.style.transform = "scale(1)"), true);
  });
});

const page = await context.newPage();
const video = page.video();
const wait = (ms) => page.waitForTimeout(ms);

async function show(loc) {
  await loc.evaluate((e) => e.scrollIntoView({ behavior: "smooth", block: "center" }));
  await wait(700);
}
async function click(loc, { force = false, pause = 600 } = {}) {
  await show(loc);
  const b = await loc.boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y, { steps: 18 });
  await wait(200);
  await loc.click({ force });
  await wait(pause);
}
async function type(loc, text) {
  await click(loc, { pause: 200 });
  await loc.pressSequentially(text, { delay: 38 });
  await wait(400);
}
async function scrollBy(y) {
  await page.evaluate((dy) => scrollBy({ top: dy, behavior: "smooth" }), y);
  await wait(1100);
}

// 1. Login
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await wait(1800);
await type(page.locator("#email"), "demo@ecopuntos.app");
await type(page.locator("#password"), "demo1234");
await click(page.locator('form button:has-text("Entrar")'), { pause: 300 });

// 2. Dashboard — look around
await page.waitForURL("**/dashboard");
await wait(2200);
await scrollBy(650);
await wait(1400);
await scrollBy(500);
await wait(1800);
await scrollBy(-450);
await wait(1200);

// 3. Deposit — pick Vidrio with the keyboard, set qty, confirm
await click(page.locator("#material"), { pause: 300 });
await page.keyboard.press("ArrowDown");
await wait(450);
await page.keyboard.press("ArrowDown");
await wait(650);
await page.keyboard.press("Tab");
await wait(300);
await click(page.locator("#qty"), { pause: 200 });
await page.keyboard.press("ControlOrMeta+a");
await page.locator("#qty").pressSequentially("2", { delay: 90 });
await wait(1600); // reading the live preview
await click(page.locator('form button:has-text("Confirmar depósito")'), { pause: 2400 });

// 4. Rewards — browse and redeem the bus pass
await click(page.locator("nav.hidden a:has-text('Recompensas')"), { pause: 1500 });
await page.waitForFunction(() => location.pathname === "/rewards"); // client-side nav
await wait(1800);
await scrollBy(320);
await wait(1400);
await click(page.locator('button:has-text("Canjear")').first(), { pause: 2600 });

// 5. Back to the panel, last look
await click(page.locator("nav.hidden a:has-text('Panel')"), { pause: 1500 });
await page.waitForFunction(() => location.pathname === "/dashboard"); // client-side nav
await wait(1800);
await scrollBy(420);
await wait(1600);
await scrollBy(-220);
await wait(1200);

await context.close();
await browser.close();
console.log(JSON.stringify({ raw: await video.path() }));
