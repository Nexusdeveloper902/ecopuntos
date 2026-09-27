import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { hashPassword } from "./password";

export type Material = { key: string; name: string; unit: string; points: number; co2: number; water: number };
export type Reward = { id: number; category: string; title: string; description: string; cost: number };
export type Person = { id: number; email: string; name: string };
export type Totals = { points: number; co2: number; water: number };
export type HistoryRow = {
  kind: "dep" | "red";
  id: number;
  date: string;
  place: string;
  detail: string;
  pts: number;
  status: string;
};

export const STATIONS = [
  "Estación Central · IoT #012",
  "Plaza Universitaria · IoT #045",
  "Parque Ecológico Norte · IoT #088",
  "Centro Comercial BioMall · IoT #104",
] as const;

// Single source of truth for the rate card; deposits store the resolved numbers.
export const MATERIALS: Material[] = [
  { key: "pet", name: "Plástico PET", unit: "unidad", points: 10, co2: 0.08, water: 1.2 },
  { key: "aluminio", name: "Aluminio", unit: "unidad", points: 15, co2: 0.12, water: 2.5 },
  { key: "vidrio", name: "Vidrio", unit: "unidad", points: 20, co2: 0.18, water: 3.0 },
  { key: "carton", name: "Cartón y papel", unit: "kg", points: 25, co2: 0.4, water: 8.0 },
  { key: "ewaste", name: "E-Waste", unit: "unidad", points: 50, co2: 1.2, water: 15.0 },
];

export const materialByKey = (key: string) => MATERIALS.find((m) => m.key === key);

const REWARDS = [
  { category: "Transporte", title: "Pase urbano de bus", description: "Un viaje en la red de metro y bus.", cost: 100 },
  { category: "Cafetería", title: "Café orgánico", description: "Canjeable en cualquier EcoCoffee.", cost: 250 },
  { category: "Entretenimiento", title: "Entradas de cine 2x1", description: "Válidas en salas asociadas.", cost: 350 },
  { category: "Supermercado", title: "Bono de compra de 10 $", description: "Descuento en productos ecológicos.", cost: 500 },
];

const LEVEL_TITLES = ["Recolector", "Reciclador", "Eco-Héroe", "Guardián verde", "Leyenda circular"];

export function levelFor(points: number) {
  const level = Math.floor(Math.max(0, points) / 500) + 1;
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    floor: (level - 1) * 500,
    next: level * 500,
  };
}

// ---------- connection ----------
const dataDir = process.env.ECOPUNTOS_DATA_DIR ?? path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });
const dbFile = process.env.ECOPUNTOS_DB ?? path.join(dataDir, "ecopuntos.db");

// ponytail: one handle reused across dev HMR (globalThis) instead of opening per reload.
const cache = globalThis as unknown as { __ecopuntosDb?: DatabaseSync };

// Opened lazily: importing this module must not touch the file. The build imports every
// page module in parallel, and concurrent DDL would trip "database is locked".
export function conn(): DatabaseSync {
  if (!cache.__ecopuntosDb) cache.__ecopuntosDb = create();
  return cache.__ecopuntosDb;
}

function create(): DatabaseSync {
  const c = new DatabaseSync(dbFile);
  c.exec("PRAGMA busy_timeout = 5000;");
  c.exec("PRAGMA journal_mode = WAL;");
  c.exec("PRAGMA foreign_keys = ON;");
  c.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rewards (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category    TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      cost        INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deposits (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      station      TEXT NOT NULL,
      material_key TEXT NOT NULL,
      qty          INTEGER NOT NULL,
      points       INTEGER NOT NULL,
      co2          REAL NOT NULL,
      water        REAL NOT NULL,
      status       TEXT NOT NULL DEFAULT 'Aprobado',
      created_at   TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS redemptions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reward_id  INTEGER NOT NULL,
      title      TEXT NOT NULL,
      cost       INTEGER NOT NULL,
      code       TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_dep_user ON deposits(user_id);
    CREATE INDEX IF NOT EXISTS idx_red_user ON redemptions(user_id);
  `);
  seed(c);
  return c;
}

function stamp(monthsAgo: number, day = 12): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  d.setUTCDate(Math.min(day, 28));
  d.setUTCHours(10, 30, 0, 0);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function seed(c: DatabaseSync) {
  const rewards = c.prepare("SELECT COUNT(*) AS n FROM rewards").get() as { n: number };
  if (rewards.n === 0) {
    const ins = c.prepare("INSERT INTO rewards (category,title,description,cost) VALUES (?,?,?,?)");
    for (const r of REWARDS) ins.run(r.category, r.title, r.description, r.cost);
  }

  const users = c.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (users.n > 0) return;

  // Demo account so a fresh install has something to look at.
  const info = c
    .prepare("INSERT INTO users (email,name,password_hash,created_at) VALUES (?,?,?,?)")
    .run("demo@ecopuntos.app", "Camila Torres", hashPassword("demo1234"), stamp(6, 3));
  const userId = Number(info.lastInsertRowid);

  const dep = c.prepare(
    "INSERT INTO deposits (user_id,station,material_key,qty,points,co2,water,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
  );
  const seedRows: Array<[string, number, number, string, string]> = [
    ["carton", 2, 5, STATIONS[2], "Aprobado"],
    ["pet", 8, 5, STATIONS[0], "Aprobado"],
    ["pet", 20, 4, STATIONS[1], "Aprobado"],
    ["vidrio", 5, 4, STATIONS[3], "Aprobado"],
    ["aluminio", 15, 3, STATIONS[0], "Aprobado"],
    ["pet", 10, 3, STATIONS[1], "Aprobado"],
    ["carton", 3, 2, STATIONS[3], "Aprobado"],
    ["pet", 12, 2, STATIONS[0], "Aprobado"],
    ["ewaste", 1, 1, STATIONS[2], "Aprobado"],
    ["vidrio", 10, 1, STATIONS[1], "Aprobado"],
    ["pet", 15, 0, STATIONS[0], "Aprobado"],
    ["aluminio", 5, 0, STATIONS[3], "Aprobado"],
    ["vidrio", 4, 0, STATIONS[1], "En proceso"],
  ];
  for (const [key, qty, months, station, status] of seedRows) {
    const m = materialByKey(key)!;
    dep.run(userId, station, key, qty, qty * m.points, qty * m.co2, qty * m.water, status, stamp(months));
  }

  const cafe = c.prepare("SELECT id,cost,title FROM rewards WHERE title = 'Café orgánico'").get() as
    | { id: number; cost: number; title: string }
    | undefined;
  if (cafe) {
    c
      .prepare("INSERT INTO redemptions (user_id,reward_id,title,cost,code,created_at) VALUES (?,?,?,?,?,?)")
      .run(userId, cafe.id, cafe.title, cafe.cost, "ECO-2026-X89B", stamp(1, 18));
  }
}

// ---------- auth writes ----------
export function userByEmail(email: string): (Person & { password_hash: string }) | undefined {
  return conn()
    .prepare("SELECT id,email,name,password_hash FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as (Person & { password_hash: string }) | undefined;
}

export function createUser(email: string, name: string, password: string): Person {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const info = conn()
    .prepare("INSERT INTO users (email,name,password_hash,created_at) VALUES (?,?,?,?)")
    .run(cleanEmail, cleanName, hashPassword(password), new Date().toISOString().slice(0, 19).replace("T", " "));
  return { id: Number(info.lastInsertRowid), email: cleanEmail, name: cleanName };
}

// ---------- reads ----------
export function listRewards(): Reward[] {
  // node:sqlite rows have a null prototype, which cannot cross into a Client Component.
  const rows = conn().prepare("SELECT id,category,title,description,cost FROM rewards ORDER BY cost").all() as Reward[];
  return rows.map((r) => ({ id: r.id, category: r.category, title: r.title, description: r.description, cost: r.cost }));
}

export function totals(userId: number): Totals {
  const row = conn()
    .prepare(
      `SELECT
         COALESCE((SELECT SUM(points) FROM deposits WHERE user_id = ?1 AND status = 'Aprobado'), 0)
       - COALESCE((SELECT SUM(cost)   FROM redemptions WHERE user_id = ?1), 0) AS points,
         COALESCE((SELECT SUM(co2)   FROM deposits WHERE user_id = ?1 AND status = 'Aprobado'), 0) AS co2,
         COALESCE((SELECT SUM(water) FROM deposits WHERE user_id = ?1 AND status = 'Aprobado'), 0) AS water`,
    )
    .get(userId) as { points: number; co2: number; water: number };
  return { points: Math.round(row.points), co2: Number(row.co2.toFixed(1)), water: Math.round(row.water) };
}

export function history(userId: number, limit = 12): HistoryRow[] {
  const raw = conn()
    .prepare(
      `SELECT kind,id,date,place,label,qty,pts,status FROM (
         SELECT 'dep' AS kind, d.id AS id, d.created_at AS date, d.station AS place,
                d.material_key AS label, d.qty AS qty, d.points AS pts, d.status AS status
         FROM deposits d WHERE d.user_id = ?1
         UNION ALL
         SELECT 'red', r.id, r.created_at, 'Canje en la app', r.title, 0, -r.cost, 'Canjeado'
         FROM redemptions r WHERE r.user_id = ?1
       ) ORDER BY date DESC LIMIT ?2`,
    )
    .all(userId, limit) as Array<{
    kind: "dep" | "red";
    id: number;
    date: string;
    place: string;
    label: string;
    qty: number;
    pts: number;
    status: string;
  }>;

  return raw.map((r) => {
    if (r.kind === "red") {
      return { kind: "red", id: r.id, date: r.date, place: r.place, detail: r.label, pts: r.pts, status: r.status };
    }
    const m = materialByKey(r.label);
    return {
      kind: "dep" as const,
      id: r.id,
      date: r.date,
      place: r.place,
      detail: `${m?.name ?? r.label} · ${r.qty} ${m?.unit ?? ""}`.trim(),
      pts: r.pts,
      status: r.status,
    };
  });
}

export function monthlyPoints(userId: number, months = 6): Array<{ label: string; points: number }> {
  const raw = conn()
    .prepare(
      `SELECT substr(created_at,1,7) AS ym, SUM(points) AS pts
       FROM deposits WHERE user_id = ? AND status = 'Aprobado'
       GROUP BY ym ORDER BY ym DESC LIMIT ?`,
    )
    .all(userId, months) as Array<{ ym: string; pts: number }>;
  const names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return raw.reverse().map((r) => ({ label: names[Number(r.ym.slice(5, 7)) - 1] ?? r.ym, points: r.pts }));
}

export function composition(userId: number): Array<{ name: string; points: number }> {
  const raw = conn()
    .prepare(
      `SELECT material_key AS k, SUM(points) AS points
       FROM deposits WHERE user_id = ? AND status = 'Aprobado' GROUP BY material_key ORDER BY points DESC`,
    )
    .all(userId) as Array<{ k: string; points: number }>;
  return raw.map((r) => ({ name: materialByKey(r.k)?.name ?? r.k, points: r.points }));
}

// ---------- writes ----------
export function recordDeposit(userId: number, station: string, materialKey: string, qty: number): number {
  const m = materialByKey(materialKey);
  if (!m) throw new Error("Material desconocido");
  conn().prepare(
    "INSERT INTO deposits (user_id,station,material_key,qty,points,co2,water,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(
    userId,
    station,
    materialKey,
    qty,
    qty * m.points,
    qty * m.co2,
    qty * m.water,
    "Aprobado",
    new Date().toISOString().slice(0, 19).replace("T", " "),
  );
  return qty * m.points;
}

export function recordRedemption(userId: number, reward: Reward): string {
  const code = `ECO-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  conn().prepare("INSERT INTO redemptions (user_id,reward_id,title,cost,code,created_at) VALUES (?,?,?,?,?,?)").run(
    userId,
    reward.id,
    reward.title,
    reward.cost,
    code,
    new Date().toISOString().slice(0, 19).replace("T", " "),
  );
  return code;
}

// ---------- sessions ----------
export function createSession(userId: number, ttlMs = 30 * 24 * 60 * 60 * 1000): { token: string; expires: number } {
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex");
  const expires = Date.now() + ttlMs;
  conn().prepare("INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)").run(token, userId, expires);
  return { token, expires };
}

export function sessionUser(token: string): Person | undefined {
  const row = conn()
    .prepare(
      `SELECT u.id AS id, u.email AS email, u.name AS name, s.expires_at AS expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    )
    .get(token) as { id: number; email: string; name: string; expires_at: number } | undefined;
  if (!row) return undefined;
  if (row.expires_at < Date.now()) {
    conn().prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return undefined;
  }
  return { id: row.id, email: row.email, name: row.name };
}

export function destroySession(token: string) {
  conn().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
