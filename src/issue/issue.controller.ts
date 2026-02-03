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
import { UpdateStatusDto } from './dto/update-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { multerConfig } from 'src/common/multer.config';

@ApiBearerAuth('JWT-auth')
// @UseGuards(AuthGuard('jwt'))
@UseGuards(AuthGuard)
@Controller('issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', multerConfig))
  create(
    @Req() req,
    @Body() dto: CreateIssueDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = file
      ? `${process.env.BASE_URL}/uploads/${file.filename}`
      : undefined;

    return this.issueService.createIssue(req.user.id, {
      ...dto,
      imageUrl,
    });
  }

  @Get()
  findMyIssues(@Req() req) {
    console.log('findMyIssues user:', req.user);
    return this.issueService.findAllIssue(req.user.id, req.user.role);
  }

  @Get('stats')
  getStats(@Req() req) {
    return this.issueService.getStats(req.user.id, req.user.role);
  }

  @Get('chart-data')
  getChartData(@Req() req) {
    return this.issueService.getChartData(req.user.role);
  }

  @Get('analytics')
  getAnalytics(@Req() req) {
    return this.issueService.getAnalyticsData(req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.issueService.findOne(+id, req.user.id, req.user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req, @Body() dto: UpdateIssueDto) {
    return this.issueService.updateIssue(+id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.issueService.deleteIssue(+id, req.user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Req() req,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.issueService.updateStatus(+id, req.user.id, req.user.role, dto);
  }
}
