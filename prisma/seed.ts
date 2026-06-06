import { prisma } from "../lib/prisma";

async function main() {
  await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John',
    },
  })
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