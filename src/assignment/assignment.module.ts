import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [AssignmentService,PrismaService],
    exports: [AssignmentService],
})
export class AssignmentModule {}
