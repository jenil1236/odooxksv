/**
 * VendorBridge — Workflow Seeder (API-based)
 * ═══════════════════════════════════════════
 * Drives the full procurement cycle via live HTTP calls.
 * Prerequisite: `prisma/seed.ts` must have run first (users & vendors exist).
 *
 * Usage:
 *   1. npm run dev           (terminal 1 — keep running)
 *   2. node scripts/seed-workflow.mjs   (terminal 2)
 *
 * Scenarios covered:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  RFQ                      │ Final State                                │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  Laptops & Workstations   │ PO SENT   · Invoice PAID                   │
 * │  Annual Office Supplies   │ PO SENT   · Invoice ISSUED (outstanding)   │
 * │  Canteen Renovation       │ PO FULFILLED · Invoice PAID                │
 * │  Freight Q3               │ PO SENT   · Invoice ISSUED (outstanding)   │
 * │  Printing & Brochures     │ Approval REJECTED — no PO                  │
 * │  IT Helpdesk AMC          │ PUBLISHED — no quotation yet (open invite) │
 * │  Housekeeping Contract    │ DRAFT — never published                    │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ─── Cookie jar ───────────────────────────────────────────────────────────────
const jar = {};

const log    = (msg)  => console.log(`    ✓ ${msg}`);
const warn   = (msg)  => console.warn(`    ⚠ ${msg}`);
const head   = (msg)  => console.log(`\n  ── ${msg}`);
const banner = (msg)  => console.log(`\n${"═".repeat(60)}\n  ${msg}\n${"═".repeat(60)}`);

async function api(method, path, body, email) {
  const headers = { "Content-Type": "application/json" };
  if (email && jar[email]) headers["Cookie"] = jar[email];

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const sc = res.headers.get("set-cookie");
  if (sc && email) jar[email] = sc.split(";")[0];

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (res.status >= 400) {
    throw new Error(`[${method} ${path}] HTTP ${res.status} — ${JSON.stringify(data)}`);
  }
  return data;
}

const GET   = (p, e)    => api("GET",   p, null, e);
const POST  = (p, b, e) => api("POST",  p, b, e);
const PATCH = (p, b, e) => api("PATCH", p, b, e);

async function login(email, password) {
  await POST("/api/auth/login", { email, password }, email);
  log(`Session started → ${email}`);
}

// ─── Step 1: Login all actors ─────────────────────────────────────────────────
async function loginAll() {
  banner("Step 1 — Authenticate all actors");
  await login("officer@vendorbridge.com", "Officer@123");
  await login("manager@vendorbridge.com", "Manager@123");
  await login("vendor@technova.com",      "Vendor@123");
  await login("vendor@officeedge.com",    "Vendor@123");
  await login("vendor@buildright.com",    "Vendor@123");
  await login("vendor@printpro.com",      "Vendor@123");
  await login("vendor@logitrack.com",     "Vendor@123");
}

// ─── Step 2: Resolve vendor DB IDs ───────────────────────────────────────────
async function getVendorMap() {
  const r = await GET(`/api/admin/vendors?t=${Date.now()}`, "officer@vendorbridge.com");
  const map = {};
  for (const v of r.vendors) map[v.contactEmail] = v.id;
  return map;
}

// ─── Step 3: Create RFQs ─────────────────────────────────────────────────────
async function createRFQs(vendorMap) {
  banner("Step 2 — Create RFQs");

  const d30 = new Date(Date.now() + 30 * 864e5).toISOString();
  const d45 = new Date(Date.now() + 45 * 864e5).toISOString();
  const d60 = new Date(Date.now() + 60 * 864e5).toISOString();
  const d15 = new Date(Date.now() + 15 * 864e5).toISOString();

  const rfqs = {};

  // ── Laptops (full cycle → PAID)
  rfqs.laptops = (await POST("/api/rfqs", {
    title:       "Laptop & Workstation Procurement – Q3 2025",
    category:    "IT & Technology",
    description: "Procurement of 50 laptops and 10 workstations for engineering and finance teams. Mandatory 3-year onsite warranty. Pre-installed Windows 11 Pro.",
    deadline:    d30,
    vendorIds:   [vendorMap["vendor@technova.com"]],
    items: [
      { itemName: "Dell Latitude 5530 Laptop",  quantity: 50, unit: "units",   description: "i7, 16GB RAM, 512GB SSD, Win11 Pro" },
      { itemName: "HP Z4 G9 Workstation",       quantity: 10, unit: "units",   description: "Xeon W, 32GB RAM, 2TB NVMe, NVIDIA T600" },
      { itemName: "3-Year Onsite Warranty",     quantity: 60, unit: "service", description: "Mandatory for all devices" },
    ],
  }, "officer@vendorbridge.com")).rfq;
  log(`Created: ${rfqs.laptops.title}`);

  // ── Office Supplies (full cycle → ISSUED invoice)
  rfqs.office = (await POST("/api/rfqs", {
    title:       "Annual Office Supplies – FY 2025-26",
    category:    "Office Supplies",
    description: "Annual procurement of stationery, pantry supplies, and office consumables for all three locations.",
    deadline:    d30,
    vendorIds:   [vendorMap["vendor@officeedge.com"]],
    items: [
      { itemName: "A4 Paper Ream (500 sheets)",    quantity: 500, unit: "reams", description: "80 GSM white copier paper" },
      { itemName: "Ball-Point Pens (Box of 10)",   quantity: 200, unit: "boxes", description: "Blue ink, medium tip" },
      { itemName: "Whiteboard Marker Set (4-col)", quantity:  50, unit: "sets",  description: "With eraser" },
      { itemName: "Filing Cabinet – 4 Drawer",    quantity:  10, unit: "units",  description: "Steel, lockable" },
    ],
  }, "officer@vendorbridge.com")).rfq;
  log(`Created: ${rfqs.office.title}`);

  // ── Canteen Renovation (full cycle → PO FULFILLED + invoice PAID)
  rfqs.canteen = (await POST("/api/rfqs", {
    title:       "HQ Canteen Renovation Works",
    category:    "Construction",
    description: "Complete renovation of the headquarter cafeteria: tile flooring, false ceiling, electrical, plumbing, and painting.",
    deadline:    d60,
    vendorIds:   [vendorMap["vendor@buildright.com"]],
    items: [
      { itemName: "Tile Flooring (600×600 mm)", quantity: 1200, unit: "sq ft",    description: "Anti-skid ceramic" },
      { itemName: "False Ceiling – Armstrong",  quantity:  800, unit: "sq ft",    description: "Grid & panel, white" },
      { itemName: "Electrical Fit-out",         quantity:    1, unit: "lump sum", description: "Complete electrical scope" },
      { itemName: "Painting – 2 coats",         quantity: 3000, unit: "sq ft",    description: "Asian Paints Apcolite Premium" },
    ],
  }, "officer@vendorbridge.com")).rfq;
  log(`Created: ${rfqs.canteen.title}`);

  // ── Printing (approval REJECTED → no PO)
  rfqs.printing = (await POST("/api/rfqs", {
    title:       "Annual Report & Brochure Printing",
    category:    "Printing & Media",
    description: "Annual report (500 copies), product brochures (2000 copies), and pull-up banners (50 units).",
    deadline:    d15,
    vendorIds:   [vendorMap["vendor@printpro.com"]],
    items: [
      { itemName: "Annual Report – A4, 64pp Gloss",      quantity:  500, unit: "copies", description: "Perfect bound, gloss laminate" },
      { itemName: "Tri-fold Product Brochure – A4",      quantity: 2000, unit: "copies", description: "130 GSM art paper" },
      { itemName: "Pull-Up Banner 85×200 cm with Stand", quantity:   50, unit: "units",  description: "Premium vinyl" },
    ],
  }, "officer@vendorbridge.com")).rfq;
  log(`Created: ${rfqs.printing.title}`);

  // ── Freight (full cycle → PO SENT, invoice ISSUED)
  rfqs.freight = (await POST("/api/rfqs", {
    title:       "Q3 Inbound Freight – Warehouse Operations",
    category:    "Logistics & Freight",
    description: "Inbound FTL freight from supplier hubs in Surat and Delhi to central warehouse in Pune. Monthly contract for Q3 FY25.",
    deadline:    d45,
    vendorIds:   [vendorMap["vendor@logitrack.com"]],
    items: [
      { itemName: "FTL Trip – Surat to Pune",  quantity: 12, unit: "trips",    description: "20MT capacity, FTL" },
      { itemName: "FTL Trip – Delhi to Pune",  quantity:  8, unit: "trips",    description: "20MT capacity, FTL" },
      { itemName: "Dunnage & Packing",         quantity:  1, unit: "lump sum", description: "Per consignment" },
    ],
  }, "officer@vendorbridge.com")).rfq;
  log(`Created: ${rfqs.freight.title}`);

  // ── IT Helpdesk AMC (PUBLISHED, no quote → open invite state)
  rfqs.amc = (await POST("/api/rfqs", {
    title:       "IT Helpdesk & AMC Services – FY 2025-26",
    category:    "IT & Technology",
    description: "Annual Maintenance Contract for IT helpdesk (L1/L2), server room upkeep, and 24×7 network monitoring.",
    deadline:    d60,
    vendorIds:   [vendorMap["vendor@technova.com"]],
    items: [
      { itemName: "L1/L2 Helpdesk Support",  quantity: 12, unit: "months",   description: "On-site, 8×5" },
      { itemName: "Server Room Maintenance", quantity:  4, unit: "quarters", description: "Preventive, quarterly" },
      { itemName: "24×7 Network Monitoring", quantity: 12, unit: "months",   description: "NOC monitoring" },
    ],
  }, "officer@vendorbridge.com")).rfq;
  log(`Created: ${rfqs.amc.title}`);

  // ── Housekeeping (DRAFT — never published)
  rfqs.cleaning = (await POST("/api/rfqs", {
    title:       "Housekeeping & Cleaning Contract – HQ",
    category:    "Office Supplies",
    description: "Annual housekeeping for the 6-floor HQ building with daily, weekly, and deep-clean schedules.",
    deadline:    d60,
    vendorIds:   [vendorMap["vendor@officeedge.com"]],
    items: [
      { itemName: "Daily Housekeeping",  quantity: 365, unit: "days",     description: "8 staff, 8 hrs" },
      { itemName: "Weekly Deep Clean",   quantity:  52, unit: "sessions", description: "Full floor" },
    ],
  }, "officer@vendorbridge.com")).rfq;
  log(`Created (DRAFT – not published): ${rfqs.cleaning.title}`);

  return rfqs;
}

// ─── Step 4: Publish RFQs ─────────────────────────────────────────────────────
async function publishRFQs(rfqs) {
  banner("Step 3 — Publish RFQs");
  for (const key of ["laptops", "office", "canteen", "printing", "freight", "amc"]) {
    await POST(`/api/rfqs/${rfqs[key].id}/publish`, {}, "officer@vendorbridge.com");
    log(`Published: ${rfqs[key].title}`);
  }
  // cleaning stays DRAFT
  log(`Skipped (DRAFT): ${rfqs.cleaning.title}`);
}

// ─── Step 5: Submit Quotations ────────────────────────────────────────────────
async function submitQuotations(rfqs) {
  banner("Step 4 — Vendors Submit Quotations");

  async function getItems(rfqId, vendorEmail) {
    const r = await GET(`/api/vendor/rfqs/${rfqId}`, vendorEmail);
    return r.rfq.items;
  }

  // Laptops — TechNova
  {
    const items = await getItems(rfqs.laptops.id, "vendor@technova.com");
    await POST(`/api/vendor/rfqs/${rfqs.laptops.id}/quotation`, {
      notes:        "All devices pre-installed and configured. Bulk discount applied.",
      paymentTerms: "50% advance, 50% on delivery",
      gstPercent:   18,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 87500,  quantity: 50, deliveryDays: 14 },
        { rfqItemId: items[1].id, unitPrice: 195000, quantity: 10, deliveryDays: 21 },
        { rfqItemId: items[2].id, unitPrice: 3500,   quantity: 60, deliveryDays:  0 },
      ],
    }, "vendor@technova.com");
    log("TechNova → Laptops & Workstations");
  }

  // Office Supplies — OfficeEdge
  {
    const items = await getItems(rfqs.office.id, "vendor@officeedge.com");
    await POST(`/api/vendor/rfqs/${rfqs.office.id}/quotation`, {
      notes:        "Delivery within 7 working days. Minimum order value applies.",
      paymentTerms: "Net 30 days",
      gstPercent:   12,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 420,  quantity: 500, deliveryDays:  7 },
        { rfqItemId: items[1].id, unitPrice: 95,   quantity: 200, deliveryDays:  7 },
        { rfqItemId: items[2].id, unitPrice: 250,  quantity:  50, deliveryDays:  7 },
        { rfqItemId: items[3].id, unitPrice: 8500, quantity:  10, deliveryDays: 14 },
      ],
    }, "vendor@officeedge.com");
    log("OfficeEdge → Annual Office Supplies");
  }

  // Canteen Renovation — BuildRight
  {
    const items = await getItems(rfqs.canteen.id, "vendor@buildright.com");
    await POST(`/api/vendor/rfqs/${rfqs.canteen.id}/quotation`, {
      notes:        "Includes labour, materials, and waste disposal. 45-day completion.",
      paymentTerms: "30% mobilisation, 40% mid-way, 30% on completion",
      gstPercent:   18,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 85,     quantity: 1200, deliveryDays: 45 },
        { rfqItemId: items[1].id, unitPrice: 95,     quantity:  800, deliveryDays: 45 },
        { rfqItemId: items[2].id, unitPrice: 250000, quantity:    1, deliveryDays: 45 },
        { rfqItemId: items[3].id, unitPrice: 18,     quantity: 3000, deliveryDays: 45 },
      ],
    }, "vendor@buildright.com");
    log("BuildRight → Canteen Renovation");
  }

  // Printing — PrintPro
  {
    const items = await getItems(rfqs.printing.id, "vendor@printpro.com");
    await POST(`/api/vendor/rfqs/${rfqs.printing.id}/quotation`, {
      notes:        "Digital proofs before print. Delivery in 12 working days post approval.",
      paymentTerms: "100% advance on confirmation",
      gstPercent:   18,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 320, quantity:  500, deliveryDays: 12 },
        { rfqItemId: items[1].id, unitPrice:  28, quantity: 2000, deliveryDays: 10 },
        { rfqItemId: items[2].id, unitPrice: 850, quantity:   50, deliveryDays:  8 },
      ],
    }, "vendor@printpro.com");
    log("PrintPro → Annual Report & Brochures");
  }

  // Freight — LogiTrack
  {
    const items = await getItems(rfqs.freight.id, "vendor@logitrack.com");
    await POST(`/api/vendor/rfqs/${rfqs.freight.id}/quotation`, {
      notes:        "Real-time GPS tracking. Insurance up to ₹25L per consignment.",
      paymentTerms: "Monthly billing, Net 15 days",
      gstPercent:   5,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 28000, quantity: 12, deliveryDays: 2 },
        { rfqItemId: items[1].id, unitPrice: 45000, quantity:  8, deliveryDays: 3 },
        { rfqItemId: items[2].id, unitPrice:  2500, quantity:  1, deliveryDays: 0 },
      ],
    }, "vendor@logitrack.com");
    log("LogiTrack → Inbound Freight Q3");
  }

  // AMC — no quotation submitted
  warn(`TechNova skipped quoting on IT Helpdesk AMC → shows 'open invite' state`);
}

// ─── Step 6: Select Winning Quotations ────────────────────────────────────────
async function selectWinners(rfqs) {
  banner("Step 5 — Select Winning Quotations");

  for (const key of ["laptops", "office", "canteen", "printing", "freight"]) {
    const rfq = rfqs[key];
    const r = await GET(`/api/rfqs/${rfq.id}/comparison`, "officer@vendorbridge.com");
    const winner = r.quotations?.find(q => q.status === "SUBMITTED" || q.status === "REVISED");
    if (!winner) { warn(`No submitted quote found for: ${rfq.title}`); continue; }
    await POST(`/api/quotations/${winner.id}/select`, {}, "officer@vendorbridge.com");
    log(`Winner selected — ${rfq.title} (₹${winner.grandTotal?.toLocaleString("en-IN") ?? "?"})`);
  }
}

// ─── Step 7: Request Approvals ────────────────────────────────────────────────
async function requestApprovals(rfqs) {
  banner("Step 6 — Request Manager Approvals");

  for (const key of ["laptops", "office", "canteen", "printing", "freight"]) {
    const rfq = rfqs[key];
    await POST(`/api/rfqs/${rfq.id}/approval-request`, {}, "officer@vendorbridge.com");
    log(`Approval requested — ${rfq.title}`);
  }
}

// ─── Step 8: Manager Approves / Rejects ───────────────────────────────────────
async function processApprovals() {
  banner("Step 7 — Manager Reviews Approvals");

  const r = await GET("/api/approvals", "manager@vendorbridge.com");
  if (!r.approvals?.length) { warn("No approvals found"); return; }

  for (const approval of r.approvals) {
    const title = approval.rfq?.title ?? approval.rfqId ?? "Unknown";

    if (title.includes("Printing") || title.includes("Brochure")) {
      await POST(`/api/approvals/${approval.id}/reject`, {
        remarks: "Budget overrun — unit cost exceeds approved marketing print budget. Re-negotiate with vendor and resubmit.",
      }, "manager@vendorbridge.com");
      log(`REJECTED — ${title}`);
    } else {
      await POST(`/api/approvals/${approval.id}/approve`, {}, "manager@vendorbridge.com");
      log(`APPROVED — ${title}`);
    }
  }
}

// ─── Step 9: Generate Purchase Orders ────────────────────────────────────────
async function generatePOs(rfqs) {
  banner("Step 8 — Generate Purchase Orders");

  const poIds = {};
  for (const key of ["laptops", "office", "canteen", "freight"]) {
    const rfq = rfqs[key];
    const r = await POST(`/api/rfqs/${rfq.id}/purchase-order`, {}, "officer@vendorbridge.com");
    poIds[key] = r.purchaseOrder.id;
    log(`PO generated — ${r.purchaseOrder.poNumber} (${rfq.title})`);
  }
  return poIds;
}

// ─── Step 10: Generate Invoices ───────────────────────────────────────────────
async function generateInvoices(poIds) {
  banner("Step 9 — Generate Invoices");

  const invIds = {};
  for (const [key, poId] of Object.entries(poIds)) {
    const r = await POST(`/api/purchase-orders/${poId}/invoice`, {}, "officer@vendorbridge.com");
    invIds[key] = r.invoice.id;
    log(`Invoice — ${r.invoice.invoiceNumber} (grandTotal ₹${r.invoice.grandTotal?.toLocaleString("en-IN")})`);
  }
  return invIds;
}

// ─── Step 11: Update Final Statuses ───────────────────────────────────────────
async function updateStatuses(poIds, invIds) {
  banner("Step 10 — Set Final Statuses");

  // Canteen PO → FULFILLED
  await PATCH(`/api/purchase-orders/${poIds.canteen}/status`, { status: "FULFILLED" }, "officer@vendorbridge.com");
  log("PO → FULFILLED (Canteen Renovation)");

  // Laptops Invoice → PAID
  await PATCH(`/api/invoices/${invIds.laptops}/paid`, {}, "officer@vendorbridge.com");
  log("Invoice → PAID (Laptops & Workstations)");

  // Canteen Invoice → PAID
  await PATCH(`/api/invoices/${invIds.canteen}/paid`, {}, "officer@vendorbridge.com");
  log("Invoice → PAID (Canteen Renovation)");

  warn("Office Supplies invoice stays ISSUED — shows as outstanding payable");
  warn("Freight invoice stays ISSUED — shows as outstanding payable");
}

// ─── Summary ──────────────────────────────────────────────────────────────────
function printSummary() {
  console.log(`
${"═".repeat(60)}
  ✅  WORKFLOW SEED COMPLETE
${"═".repeat(60)}

  LOGIN CREDENTIALS
  ─────────────────────────────────────────────────────────
  Role                    Email                         Password
  ─────────────────────────────────────────────────────────
  Admin                   admin@vendorbridge.com         Admin@123
  Procurement Officer     officer@vendorbridge.com       Officer@123
  Manager / Approver      manager@vendorbridge.com       Manager@123
  Vendor (IT)             vendor@technova.com            Vendor@123
  Vendor (Office)         vendor@officeedge.com          Vendor@123
  Vendor (Construction)   vendor@buildright.com          Vendor@123
  Vendor (Print)          vendor@printpro.com            Vendor@123
  Vendor (Logistics)      vendor@logitrack.com           Vendor@123
  ─────────────────────────────────────────────────────────

  WORKFLOW STATES
  ─────────────────────────────────────────────────────────
  Laptops & Workstations  →  PO SENT       ·  Invoice PAID ✅
  Annual Office Supplies  →  PO SENT       ·  Invoice ISSUED ⏳
  HQ Canteen Renovation   →  PO FULFILLED  ·  Invoice PAID ✅
  Inbound Freight Q3      →  PO SENT       ·  Invoice ISSUED ⏳
  Printing & Brochures    →  ❌ Approval REJECTED (no PO)
  IT Helpdesk AMC         →  📋 PUBLISHED  ·  No quotation (open invite)
  Housekeeping Contract   →  📝 DRAFT      ·  Not published
  ─────────────────────────────────────────────────────────

  Open http://localhost:3000 and log in to explore the system.
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║       VendorBridge — Workflow Seeder (API-based)         ║
║  Target: ${BASE_URL.padEnd(47)}║
╚══════════════════════════════════════════════════════════╝`);

  try {
    await loginAll();
    const vendorMap = await getVendorMap();
    const rfqs      = await createRFQs(vendorMap);
    await publishRFQs(rfqs);
    await submitQuotations(rfqs);
    await selectWinners(rfqs);
    await requestApprovals(rfqs);
    await processApprovals();
    const poIds  = await generatePOs(rfqs);
    const invIds = await generateInvoices(poIds);
    await updateStatuses(poIds, invIds);
    printSummary();
  } catch (err) {
    console.error("\n  ✗ WORKFLOW SEED FAILED:", err.message);
    process.exit(1);
  }
}

main();
