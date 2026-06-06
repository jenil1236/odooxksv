/**
 * VendorBridge — Prisma Direct Seeder  (plain Node.js, no ts-node)
 * ══════════════════════════════════════════════════════════════════
 * Creates: Organisation · Users · Vendor Categories · Vendors
 * All with KNOWN passwords so the workflow seeder can log in.
 *
 * Prerequisites:
 *   1. Copy .env to project root (DATABASE_URL must be set)
 *   2. npx prisma migrate reset --force   ← wipes DB + re-runs migrations
 *   3. node prisma/seed.mjs               ← this file
 *   4. npm run dev                        ← start dev server
 *   5. node scripts/seed-workflow.mjs     ← drives the procurement workflow
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";

// ─── Load .env manually (dotenv not needed, we parse it ourselves) ────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath   = path.resolve(__dirname, "../.env");

try {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env may not exist — DATABASE_URL must be set in the environment
}

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("  ✗  DATABASE_URL is not set. Create a .env file or export the variable.");
  process.exit(1);
}

// ─── DB client ────────────────────────────────────────────────────────────────
const { Pool } = pg;
const pool = new Pool({ connectionString: DB_URL });

async function q(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SALT   = 12;
const hash   = (p) => bcrypt.hash(p, SALT);
const cuid   = () => {
  // Simple CUID-like unique ID (compatible format, not a full CUID library)
  const ts  = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `c${ts}${rnd}`.slice(0, 25);
};
const now    = () => new Date().toISOString();
const log    = (msg) => console.log(`    ✓ ${msg}`);
const head   = (msg) => console.log(`\n  ── ${msg}`);
const banner = (msg) => console.log(`\n${"═".repeat(56)}\n  ${msg}\n${"═".repeat(56)}`);

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║       VendorBridge — Prisma Direct Seeder            ║
╚══════════════════════════════════════════════════════╝`);

  // ── 1. Organisation ──────────────────────────────────────────────────────────
  head("Organisation");
  const orgId = cuid();
  await q(
    `INSERT INTO "Organization" (id, name, details, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $4)`,
    [orgId, "VendorBridge Corp", "A leading procurement and vendor management organisation.", now()]
  );
  log(`VendorBridge Corp (${orgId})`);

  // ── 2. Internal Users ────────────────────────────────────────────────────────
  head("Internal Users");

  const adminId   = cuid();
  const officerId = cuid();
  const managerId = cuid();

  await q(
    `INSERT INTO "User" (id, "firstName", "lastName", email, "passwordHash", phone, country, role, "isActive", "organizationId", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
    [adminId, "Aryan", "Mehta", "admin@vendorbridge.com",
     await hash("Admin@123"), "+91-9876543210", "India", "ADMIN", true, orgId, now()]
  );
  log("Admin:   Aryan Mehta  <admin@vendorbridge.com>  pw: Admin@123");

  await q(
    `INSERT INTO "User" (id, "firstName", "lastName", email, "passwordHash", phone, country, role, "isActive", "organizationId", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
    [officerId, "Priya", "Sharma", "officer@vendorbridge.com",
     await hash("Officer@123"), "+91-9812345678", "India", "PROCUREMENT_OFFICER", true, orgId, now()]
  );
  log("Officer: Priya Sharma <officer@vendorbridge.com> pw: Officer@123");

  await q(
    `INSERT INTO "User" (id, "firstName", "lastName", email, "passwordHash", phone, country, role, "isActive", "organizationId", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
    [managerId, "Rahul", "Verma", "manager@vendorbridge.com",
     await hash("Manager@123"), "+91-9900112233", "India", "MANAGER_APPROVER", true, orgId, now()]
  );
  log("Manager: Rahul Verma  <manager@vendorbridge.com> pw: Manager@123");

  // ── 3. Vendor Categories ─────────────────────────────────────────────────────
  head("Vendor Categories");

  const catIds = {};
  const catDefs = [
    { name: "IT & Technology",     description: "Hardware, software, networking, and cloud services" },
    { name: "Office Supplies",     description: "Stationery, furniture, cleaning, and pantry items" },
    { name: "Construction",        description: "Civil works, contractors, and building materials" },
    { name: "Printing & Media",    description: "Marketing collateral, packaging, and large-format printing" },
    { name: "Logistics & Freight", description: "Courier, freight forwarding, and warehousing" },
  ];

  for (const c of catDefs) {
    const id = cuid();
    catIds[c.name] = id;
    await q(
      `INSERT INTO "VendorCategory" (id, name, description, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$4)`,
      [id, c.name, c.description, now()]
    );
    log(c.name);
  }

  // ── 4. Vendors (User + Vendor row) ───────────────────────────────────────────
  head("Vendors");

  const vendorDefs = [
    {
      email: "vendor@technova.com", firstName: "Kiran",  lastName: "Desai",    phone: "+91-9876501234",
      companyName: "TechNova Solutions Pvt Ltd", contactName: "Kiran Desai",
      gstNumber: "27ABCDE1234F1Z5", address: "Plot 12, MIDC", city: "Pune",
      state: "Maharashtra", postalCode: "411018", category: "IT & Technology",
      notes: "Preferred IT vendor with 5+ years relationship",
    },
    {
      email: "vendor@officeedge.com", firstName: "Sunita", lastName: "Pillai",   phone: "+91-8800223344",
      companyName: "OfficeEdge Supplies Ltd", contactName: "Sunita Pillai",
      gstNumber: "29XYZA5678B2Z1", address: "14 MG Road", city: "Bengaluru",
      state: "Karnataka", postalCode: "560001", category: "Office Supplies",
      notes: "ISO-certified office supplies distributor",
    },
    {
      email: "vendor@buildright.com", firstName: "Vikram", lastName: "Rathod",   phone: "+91-9955667788",
      companyName: "BuildRight Contractors", contactName: "Vikram Rathod",
      gstNumber: "24UVWX1111C3Z9", address: "Sector 7, Industrial Area", city: "Surat",
      state: "Gujarat", postalCode: "395010", category: "Construction",
      notes: "Civil and structural works specialist",
    },
    {
      email: "vendor@printpro.com", firstName: "Anita",  lastName: "Krishnan", phone: "+91-9811001122",
      companyName: "PrintPro Media Works", contactName: "Anita Krishnan",
      gstNumber: "33MNOP2222D4Z8", address: "T Nagar", city: "Chennai",
      state: "Tamil Nadu", postalCode: "600017", category: "Printing & Media",
      notes: "Full-service print shop for marketing and events",
    },
    {
      email: "vendor@logitrack.com", firstName: "Deepak", lastName: "Nair",     phone: "+91-9700334455",
      companyName: "LogiTrack Freight Services", contactName: "Deepak Nair",
      gstNumber: "32QRST3333E5Z7", address: "Cochin Port Trust Area", city: "Kochi",
      state: "Kerala", postalCode: "682009", category: "Logistics & Freight",
      notes: "Pan-India freight and last-mile delivery",
    },
  ];

  const vendorPw = await hash("Vendor@123");

  for (const def of vendorDefs) {
    const userId   = cuid();
    const vendorId = cuid();

    await q(
      `INSERT INTO "User" (id, "firstName", "lastName", email, "passwordHash", phone, country, role, "isActive", "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
      [userId, def.firstName, def.lastName, def.email, vendorPw,
       def.phone, "India", "VENDOR", true, orgId, now()]
    );

    await q(
      `INSERT INTO "Vendor" (id, "companyName", "gstNumber", "contactName", "contactEmail", "contactPhone",
        address, city, state, country, "postalCode", status, rating, "isActive", notes,
        "userId", "organizationId", "categoryId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$19)`,
      [vendorId, def.companyName, def.gstNumber, def.contactName, def.email, def.phone,
       def.address, def.city, def.state, "India", def.postalCode,
       "ACTIVE", 4.5, true, def.notes,
       userId, orgId, catIds[def.category], now()]
    );

    log(`${def.companyName.padEnd(34)} <${def.email}>`);
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  banner("Prisma seed complete!");
  console.log(`
  Users & vendors created with known passwords.

  NEXT STEPS:
  ─────────────────────────────────────────────────
  1.  npm run dev                      (keep terminal open)
  2.  node scripts/seed-workflow.mjs   (new terminal)
  ─────────────────────────────────────────────────
`);
}

main()
  .then(() => pool.end())
  .catch(async (e) => {
    console.error("\n  ✗ Seed failed:", e.message ?? e);
    await pool.end();
    process.exit(1);
  });
