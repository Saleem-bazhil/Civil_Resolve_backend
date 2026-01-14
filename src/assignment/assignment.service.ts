import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { IssueStatus } from '@prisma/client';

@Injectable()
export class AssignmentService {
  constructor(private prisma: PrismaService) {}

  async assign(category: string, area: string) {
    // department
    const department = await this.prisma.department.findFirst({
      where: {
        name: {
          equals: category,
          mode: 'insensitive',
        },
      },
    });

    if (!department) {
      throw new NotFoundException(
        `No department found for category ${category}`,
      );
    }

    // area officers
    const officers = await this.prisma.officer.findMany({
      where: {
        departmentId: department.id,
        area: area,
        isActive: true,
      },
      include: {
        assignedIssues: {
          where: {
            status: {
              in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS],
            },
          },
        },
      },
    });

    let selectedOfficer:any = null;

    // least workload
    if (officers.length > 0) {
      selectedOfficer = officers.sort(
        (a, b) => a.assignedIssues.length - b.assignedIssues.length,
      )[0];
    }

    // backup officer
    if (!selectedOfficer) {
      const backupOfficers = await this.prisma.officer.findMany({
        where: {
          departmentId: department.id,
          isActive: true,
        },
        include: {
          assignedIssues: {
            where: {
              status: {
                in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS],
              },
            },
          },
        },
      });

      if (backupOfficers.length > 0) {
        selectedOfficer = backupOfficers.sort(
          (a, b) => a.assignedIssues.length - b.assignedIssues.length,
        )[0];
      }
    }

    return {
      department,
      officer: selectedOfficer,
    };
  }
}
