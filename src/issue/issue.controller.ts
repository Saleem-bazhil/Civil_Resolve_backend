import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/users/auth/auth.guard';
import { IssueService } from './issue.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
           
@ApiBearerAuth('JWT-auth') 
// @UseGuards(AuthGuard('jwt'))
@UseGuards(AuthGuard)

@Controller('issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateIssueDto) {
    return this.issueService.createIssue(req.user.id, dto);
  }

  @Get()
  findMyIssues(@Req() req) {
    return this.issueService.findAllIssue(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.issueService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.issueService.updateIssue(+id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.issueService.deleteIssue(+id, req.user.id);
  }
}
