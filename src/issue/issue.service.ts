import { Injectable,ForbiddenException,NotFoundException } from '@nestjs/common';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { PrismaService } from 'src/prisma.service';
import { IssueStatus } from '@prisma/client';
import { STATUS_TRANSITIONS } from './issue.constants';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Role } from '@prisma/client';

@Injectable()
export class IssueService {
  constructor(private prisma:PrismaService){}
  async createIssue(userId:number ,dto: CreateIssueDto) {
    return this.prisma.issue.create({
      data:{
        title :dto.title,
        description:dto.description,
        imageUrl:dto.imageUrl,
        address:dto.address,
        landmark:dto.landmark,
        citizenId:userId,
        category: dto.category,
        area: dto.area,
        status:IssueStatus.OPEN,
      },
    });
  }

  async findAllIssue(userId:number) {
    return this.prisma.issue.findMany({
      where:{citizenId:userId},
      orderBy:{createdAt:'desc'},
      include:{
        department:true,
        // officer:true,
      }
    });
  }

  async findOne(id: number,userId:number) {
    const issue = await this.prisma.issue.findUnique({
      where:{id},
      include:{
        statusHistory:true,
        department:true,
        // officer:true,
      }
    });
    if (!issue) {
      throw new NotFoundException("Issue Not Found");
    }
    if (issue.citizenId != userId) {
      throw new ForbiddenException("Access Denied");
    }
    return issue
  }

  async updateIssue(id: number,userId:number, dto: UpdateIssueDto) {
    const issue = await this.prisma.issue.findUnique({
      where :{id},
    });
      if (!issue) {
        throw new NotFoundException("Issue Not Found")
      }
      if (issue.citizenId != userId || issue.status != IssueStatus.OPEN) {
        throw new ForbiddenException("Cannot Update this Issue");
      }
    return this.prisma.issue.update({
      where:{id},
      data :dto,
    });
  }

  async deleteIssue(id: number,userId:number) {
    const issue = await this.prisma.issue.findUnique({
      where:{id}
    });
     if (!issue) {
      throw new NotFoundException("Issue Not Found")
    }
    if (issue.citizenId != userId || issue.status != IssueStatus.OPEN) {
      throw new ForbiddenException("Cannot Update this Issue");
      
    }
    return this.prisma.issue.delete({
      where:{id},
    });

  }

  async updateStatus(IssueId:number,userId:number,role:Role,dto:UpdateStatusDto){
    const issue = await this.prisma.issue.findUnique({
      where:{id:IssueId},
    });
    if (!issue){
      throw new NotFoundException ("Issue Not Found")
    }

    if(role == Role.CITIZEN){
      throw new ForbiddenException("Citizen Cannot Change the Status")
    }

    const allowedNext = STATUS_TRANSITIONS[issue.status];

    if (!allowedNext.includes(dto.status)) {
      throw new ForbiddenException("Invalid Status transtion");
    }

    const updatedIssue = await this.prisma.issue.update({
      where: { id: IssueId  },
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

  return updatedIssue;
  }
}
