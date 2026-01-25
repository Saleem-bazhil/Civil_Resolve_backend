import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IssueController } from './issue.controller';
import { PrismaService } from 'src/prisma.service';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [AssignmentModule, NotificationsModule],
  controllers: [IssueController],
  providers: [IssueService, PrismaService],
})
export class IssueModule { }
