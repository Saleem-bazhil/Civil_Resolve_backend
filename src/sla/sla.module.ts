import { Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [SlaService,PrismaService]
})
export class SlaModule {}
