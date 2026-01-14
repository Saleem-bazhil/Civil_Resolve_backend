import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentService } from './assignment.service';
import { PrismaService } from '../prisma.service';

describe('AssignmentService (logic)', () => {
  let service: AssignmentService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignmentService, PrismaService],
    }).compile();

    service = module.get<AssignmentService>(AssignmentService);
    prisma = module.get<PrismaService>(PrismaService);

    // clean data
    await prisma.issue.deleteMany();
    await prisma.officer.deleteMany();

    // check department
    let department = await prisma.department.findFirst({
      where: { name: 'WATER' },
    });

    if (!department) {
      department = await prisma.department.create({
        data: { name: 'WATER' },
      });
    }

    // check user
    let user = await prisma.user.findUnique({
      where: { email: 'officer@test.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'officer@test.com',
          password: 'hashed-password',
          role: 'OFFICER',
        },
      });
    }

    // create officer
    await prisma.officer.create({
      data: {
        userId: user.id,
        departmentId: department.id,
        area: 'WARD_1',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // close db
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('assigns officer for valid category and area', async () => {
    const result = await service.assign('WATER', 'WARD_1');

    // check department
    expect(result.department).toBeDefined();
    expect(result.department.name).toBe('WATER');

    // check officer
    expect(result.officer).toBeDefined();
    expect(result.officer.area).toBe('WARD_1');
  });
});
