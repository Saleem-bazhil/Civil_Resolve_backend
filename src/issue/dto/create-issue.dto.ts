import { IsString,IsOptional,IsNumber } from "class-validator";

export class CreateIssueDto {
    @IsString()
    title :String;
    @IsString()
    description :String;
    @IsOptional()
    @IsString()
    imageUrl? :String;
    @IsString()
    address : String;
    @IsString()
    @IsOptional()
    landmark? : String;
    @IsNumber()
    departmentId : number;
}
