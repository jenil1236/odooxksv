const { Client } = require('./node_modules/pg');

const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/odoo_ksv?schema=public',
});

async function main() {
  await client.connect();
  try {
    const users = await client.query('SELECT id, email, role, "organizationId" FROM "User"');
    console.log('--- USERS ---');
    console.log(users.rows);

    const vendors = await client.query('SELECT id, "companyName", status, "organizationId", "userId" FROM "Vendor"');
    console.log('--- VENDORS ---');
    console.log(vendors.rows);

    const orgs = await client.query('SELECT id, name FROM "Organization"');
    console.log('--- ORGANIZATIONS ---');
    console.log(orgs.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
