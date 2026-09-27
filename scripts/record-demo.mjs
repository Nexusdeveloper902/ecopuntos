/**
 * Records a feature tour of the EcoPuntos app.
 *
 * Dev-only utility: it needs Playwright, which is deliberately NOT a project
 * dependency (it would drag a browser download into `npm install`).
 *
 *   npx playwright install chromium
 *   node scripts/record-demo.mjs
 *
 * Env: BASE_URL (default http://localhost:3000), OUT_DIR, CHROME_PATH.
 * Writes two webm files into OUT_DIR/raw (desktop + mobile) to be stitched.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "demo-out";
const EXE = process.env.CHROME_PATH || undefined;
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

mkdirSync(`${OUT}/raw`, { recursive: true });

async function caption(page, text, tone = "") {
  await page.evaluate(
    ({ t, tone }) => {
      const old = document.getElementById("__caption");
      if (old) old.remove();
      const el = document.createElement("div");
      el.id = "__caption";
      el.textContent = t;
      el.style.cssText = [
        "position:fixed", "left:50%", "bottom:32px", "transform:translateX(-50%)",
        "z-index:2147483647", "color:#fff", "padding:13px 22px", "border-radius:10px",
        "font:600 16px/1.3 Inter,system-ui,-apple-system,sans-serif",
        "box-shadow:0 10px 30px rgba(2,6,23,.35)", "white-space:nowrap",
        "border:1px solid rgba(255,255,255,.12)",
        `background:${tone === "ok" ? "rgba(5,150,105,.96)" : "rgba(15,23,42,.93)"}`,
      ].join(";");
      document.body.appendChild(el);
    },
    { t: text, tone }
  );
}

const card = (sub, foot) => `<!doctype html><html><body style="margin:0">
<div style="height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:20px;background:#0f172a;color:#fff;font-family:Inter,system-ui,-apple-system,sans-serif">
  <div style="display:flex;align-items:center;gap:16px">
    <div style="width:56px;height:56px;border-radius:14px;background:#059669;display:grid;place-items:center">
      <svg viewBox="3.2 3.2 17.6 17.6" width="38" height="38">
        <path d="M16.02 6.27 A7 7 0 1 1 7.98 6.27" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M9.78 5.01 L8.59 8.53 L6.07 4.93 Z" fill="#fff"/>
        <circle cx="12" cy="12" r="2.4" fill="#fff"/>
      </svg>
    </div>
    <div style="font-size:34px;font-weight:600;letter-spacing:-.5px">Eco<span style="color:#34d399">Puntos</span></div>
  </div>
  <div style="font-size:19px;color:#94a3b8">${sub}</div>
  <div style="margin-top:12px;font-size:13px;color:#64748b;letter-spacing:.4px">${foot}</div>
</div></body></html>`;

const browser = await chromium.launch({
  executablePath: EXE,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const record = async (viewport, run) => {
  const ctx = await browser.newContext({
    viewport,
    recordVideo: { dir: `${OUT}/raw`, size: viewport },
  });
  const page = await ctx.newPage();
  const video = page.video();
  const scene = async (name, fn) => {
    try {
      await fn();
    } catch (e) {
      console.error(`[skip] ${name}: ${String(e).split("\n")[0].slice(0, 120)}`);
    }
  };
  await run(page, scene);
  await ctx.close();
  return video.path();
};

// ======================= DESKTOP =======================
const deskPath = await record(DESKTOP, async (p, scene) => {
  const signIn = async () => {
    await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await p.fill("#email", "demo@ecopuntos.app");
    await p.fill("#password", "demo1234");
    await p.locator('form button:has-text("Entrar")').click();
    await p.waitForURL("**/dashboard");
  };

  await scene("intro", async () => {
    await p.setContent(card("Reciclaje con recompensas", "App de puntos por reciclar · Next.js + SQLite"));
    await p.waitForTimeout(3200);
  });

  await scene("login", async () => {
    await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await caption(p, "Acceso con sesión segura · scrypt + cookie httpOnly");
    await p.waitForTimeout(1600);
    await p.locator("#email").pressSequentially("demo@ecopuntos.app", { delay: 22 });
    await p.locator("#password").pressSequentially("demo1234", { delay: 45 });
    await p.waitForTimeout(600);
    await p.locator('form button:has-text("Entrar")').click();
    await p.waitForURL("**/dashboard");
    await p.waitForTimeout(1500);
  });

  await scene("dashboard", async () => {
    await caption(p, "Panel · saldo, impacto ambiental y nivel");
    await p.waitForTimeout(2000);
    await p.mouse.wheel(0, 360);
    await p.waitForTimeout(2200);
    await p.mouse.wheel(0, 430);
    await caption(p, "Gráficas calculadas desde los movimientos reales");
    await p.waitForTimeout(2400);
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await p.waitForTimeout(1400);
  });

  await scene("deposit", async () => {
    await caption(p, "Depositar · los puntos se calculan en vivo");
    await p.waitForTimeout(1500);
    await p.selectOption("#material", "carton");
    await p.waitForTimeout(900);
    await p.fill("#qty", "3");
    await p.waitForTimeout(1900);
    await p.locator('form button:has-text("Confirmar depósito")').click();
    await p.waitForTimeout(2300);
    await caption(p, "Saldo e historial se actualizan al instante", "ok");
    await p.waitForTimeout(1800);
    await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
    await p.waitForTimeout(2400);
  });

  await scene("rewards", async () => {
    await p.goto(`${BASE}/rewards`, { waitUntil: "networkidle" });
    await caption(p, "Recompensas · canje con código generado");
    await p.waitForTimeout(2000);
    await p.locator('button:has-text("Canjear")').first().click();
    await p.waitForTimeout(2300);
    await caption(p, "Descuenta el saldo y devuelve un código", "ok");
    await p.waitForTimeout(2200);
  });

  await scene("register", async () => {
    await p.locator('button:has-text("Salir")').click();
    await p.waitForURL("**/login");
    await p.goto(`${BASE}/register`, { waitUntil: "networkidle" });
    await caption(p, "Cuentas nuevas · validación en el servidor");
    await p.waitForTimeout(1500);
    await p.fill("#name", "Ana Prueba");
    await p.fill("#email", "ana@ecopuntos.app");
    await p.fill("#password", "corta");
    await p.locator('form button:has-text("Crear cuenta")').click();
    await p.waitForTimeout(2100);
    await p.fill("#password", "contrasena-segura");
    await p.locator('form button:has-text("Crear cuenta")').click();
    await p.waitForURL("**/dashboard");
    await caption(p, "Cuenta creada con estado inicial vacío", "ok");
    await p.waitForTimeout(2300);
  });

  await scene("outro", async () => {
    await p.setContent(card("Next.js · TypeScript · Tailwind · SQLite", "Sin base externa · sin módulos nativos · demo@ecopuntos.app"));
    await p.waitForTimeout(3000);
  });
});

// ======================= MOBILE =======================
const mobPath = await record(MOBILE, async (p, scene) => {
  await scene("mobile-login", async () => {
    await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await caption(p, "La misma app en móvil");
    await p.waitForTimeout(1500);
    await p.fill("#email", "demo@ecopuntos.app");
    await p.fill("#password", "demo1234");
    await p.locator('form button:has-text("Entrar")').click();
    await p.waitForURL("**/dashboard");
    await p.waitForTimeout(1800);
  });

  await scene("mobile-dashboard", async () => {
    await caption(p, "Panel adaptable");
    await p.evaluate(() => window.scrollTo({ top: 560, behavior: "smooth" }));
    await p.waitForTimeout(2400);
  });

  await scene("mobile-rewards", async () => {
    await p.goto(`${BASE}/rewards`, { waitUntil: "networkidle" });
    await caption(p, "Tarjetas apiladas y navegación inferior");
    await p.waitForTimeout(2400);
    await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
    await p.waitForTimeout(2400);
  });
});

await browser.close();
console.log(JSON.stringify({ deskPath: await deskPath, mobPath: await mobPath }));
