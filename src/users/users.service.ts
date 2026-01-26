import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user-dto';
import { SignupResponse } from './user';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { LoginDTO } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }
  async signup(payload: CreateUserDTO): Promise<SignupResponse> {
    console.log("Signup Payload:", payload);
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: payload.email,
      },
    });
    if (existingUser) {
      throw new BadRequestException(
        'User created with the email you provided',
        {
          cause: new Error(),
          description: 'user is already registered',
        },
      );
    }
    const hash = await this.encryptPassword(payload.password, 10);



    return await this.prisma.user.create({
      data: {
        ...payload,
        password: hash,
      },
      select: {
        email: true,
        id: true,
      },
    });
  }

  async login(loginDTO: LoginDTO): Promise<{ accessToken: string }> {
    // find user based on email
    const user = await this.prisma.user.findFirst({
      where: {
        email: loginDTO.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const isMatched = await this.decryptPassword(
      loginDTO.password,
      user.password,
    );
    if (!isMatched) {
      throw new UnauthorizedException('Invalid password');
    }
    // match the user provided password with decrypted
    // if password not matched then send the error invalid password
    const accessToken = await this.jwtService.signAsync(
      {
        email: user.email,
        id: user.id,
        role: user.role,
      },
      { expiresIn: '1d' },
    );
    // return json web token
    return { accessToken };
  }

  async encryptPassword(plainText, saltRounds) {
    return await bcrypt.hash(plainText, saltRounds);
  }
  async decryptPassword(plainText, hash) {
    return await bcrypt.compare(plainText, hash);
  }

  async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        officer: {
          include: {
            department: true,
          }
        }
      }
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: number, payload: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: payload,
    });
    const { password, ...result } = user;
    return result;
  }
}