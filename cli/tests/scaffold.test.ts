import { describe, expect, test } from "bun:test";
import { STACK_IDS, getStack, isSupportedCombo } from "../src/config/stacks.ts";
import { buildFileMap } from "../src/generators/index.ts";
import type { ProjectOptions } from "../src/types/index.ts";

function opts(over: Partial<ProjectOptions> = {}): ProjectOptions {
  return {
    projectName: "demo",
    stack: "mern",
    language: "typescript",
    runtime: "bun",
    packageManager: "bun",
    install: false,
    git: false,
    targetDir: "/tmp/demo",
    ...over,
  };
}

describe("stack registry", () => {
  test("ships six stacks", () => {
    expect(STACK_IDS).toEqual(["mern", "pern", "hono-pg", "go-fiber", "fastapi", "nestjs"]);
  });

  test("go-fiber only supports go", () => {
    expect(getStack("go-fiber").languages).toEqual(["go"]);
    expect(isSupportedCombo("go-fiber", "go", "go")).toBe(true);
    expect(isSupportedCombo("mern", "go", "go")).toBe(false);
    expect(isSupportedCombo("mern", "typescript", "bun")).toBe(true);
  });

  test("nestjs is typescript on node and still lets you pick a pm", () => {
    const def = getStack("nestjs");
    expect(def.label).toBe("NestJS + Next.js");
    expect(def.frontend).toBe("nextjs");
    expect(def.languages).toEqual(["typescript"]);
    expect(def.runtimes).toEqual(["node"]);
    expect(def.packageManagers).toEqual(["npm", "pnpm", "yarn", "bun"]);
    expect(isSupportedCombo("nestjs", "typescript", "node")).toBe(true);
    expect(isSupportedCombo("nestjs", "javascript", "node")).toBe(false);
  });

  test("fastapi is python for the server and lets you pick a client pm", () => {
    const def = getStack("fastapi");
    expect(def.languages).toEqual(["python"]);
    expect(def.runtimes).toEqual(["python"]);
    expect(def.packageManagers).toEqual(["npm", "pnpm", "yarn", "bun"]);
    expect(isSupportedCombo("fastapi", "python", "python")).toBe(true);
    expect(isSupportedCombo("fastapi", "typescript", "python")).toBe(false);
  });
});

describe("buildFileMap", () => {
  test("mern/typescript has layered express + mongo + vite client", () => {
    const files = buildFileMap(opts());
    const keys = Object.keys(files);
    for (const f of [
      "client/src/App.tsx",
      "client/src/lib/api.ts",
      "server/src/app.ts",
      "server/src/config/db.ts",
      "server/src/models/user.ts",
      "server/src/routes/users.ts",
      "server/src/middlewares/validate.ts",
      "docker-compose.yml",
      "README.md",
    ]) {
      expect(keys).toContain(f);
    }
    expect(files["server/package.json"]).toContain("mongoose");
    expect(files["server/package.json"]).not.toContain("pg");
  });

  test("pern/javascript uses js/jsx and pg", () => {
    const files = buildFileMap(
      opts({ stack: "pern", language: "javascript", runtime: "node", packageManager: "npm" }),
    );
    expect(Object.keys(files)).toContain("server/src/app.js");
    expect(Object.keys(files)).toContain("client/src/App.jsx");
    expect(files["server/package.json"]).toContain('"pg"');
    expect(files["server/package.json"]).not.toContain("mongoose");
  });

  test("root scripts avoid npm-only --prefix (work under bun/pnpm/yarn)", () => {
    for (const pm of ["npm", "pnpm", "yarn", "bun"] as const) {
      const files = buildFileMap(opts({ packageManager: pm }));
      const root = JSON.parse(files["package.json"] as string);
      expect(root.scripts.dev).toContain("cd client");
      expect(root.scripts.dev).not.toContain("--prefix");
      expect(root.scripts.build).not.toContain("--prefix");
    }
  });

  test("generated TS uses .js import specifiers (never .ts/.tsx)", () => {
    const files = buildFileMap(opts());
    for (const [name, content] of Object.entries(files)) {
      if (!/\.(ts|tsx)$/.test(name)) continue;
      const bad = (content as string)
        .split("\n")
        .filter((l) => /^\s*import .* from ["']\.\.?\//.test(l) && /\.(ts|tsx)["']/.test(l));
      expect(bad, name).toEqual([]);
    }
  });

  test("generated JS contains no TypeScript syntax", () => {
    const files = buildFileMap(
      opts({ stack: "pern", language: "javascript", runtime: "node", packageManager: "npm" }),
    );
    for (const [name, content] of Object.entries(files)) {
      if (!name.endsWith(".js") && !name.endsWith(".jsx")) continue;
      expect(content as string, `${name}: return-type annotation`).not.toMatch(/\)\s*:\s*Promise</);
      expect(content as string, `${name}: typed declaration`).not.toMatch(/(let|const|function \w+)\s+\w+\s*:\s*[A-Z]/);
    }
  });

  test("hono-pg uses hono with runtime-specific entry", () => {
    const bunFiles = buildFileMap(opts({ stack: "hono-pg", runtime: "bun" }));
    expect(bunFiles["server/src/index.ts"]).toContain("fetch: app.fetch");
    expect(bunFiles["server/src/index.ts"]).not.toContain("@hono/node-server");

    const nodeFiles = buildFileMap(
      opts({ stack: "hono-pg", runtime: "node", packageManager: "npm" }),
    );
    expect(nodeFiles["server/src/index.ts"]).toContain("@hono/node-server");
    expect(nodeFiles["server/package.json"]).toContain("@hono/zod-validator");
  });

  test("go-fiber emits go server + ts client + makefile", () => {
    const files = buildFileMap(opts({ stack: "go-fiber", language: "go", runtime: "go" }));
    const keys = Object.keys(files);
    for (const f of [
      "server/go.mod",
      "server/cmd/api/main.go",
      "server/internal/handlers/users.go",
      "server/internal/routes/routes.go",
      "Makefile",
      "client/src/App.tsx",
    ]) {
      expect(keys).toContain(f);
    }
  });

  test("fastapi emits typed python api, migrations, tests and a Next.js auth client", () => {
    const files = buildFileMap(opts({ stack: "fastapi", language: "python", runtime: "python" }));
    const keys = Object.keys(files);
    for (const f of [
      "server/app/main.py",
      "server/app/core/config.py",
      "server/app/core/security.py",
      "server/app/db/session.py",
      "server/app/models/user.py",
      "server/app/models/refresh_token.py",
      "server/app/schemas/user.py",
      "server/app/services/auth.py",
      "server/app/api/deps.py",
      "server/app/api/routes/auth.py",
      "server/alembic.ini",
      "server/alembic/versions/0001_initial.py",
      "server/tests/test_auth.py",
      "server/pyproject.toml",
      "scripts/py.mjs",
      "client/app/layout.tsx",
      "client/app/page.tsx",
      "client/app/globals.css",
      "client/lib/api.ts",
      "client/next.config.ts",
      "client/package.json",
      "docker-compose.yml",
    ]) {
      expect(keys).toContain(f);
    }

    expect(keys).not.toContain("client/src/App.tsx");
    expect(keys).not.toContain("client/vite.config.ts");

    expect(files["server/requirements.txt"]).toContain("fastapi");
    expect(files["server/requirements.txt"]).toContain("sqlalchemy");
    expect(files["server/requirements.txt"]).toContain("alembic");
    expect(files["server/requirements-dev.txt"]).toContain("pytest");
    expect(files["server/app/api/routes/auth.py"]).toContain("/refresh");
    expect(files["server/app/core/security.py"]).toContain("PasswordHash");
    expect(files["server/app/schemas/user.py"]).not.toContain("hashed_password:");
    expect(files["client/app/page.tsx"]).toContain("Sign up");
    expect(files["client/app/page.tsx"]).toContain('"use client"');
    expect(files["client/package.json"]).toContain('"next": "16.4.5"');
    expect(files["client/next.config.ts"]).toContain("/api/:path*");
    expect(files["client/lib/api.ts"]).not.toContain("import.meta.env");
    expect(files["package.json"]).toContain("scripts/py.mjs");
    expect(files[".gitignore"]).toContain(".venv/");
    expect(files[".gitignore"]).toContain(".next/");
    expect(files["server/.env.example"]).toContain("postgresql+asyncpg");
  });

  test("nestjs emits layered modules, migration, e2e and the shared Next.js client", () => {
    const files = buildFileMap(opts({ stack: "nestjs", language: "typescript", runtime: "node" }));
    const keys = Object.keys(files);
    for (const f of [
      "server/src/main.ts",
      "server/src/app.module.ts",
      "server/src/config/env.ts",
      "server/src/common/http-exception.filter.ts",
      "server/src/users/user.entity.ts",
      "server/src/users/users.controller.ts",
      "server/src/users/users.service.ts",
      "server/src/users/users.module.ts",
      "server/src/auth/auth.controller.ts",
      "server/src/auth/auth.service.ts",
      "server/src/auth/auth.module.ts",
      "server/src/auth/jwt-auth.guard.ts",
      "server/src/auth/refresh-token.entity.ts",
      "server/src/auth/dto/auth.dto.ts",
      "server/src/health/health.controller.ts",
      "server/src/database/data-source.ts",
      "server/src/database/migrations/1730000000000-InitialSchema.ts",
      "server/test/app.e2e-spec.ts",
      "server/nest-cli.json",
      "server/tsconfig.build.json",
      "client/app/layout.tsx",
      "client/app/page.tsx",
      "client/lib/api.ts",
      "client/next.config.ts",
      "client/package.json",
      "docker-compose.yml",
    ]) {
      expect(keys).toContain(f);
    }

    expect(keys).not.toContain("client/src/App.tsx");
    expect(keys).not.toContain("client/vite.config.ts");

    expect(files["server/package.json"]).toContain("@nestjs/core");
    expect(files["server/package.json"]).toContain("@nestjs/typeorm");
    expect(files["server/package.json"]).toContain("argon2");
    expect(files["server/package.json"]).not.toContain("mongoose");
    expect(files["server/src/auth/auth.controller.ts"]).toContain('@Post("refresh")');
    expect(files["server/src/auth/auth.service.ts"]).toContain("argon2.hash");
    expect(files["server/src/auth/auth.service.ts"]).toContain("revoked = true");
    expect(files["server/src/users/user-response.ts"]).toContain("full_name");
    expect(files["server/test/app.e2e-spec.ts"]).toContain("better-sqlite3");
    expect(files["server/test/app.e2e-spec.ts"]).toContain("/api/auth/refresh");
    expect(files["client/package.json"]).toContain('"next": "16.4.5"');
    expect(files["client/next.config.ts"]).toContain("/api/:path*");
    expect(files["package.json"]).toContain("cd server");
    expect(files["package.json"]).toContain("cd client");
    expect(files[".gitignore"]).toContain(".next/");
    expect(files[".gitignore"]).toContain("dist/");
    expect(files["server/.env.example"]).toContain("DATABASE_URL");
    expect(files["server/.env.example"]).toContain("JWT_SECRET");
    expect(files["README.md"]).toContain("NestJS");
  });

  test("every template file is non-empty", () => {
    for (const stack of STACK_IDS) {
      const o =
        stack === "go-fiber"
          ? opts({ stack, language: "go", runtime: "go" })
          : stack === "fastapi"
            ? opts({ stack, language: "python", runtime: "python" })
            : opts({ stack });
      for (const [name, content] of Object.entries(buildFileMap(o))) {
        expect(content.length, `${stack}:${name}`).toBeGreaterThan(0);
      }
    }
  });
});
