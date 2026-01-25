import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Role } from '../../roles/roles.enum';

export class CreateUserDTO {
  // firstname could be empty
  @IsOptional()
  @IsString()
  firstname: string;
  //   lastName could be empty
  @IsOptional()
  @IsString()
  lastname: string;
  //   Email format
  // should not be empty
  @IsEmail()
  @IsNotEmpty()
  email: string;
  //   password
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  blocked: boolean;
  @IsEnum(Role)
  @IsOptional()
  role: Role;
}