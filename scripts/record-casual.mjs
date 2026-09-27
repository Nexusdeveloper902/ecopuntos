/**
 * Records a casual click-through of the EcoPuntos app: one continuous take,
 * no captions, no title cards. Approximates a hand recording:
 *
 * - an on-page cursor follows every mouse move (headless video captures no
 *   OS pointer, so without this the clicks come from nowhere),
 * - curved eased mouse paths with occasional overshoot,
 * - scrolling in many small ticks with hesitations, like a wheel finger,
 * - irregular typing rhythm, hover-before-click, idle drift while "reading".
 *
 * Dev-only utility: reuses the machine's Playwright + cached Chromium, neither
 * of which is a project dependency (see record-demo.mjs header).
 *
 *   node scripts/record-casual.mjs
 *
 * Env: BASE_URL (default http://localhost:3000), OUT_DIR (default demo-out),
 * PW_CORE (absolute path to a playwright-core install).
 * Writes OUT_DIR/raw/casual-<ts>.webm.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: `${OUT}/raw`, size: { width: 1440, height: 900 } },
});

// Visible cursor + mouse tracker on every page, before any content loads.
await ctx.addInitScript(() => {
  const el = document.createElement("div");
  el.id = "__cursor";
  el.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 3.5 19.5 12l-7.6 1.4L8.5 21z" fill="#fff" stroke="#1e293b" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  el.style.cssText = [
    "position:fixed", "left:0", "top:0", "z-index:2147483647",
    "pointer-events:none", "filter:drop-shadow(0 1px 2px rgba(2,6,23,.45))",
  ].join(";");
  const move = (x, y) => {
    window.__mouse = { x, y };
    el.style.transform = `translate(${x - 1}px,${y - 1}px) scale(${window.__pressed ? 0.88 : 1})`;
  };
  window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
  window.addEventListener("mousedown", () => { window.__pressed = true; });
  window.addEventListener("mouseup", () => { window.__pressed = false; });
  const put = () => document.body && document.body.appendChild(el);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", put);
  else put();
  window.__mouse = { x: 700, y: 620 };
});

const p = await ctx.newPage();
const video = p.video();
const mousePos = async () =>
  p.evaluate(() => window.__mouse ?? { x: 700, y: 620 });

// Curved, eased path with occasional overshoot past the target.
async function glideTo(x, y) {
  const { x: sx, y: sy } = await mousePos();
  const dx = x - sx, dy = y - sy;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return;
  const steps = Math.max(12, Math.min(32, Math.round(dist / 38)));
  const nx = -dy / dist, ny = dx / dist; // perpendicular
  const bend = rnd(-0.16, 0.16) * dist;
  const cx = sx + dx / 2 + nx * bend, cy = sy + dy / 2 + ny * bend;
  const quad = (t) => ({
    x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * x,
    y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * y,
  });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.75 ? 1 - Math.pow(1 - t / 0.75, 2) * 0.25 : 0.75 + (t - 0.75); // ease-out then settle
    const pt = quad(Math.min(1, e));
    await p.mouse.move(pt.x, pt.y);
    await sleep(rnd(6, 14));
  }
  if (Math.random() < 0.45) {
    // overshoot a few px and drift back, like a real hand correcting
    await p.mouse.move(x + rnd(-7, 7), y + rnd(-7, 7));
    await sleep(rnd(30, 70));
    await p.mouse.move(x, y);
  } else {
    await p.mouse.move(x, y);
  }
}

// Scroll in stages until the element is on screen, like reaching for it.
async function ensureVisible(locator) {
  for (let i = 0; i < 14; i++) {
    const box = await locator.boundingBox();
    if (!box) throw new Error("ensureVisible: element has no box");
    const vh = await p.evaluate(() => window.innerHeight);
    if (box.y >= 100 && box.y + box.height <= vh - 20) return box;
    const delta = box.y < 100 ? box.y - 150 : box.y - vh + 170;
    await scrollBy(Math.max(-520, Math.min(520, delta)));
    await sleep(rnd(150, 350));
  }
  const box = await locator.boundingBox();
  if (!box) throw new Error("ensureVisible: element has no box");
  return box;
}

async function humanClick(locator) {
  const box = await ensureVisible(locator);
  await glideTo(box.x + box.width * rnd(0.3, 0.7), box.y + box.height * rnd(0.3, 0.7));
  await sleep(rnd(180, 480)); // hover, deciding
  await p.mouse.down();
  await sleep(rnd(70, 140));
  await p.mouse.up();
}

async function humanType(locator, text) {
  await humanClick(locator);
  await sleep(rnd(200, 450));
  for (const ch of text) {
    await p.keyboard.type(ch);
    await sleep(Math.random() < 0.12 ? rnd(180, 320) : rnd(28, 95));
  }
}

// Wheel scrolling the way a finger does: bursts of small ticks, hesitations.
async function scrollBy(total) {
  let left = total;
  while (Math.abs(left) > 10) {
    const tick = Math.sign(left) * Math.min(Math.abs(left), rnd(35, 90));
    await p.mouse.wheel(0, tick);
    left -= tick;
    await sleep(Math.random() < 0.18 ? rnd(120, 260) : rnd(25, 60));
  }
}

// Idle drift while "reading": tiny movements, cursor stays roughly put.
async function read(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const { x, y } = await mousePos();
    await p.mouse.move(x + rnd(-9, 9), y + rnd(-7, 7));
    await sleep(rnd(220, 520));
  }
}

const centerOf = async (locator, xRatio = 0.5) => {
  const box = await locator.boundingBox();
  return { x: box.x + box.width * xRatio, y: box.y + box.height / 2 };
};

// ======================= the take =======================
await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await read(2100);

await humanType(p.locator("#email"), "demo@ecopuntos.app");
await sleep(rnd(300, 600));
await humanType(p.locator("#password"), "demo1234");
await sleep(rnd(500, 900));
await humanClick(p.locator('form button:has-text("Entrar")'));
await p.waitForURL("**/dashboard");
await read(2400);

// look around: drift down the page in bursts, hover the charts
await scrollBy(620);
await read(1700);
const bars = p.locator("text=Puntos por mes").first();
try {
  const { x, y } = await centerOf(bars);
  await glideTo(x + 120, y + 90); // sweep across the bars like reading them
  await sleep(rnd(500, 900));
  await glideTo(x + 260, y + 60);
} catch { /* keep going, it's a vibe not a test */ }
await read(1200);
await scrollBy(480);
await read(2100);
await scrollBy(-260); // scroll back up a touch, re-reading
await read(1400);

// deposit: focus the select, arrow down to Vidrio (3rd option), tab on
await humanClick(p.locator("#material"));
await sleep(rnd(300, 600));
await p.keyboard.press("ArrowDown");
await sleep(rnd(350, 650));
await p.keyboard.press("ArrowDown");
await sleep(rnd(500, 900));
await p.keyboard.press("Tab");
await humanClick(p.locator("#qty"));
await p.keyboard.press("ControlOrMeta+a");
await sleep(rnd(150, 300));
for (const ch of "2") {
  await p.keyboard.type(ch);
  await sleep(rnd(60, 140));
}
await read(1900); // looking at the live preview
await humanClick(p.locator('form button:has-text("Confirmar depósito")'));
await read(2800);

// go browse the rewards
await humanClick(p.locator("nav.hidden a:has-text('Recompensas')"));
await p.waitForFunction(() => location.pathname === "/rewards"); // client-side nav: no load event
await read(2000);
await scrollBy(320);
await read(1500);
const cards = p.locator('button:has-text("Canjear")');
await glideTo(...Object.values(await centerOf(cards.first(), 0.2)));
await read(900);
await humanClick(cards.first());
await read(3000);

// back to the panel, last look around
await humanClick(p.locator("nav.hidden a:has-text('Panel')"));
await p.waitForFunction(() => location.pathname === "/dashboard"); // client-side nav: no load event
await read(1800);
await scrollBy(420);
await read(1500);
await scrollBy(-180);
await glideTo(rnd(900, 1150), rnd(500, 700)); // park the cursor somewhere neutral
await read(900);

await ctx.close();
await browser.close();
console.log(JSON.stringify({ raw: await video.path() }));
