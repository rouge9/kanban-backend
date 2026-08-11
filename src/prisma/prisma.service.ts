import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from 'generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'development') {
      (this.$on as (event: string, cb: (e: Prisma.QueryEvent) => void) => void)(
        'query',
        (event: Prisma.QueryEvent) => {
          if (event.duration > 100) {
            this.logger.warn(
              `Slow query (${event.duration}ms): ${event.query}`,
            );
          }
        },
      );
    }

    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    const models = Reflect.ownKeys(this).filter(
      (key) =>
        typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
    );
    return Promise.all(
      models.map((modelKey) =>
        (
          this as unknown as Record<
            string,
            { deleteMany: () => Promise<unknown> }
          >
        )[modelKey as string].deleteMany(),
      ),
    );
  }
}
