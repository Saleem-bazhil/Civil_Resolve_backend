import {
    Controller,
    Get,
    Patch,
    Param,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../users/auth/auth.guard';
import { RolesGuard } from '../roles/roles.guard';

@Controller('notifications')
@UseGuards(AuthGuard, RolesGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async getNotifications(@Request() req) {
        return this.notificationsService.getUserNotifications(req.user.id);
    }

    @Patch(':id/read')
    async markAsRead(@Param('id', ParseIntPipe) id: number) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }
}
