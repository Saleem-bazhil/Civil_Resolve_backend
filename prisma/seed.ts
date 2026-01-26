import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Departments
  await prisma.department.createMany({
    data: [
      { name: 'Water Supply' },
      { name: 'Electricity' },
      { name: 'Roads' },
      { name: 'Sanitation' },
      { name: 'Road & Footpath' },
      { name: 'Street Lights' },
      { name: 'Drainage' },
      { name: 'Public Property' },
      { name: 'Other' },
    ],
    skipDuplicates: true,
  });

  const waterDept = await prisma.department.findFirst({ where: { name: 'Water Supply' } });
  const electricDept = await prisma.department.findFirst({ where: { name: 'Electricity' } });

  // 2. SLA Rules
  if (waterDept && electricDept) {
    await prisma.slaRule.createMany({
      data: [
        { departmentId: waterDept.id, hours: 48 },
        { departmentId: electricDept.id, hours: 24 },
      ],
      skipDuplicates: true,
    });
  }

  // 3. Create Officer User if not exists
  // Password hash for 'password' (bcrypt) - simplified for seed
  const passwordHash = '$2b$10$EpWa/z8.O/h.q.E/V.E.O.k.E.O.k.E.O.k.E.O.k.E.O.k.E.O'; // This is a dummy hash, in real app use bcrypt.hash

  // We'll rely on the app's signup for real hashing, or we can use a known hash. 
  // For now let's use a placeholder or assume the user exists. 
  // Actually, let's fix the existing user 'suresh.raj@municipality.in' to be an officer.

  const officerEmail = 'suresh.raj@municipality.in';
  let officerUser = await prisma.user.findUnique({
    where: { email: officerEmail },
  });

  if (!officerUser) {
    // If not exists, create with dummy password (won't work for login unless we know the hash logic matches)
    // But better to expect the user to have signed up.
    // However, the user already has this user.
    console.log(`User ${officerEmail} not found. Please signup first or update seed with valid hash.`);
  } else {
    // 4. Create Officer Record
    if (waterDept) {
      await prisma.officer.upsert({
        where: { userId: officerUser.id },
        update: {},
        create: {
          userId: officerUser.id,
          departmentId: waterDept.id,
          area: 'Sector 4', // Example area
          isActive: true
        }
      });
      console.log(`Officer record created for ${officerEmail} in ${waterDept.name}`);
    }
  }
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
