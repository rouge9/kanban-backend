import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtRefreshPayload } from '../interfaces/jwt-user.interface';
import type { SessionModel } from 'generated/prisma/models';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
    });
  }

  async validate(payload: JwtRefreshPayload) {
    const session = await (this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    }) as Promise<SessionModel | null>);

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    return { sessionId: session.id, userId: session.userId };
  }
}
