import { Injectable,ForbiddenException,NotFoundException } from '@nestjs/common';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { IssueStatus } from '@prisma/client';
import { Issue } from './entities/issue.entity';

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
}
