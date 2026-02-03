import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user-dto';
import { UsersService } from './users.service';
import { LoginDTO } from './dto/login-dto';
import { AuthGuard } from './auth/auth.guard';
import { Roles } from 'src/roles/role.decorator';
import { Role } from 'src/roles/roles.enum';
import { RolesGuard } from 'src/roles/roles.guard';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) { }
  @Public()
  @Post('/signup')
  async create(
    @Body()
    createUserDTO: CreateUserDTO,
  ) {
    return await this.userService.signup(createUserDTO);
  }

  @Public()
  @Post('/login')
  async login(
    @Body()
    loginDTO: LoginDTO,
  ) {
    return await this.userService.login(loginDTO);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get('/profile')
  @Roles(Role.Citizen, Role.Officer, Role.Admin)
  async getProfile(@Request() req) {
    return this.userService.getUserProfile(req.user.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Citizen, Role.Officer, Role.Admin)
  @Patch('/profile')
  async updateProfile(@Request() req, @Body() body: any) {
    return this.userService.updateProfile(req.user.id, body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('/officer')
  async createOfficer(@Body() body: any) {
    return this.userService.createOfficer(body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('/departments')
  async getDepartments() {
    return this.userService.findAllDepartments();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('/officers')
  async getOfficers() {
    return this.userService.findAllOfficers();
  }
}