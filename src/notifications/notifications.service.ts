import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    // Create a notification 
    async createNotification(
        userId: number,
        type: NotificationType,
        message: string,
        issueId?: number,
    ) {
        return this.prisma.notification.create({
            data: {
                userId,
                type,
                message,
                issueId,
            },
        });
    }

    async getUserNotifications(userId: number) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                issue: {
                    select: { title: true },
                },
            },
        });
    }

    async markAsRead(notificationId: number) {
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { read: true },
        });
    }

    async markAllAsRead(userId: number) {
        return this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    }
}
