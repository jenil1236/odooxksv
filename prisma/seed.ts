/**
 * VendorBridge — Prisma Direct Seeder
 * ─────────────────────────────────────
 * Creates: Organisation, Users (Admin, Officer, Manager, 5×Vendor),
 *          VendorCategories, and Vendor profiles — all with KNOWN passwords.
 *
 * Run via:  npx prisma db seed
 *
 * Passwords:
 *   Admin              → Admin@123
 *   Procurement Officer→ Officer@123
 *   Manager Approver   → Manager@123
 *   All Vendors        → Vendor@123
 */

import "dotenv/config";
import { PrismaPg }    from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import bcrypt           from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter   = new PrismaPg({ connectionString });
const prisma    = new PrismaClient({ adapter });

const SALT = 12;
const hash = (p: string) => bcrypt.hash(p, SALT);

const log  = (msg: string) => console.log(`  ✓ ${msg}`);
const head = (msg: string) => console.log(`\n── ${msg}`);

// ─── Passwords ────────────────────────────────────────────────────────────────
const ADMIN_PASS   = "Admin@123";
const OFFICER_PASS = "Officer@123";
const MANAGER_PASS = "Manager@123";
const VENDOR_PASS  = "Vendor@123";

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   VendorBridge — Prisma Seeder           ║");
  console.log("╚══════════════════════════════════════════╝");

  // ── 1. Organisation ──────────────────────────────────────────────────────────
  head("Organisation");
  const org = await prisma.organization.create({
    data: {
      name:    "VendorBridge Corp",
      details: "A leading procurement and vendor management organisation.",
    },
  });
  log(`Org: ${org.name} (${org.id})`);

  // ── 2. Internal Users ────────────────────────────────────────────────────────
  head("Internal Users");

  const admin = await prisma.user.create({
    data: {
      firstName:      "Aryan",
      lastName:       "Mehta",
      email:          "admin@vendorbridge.com",
      passwordHash:   await hash(ADMIN_PASS),
      phone:          "+91-9876543210",
      country:        "India",
      role:           "ADMIN",
      organizationId: org.id,
    },
  });
  log(`Admin:   ${admin.firstName} ${admin.lastName} <${admin.email}>`);

  const officer = await prisma.user.create({
    data: {
      firstName:      "Priya",
      lastName:       "Sharma",
      email:          "officer@vendorbridge.com",
      passwordHash:   await hash(OFFICER_PASS),
      phone:          "+91-9812345678",
      country:        "India",
      role:           "PROCUREMENT_OFFICER",
      organizationId: org.id,
    },
  });
  log(`Officer: ${officer.firstName} ${officer.lastName} <${officer.email}>`);

  const manager = await prisma.user.create({
    data: {
      firstName:      "Rahul",
      lastName:       "Verma",
      email:          "manager@vendorbridge.com",
      passwordHash:   await hash(MANAGER_PASS),
      phone:          "+91-9900112233",
      country:        "India",
      role:           "MANAGER_APPROVER",
      organizationId: org.id,
    },
  });
  log(`Manager: ${manager.firstName} ${manager.lastName} <${manager.email}>`);

  // ── 3. Vendor Categories ─────────────────────────────────────────────────────
  head("Vendor Categories");

  const categories: Record<string, string> = {};
  const catDefs = [
    { name: "IT & Technology",     description: "Hardware, software, networking, and cloud services" },
    { name: "Office Supplies",     description: "Stationery, furniture, cleaning, and pantry items" },
    { name: "Construction",        description: "Civil works, contractors, and building materials" },
    { name: "Printing & Media",    description: "Marketing collateral, packaging, and large-format printing" },
    { name: "Logistics & Freight", description: "Courier, freight forwarding, and warehousing" },
  ];

  for (const c of catDefs) {
    const cat = await prisma.vendorCategory.create({ data: c });
    categories[c.name] = cat.id;
    log(`Category: ${c.name}`);
  }

  // ── 4. Vendor Users + Vendor Profiles ────────────────────────────────────────
  head("Vendors");

  interface VendorDef {
    user:   { firstName: string; lastName: string; email: string; phone: string };
    vendor: {
      companyName: string; contactName: string; contactEmail: string;
      contactPhone: string; gstNumber: string; address: string;
      city: string; state: string; country: string; postalCode: string;
      category: string; notes: string;
    };
  }

  const vendorDefs: VendorDef[] = [
    {
      user:   { firstName: "Kiran",  lastName: "Desai",    email: "vendor@technova.com",   phone: "+91-9876501234" },
      vendor: {
        companyName: "TechNova Solutions Pvt Ltd", contactName: "Kiran Desai",
        contactEmail: "vendor@technova.com",       contactPhone: "+91-9876501234",
        gstNumber: "27ABCDE1234F1Z5",
        address: "Plot 12, MIDC", city: "Pune", state: "Maharashtra",
        country: "India", postalCode: "411018",
        category: "IT & Technology",
        notes: "Preferred IT vendor with 5+ years relationship",
      },
    },
    {
      user:   { firstName: "Sunita", lastName: "Pillai",   email: "vendor@officeedge.com", phone: "+91-8800223344" },
      vendor: {
        companyName: "OfficeEdge Supplies Ltd",    contactName: "Sunita Pillai",
        contactEmail: "vendor@officeedge.com",     contactPhone: "+91-8800223344",
        gstNumber: "29XYZA5678B2Z1",
        address: "14 MG Road", city: "Bengaluru", state: "Karnataka",
        country: "India", postalCode: "560001",
        category: "Office Supplies",
        notes: "ISO-certified office supplies distributor",
      },
    },
    {
      user:   { firstName: "Vikram", lastName: "Rathod",   email: "vendor@buildright.com", phone: "+91-9955667788" },
      vendor: {
        companyName: "BuildRight Contractors",     contactName: "Vikram Rathod",
        contactEmail: "vendor@buildright.com",     contactPhone: "+91-9955667788",
        gstNumber: "24UVWX1111C3Z9",
        address: "Sector 7, Industrial Area", city: "Surat", state: "Gujarat",
        country: "India", postalCode: "395010",
        category: "Construction",
        notes: "Civil and structural works specialist",
      },
    },
    {
      user:   { firstName: "Anita",  lastName: "Krishnan", email: "vendor@printpro.com",   phone: "+91-9811001122" },
      vendor: {
        companyName: "PrintPro Media Works",       contactName: "Anita Krishnan",
        contactEmail: "vendor@printpro.com",       contactPhone: "+91-9811001122",
        gstNumber: "33MNOP2222D4Z8",
        address: "T Nagar", city: "Chennai", state: "Tamil Nadu",
        country: "India", postalCode: "600017",
        category: "Printing & Media",
        notes: "Full-service print shop for marketing and events",
      },
    },
    {
      user:   { firstName: "Deepak", lastName: "Nair",     email: "vendor@logitrack.com",  phone: "+91-9700334455" },
      vendor: {
        companyName: "LogiTrack Freight Services", contactName: "Deepak Nair",
        contactEmail: "vendor@logitrack.com",      contactPhone: "+91-9700334455",
        gstNumber: "32QRST3333E5Z7",
        address: "Cochin Port Trust Area", city: "Kochi", state: "Kerala",
        country: "India", postalCode: "682009",
        category: "Logistics & Freight",
        notes: "Pan-India freight and last-mile delivery",
      },
    },
  ];

  const vendorIds: Record<string, string> = {};

  for (const def of vendorDefs) {
    const vUser = await prisma.user.create({
      data: {
        firstName:      def.user.firstName,
        lastName:       def.user.lastName,
        email:          def.user.email,
        passwordHash:   await hash(VENDOR_PASS),
        phone:          def.user.phone,
        country:        "India",
        role:           "VENDOR",
        organizationId: org.id,
      },
    });

    const vendor = await prisma.vendor.create({
      data: {
        companyName:    def.vendor.companyName,
        contactName:    def.vendor.contactName,
        contactEmail:   def.vendor.contactEmail,
        contactPhone:   def.vendor.contactPhone,
        gstNumber:      def.vendor.gstNumber,
        address:        def.vendor.address,
        city:           def.vendor.city,
        state:          def.vendor.state,
        country:        def.vendor.country,
        postalCode:     def.vendor.postalCode,
        status:         "ACTIVE",
        rating:         4.5,
        notes:          def.vendor.notes,
        userId:         vUser.id,
        organizationId: org.id,
        categoryId:     categories[def.vendor.category],
      },
    });

    vendorIds[def.vendor.contactEmail] = vendor.id;
    log(`Vendor: ${def.vendor.companyName} (${def.vendor.contactEmail})`);
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log(`
  ✅  Prisma seed complete!

  Next step → run workflow seeder:
    npm run dev              (in terminal 1 — keep running)
    node scripts/seed-workflow.mjs  (in terminal 2)
`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("\n  ✗ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });