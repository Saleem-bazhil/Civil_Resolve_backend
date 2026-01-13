import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.department.createMany({
    data: [
      { name: 'Water Supply' },
      { name: 'Electricity' },
      { name: 'Roads' },
    ],
    skipDuplicates: true,
  });

  await prisma.slaRule.createMany({
    data: [
      { departmentId: 1, hours: 48 },
      { departmentId: 2, hours: 24 },
      { departmentId: 3, hours: 72 },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => {
    console.log(' Seed completed');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
