import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make env vars available everywhere
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    PostsModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // Strip properties without decorators
        forbidNonWhitelisted: true, // Throw error on extra properties
        transform: true, // Auto-transform payloads to DTO instances
      }),
    },
  ],
})
export class AppModule {}
