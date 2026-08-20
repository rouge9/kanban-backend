import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TeamsModule } from './teams/teams.module';
import { ProjectsModule } from './projects/projects.module';
import { BoardsModule } from './boards/boards.module';
import { ColumnsModule } from './columns/columns.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make env vars available everywhere
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    OrganizationsModule,
    TeamsModule,
    ProjectsModule,
    BoardsModule,
    ColumnsModule,
    TasksModule,
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
