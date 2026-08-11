# Blog API — Beginner's Guide

A complete explanation of this project: what it does, how it's structured, and what every piece of code means.

---

## What Is This Project?

This is a **REST API** for a blog application. It lets you:

- Register and log in as a user
- Create, read, update, and delete blog posts
- Protect certain actions so only logged-in users can do them

It is built with:

| Tool | What it does |
|------|-------------|
| **NestJS** | The main framework — organizes your code into modules |
| **Prisma** | Talks to the database — lets you write TypeScript instead of SQL |
| **PostgreSQL** | The database — stores all your data |
| **Docker** | Runs PostgreSQL in a container so you don't install it manually |
| **JWT** | JSON Web Tokens — how users stay "logged in" |
| **Swagger** | Auto-generates API documentation at `/api/docs` |

---

## How a Request Flows Through the App

Understanding this flow is the most important thing for a beginner:

```
HTTP Request
    │
    ▼
main.ts          ← starts the app, sets up Swagger and CORS
    │
    ▼
AppModule        ← the root module, imports everything
    │
    ▼
Controller       ← receives the request, calls the service
    │
    ▼
Guard (optional) ← checks if the user is logged in (JWT)
    │
    ▼
Service          ← contains the business logic
    │
    ▼
PrismaService    ← talks to the database
    │
    ▼
PostgreSQL       ← stores/retrieves data
    │
    ▼
HTTP Response    ← sent back to the client
```

---

## Project Structure

```
src/
├── main.ts                  ← Entry point, starts the server
├── app.module.ts            ← Root module, wires everything together
├── app.controller.ts        ← Root controller (just a health check)
├── app.service.ts           ← Root service
│
├── prisma/                  ← Database connection
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── auth/                    ← Login and JWT authentication
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── interfaces/
│   │   └── jwt-user.interface.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── dto/
│       └── login.dto.ts
│
├── users/                   ← User CRUD
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── entities/
│       └── user.entity.ts
│
└── posts/                   ← Post CRUD
    ├── posts.module.ts
    ├── posts.controller.ts
    ├── posts.service.ts
    └── dto/
        ├── create-post.dto.ts
        ├── update-post.dto.ts
        └── query-posts.dto.ts
```

---

## Entry Point — `main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: process.env.FRONTEND_URL || '*', credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('Production-ready NestJS + Prisma + PostgreSQL API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
```

**What this does line by line:**

- `NestFactory.create(AppModule)` — creates the entire app from the root module
- `enableCors` — allows browsers from other origins (e.g. a React frontend) to call this API
- `DocumentBuilder` — configures Swagger UI, which gives you a visual page to test all your endpoints at `http://localhost:3000/api/docs`
- `addBearerAuth()` — tells Swagger that some endpoints need a JWT token in the `Authorization: Bearer <token>` header
- `app.listen(port)` — starts the HTTP server on port 3000

---

## Root Module — `app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    UsersModule,
    PostsModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
```

**What this does:**

- `ConfigModule.forRoot({ isGlobal: true })` — loads your `.env` file and makes all environment variables available everywhere in the app without re-importing
- `ValidationPipe` — automatically validates every incoming request body against your DTO rules:
  - `whitelist: true` — strips any extra fields the client sends that aren't in your DTO
  - `forbidNonWhitelisted: true` — throws an error if the client sends unexpected fields
  - `transform: true` — automatically converts strings like `"1"` to numbers where needed

---

## Database Layer — Prisma

### `prisma/schema.prisma`

This file defines your database structure. Think of it as a blueprint for your tables.

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../generated/prisma"
  moduleFormat = "commonjs"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  slug      String   @unique
  content   String
  published Boolean  @default(false)
  viewCount Int      @default(0) @map("view_count")
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int      @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("posts")
}

enum Role {
  USER
  ADMIN
}
```

**Key concepts:**

- `@id @default(autoincrement())` — this field is the primary key and auto-increments (1, 2, 3...)
- `@unique` — no two rows can have the same value for this field
- `String?` — the `?` means this field is optional (nullable)
- `@default(now())` — automatically sets the value to the current timestamp
- `@updatedAt` — Prisma automatically updates this whenever the row changes
- `@map("created_at")` — the TypeScript field is `createdAt` but the actual database column is `created_at`
- `@@map("users")` — the TypeScript model is `User` but the actual database table is `users`
- `Post[]` — a User can have many Posts (one-to-many relationship)
- `@relation(fields: [authorId], references: [id])` — the `authorId` column in `posts` links to the `id` column in `users`

### `prisma/prisma.service.ts`

```typescript
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
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
            this.logger.warn(`Slow query (${event.duration}ms): ${event.query}`);
          }
        },
      );
    }
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**What this does:**

- `extends PrismaClient` — `PrismaService` IS a Prisma client, so you can call `this.prisma.user.findMany()` etc.
- `PrismaPg` — the adapter that connects Prisma to PostgreSQL using the connection string from `.env`
- `OnModuleInit` — NestJS calls `onModuleInit()` automatically when the app starts. We use it to open the database connection
- `OnModuleDestroy` — NestJS calls `onModuleDestroy()` when the app shuts down. We use it to close the connection cleanly
- The slow query logger — in development, if any database query takes more than 100ms, it logs a warning so you can optimize it

### `prisma/prisma.module.ts`

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- `@Global()` — makes `PrismaService` available to every other module without needing to import `PrismaModule` in each one. You only import it once in `AppModule`.

---

## Authentication — How Login Works

Authentication answers the question: **"Who are you?"**

This app uses **JWT (JSON Web Tokens)**. Here's the concept:

1. User sends email + password to `POST /auth/login`
2. Server checks the password against the hashed one in the database
3. If correct, server creates a **JWT token** (a signed string) and sends it back
4. For future requests, the user includes this token in the `Authorization` header
5. The server verifies the token's signature to confirm the user's identity — no database lookup needed

### `auth/auth.service.ts`

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const { password: _password, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
```

**What this does:**

- `bcrypt.compare(password, user.password)` — compares the plain text password the user sent against the hashed password stored in the database. Bcrypt is a one-way hashing algorithm — you can never reverse a hash back to the original password
- `const { password: _password, ...result } = user` — destructures the user object, separating the password field from the rest. The `...result` contains everything except the password, so we never send the password back to the client
- `jwtService.sign(payload)` — creates a JWT token containing the user's `id`, `email`, and `role`. This token is signed with `JWT_SECRET` from `.env`

### `auth/strategies/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

**What this does:**

- This runs automatically on every protected route
- `fromAuthHeaderAsBearerToken()` — extracts the JWT from the `Authorization: Bearer <token>` header
- `ignoreExpiration: false` — rejects tokens that have expired
- `validate(payload)` — after the token signature is verified, this method is called with the decoded payload. Whatever you return here gets attached to `request.user`

### `auth/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

This is a **guard** — it sits in front of a route and decides whether to allow the request through. When you put `@UseGuards(JwtAuthGuard)` on a route, NestJS runs the JWT strategy before the controller method. If the token is invalid or missing, it returns a `401 Unauthorized` response automatically.

### `auth/decorators/current-user.decorator.ts`

```typescript
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtUser }>();
    return request.user;
  },
);
```

After `JwtAuthGuard` runs, the user object is stored on `request.user`. This decorator is a shortcut to extract it directly into a controller parameter. Instead of writing `req.user` everywhere, you write `@CurrentUser() user: JwtUser`.

---

## Users Module

### `users/dto/create-user.dto.ts`

```typescript
export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;
}
```

A **DTO (Data Transfer Object)** defines the shape of data coming into your API. The decorators serve two purposes:

- `@IsEmail()`, `@IsString()`, `@MinLength(8)` — validation rules. If the request body doesn't match, `ValidationPipe` automatically rejects it with a `400 Bad Request`
- `@ApiProperty()` — tells Swagger to show this field in the documentation with an example value
- `!` after the property name — tells TypeScript "this will definitely be assigned" (by the validation pipeline)

### `users/users.service.ts`

```typescript
async create(dto: CreateUserDto) {
  const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new ConflictException('Email already registered');

  const hashedPassword = await bcrypt.hash(dto.password, 12);

  return this.prisma.user.create({
    data: { ...dto, password: hashedPassword },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  });
}
```

**What this does:**

- Checks if the email is already taken before creating the user
- `bcrypt.hash(dto.password, 12)` — hashes the password with a cost factor of 12 (higher = slower = more secure). Passwords are **never** stored as plain text
- `select` — tells Prisma which fields to return. Notice `password` is not in the list — we never send it back

---

## Posts Module

### `posts/dto/query-posts.dto.ts`

```typescript
export class QueryPostsDto {
  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  published?: boolean;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 10)
  limit?: number = 10;
}
```

Query parameters from URLs are always strings (e.g. `?page=2&published=true`). The `@Transform` decorator converts them to the correct types — `"2"` becomes `2`, `"true"` becomes `true`.

### `posts/posts.service.ts` — findAll with pagination

```typescript
async findAll(query: QueryPostsDto) {
  const { published, search, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = {};
  if (published !== undefined) where.published = published;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [posts, total] = await Promise.all([
    this.prisma.post.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    this.prisma.post.count({ where }),
  ]);

  return {
    data: posts,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
```

**What this does:**

- `skip = (page - 1) * limit` — pagination math. Page 1 skips 0 records, page 2 skips 10, page 3 skips 20, etc.
- `Prisma.PostWhereInput` — the proper TypeScript type for Prisma's `where` clause, avoiding `any`
- `where.OR` — searches both `title` and `content` for the search term, case-insensitively
- `Promise.all([...])` — runs both database queries **at the same time** instead of one after the other, which is faster
- The response includes a `meta` object with pagination info so the frontend knows how many pages there are

### View count increment

```typescript
this.prisma.post
  .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
  .catch(() => {});
```

This is a **fire-and-forget** pattern. The view count update runs in the background — we don't `await` it and we silently ignore errors with `.catch(() => {})`. This means the user gets their response immediately without waiting for the view count to update.

---

## Infrastructure

### `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: blog_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: blog_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d blog_db']
      interval: 5s
      retries: 10
```

**What this does:**

- `image: postgres:17-alpine` — uses the official PostgreSQL 17 Docker image (alpine = small size)
- `environment` — sets the database username, password, and database name
- `ports: '5432:5432'` — maps port 5432 on your machine to port 5432 inside the container, so your app can connect via `localhost:5432`
- `volumes` — persists the database data on your machine so it survives container restarts
- `healthcheck` — Docker waits until Postgres is actually ready to accept connections before starting the API container

### `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blog_db"
PORT=3000
NODE_ENV=development
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

- `DATABASE_URL` — the connection string. Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- `JWT_SECRET` — the secret key used to sign and verify JWT tokens. Change this to a long random string in production
- `JWT_EXPIRES_IN` — how long a token is valid. `"7d"` means 7 days

### `prisma.config.ts`

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
```

In Prisma 7, the database URL for migrations is configured here instead of in `schema.prisma`. The `import "dotenv/config"` loads `.env` so `process.env.DATABASE_URL` is available.

---

## NestJS Core Concepts Explained

### Modules

Every feature is wrapped in a module. A module groups related controllers, services, and providers together.

```typescript
@Module({
  imports: [],      // other modules this module depends on
  providers: [],    // services (injectable classes)
  controllers: [],  // controllers (handle HTTP requests)
  exports: [],      // services to share with other modules
})
```

### Dependency Injection

NestJS manages creating instances of your classes. You never write `new UsersService()` — you just declare it in the constructor and NestJS injects it:

```typescript
constructor(private usersService: UsersService) {}
// NestJS automatically creates and injects UsersService
```

For this to work, `UsersService` must be listed as a `provider` in its module, and if another module needs it, it must be in `exports`.

### Controllers vs Services

- **Controller** — handles the HTTP layer. It receives requests, extracts data (body, params, query), calls the service, and returns the response. It should contain no business logic.
- **Service** — contains all the business logic. It talks to the database, applies rules, and returns data. It knows nothing about HTTP.

This separation makes your code easier to test and maintain.

---

## API Endpoints

| Method | URL | Auth Required | Description |
|--------|-----|---------------|-------------|
| POST | `/auth/login` | No | Login, returns JWT token |
| POST | `/users` | No | Register a new user |
| GET | `/users` | No | Get all users |
| GET | `/users/:id` | No | Get user by ID |
| PATCH | `/users/:id` | No | Update user |
| DELETE | `/users/:id` | No | Delete user |
| POST | `/posts` | Yes | Create a post |
| GET | `/posts` | No | Get all posts (with pagination) |
| GET | `/posts/:slug` | No | Get post by slug |
| PATCH | `/posts/:id` | Yes | Update your post |
| DELETE | `/posts/:id` | Yes | Delete your post |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker compose up -d postgres

# 3. Run database migrations (creates tables)
npx prisma migrate dev --name init

# 4. Generate Prisma client
npx prisma generate

# 5. Start the app
npm run start:dev
```

### Useful URLs

- API: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api/docs`
- Prisma Studio (database GUI): `npx prisma studio --url "postgresql://postgres:postgres@localhost:5432/blog_db"`

### Common Commands

```bash
# Start postgres container
docker compose up -d postgres

# Stop postgres container
docker compose down

# Reset database (drops all data and re-runs migrations)
npx prisma migrate reset

# Open database GUI
npx prisma studio --url "postgresql://postgres:postgres@localhost:5432/blog_db"

# Run in development (auto-restarts on file changes)
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

---

## How to Test the API

1. Start the app with `npm run start:dev`
2. Open `http://localhost:3000/api/docs` in your browser
3. Create a user: click `POST /users` → "Try it out" → fill in email and password → Execute
4. Login: click `POST /auth/login` → enter the same email and password → Execute → copy the `access_token` from the response
5. Authorize: click the "Authorize" button at the top of the Swagger page → paste the token → Authorize
6. Now you can call protected endpoints like `POST /posts`
