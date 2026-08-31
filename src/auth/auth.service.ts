import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async createSession(userId: string, email: string, role: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await this.prisma.session.create({
      data: { userId, refreshToken: crypto.randomUUID(), expiresAt },
    });

    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        sessionId: session.id,
      },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ||
          '15m') as StringValue,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, email, sessionId: session.id },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ||
          '2d') as StringValue,
      },
    );

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshToken },
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.createSession(user.id, user.email, user.role);
    return { ...tokens, user };
  }

  async signup(dto: CreateUserDto) {
    await this.usersService.create(dto);
    return { message: 'User created successfully' };
  }

  async refreshToken(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) throw new UnauthorizedException('Session not found');

    await this.prisma.session.deleteMany({ where: { id: sessionId } });
    return this.createSession(
      session.userId,
      session.user.email,
      session.user.role,
    );
  }

  async logout(sessionId: string) {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
    return { message: 'Logged out successfully' };
  }
}
