import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { IssueStatus, NotificationType } from '@prisma/client';

@Injectable()
export class SlaService {
  constructor(private prisma: PrismaService) {}

  // Runs every 5 minutes
  @Cron('*/5 * * * *')
  async checkSlaBreaches() {
    const now = new Date();

    const expiredIssues = await this.prisma.issue.findMany({
      where: {
        slaDeadline: { lt: now },
        slaBreached: false,
        status: {
          notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED],
        },
      },
    });

    for (const issue of expiredIssues) {
      await this.escalateIssue(issue.id);
    }
  }

private async escalateIssue(issueId: number) {
  const issue = await this.prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      officer: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!issue) return;

  await this.prisma.issue.update({
    where: { id: issue.id },
    data: {
      slaBreached: true,
      escalationLevel: issue.escalationLevel + 1,
    },
  });

  if (issue.officer?.userId) {
    await this.prisma.notification.create({
      data: {
        userId: issue.officer.userId,
        issueId: issue.id,
        type: NotificationType.SLA_BREACH,
        message: `Issue #${issue.id} has breached SLA`,
      },
    });
  }
}

}
