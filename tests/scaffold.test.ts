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
  test("ships four stacks", () => {
    expect(STACK_IDS).toEqual(["mern", "pern", "hono-pg", "go-fiber"]);
  });

  test("go-fiber only supports go", () => {
    expect(getStack("go-fiber").languages).toEqual(["go"]);
    expect(isSupportedCombo("go-fiber", "go", "go")).toBe(true);
    expect(isSupportedCombo("mern", "go", "go")).toBe(false);
    expect(isSupportedCombo("mern", "typescript", "bun")).toBe(true);
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

  test("every template file is non-empty", () => {
    for (const stack of STACK_IDS) {
      const o =
        stack === "go-fiber"
          ? opts({ stack, language: "go", runtime: "go" })
          : opts({ stack });
      for (const [name, content] of Object.entries(buildFileMap(o))) {
        expect(content.length, `${stack}:${name}`).toBeGreaterThan(0);
      }
    }
  });
});
