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
    if (role === Role.ADMIN) {
      return this.prisma.issue.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
          citizen: {
            select: {
              firstname: true,
              lastname: true,
              mobile: true,
            }
          },
          officer: true
        }
      });
    }

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

  async getStats(userId: number, role: Role = Role.CITIZEN) {
    if (role === Role.ADMIN) {
      const total = await this.prisma.issue.count();
      const open = await this.prisma.issue.count({
        where: { status: IssueStatus.OPEN },
      });
      const resolved = await this.prisma.issue.count({
        where: { status: IssueStatus.RESOLVED },
      });
      const inProgress = await this.prisma.issue.count({
        where: { status: IssueStatus.IN_PROGRESS },
      });
      return { total, open, resolved, inProgress };
    }

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

  async getChartData(role: Role = Role.CITIZEN) {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException("Access Denied");
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const issues = await this.prisma.issue.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Initialize last 7 days with 0
    const chartData: { name: string; count: number; fullDate: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., "Mon"
      chartData.push({ name: dateStr, count: 0, fullDate: d.toISOString().split('T')[0] });
    }
    chartData.reverse();

    // Fill counts
    issues.forEach(issue => {
      const issueDate = issue.createdAt.toISOString().split('T')[0];
      const day = chartData.find(d => d.fullDate === issueDate);
      if (day) {
        day.count++;
      }
    });

    return {
      categories: chartData.map(d => d.name),
      data: chartData.map(d => d.count)
    };
  }

  async getAnalyticsData(role: Role) {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException("Access Denied");
    }

    const issues = await this.prisma.issue.findMany({
      include: {
        department: true,
        officer: true,
      }
    });

    //  Monthly Trend (Last 6 Months)
    const months: { key: string; reported: number; resolved: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' });
      months.push({ key, reported: 0, resolved: 0 });
    }

    issues.forEach(issue => {
      const d = new Date(issue.createdAt);
      const key = d.toLocaleString('default', { month: 'short' });
      const monthData = months.find(m => m.key === key);
      if (monthData) {
        monthData.reported++;
        if (issue.status === IssueStatus.RESOLVED) {
          monthData.resolved++;
        }
      }
    });

    //  Issues By Area
    const areaMap = new Map();
    issues.forEach(issue => {
      if (issue.area) {
        const current = areaMap.get(issue.area) || { total: 0, resolved: 0 };
        current.total++;
        if (issue.status === IssueStatus.RESOLVED) current.resolved++;
        areaMap.set(issue.area, current);
      }
    });
    const issuesByArea = Array.from(areaMap.entries()).map(([area, data]) => ({
      area,
      total: data.total,
      resolved: data.resolved
    }));

    //  Department Efficiency
    const deptMap = new Map();
    issues.forEach(issue => {
      const deptName = issue.department?.name || "Unassigned";
      const current = deptMap.get(deptName) || { resolved: 0, pending: 0 };
      if (issue.status === IssueStatus.RESOLVED) {
        current.resolved++;
      } else {
        current.pending++;
      }
      deptMap.set(deptName, current);
    });
    const departmentEfficiency = Array.from(deptMap.entries()).map(([name, data]) => ({
      name,
      resolved: data.resolved,
      pending: data.pending
    }));

    //  Avg Resolution Time by Category
    const categoryMap = new Map();
    const resolvedIssues = issues.filter(i => i.status === IssueStatus.RESOLVED);

    resolvedIssues.forEach(issue => {
      const durationMs = new Date(issue.updatedAt).getTime() - new Date(issue.createdAt).getTime();
      const durationHrs = durationMs / (1000 * 60 * 60);

      const current = categoryMap.get(issue.category) || { totalHrs: 0, count: 0 };
      current.totalHrs += durationHrs;
      current.count++;
      categoryMap.set(issue.category, current);
    });

    const avgResolutionByCat = {
      categories: Array.from(categoryMap.keys()),
      data: Array.from(categoryMap.values()).map((d: any) => Math.round(d.totalHrs / d.count))
    };

    //  Officer Performance
    const officerMap = new Map();
    issues.forEach(issue => {
      if (issue.officerId && issue.officer) {
        const officerName = `Officer ${issue.officer.id}`; // Ideally join with User to get name
        const current = officerMap.get(issue.officerId) || { id: issue.officerId, name: officerName, resolved: 0, totalTime: 0 };

        if (issue.status === IssueStatus.RESOLVED) {
          current.resolved++;
          const durationMs = new Date(issue.updatedAt).getTime() - new Date(issue.createdAt).getTime();
          current.totalTime += durationMs / (1000 * 60 * 60);
        }
        officerMap.set(issue.officerId, current);
      }
    });

    const officerPerformance = Array.from(officerMap.values()).map((data: any) => ({
      name: data.name,
      resolved: data.resolved,
      avgTime: data.resolved > 0 ? (data.totalTime / data.resolved).toFixed(1) + " hrs" : "0 hrs",
      compliance: (Math.random() * (100 - 80) + 80).toFixed(0) + "%", // Mock for now
      performance: Math.round(Math.random() * (100 - 70) + 70) // Mock
    }));

    //  Global Stats
    let totalResolutionTime = 0;
    let totalResolvedCount = resolvedIssues.length;
    resolvedIssues.forEach(i => {
      totalResolutionTime += (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60);
    });
    const avgGlobalResolutionTime = totalResolvedCount > 0 ? (totalResolutionTime / totalResolvedCount).toFixed(1) + "h" : "0h";

    return {
      monthlyTrend: {
        categories: months.map(m => m.key),
        reported: months.map(m => m.reported),
        resolved: months.map(m => m.resolved)
      },
      issuesByArea,
      departmentEfficiency,
      avgResolutionByCat,
      officerPerformance,
      globalStats: {
        avgResolutionTime: avgGlobalResolutionTime,
        slaCompliance: "94%" // Static for now
      }
    };
  }

  async findOne(id: number, userId: number, role: Role = Role.CITIZEN) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        statusHistory: true,
        department: true,
        officer: true, // check user assigned officer
        citizen: true
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
