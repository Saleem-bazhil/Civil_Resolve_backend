import { IssueStatus } from "@prisma/client";

export const STATUS_TRANSITIONS: Record<IssueStatus,IssueStatus[]> = {
    OPEN: [IssueStatus.IN_PROGRESS],
    IN_PROGRESS:[IssueStatus.RESOLVED],
    RESOLVED:[IssueStatus.CLOSED],
    CLOSED:[]
}