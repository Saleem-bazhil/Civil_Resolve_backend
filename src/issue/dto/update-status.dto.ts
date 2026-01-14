import { IsEnum } from "class-validator";
import { IssueStatus } from "@prisma/client";

export class UpdateStatusDto{
    @IsEnum(IssueStatus)
    status :IssueStatus;
}