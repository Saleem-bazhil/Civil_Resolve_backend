import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { PrismaService } from 'src/prisma.service';
import { IssueStatus } from '@prisma/client';
import { STATUS_TRANSITIONS } from './issue.constants';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Role } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { AssignmentService } from 'src/assignment/assignment.service';

@Injectable()
export class IssueService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private assignmentService: AssignmentService,
  ) { }
  async createIssue(userId: number, dto: CreateIssueDto) {

    // Assign to Department And Officer 
    const assignment = await this.assignmentService.assign(dto.category, dto.area)

    const issue = await this.prisma.issue.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        address: dto.address,
        landmark: dto.landmark,
        citizenId: userId,
        category: dto.category,
        area: dto.area,
        status: IssueStatus.OPEN,
        departmentId: assignment.department.id, 
        officerId: assignment.officer ? assignment.officer.id : null, 
      },
    });

    if (assignment.officer) {
      try {
        await this.notificationsService.createNotification(
          assignment.officer.userId,
          NotificationType.ISSUE_CREATED,
          `New issue Assigned: ${issue.title}`,
          issue.id
        )

      } catch (error) {
        console.log("Failed to notify officer", error);
      }
    }
    return issue;
  }

  async findAllIssue(userId: number, role: Role = Role.CITIZEN) {
    // console.log(`findAllIssue: userId=${userId}, role=${role}`);
    if (role === Role.OFFICER) {
      const officer = await this.prisma.officer.findFirst({
        where: { userId },
      });
      // console.log("Found officer:", officer);

      if (!officer) {
        return []; 
      }

      return this.prisma.issue.findMany({
        where: { officerId: officer.id },
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
          citizen: {
            select: {
              firstname: true,
              lastname: true,
              mobile: true,
            }
          }
        }
      })
    }
    return this.prisma.issue.findMany({
      where: { citizenId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
      }
    });
  }

  async getStats(userId: number) {
    const total = await this.prisma.issue.count({
      where: { citizenId: userId },
    });
    const open = await this.prisma.issue.count({
      where: { citizenId: userId, status: IssueStatus.OPEN },
    });
    const resolved = await this.prisma.issue.count({
      where: { citizenId: userId, status: IssueStatus.RESOLVED },
    });
    const inProgress = await this.prisma.issue.count({
      where: { citizenId: userId, status: IssueStatus.IN_PROGRESS },
    });

    return { total, open, resolved, inProgress };
  }

  async findOne(id: number, userId: number, role: Role = Role.CITIZEN) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        statusHistory: true,
        department: true,
        officer: true, // check user assigned officer
      }
    });
    if (!issue) {
      throw new NotFoundException("Issue Not Found");
    }

    if (role === Role.CITIZEN) {
      if (issue.citizenId != userId) {
        // console.log("Access Denied: Citizen ID mismatch");
        throw new ForbiddenException("Access Denied");
      }
    } else if (role === Role.OFFICER) {
      // Find the officer record for this user
      const officer = await this.prisma.officer.findFirst({ where: { userId } });

      if (!officer || issue.officerId !== officer.id) {
        throw new ForbiddenException("Access Denied: You are not assigned to this issue");
      }
    }

    return issue
  }

  async updateIssue(id: number, userId: number, dto: UpdateIssueDto) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
    });
    if (!issue) {
      throw new NotFoundException("Issue Not Found")
    }
    if (issue.citizenId != userId || issue.status != IssueStatus.OPEN) {
      throw new ForbiddenException("Cannot Update this Issue");
    }
    return this.prisma.issue.update({
      where: { id },
      data: dto,
    });
  }

  async deleteIssue(id: number, userId: number) {
    const issue = await this.prisma.issue.findUnique({
      where: { id }
    });
    if (!issue) {
      throw new NotFoundException("Issue Not Found")
    }
    if (issue.citizenId != userId || issue.status != IssueStatus.OPEN) {
      throw new ForbiddenException("Cannot Update this Issue");

    }
    return this.prisma.issue.delete({
      where: { id },
    });

  }

  async updateStatus(IssueId: number, userId: number, role: Role, dto: UpdateStatusDto) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: IssueId },
    });
    if (!issue) {
      throw new NotFoundException("Issue Not Found")
    }

    if (role == Role.CITIZEN) {
      throw new ForbiddenException("Citizen Cannot Change the Status")
    }

    const allowedNext = STATUS_TRANSITIONS[issue.status];

    if (!allowedNext.includes(dto.status)) {
      throw new ForbiddenException("Invalid Status transtion");
    }

    const updatedIssue = await this.prisma.issue.update({
      where: { id: IssueId },
      data: { status: dto.status },
    });

    // status history
    await this.prisma.issueStatusHistory.create({
      data: {
        issueId: issue.id,
        oldStatus: issue.status,
        newStatus: dto.status,
        changedBy: userId,
      },
    });

    // Trigger notification
    try {
      // Notify the citizen
      await this.notificationsService.createNotification(
        issue.citizenId,
        NotificationType.STATUS_CHANGED,
        `Your issue #${issue.id} status has been updated to ${dto.status}`,
        issue.id,
      );
    } catch (error) {
      console.error('Failed to create notification', error);
    }

    return updatedIssue;
  }
}
