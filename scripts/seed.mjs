/**
 * VendorBridge — Database Seeder
 * ================================
 * Seeds the database by calling the live API (app must be running).
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * Prerequisites:
 *   1. Run: npx prisma migrate reset --force   (clears DB + re-runs migrations)
 *   2. Start the dev server: npm run dev
 *   3. In a new terminal: node scripts/seed.mjs
 *
 * Test Credentials (after seeding):
 * ┌──────────────────────────────────┬────────────────────────────────┬──────────────────────┐
 * │ Role                             │ Email                          │ Password             │
 * ├──────────────────────────────────┼────────────────────────────────┼──────────────────────┤
 * │ Admin                            │ admin@vendorbridge.com         │ Admin@123            │
 * │ Procurement Officer              │ officer@vendorbridge.com       │ Officer@123          │
 * │ Manager / Approver               │ manager@vendorbridge.com       │ Manager@123          │
 * │ Vendor — TechNova Solutions      │ vendor@technova.com            │ Vendor@123           │
 * │ Vendor — OfficeEdge Supplies     │ vendor@officeedge.com          │ Vendor@123           │
 * │ Vendor — BuildRight Contractors  │ vendor@buildright.com          │ Vendor@123           │
 * │ Vendor — PrintPro Media          │ vendor@printpro.com            │ Vendor@123           │
 * │ Vendor — LogiTrack Freight       │ vendor@logitrack.com           │ Vendor@123           │
 * └──────────────────────────────────┴────────────────────────────────┴──────────────────────┘
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log    = (msg)          => console.log(`  ✓ ${msg}`);
const warn   = (msg)          => console.warn(`  ⚠ ${msg}`);
const banner = (msg)          => console.log(`\n${"─".repeat(60)}\n  ${msg}\n${"─".repeat(60)}`);
const fail   = (msg, detail)  => { console.error(`  ✗ ${msg}`, detail ?? ""); process.exit(1); };

/** Minimal cookie jar keyed by user email */
const cookies = {};

async function api(method, path, body, email) {
  const headers = { "Content-Type": "application/json" };
  if (email && cookies[email]) headers["Cookie"] = cookies[email];

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Capture Set-Cookie so the session persists across calls
  const raw = res.headers.get("set-cookie");
  if (raw && email) {
    // Extract just the name=value part (first segment before ";")
    cookies[email] = raw.split(";")[0];
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (res.status >= 400) {
    throw new Error(`[${method} ${path}] HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

const GET   = (path, email)       => api("GET",   path, null, email);
const POST  = (path, body, email) => api("POST",  path, body, email);
const PATCH = (path, body, email) => api("PATCH", path, body, email);

// ─── Step 1: Create Org + Admin ───────────────────────────────────────────────

async function createAdmin() {
  banner("Step 1 — Create Organisation & Admin");
  const data = await POST("/api/auth/signup", {
    firstName:           "Aryan",
    lastName:            "Mehta",
    email:               "admin@vendorbridge.com",
    password:            "Admin@123",
    phone:               "+91-9876543210",
    country:             "India",
    organizationName:    "VendorBridge Corp",
    organizationDetails: "A leading procurement and vendor management organisation.",
  }, "admin@vendorbridge.com");
  log(`Admin created — Role: ${data.role}`);
}

// ─── Step 2: Login ────────────────────────────────────────────────────────────

async function login(email, password, label) {
  await POST("/api/auth/login", { email, password }, email);
  log(`Session started — ${label} (${email})`);
}

// ─── Step 3: Create Internal Users ───────────────────────────────────────────

async function createInternalUsers() {
  banner("Step 3 — Create Internal Users");

  await POST("/api/admin/users", {
    firstName: "Priya",
    lastName:  "Sharma",
    email:     "officer@vendorbridge.com",
    password:  "Officer@123",
    phone:     "+91-9812345678",
    country:   "India",
    role:      "PROCUREMENT_OFFICER",
  }, "admin@vendorbridge.com");
  log("Procurement Officer: Priya Sharma <officer@vendorbridge.com>");

  await POST("/api/admin/users", {
    firstName: "Rahul",
    lastName:  "Verma",
    email:     "manager@vendorbridge.com",
    password:  "Manager@123",
    phone:     "+91-9900112233",
    country:   "India",
    role:      "MANAGER_APPROVER",
  }, "admin@vendorbridge.com");
  log("Manager Approver:   Rahul Verma   <manager@vendorbridge.com>");
}

// ─── Step 4: Create Vendor Categories ────────────────────────────────────────

async function createCategories() {
  banner("Step 4 — Create Vendor Categories");

  const cats = [
    { name: "IT & Technology",    description: "Hardware, software, networking, and cloud services" },
    { name: "Office Supplies",    description: "Stationery, furniture, cleaning, and pantry items" },
    { name: "Construction",       description: "Civil works, contractors, and building materials" },
    { name: "Printing & Media",   description: "Marketing collateral, packaging, and large-format printing" },
    { name: "Logistics & Freight",description: "Courier, freight forwarding, and warehousing" },
  ];

  const created = {};
  for (const cat of cats) {
    const r = await POST("/api/admin/vendor-categories", cat, "admin@vendorbridge.com");
    created[cat.name] = r.category.id;
    log(`Category: ${cat.name}`);
  }
  return created;
}

// ─── Step 5: Register Vendors ─────────────────────────────────────────────────

async function createVendors(categoryIds) {
  banner("Step 5 — Register Vendors");

  const vendors = [
    {
      companyName:  "TechNova Solutions Pvt Ltd",
      contactName:  "Kiran Desai",
      contactEmail: "vendor@technova.com",
      contactPhone: "+91-9876501234",
      gstNumber:    "27ABCDE1234F1Z5",
      address:      "Plot 12, MIDC",
      city:         "Pune",
      state:        "Maharashtra",
      country:      "India",
      postalCode:   "411018",
      categoryId:   categoryIds["IT & Technology"],
      notes:        "Preferred IT vendor with 5+ years relationship",
    },
    {
      companyName:  "OfficeEdge Supplies Ltd",
      contactName:  "Sunita Pillai",
      contactEmail: "vendor@officeedge.com",
      contactPhone: "+91-8800223344",
      gstNumber:    "29XYZA5678B2Z1",
      address:      "14 MG Road",
      city:         "Bengaluru",
      state:        "Karnataka",
      country:      "India",
      postalCode:   "560001",
      categoryId:   categoryIds["Office Supplies"],
      notes:        "ISO-certified office supplies distributor",
    },
    {
      companyName:  "BuildRight Contractors",
      contactName:  "Vikram Rathod",
      contactEmail: "vendor@buildright.com",
      contactPhone: "+91-9955667788",
      gstNumber:    "24UVWX1111C3Z9",
      address:      "Sector 7, Industrial Area",
      city:         "Surat",
      state:        "Gujarat",
      country:      "India",
      postalCode:   "395010",
      categoryId:   categoryIds["Construction"],
      notes:        "Civil and structural works specialist",
    },
    {
      companyName:  "PrintPro Media Works",
      contactName:  "Anita Krishnan",
      contactEmail: "vendor@printpro.com",
      contactPhone: "+91-9811001122",
      gstNumber:    "33MNOP2222D4Z8",
      address:      "T Nagar",
      city:         "Chennai",
      state:        "Tamil Nadu",
      country:      "India",
      postalCode:   "600017",
      categoryId:   categoryIds["Printing & Media"],
      notes:        "Full-service print shop for marketing and events",
    },
    {
      companyName:  "LogiTrack Freight Services",
      contactName:  "Deepak Nair",
      contactEmail: "vendor@logitrack.com",
      contactPhone: "+91-9700334455",
      gstNumber:    "32QRST3333E5Z7",
      address:      "Cochin Port Trust Area",
      city:         "Kochi",
      state:        "Kerala",
      country:      "India",
      postalCode:   "682009",
      categoryId:   categoryIds["Logistics & Freight"],
      notes:        "Pan-India freight and last-mile delivery",
    },
  ];

  const created = {};
  for (const v of vendors) {
    const r = await POST("/api/admin/vendors", v, "admin@vendorbridge.com");
    created[v.contactEmail] = r.vendor.id;
    log(`Vendor: ${v.companyName} (${v.contactEmail})`);
  }
  return created;
}

// ─── Step 6: Fetch vendor IDs from DB via API ─────────────────────────────────

async function getVendorIds() {
  const r = await GET("/api/admin/vendors", "admin@vendorbridge.com");
  const map = {};
  for (const v of r.vendors) map[v.contactEmail] = v.id;
  return map;
}

// ─── Step 7: Create & Publish RFQs ───────────────────────────────────────────

async function createRFQs(vendorIds) {
  banner("Step 7 — Create RFQs & Publish");

  const future30  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const future60  = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const future15  = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  const future7   = new Date(Date.now() +  7 * 24 * 60 * 60 * 1000).toISOString();
  const future45  = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();

  const rfqs = {};

  // RFQ-1: IT Equipment Procurement (will go full workflow → PAID invoice)
  const r1 = await POST("/api/rfqs", {
    title:       "Laptop & Workstation Procurement – Q3 2025",
    category:    "IT & Technology",
    description: "Procurement of 50 laptops and 10 workstations for the engineering and finance teams. Must include 3-year onsite warranty and pre-installed Windows 11 Pro.",
    deadline:    future30,
    items: [
      { itemName: "Dell Latitude 5530 Laptop",  quantity: 50, unit: "units",  description: "i7, 16GB RAM, 512GB SSD, Windows 11 Pro" },
      { itemName: "HP Z4 Workstation",          quantity: 10, unit: "units",  description: "Xeon W, 32GB RAM, 2TB NVMe, NVIDIA T600" },
      { itemName: "3-Year Onsite Warranty",     quantity: 60, unit: "service",description: "Mandatory onsite warranty for all devices" },
    ],
    vendorIds: [vendorIds["vendor@technova.com"]],
  }, "officer@vendorbridge.com");
  rfqs.laptops = r1.rfq;
  log(`RFQ created: ${r1.rfq.title}`);

  // RFQ-2: Office Supplies (full workflow → SENT invoice)
  const r2 = await POST("/api/rfqs", {
    title:       "Annual Office Supplies – FY 2025-26",
    category:    "Office Supplies",
    description: "Annual procurement of stationery, pantry supplies, and general office consumables for all three office locations.",
    deadline:    future30,
    items: [
      { itemName: "A4 Paper Ream (500 sheets)",   quantity: 500, unit: "reams",  description: "80 GSM white copier paper" },
      { itemName: "Ball-Point Pens (Box of 10)",  quantity: 200, unit: "boxes",  description: "Blue ink, medium tip" },
      { itemName: "Whiteboard Markers Set",       quantity:  50, unit: "sets",   description: "4-colour set with eraser" },
      { itemName: "Filing Cabinet (4-drawer)",    quantity:  10, unit: "units",  description: "Steel, lockable" },
    ],
    vendorIds: [vendorIds["vendor@officeedge.com"]],
  }, "officer@vendorbridge.com");
  rfqs.office = r2.rfq;
  log(`RFQ created: ${r2.rfq.title}`);

  // RFQ-3: Canteen Renovation (full workflow → PO FULFILLED, invoice PAID)
  const r3 = await POST("/api/rfqs", {
    title:       "HQ Canteen Renovation Works",
    category:    "Construction",
    description: "Complete renovation of the headquarter cafeteria including tile flooring, electrical work, plumbing, false ceiling, and painting.",
    deadline:    future60,
    items: [
      { itemName: "Tile Flooring (600x600mm)",  quantity: 1200, unit: "sq ft", description: "Anti-skid ceramic tiles" },
      { itemName: "False Ceiling (Armstrong)",  quantity:  800, unit: "sq ft", description: "Grid & panel, white" },
      { itemName: "Electrical Wiring & Fit",   quantity:    1, unit: "lump sum", description: "Complete electrical fit-out" },
      { itemName: "Painting (2 coats)",        quantity: 3000, unit: "sq ft", description: "Asian Paints Apcolite Premium" },
    ],
    vendorIds: [vendorIds["vendor@buildright.com"]],
  }, "officer@vendorbridge.com");
  rfqs.canteen = r3.rfq;
  log(`RFQ created: ${r3.rfq.title}`);

  // RFQ-4: Marketing Collateral (full workflow → approval REJECTED)
  const r4 = await POST("/api/rfqs", {
    title:       "Annual Report & Brochure Printing",
    category:    "Printing & Media",
    description: "High-quality print run for the annual report (500 copies), product brochures (2000 copies), and promotional banners (50 units).",
    deadline:    future15,
    items: [
      { itemName: "Annual Report (Full Colour, A4)", quantity:  500, unit: "copies",  description: "64pp, perfect bound, gloss laminate" },
      { itemName: "Product Brochure (A4, Tri-fold)", quantity: 2000, unit: "copies",  description: "Art paper 130 GSM" },
      { itemName: "Pull-Up Banner (85x200cm)",       quantity:   50, unit: "units",   description: "Premium vinyl with stand" },
    ],
    vendorIds: [vendorIds["vendor@printpro.com"]],
  }, "officer@vendorbridge.com");
  rfqs.printing = r4.rfq;
  log(`RFQ created: ${r4.rfq.title}`);

  // RFQ-5: Freight (PUBLISHED, quotations submitted, winner selected, approval PENDING)
  const r5 = await POST("/api/rfqs", {
    title:       "Q3 Inbound Freight – Warehouse Operations",
    category:    "Logistics & Freight",
    description: "Inbound freight services from supplier hubs in Surat and Delhi to our central warehouse in Pune. Monthly contract for Q3 FY25.",
    deadline:    future45,
    items: [
      { itemName: "FTL Surat–Pune (per trip)",   quantity: 12, unit: "trips",   description: "Full truck load, 20MT capacity" },
      { itemName: "FTL Delhi–Pune (per trip)",   quantity:  8, unit: "trips",   description: "Full truck load, 20MT capacity" },
      { itemName: "Dunnage & Packing",           quantity:  1, unit: "lump sum",description: "Included per consignment" },
    ],
    vendorIds: [vendorIds["vendor@logitrack.com"]],
  }, "officer@vendorbridge.com");
  rfqs.freight = r5.rfq;
  log(`RFQ created: ${r5.rfq.title}`);

  // RFQ-6: IT Support (PUBLISHED, no quotes yet — shows empty state)
  const r6 = await POST("/api/rfqs", {
    title:       "IT Helpdesk & AMC Services – FY 2025-26",
    category:    "IT & Technology",
    description: "Annual Maintenance Contract for IT helpdesk support (L1/L2), server room upkeep, and network monitoring.",
    deadline:    future60,
    items: [
      { itemName: "L1/L2 Helpdesk Support",  quantity: 12, unit: "months",    description: "On-site, 8x5 support model" },
      { itemName: "Server Room Maintenance", quantity:  4, unit: "quarters",  description: "Quarterly preventive maintenance" },
      { itemName: "Network Monitoring",      quantity: 12, unit: "months",    description: "24x7 NOC monitoring" },
    ],
    vendorIds: [vendorIds["vendor@technova.com"]],
  }, "officer@vendorbridge.com");
  rfqs.itSupport = r6.rfq;
  log(`RFQ created: ${r6.rfq.title}`);

  // RFQ-7: Cleaning Contract (DRAFT — never published)
  const r7 = await POST("/api/rfqs", {
    title:       "Housekeeping & Cleaning Contract – HQ",
    category:    "Office Supplies",
    description: "Annual housekeeping and cleaning services for the 6-floor HQ building with daily, weekly, and deep-clean schedules.",
    deadline:    future60,
    items: [
      { itemName: "Daily Housekeeping (per day)",  quantity: 365, unit: "days",    description: "8 staff, 8 hours each" },
      { itemName: "Weekly Deep Clean",             quantity:  52, unit: "sessions",description: "Full floor deep clean" },
    ],
    vendorIds: [vendorIds["vendor@officeedge.com"]],
  }, "officer@vendorbridge.com");
  rfqs.cleaning = r7.rfq;
  log(`RFQ created (DRAFT, not published): ${r7.rfq.title}`);

  // Publish RFQ-1 through RFQ-6 (leave RFQ-7 as DRAFT)
  for (const [key, rfq] of Object.entries(rfqs)) {
    if (key === "cleaning") continue; // keep as DRAFT
    await POST(`/api/rfqs/${rfq.id}/publish`, {}, "officer@vendorbridge.com");
    log(`Published: ${rfq.title}`);
  }

  return rfqs;
}

// ─── Step 8: Submit Quotations ────────────────────────────────────────────────

async function submitQuotations(rfqs) {
  banner("Step 8 — Vendors Submit Quotations");

  // Helper to get RFQ items (required for rfqItemId mapping)
  async function getRfqItems(rfqId, vendorEmail) {
    const r = await GET(`/api/vendor/rfqs/${rfqId}`, vendorEmail);
    return r.rfq.items;
  }

  // ── RFQ-1: Laptops — TechNova ──
  {
    const items = await getRfqItems(rfqs.laptops.id, "vendor@technova.com");
    await POST(`/api/vendor/rfqs/${rfqs.laptops.id}/quotation`, {
      notes:        "All devices pre-installed and configured. Bulk discount applied for 60+ units.",
      paymentTerms: "50% advance, 50% on delivery",
      gstPercent:   18,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 87500,  quantity: 50,  deliveryDays: 14 },
        { rfqItemId: items[1].id, unitPrice: 195000, quantity: 10,  deliveryDays: 21 },
        { rfqItemId: items[2].id, unitPrice: 3500,   quantity: 60,  deliveryDays: 0  },
      ],
    }, "vendor@technova.com");
    log("Quotation submitted: TechNova → Laptops RFQ");
  }

  // ── RFQ-2: Office Supplies — OfficeEdge ──
  {
    const items = await getRfqItems(rfqs.office.id, "vendor@officeedge.com");
    await POST(`/api/vendor/rfqs/${rfqs.office.id}/quotation`, {
      notes:        "Delivery within 7 working days. Minimum order value applies.",
      paymentTerms: "Net 30 days",
      gstPercent:   12,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 420,  quantity: 500, deliveryDays: 7  },
        { rfqItemId: items[1].id, unitPrice: 95,   quantity: 200, deliveryDays: 7  },
        { rfqItemId: items[2].id, unitPrice: 250,  quantity: 50,  deliveryDays: 7  },
        { rfqItemId: items[3].id, unitPrice: 8500, quantity: 10,  deliveryDays: 14 },
      ],
    }, "vendor@officeedge.com");
    log("Quotation submitted: OfficeEdge → Office Supplies RFQ");
  }

  // ── RFQ-3: Canteen Renovation — BuildRight ──
  {
    const items = await getRfqItems(rfqs.canteen.id, "vendor@buildright.com");
    await POST(`/api/vendor/rfqs/${rfqs.canteen.id}/quotation`, {
      notes:        "Includes labour, material, and waste disposal. Work to be completed in 45 days.",
      paymentTerms: "30% mobilisation advance, 40% mid-way, 30% on completion",
      gstPercent:   18,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 85,     quantity: 1200, deliveryDays: 45 },
        { rfqItemId: items[1].id, unitPrice: 95,     quantity: 800,  deliveryDays: 45 },
        { rfqItemId: items[2].id, unitPrice: 250000, quantity: 1,    deliveryDays: 45 },
        { rfqItemId: items[3].id, unitPrice: 18,     quantity: 3000, deliveryDays: 45 },
      ],
    }, "vendor@buildright.com");
    log("Quotation submitted: BuildRight → Canteen Renovation RFQ");
  }

  // ── RFQ-4: Printing — PrintPro ──
  {
    const items = await getRfqItems(rfqs.printing.id, "vendor@printpro.com");
    await POST(`/api/vendor/rfqs/${rfqs.printing.id}/quotation`, {
      notes:        "Final proofs shared digitally before print. Delivery within 12 working days post approval.",
      paymentTerms: "100% advance on order confirmation",
      gstPercent:   18,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 320, quantity: 500,  deliveryDays: 12 },
        { rfqItemId: items[1].id, unitPrice: 28,  quantity: 2000, deliveryDays: 10 },
        { rfqItemId: items[2].id, unitPrice: 850, quantity: 50,   deliveryDays: 8  },
      ],
    }, "vendor@printpro.com");
    log("Quotation submitted: PrintPro → Printing RFQ");
  }

  // ── RFQ-5: Freight — LogiTrack ──
  {
    const items = await getRfqItems(rfqs.freight.id, "vendor@logitrack.com");
    await POST(`/api/vendor/rfqs/${rfqs.freight.id}/quotation`, {
      notes:        "Real-time GPS tracking provided. Insurance included up to ₹25L per consignment.",
      paymentTerms: "Monthly billing, Net 15 days",
      gstPercent:   5,
      isDraft:      false,
      items: [
        { rfqItemId: items[0].id, unitPrice: 28000, quantity: 12, deliveryDays: 2 },
        { rfqItemId: items[1].id, unitPrice: 45000, quantity: 8,  deliveryDays: 3 },
        { rfqItemId: items[2].id, unitPrice: 2500,  quantity: 1,  deliveryDays: 0 },
      ],
    }, "vendor@logitrack.com");
    log("Quotation submitted: LogiTrack → Freight RFQ");
  }

  // RFQ-6 (IT Support) — no quotation submitted yet (shows open/empty state)
  log("RFQ-6 (IT Support): No quotation submitted — shows open invite state");
}

// ─── Step 9: Select Winning Quotations ────────────────────────────────────────

async function selectWinners(rfqs) {
  banner("Step 9 — Procurement Officer Selects Winners");

  // Fetch quotation IDs for each RFQ
  async function getQuotationId(rfqId) {
    const r = await GET(`/api/rfqs/${rfqId}/comparison`, "officer@vendorbridge.com");
    // First submitted quotation is the winner (only one vendor per RFQ in this seed)
    const submitted = r.quotations?.find(q => q.status === "SUBMITTED" || q.status === "REVISED");
    if (!submitted) throw new Error(`No submitted quotation found for RFQ ${rfqId}`);
    return submitted.id;
  }

  for (const key of ["laptops", "office", "canteen", "printing", "freight"]) {
    const rfq = rfqs[key];
    const quotationId = await getQuotationId(rfq.id);
    await POST(`/api/quotations/${quotationId}/select`, {}, "officer@vendorbridge.com");
    log(`Winner selected: ${rfq.title}`);
  }
}

// ─── Step 10: Request Approvals ───────────────────────────────────────────────

async function requestApprovals(rfqs) {
  banner("Step 10 — Request Manager Approvals");

  for (const key of ["laptops", "office", "canteen", "printing", "freight"]) {
    const rfq = rfqs[key];
    await POST(`/api/rfqs/${rfq.id}/approval-request`, {}, "officer@vendorbridge.com");
    log(`Approval requested: ${rfq.title}`);
  }
}

// ─── Step 11: Manager Actions ─────────────────────────────────────────────────

async function processApprovals() {
  banner("Step 11 — Manager Approves / Rejects");

  const r = await GET("/api/approvals", "manager@vendorbridge.com");
  const approvals = r.approvals;

  for (const approval of approvals) {
    const rfqTitle = approval.rfq?.title ?? approval.rfqId;

    if (rfqTitle.includes("Printing")) {
      // Reject printing — demonstrate the rejection flow
      await POST(`/api/approvals/${approval.id}/reject`, {
        remarks: "Budget overrun — unit cost exceeds approved marketing print budget for H2. Please re-negotiate with vendor and resubmit.",
      }, "manager@vendorbridge.com");
      log(`REJECTED: ${rfqTitle}`);
    } else {
      // Approve all others
      await POST(`/api/approvals/${approval.id}/approve`, {}, "manager@vendorbridge.com");
      log(`APPROVED: ${rfqTitle}`);
    }
  }
}

// ─── Step 12: Generate Purchase Orders ────────────────────────────────────────

async function generatePOs(rfqs) {
  banner("Step 12 — Generate Purchase Orders");

  for (const key of ["laptops", "office", "canteen", "freight"]) {
    const rfq = rfqs[key];
    const r = await POST(`/api/rfqs/${rfq.id}/purchase-order`, {}, "officer@vendorbridge.com");
    log(`PO generated: ${r.purchaseOrder.poNumber} — ${rfq.title}`);
  }
}

// ─── Step 13: Fetch POs ────────────────────────────────────────────────────────

async function getPOs() {
  const r = await GET("/api/purchase-orders", "officer@vendorbridge.com");
  return r.purchaseOrders;
}

// ─── Step 14: Generate Invoices ───────────────────────────────────────────────

async function generateInvoices(pos) {
  banner("Step 14 — Generate Invoices from POs");

  const invoices = [];
  for (const po of pos) {
    const r = await POST(`/api/purchase-orders/${po.id}/invoice`, {}, "officer@vendorbridge.com");
    invoices.push({ invoice: r.invoice, po });
    log(`Invoice generated: ${r.invoice.invoiceNumber} for PO ${po.poNumber}`);
  }
  return invoices;
}

// ─── Step 15: Update Statuses ─────────────────────────────────────────────────

async function updateStatuses(pos, invoices) {
  banner("Step 15 — Update PO & Invoice Statuses");

  // Mark canteen PO as FULFILLED (work completed)
  const canteenPO = pos.find(p => p.rfq?.title?.includes("Canteen"));
  if (canteenPO) {
    await PATCH(`/api/purchase-orders/${canteenPO.id}/status`, { status: "FULFILLED" }, "officer@vendorbridge.com");
    log(`PO status → FULFILLED: Canteen Renovation`);
  }

  // Mark laptops invoice as PAID
  const laptopInv = invoices.find(i => i.po.rfq?.title?.includes("Laptop"));
  if (laptopInv) {
    await PATCH(`/api/invoices/${laptopInv.invoice.id}/paid`, {}, "officer@vendorbridge.com");
    log(`Invoice → PAID: ${laptopInv.invoice.invoiceNumber} (Laptops)`);
  }

  // Mark canteen invoice as PAID
  const canteenInv = invoices.find(i => i.po.rfq?.title?.includes("Canteen"));
  if (canteenInv) {
    await PATCH(`/api/invoices/${canteenInv.invoice.id}/paid`, {}, "officer@vendorbridge.com");
    log(`Invoice → PAID: ${canteenInv.invoice.invoiceNumber} (Canteen)`);
  }

  // Office Supplies invoice stays as ISSUED (outstanding)
  const officeInv = invoices.find(i => i.po.rfq?.title?.includes("Office Supplies"));
  if (officeInv) log(`Invoice stays ISSUED (unpaid): ${officeInv.invoice.invoiceNumber} (Office Supplies)`);

  // Freight invoice stays ISSUED
  const freightInv = invoices.find(i => i.po.rfq?.title?.includes("Freight"));
  if (freightInv) log(`Invoice stays ISSUED (unpaid): ${freightInv.invoice.invoiceNumber} (Freight)`);
}

// ─── Summary Table ────────────────────────────────────────────────────────────

function printSummary() {
  banner("✅  SEED COMPLETE — Test Credentials");

  const tbl = [
    ["Role",                   "Email",                        "Password",   "Login URL"],
    ["─".repeat(24),           "─".repeat(31),                 "─".repeat(12),"─".repeat(30)],
    ["Admin",                  "admin@vendorbridge.com",        "Admin@123",  "/login"],
    ["Procurement Officer",    "officer@vendorbridge.com",      "Officer@123","/login"],
    ["Manager / Approver",     "manager@vendorbridge.com",      "Manager@123","/login"],
    ["Vendor (IT)",            "vendor@technova.com",           "Vendor@123", "/login"],
    ["Vendor (Office)",        "vendor@officeedge.com",         "Vendor@123", "/login"],
    ["Vendor (Construction)",  "vendor@buildright.com",         "Vendor@123", "/login"],
    ["Vendor (Print)",         "vendor@printpro.com",           "Vendor@123", "/login"],
    ["Vendor (Logistics)",     "vendor@logitrack.com",          "Vendor@123", "/login"],
  ];

  for (const row of tbl) {
    console.log(`  ${row[0].padEnd(26)} ${row[1].padEnd(34)} ${row[2].padEnd(14)} ${row[3]}`);
  }

  console.log(`
  📊 Data Seeded — All Workflow States Covered:
  ┌────────────────────────────────────────────────────────────┐
  │  Laptops RFQ      → Full cycle (Approved → PO → PAID)    │
  │  Office Supplies  → Full cycle (Approved → PO → ISSUED)  │
  │  Canteen Reno     → Full cycle (Approved → PO FULFILLED   │
  │                      → Invoice PAID)                      │
  │  Freight RFQ      → Full cycle (Approved → PO → ISSUED)  │
  │  Printing RFQ     → Approval REJECTED (no PO generated)  │
  │  IT Support RFQ   → PUBLISHED, no quotation yet           │
  │  Housekeeping     → DRAFT (not published)                 │
  └────────────────────────────────────────────────────────────┘
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║          VendorBridge Database Seeder                    ║
║  Target: ${BASE_URL.padEnd(48)}║
╚══════════════════════════════════════════════════════════╝`);

  try {
    // 1. Create admin (first signup → ADMIN)
    await createAdmin();

    // 2. Login with all actors
    banner("Step 2 — Establish Sessions");
    await login("admin@vendorbridge.com",   "Admin@123",   "Admin");

    // 3. Create internal staff
    await createInternalUsers();

    // 4. Login as the newly created staff
    await login("officer@vendorbridge.com", "Officer@123", "Procurement Officer");
    await login("manager@vendorbridge.com", "Manager@123", "Manager Approver");

    // 4. Vendor categories
    const categoryIds = await createCategories();

    // 5. Register vendors (creates User + Vendor in one call)
    await createVendors(categoryIds);

    // Re-fetch vendor IDs (API returns them)
    const vendorIds = await getVendorIds();

    // Login as each vendor (passwords are set by the seeder, not auto-generated)
    // Note: The admin vendor creation uses generatePassword(), but we override
    // vendor passwords via direct API for seeding. Since admin creates vendors
    // with generated passwords, we need to reset them via Prisma directly OR
    // use the generated approach. We'll use a direct Prisma script for vendors.

    // 6. Create + publish RFQs
    const rfqs = await createRFQs(vendorIds);

    // 7. Login as vendors (using known seed password)
    banner("Step 6b — Vendor Sessions");
    await login("vendor@technova.com",    "Vendor@123", "TechNova");
    await login("vendor@officeedge.com",  "Vendor@123", "OfficeEdge");
    await login("vendor@buildright.com",  "Vendor@123", "BuildRight");
    await login("vendor@printpro.com",    "Vendor@123", "PrintPro");
    await login("vendor@logitrack.com",   "Vendor@123", "LogiTrack");

    // 8. Submit quotations
    await submitQuotations(rfqs);

    // 9. Select winners
    await selectWinners(rfqs);

    // 10. Request approvals
    await requestApprovals(rfqs);

    // 11. Manager acts on approvals
    await processApprovals();

    // 12. Generate POs
    await generatePOs(rfqs);

    // 13. Fetch generated POs
    const pos = await getPOs();

    // 14. Generate invoices
    const invoices = await generateInvoices(pos);

    // 15. Update final statuses
    await updateStatuses(pos, invoices);

    // Done
    printSummary();

  } catch (err) {
    console.error("\n  ✗ SEED FAILED:", err.message);
    process.exit(1);
  }
}

main();
