import { prisma } from "../lib/prisma";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: 'john@example.com' }
  });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: '$2b$10$xyz', // Dummy bcrypt hash
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });