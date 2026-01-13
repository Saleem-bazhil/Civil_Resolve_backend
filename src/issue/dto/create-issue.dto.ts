import { IsString,IsOptional,IsNumber } from "class-validator";

export class CreateIssueDto {
    @IsString()
    title :string;

    @IsString()
    description :string;

    @IsOptional()
    @IsString()
    imageUrl? :string;

    @IsString()
    address : string;

    @IsString()
    @IsOptional()
    landmark? : string;

    @IsNumber()
    departmentId : number;
}
