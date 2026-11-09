import type { ProjectOptions } from "../types/index.ts";
import type { FileMap } from "../utils/fs.ts";
import { runScript } from "./common.ts";

/*
 * NestJS stack: Next.js (App Router, TypeScript) client + NestJS API.
 *
 * Same depth bar as the FastAPI template:
 *   - layered Nest modules (controller → service → TypeORM repository)
 *   - real auth: argon2 hashing, JWT access/refresh with rotation and revocation
 *   - TypeORM entities + a production migration + dev sync
 *   - Jest e2e suite on an in-memory SQLite database, ESLint, strict tsc
 *   - the shared Next.js client signs up, signs in and loads /api/auth/me
 */

const SERVER_PACKAGE_JSON = `{
  "name": "server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "dev": "nest start --watch",
    "start:prod": "node dist/main.js",
    "lint": "eslint \\"{src,test}/**/*.ts\\" && tsc --noEmit",
    "format": "prettier --write \\"{src,test}/**/*.ts\\"",
    "test": "jest --runInBand",
    "typecheck": "tsc --noEmit",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/database/data-source.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/typeorm": "^11.0.0",
    "argon2": "^0.44.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "dotenv": "^16.4.7",
    "pg": "^8.13.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.28",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/better-sqlite3": "^7.6.12",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.0",
    "@types/supertest": "^6.0.2",
    "better-sqlite3": "^11.8.1",
    "eslint": "^9.18.0",
    "jest": "^29.7.0",
    "prettier": "^3.4.2",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "testRegex": "test/.*\\\\.e2e-spec\\\\.ts$",
    "transform": {
      "^.+\\\\.(t|j)s$": ["ts-jest", { "tsconfig": "tsconfig.json" }]
    },
    "testEnvironment": "node"
  }
}
`;

const SERVER_TSCONFIG = `{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node", "jest"]
  }
}
`;

const SERVER_TSCONFIG_BUILD = `{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
`;

const NEST_CLI_JSON = `{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
`;

const ESLINT_CONFIG = `import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
`;

const PRETTIER_CONFIG = `{
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100
}
`;

const ENV_EXAMPLE = `# Copy to server/.env (NestJS reads it through @nestjs/config).
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Postgres — started by \`docker compose up -d\`.
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stackit

# Dev creates/updates tables on boot. In production set this to false and run
#   npm run migration:run
TYPEORM_SYNC=true

# Must be at least 32 characters. Generate one:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET=dev-only-change-me-replace-before-production-32b
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
`;

const MAIN_TS = `import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: config.get<string>("CLIENT_URL"),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>("PORT") ?? 5000;
  await app.listen(port);
  console.log("API listening on http://localhost:" + port);
}

void bootstrap();
`;

const ENV_TS = `import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  TYPEORM_SYNC: z.enum(["true", "false"]).default("true"),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRE_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_EXPIRE_DAYS: z.coerce.number().int().positive().default(7),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => issue.path.join(".") + ": " + issue.message)
      .join("; ");
    throw new Error("Invalid environment configuration — " + issues);
  }
  return parsed.data;
}
`;

const APP_MODULE_TS = `import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "./auth/auth.module";
import { validateEnv } from "./config/env";
import { HealthModule } from "./health/health.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        url: config.getOrThrow<string>("DATABASE_URL"),
        autoLoadEntities: true,
        synchronize: config.get<string>("TYPEORM_SYNC") === "true",
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
`;

const EXCEPTION_FILTER_TS = `import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

/** Map every error to the API's single error shape: { detail: string }. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      let detail = exception.message;

      if (typeof body === "string") {
        detail = body;
      } else if (typeof body === "object" && body !== null) {
        const payload = body as { message?: string | string[]; error?: string };
        if (Array.isArray(payload.message)) detail = payload.message.join(", ");
        else if (typeof payload.message === "string") detail = payload.message;
        else if (typeof payload.error === "string") detail = payload.error;
      }

      response.status(status).json({ detail });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ detail: "Internal server error" });
  }
}
`;

const CURRENT_USER_TS = `import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import type { User } from "../users/user.entity";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest<Request & { user: User }>();
    return request.user;
  },
);
`;

const USER_ENTITY_TS = `import { randomUUID } from "node:crypto";

import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryColumn("varchar", { length: 36 })
  id: string = randomUUID();

  @Column({ unique: true })
  email!: string;

  @Column({ name: "full_name", length: 80 })
  fullName!: string;

  @Column({ name: "hashed_password" })
  hashedPassword!: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
`;

const USER_RESPONSE_TS = `import type { User } from "./user.entity";

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

/** The API speaks snake_case; entities stay camelCase. */
export function presentUser(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    is_active: user.isActive,
    created_at: new Date(user.createdAt).toISOString(),
  };
}
`;

const USERS_SERVICE_TS = `import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async list(): Promise<User[]> {
    return this.users.find({ order: { createdAt: "DESC" } });
  }
}
`;

const USERS_CONTROLLER_TS = `import { Controller, Get, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { presentUser, type UserResponse } from "./user-response";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(): Promise<UserResponse[]> {
    const users = await this.users.list();
    return users.map(presentUser);
  }
}
`;

const USERS_MODULE_TS = `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { User } from "./user.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
`;

const REFRESH_TOKEN_ENTITY_TS = `import { randomUUID } from "node:crypto";

import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryColumn("varchar", { length: 36 })
  id: string = randomUUID();

  @Column({ name: "user_id", length: 36 })
  userId!: string;

  @Column({ unique: true, length: 64 })
  jti!: string;

  @Column({ default: false })
  revoked!: boolean;

  @Column({ name: "expires_at" })
  expiresAt!: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
`;

const TOKEN_TYPES_TS = `export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface JwtPayload {
  sub: string;
  type: "access" | "refresh";
  jti: string;
}
`;

const AUTH_DTO_TS = `import { IsEmail, IsString, Length, MinLength } from "class-validator";

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 80)
  full_name!: string;

  @IsString()
  @Length(8, 128)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 128)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(1)
  refresh_token!: string;
}
`;

const AUTH_SERVICE_TS = `import { randomUUID } from "node:crypto";

import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { Repository } from "typeorm";

import { User } from "../users/user.entity";
import type { SignupDto } from "./dto/auth.dto";
import { RefreshToken } from "./refresh-token.entity";
import type { JwtPayload, TokenPair } from "./token.types";

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly accessMinutes: number;
  private readonly refreshDays: number;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.jwtSecret = config.getOrThrow<string>("JWT_SECRET");
    this.accessMinutes = config.get<number>("ACCESS_TOKEN_EXPIRE_MINUTES") ?? 15;
    this.refreshDays = config.get<number>("REFRESH_TOKEN_EXPIRE_DAYS") ?? 7;
  }

  async signup(input: SignupDto): Promise<User> {
    const email = input.email.toLowerCase();
    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException("Email already registered");
    }

    const user = this.users.create({
      email,
      fullName: input.full_name,
      hashedPassword: await argon2.hash(input.password),
    });

    try {
      return await this.users.save(user);
    } catch {
      throw new ConflictException("Email already registered");
    }
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !(await argon2.verify(user.hashedPassword, password))) {
      throw new UnauthorizedException("Incorrect email or password");
    }
    if (!user.isActive) {
      throw new UnauthorizedException("Inactive user");
    }
    return this.issueTokens(user);
  }

  async issueTokens(user: User): Promise<TokenPair> {
    const access_token = await this.sign(user.id, "access", this.accessMinutes * 60);

    const jti = randomUUID();
    const refresh_token = await this.sign(user.id, "refresh", this.refreshDays * 86400, jti);
    const expiresAt = new Date(Date.now() + this.refreshDays * 86400 * 1000);

    await this.refreshTokens.save(this.refreshTokens.create({ userId: user.id, jti, expiresAt }));

    return {
      access_token,
      refresh_token,
      token_type: "bearer",
      expires_in: this.accessMinutes * 60,
    };
  }

  async rotate(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefresh(refreshToken);

    const stored = await this.refreshTokens.findOne({ where: { jti: payload.jti } });
    if (!stored || stored.revoked) {
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    stored.revoked = true;
    await this.refreshTokens.save(stored);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    let payload: JwtPayload;
    try {
      payload = await this.verifyRefresh(refreshToken);
    } catch {
      return; // logout is idempotent: unknown or expired tokens are a no-op
    }

    const stored = await this.refreshTokens.findOne({ where: { jti: payload.jti } });
    if (stored && !stored.revoked) {
      stored.revoked = true;
      await this.refreshTokens.save(stored);
    }
  }

  private sign(
    sub: string,
    type: "access" | "refresh",
    expiresIn: number,
    jti: string = randomUUID(),
  ): Promise<string> {
    const payload: JwtPayload = { sub, type, jti };
    return this.jwt.signAsync(payload, { secret: this.jwtSecret, expiresIn });
  }

  private async verifyRefresh(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, { secret: this.jwtSecret });
      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Expected a refresh token");
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
`;

const JWT_AUTH_GUARD_TS = `import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import type { Request } from "express";
import { Repository } from "typeorm";

import { User } from "../users/user.entity";
import type { JwtPayload } from "./token.types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly secret: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    this.secret = config.getOrThrow<string>("JWT_SECRET");
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Not authenticated");
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(header.slice(7), { secret: this.secret });
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    if (payload.type !== "access") {
      throw new UnauthorizedException("Expected an access token");
    }

    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    request.user = user;
    return true;
  }
}
`;

const AUTH_CONTROLLER_TS = `import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../common/current-user.decorator";
import { User } from "../users/user.entity";
import { presentUser, type UserResponse } from "../users/user-response";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto, SignupDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { TokenPair } from "./token.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  async signup(@Body() input: SignupDto): Promise<UserResponse> {
    return presentUser(await this.auth.signup(input));
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() input: LoginDto): Promise<TokenPair> {
    return this.auth.login(input.email, input.password);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() input: RefreshDto): Promise<TokenPair> {
    return this.auth.rotate(input.refresh_token);
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Body() input: RefreshDto): Promise<{ message: string }> {
    await this.auth.logout(input.refresh_token);
    return { message: "Logged out" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User): UserResponse {
    return presentUser(user);
  }
}
`;

const AUTH_MODULE_TS = `import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "../users/user.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RefreshToken } from "./refresh-token.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken]), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
`;

const HEALTH_CONTROLLER_TS = `import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

const startedAt = Date.now();

@Controller("health")
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  health(): { status: string; uptime: number } {
    return { status: "ok", uptime: Number(((Date.now() - startedAt) / 1000).toFixed(3)) };
  }

  @Get("ready")
  async ready(): Promise<{ status: string; database: string }> {
    try {
      await this.dataSource.query("SELECT 1");
    } catch {
      throw new ServiceUnavailableException("database unavailable");
    }
    return { status: "ready", database: "ok" };
  }
}
`;

const HEALTH_MODULE_TS = `import { Module } from "@nestjs/common";

import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
`;

const DATA_SOURCE_TS = `import "dotenv/config";
import "reflect-metadata";

import { DataSource } from "typeorm";

import { RefreshToken } from "../auth/refresh-token.entity";
import { User } from "../users/user.entity";
import { InitialSchema1730000000000 } from "./migrations/1730000000000-InitialSchema";

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/stackit",
  entities: [User, RefreshToken],
  migrations: [InitialSchema1730000000000],
  synchronize: false,
});
`;

const INITIAL_MIGRATION_TS = `import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1730000000000 implements MigrationInterface {
  name = "InitialSchema1730000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "users" ("id" character varying(36) NOT NULL, "email" character varying NOT NULL, "full_name" character varying(80) NOT NULL, "hashed_password" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_users" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE TABLE "refresh_tokens" ("id" character varying(36) NOT NULL, "user_id" character varying(36) NOT NULL, "jti" character varying(64) NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_refresh_tokens_jti" UNIQUE ("jti"), CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_refresh_tokens_user_id"');
    await queryRunner.query('DROP TABLE "refresh_tokens"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
`;

const E2E_TEST_TS = `import "reflect-metadata";

import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import request from "supertest";

import { AuthModule } from "../src/auth/auth.module";
import { RefreshToken } from "../src/auth/refresh-token.entity";
import { HttpExceptionFilter } from "../src/common/http-exception.filter";
import { validateEnv } from "../src/config/env";
import { HealthModule } from "../src/health/health.module";
import { User } from "../src/users/user.entity";
import { UsersModule } from "../src/users/users.module";

const PASSWORD = "correct-horse-battery";

/** Distinct emails per test: all tests share one in-memory database. */
function signupPayload(email: string) {
  return { email, full_name: "Ada Lovelace", password: PASSWORD };
}

describe("API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: (env) =>
            validateEnv({
              ...env,
              DATABASE_URL: "postgres://unused-in-tests",
              JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
            }),
        }),
        TypeOrmModule.forRoot({
          type: "better-sqlite3",
          database: ":memory:",
          entities: [User, RefreshToken],
          synchronize: true,
        }),
        HealthModule,
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("serves health", async () => {
    const response = await request(app.getHttpServer()).get("/api/health").expect(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("runs the full auth flow", async () => {
    const SIGNUP = signupPayload("ada@example.com");
    const signup = await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send(SIGNUP)
      .expect(201);
    expect(signup.body.email).toBe(SIGNUP.email);
    expect(signup.body.full_name).toBe(SIGNUP.full_name);
    expect(signup.body.hashed_password).toBeUndefined();

    await request(app.getHttpServer()).post("/api/auth/signup").send(SIGNUP).expect(409);

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: SIGNUP.email, password: SIGNUP.password })
      .expect(200);

    const tokens = login.body;
    const auth = { Authorization: "Bearer " + tokens.access_token };

    const me = await request(app.getHttpServer()).get("/api/auth/me").set(auth).expect(200);
    expect(me.body.full_name).toBe(SIGNUP.full_name);

    const refreshed = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refresh_token: tokens.refresh_token })
      .expect(200);

    // Rotation: the old refresh token must be dead.
    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refresh_token: tokens.refresh_token })
      .expect(401);

    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .send({ refresh_token: refreshed.body.refresh_token })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refresh_token: refreshed.body.refresh_token })
      .expect(401);
  });

  it("rejects a bad password", async () => {
    const SIGNUP = signupPayload("grace@example.com");
    await request(app.getHttpServer()).post("/api/auth/signup").send(SIGNUP).expect(201);
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: SIGNUP.email, password: "wrong-password" })
      .expect(401);
  });

  it("requires a token for /me", async () => {
    await request(app.getHttpServer()).get("/api/auth/me").expect(401);
  });

  it("validates the signup payload", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/signup")
      .send({ email: "not-an-email", full_name: "", password: "short" })
      .expect(400);
  });

  it("protects the users endpoint", async () => {
    await request(app.getHttpServer()).get("/api/users").expect(401);

    const SIGNUP = signupPayload("linus@example.com");
    await request(app.getHttpServer()).post("/api/auth/signup").send(SIGNUP).expect(201);
    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: SIGNUP.email, password: SIGNUP.password })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get("/api/users")
      .set({ Authorization: "Bearer " + login.body.access_token })
      .expect(200);
    expect(response.body.length).toBeGreaterThanOrEqual(3);
    expect(response.body.some((user: { email: string }) => user.email === SIGNUP.email)).toBe(true);
    expect(response.body[0].hashed_password).toBeUndefined();
  });
});
`;

const COMPOSE = `services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: stackit
    volumes: ["pg-data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d stackit"]
      interval: 5s
      timeout: 3s
      retries: 10
volumes:
  pg-data:
`;

/** Root .gitignore additions for the NestJS + Next.js layout. */
export const NESTJS_GITIGNORE_EXTRA = `# next.js
.next/
next-env.d.ts

# nest.js / typescript
*.tsbuildinfo
`;

/** Root package.json wiring the Next.js client and the NestJS API together. */
export function nestjsRootPackageJson(o: ProjectOptions): string {
  const pm = o.packageManager;
  return (
    JSON.stringify(
      {
        name: o.projectName,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: `concurrently "cd server && ${runScript(pm, "dev")}" "cd client && ${runScript(pm, "dev")}"`,
          "dev:api": `cd server && ${runScript(pm, "dev")}`,
          "dev:client": `cd client && ${runScript(pm, "dev")}`,
          "db:up": "docker compose up -d",
          "db:down": "docker compose down",
          "db:migrate": `cd server && ${runScript(pm, "migration:run")}`,
          test: `cd server && ${runScript(pm, "test")}`,
          lint: `cd server && ${runScript(pm, "lint")}`,
          format: `cd server && ${runScript(pm, "format")}`,
          build: `cd server && ${runScript(pm, "build")} && cd ../client && ${runScript(pm, "build")}`,
        },
        devDependencies: { concurrently: "^9.1.2" },
      },
      null,
      2,
    ) + "\n"
  );
}

/** NestJS modules + TypeORM entities; the Next.js client is shared with FastAPI. */
export function nestjsFiles(o: ProjectOptions): FileMap {
  return {
    "server/package.json": SERVER_PACKAGE_JSON,
    "server/tsconfig.json": SERVER_TSCONFIG,
    "server/tsconfig.build.json": SERVER_TSCONFIG_BUILD,
    "server/nest-cli.json": NEST_CLI_JSON,
    "server/eslint.config.mjs": ESLINT_CONFIG,
    "server/.prettierrc": PRETTIER_CONFIG,
    "server/.env.example": ENV_EXAMPLE,
    "server/src/main.ts": MAIN_TS,
    "server/src/app.module.ts": APP_MODULE_TS,
    "server/src/config/env.ts": ENV_TS,
    "server/src/common/http-exception.filter.ts": EXCEPTION_FILTER_TS,
    "server/src/common/current-user.decorator.ts": CURRENT_USER_TS,
    "server/src/users/user.entity.ts": USER_ENTITY_TS,
    "server/src/users/user-response.ts": USER_RESPONSE_TS,
    "server/src/users/users.service.ts": USERS_SERVICE_TS,
    "server/src/users/users.controller.ts": USERS_CONTROLLER_TS,
    "server/src/users/users.module.ts": USERS_MODULE_TS,
    "server/src/auth/refresh-token.entity.ts": REFRESH_TOKEN_ENTITY_TS,
    "server/src/auth/token.types.ts": TOKEN_TYPES_TS,
    "server/src/auth/dto/auth.dto.ts": AUTH_DTO_TS,
    "server/src/auth/auth.service.ts": AUTH_SERVICE_TS,
    "server/src/auth/auth.controller.ts": AUTH_CONTROLLER_TS,
    "server/src/auth/auth.module.ts": AUTH_MODULE_TS,
    "server/src/auth/jwt-auth.guard.ts": JWT_AUTH_GUARD_TS,
    "server/src/health/health.controller.ts": HEALTH_CONTROLLER_TS,
    "server/src/health/health.module.ts": HEALTH_MODULE_TS,
    "server/src/database/data-source.ts": DATA_SOURCE_TS,
    "server/src/database/migrations/1730000000000-InitialSchema.ts": INITIAL_MIGRATION_TS,
    "server/test/app.e2e-spec.ts": E2E_TEST_TS,
    "docker-compose.yml": COMPOSE,
  };
}

export function nestjsReadme(o: ProjectOptions): string {
  const pm = o.packageManager;
  return `# ${o.projectName}

Scaffolded with **stackit** — \`nestjs\` (Node 20+, Next.js App Router client).

A working full-stack app, not a folder of TODOs: real auth (argon2 + JWT with
refresh-token rotation), a protected endpoint, Postgres via TypeORM, a
production migration, and a Next.js client that signs up, signs in and loads
\`/api/auth/me\`.

## Structure

\`\`\`
${o.projectName}/
├── client/                       # Next.js App Router (rewrites /api → :5000)
│   ├── app/
│   │   ├── layout.tsx            # root layout + metadata
│   │   ├── page.tsx              # sign in / sign up / profile
│   │   └── globals.css
│   ├── lib/api.ts                # typed client, token refresh on 401
│   └── next.config.ts            # /api/:path* → NestJS
├── server/                       # NestJS + TypeORM + Postgres
│   ├── src/
│   │   ├── main.ts               # bootstrap, CORS, validation, error filter
│   │   ├── app.module.ts         # config + TypeORM wiring
│   │   ├── config/env.ts         # zod-validated environment
│   │   ├── auth/                 # controller, service, JWT guard, DTOs
│   │   ├── users/                # entity, service, protected controller
│   │   ├── health/               # /api/health + /api/health/ready
│   │   ├── common/               # { detail } exception filter, decorator
│   │   └── database/             # data source + initial migration
│   └── test/app.e2e-spec.ts      # Jest e2e on in-memory SQLite
├── docker-compose.yml
└── .env.example
\`\`\`

## Quickstart

\`\`\`bash
cd ${o.projectName}
cp .env.example server/.env
docker compose up -d                       # Postgres on :5432
${pm} run dev                              # API :5000 + Next.js :3000
\`\`\`

Open **http://localhost:3000**, click *Sign up*, and you are signed in.

- Client: http://localhost:3000
- API: http://localhost:5000/api/health
- Readiness: http://localhost:5000/api/health/ready

> Dev mode keeps the schema in sync (\`TYPEORM_SYNC=true\`). For production set it
> to \`false\`, set a real \`JWT_SECRET\`, then run \`${pm} run db:migrate\`.

## Auth endpoints

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | \`/api/auth/signup\` | 201 + user (argon2 hashed password) |
| POST | \`/api/auth/login\` | 200 + access + refresh token |
| POST | \`/api/auth/refresh\` | rotates the refresh token, revokes the old one |
| POST | \`/api/auth/logout\` | revokes the refresh token |
| GET | \`/api/auth/me\` | protected — needs \`Authorization: Bearer <access>\` |

Access tokens last 15 minutes, refresh tokens 7 days and are stored in the
database so they can be revoked. A 401 on any request makes the client refresh
once and replay the call.

## Scripts

| Command | What it does |
| ------- | ------------ |
| \`${pm} run dev\` | NestJS (watch) + Next.js together |
| \`${pm} run test\` | Jest e2e: auth flow, validation, protected routes, rotation |
| \`${pm} run lint\` | ESLint + \`tsc --noEmit\` |
| \`${pm} run format\` | Prettier |
| \`${pm} run db:migrate\` | TypeORM migrations |
| \`${pm} run build\` | production NestJS + Next.js builds |

## Layout rules

- Controllers only parse input and shape responses; services own the logic.
- \`JwtAuthGuard\` is the only way to read the caller — no ad-hoc token parsing.
- Every error becomes \`{ "detail": "..." }\`, which keeps one client error path.
- Entities stay camelCase; \`presentUser()\` maps to the API's snake_case contract.
- \`synchronize\` is a dev shortcut; migrations are the source of truth in production.
`;
}
