import type { ProjectOptions } from "../types/index.ts";
import type { FileMap } from "../utils/fs.ts";

export const isTS = (o: ProjectOptions): boolean => o.language === "typescript";
export const ext = (o: ProjectOptions): "ts" | "js" => (isTS(o) ? "ts" : "js");
/** client entry ext: jsx | tsx */
export const cext = (o: ProjectOptions): "tsx" | "jsx" => (isTS(o) ? "tsx" : "jsx");

/** `<pm> run <script>` works for npm/pnpm/yarn/bun uniformly. */
export const runScript = (pm: string, script: string): string => `${pm} run ${script}`;

export function rootPackageJson(o: ProjectOptions): string {
  const pm = o.packageManager;
  return JSON.stringify(
    {
      name: o.projectName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: `concurrently ${JSON.stringify(`${runScript(pm, "dev")} --prefix client`)} ${JSON.stringify(`${runScript(pm, "dev")} --prefix server`)}`,
        build: `${runScript(pm, "build")} --prefix client && ${runScript(pm, "build")} --prefix server`,
        "install:all": `${pm} install --prefix client && ${pm} install --prefix server`,
      },
      devDependencies: { concurrently: "^9.1.2" },
    },
    null,
    2,
  ) + "\n";
}

export function goRootPackageJson(o: ProjectOptions): string {
  return JSON.stringify(
    {
      name: o.projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        "dev:client": "npm run dev --prefix client",
        dev: "npm run dev --prefix client",
        build: "npm run build --prefix client",
      },
    },
    null,
    2,
  ) + "\n";
}

export const ROOT_GITIGNORE = `# deps
node_modules/
dist/
build/
*.local

# env
.env
.env.*.local

# logs / coverage
logs/
*.log
coverage/

# editor / os
.vscode/*
!.vscode/extensions.json
.idea/
.DS_Store

# go (go-fiber)
server/bin/
`;

export function readme(o: ProjectOptions, backend: string, db: string): string {
  const e = ext(o);
  return `# ${o.projectName}

Scaffolded with **stackit** — \`${o.stack}\` (${o.language}, ${o.runtime}).

## Structure

\`\`\`
${o.projectName}/
├── client/                 # Vite + React frontend (proxies /api → :5000)
│   ├── src/
│   │   ├── App.${cext(o)}            # demo page (calls the API)
│   │   ├── main.${cext(o)}
│   │   └── lib/api.${e}      # typed API helper
│   └── vite.config.${e}
├── server/                 # ${backend} API + ${db}
│   └── src/
│       ├── index.${e}        # entrypoint (reads env, starts server)
│       ├── app.${e}          # app factory (routes + middleware)
│       ├── config/           # env + database connection
│       ├── routes/           # route definitions
│       ├── controllers/      # request handlers
│       ├── models/           # data models / schemas
│       ├── middlewares/      # errorHandler, notFound, logger
│       └── utils/            # helpers (asyncHandler, ApiError)
├── docker-compose.yml      # one-command ${db}
└── .env.example
\`\`\`

## Quickstart

\`\`\`bash
cd ${o.projectName}
cp .env.example server/.env          # then fill in values
${o.packageManager} install --prefix client && ${o.packageManager} install --prefix server
${runScript(o.packageManager, "dev")}   # runs client + server together
\`\`\`

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:5000 |
| Health | http://localhost:5000/api/health |

## With Docker (database only)

\`\`\`bash
docker compose up -d
\`\`\`
`;
}

export function goReadme(o: ProjectOptions): string {
  return `# ${o.projectName}

Scaffolded with **stackit** — \`go-fiber\` (Go + React/Vite, Postgres-ready).

## Structure

\`\`\`
${o.projectName}/
├── client/                 # Vite + React frontend (proxies /api → :5000)
└── server/                 # Go + Fiber API
    ├── cmd/api/main.go     # entrypoint
    └── internal/
        ├── config/         # env loading
        ├── db/             # postgres pool (optional, via DATABASE_URL)
        ├── handlers/       # HTTP handlers
        ├── middleware/     # logger, cors, recover
        ├── models/         # domain types
        └── routes/         # route registration
\`\`\`

## Quickstart

\`\`\`bash
cd ${o.projectName}
cp server/.env.example server/.env
cd server && go mod tidy && go run ./cmd/api
cd ../client && npm install && npm run dev
\`\`\`

Or with make: \`make dev\` (starts both), \`make tidy\`, \`make build\`.
`;
}

export function makefile(): string {
  return `tidy:
\tcd server && go mod tidy
\tcd client && npm install

dev:
\t@(cd server && go run ./cmd/api) & (cd client && npm run dev) & wait

build:
\tcd server && go build -o bin/api ./cmd/api
\tcd client && npm run build
`;
}

/* ------------------------------- Vite client ------------------------------ */

export function clientPackageJson(o: ProjectOptions): string {
  const t = isTS(o);
  return JSON.stringify(
    {
      name: "client",
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: t ? "tsc -b && vite build" : "vite build",
        preview: "vite preview",
      },
      dependencies: { react: "^19.1.0", "react-dom": "^19.1.0" },
      devDependencies: {
        "@vitejs/plugin-react": "^4.3.4",
        vite: "^6.3.5",
        ...(t ? { typescript: "^5.8.3", "@types/react": "^19.1.8", "@types/react-dom": "^19.1.6" } : {}),
      },
    },
    null,
    2,
  ) + "\n";
}

export function viteConfig(o: ProjectOptions): string {
  const t = isTS(o);
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
${t ? '/// <reference types="vite/client" />\n' : ""}
// Vite dev server proxies /api to the backend (see server/.env PORT).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
`;
}

export function clientIndexHtml(projectName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${"__ENTRY_EXT__"}"></script>
  </body>
</html>
`;
}

export function clientMain(o: ProjectOptions): string {
  const c = cext(o);
  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.${c}";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root element missing");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;
}

export function clientApp(o: ProjectOptions): string {
  const t = isTS(o);
  return `import { useEffect, useState } from "react";
import { getHealth } from "./lib/api.${ext(o)}";
import "./App.css";

export default function App() {
  const [health, setHealth] = useState${t ? "<string>" : ""}("checking API…");
  const [error, setError] = useState${t ? "<string | null>" : ""}(null);

  useEffect(() => {
    getHealth()
      .then((h) => setHealth(\`API: \${h.status} (uptime \${Math.round(h.uptime)}s)\`))
      .catch((e${t ? ": unknown" : ""}) => setError(e ${t ? "instanceof Error ? e.message : String(e)" : "?.message ?? String(e)"}));
  }, []);

  return (
    <main className="wrap">
      <h1>stackit ⚡</h1>
      <p className="sub">Vite + React frontend talking to the API.</p>
      <div className="card">
        {error ? <code className="err">{error}</code> : <code>{health}</code>}
      </div>
      <p className="hint">
        Edit <code>client/src/App.${cext(o)}</code> — edit <code>server/src/routes/</code> to add endpoints.
      </p>
    </main>
  );
}
`;
}

export const CLIENT_APP_CSS = `.wrap { max-width: 640px; margin: 4rem auto; padding: 0 1.5rem; font-family: system-ui, sans-serif; }
.sub { color: #666; }
.card { background: #f6f6f6; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1rem 1.25rem; margin: 1.5rem 0; }
.err { color: #c00; }
.hint { color: #666; font-size: 0.9rem; }
code { font-family: ui-monospace, monospace; }
`;

export const CLIENT_INDEX_CSS = `* { box-sizing: border-box; }
body { margin: 0; background: #fff; color: #111; }
`;

export function clientApiTsFixed(o: ProjectOptions): string {
  void o;
  return `// Tiny fetch wrapper — base URL comes from the Vite proxy (/api) in dev,
// or VITE_API_URL in production builds.
const BASE: string = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ?? "";

export interface Health {
  status: string;
  uptime: number;
}

async function req<T>(path: string): Promise<T> {
  const res = await fetch(\`\${BASE}\${path}\`);
  if (!res.ok) throw new Error(\`API \${res.status}: \${await res.text()}\`);
  return res.json() as Promise<T>;
}

export function getHealth(): Promise<Health> {
  return req<Health>("/api/health");
}
`;
}

export function clientApiJs(): string {
  return `// Tiny fetch wrapper — base URL comes from the Vite proxy (/api) in dev,
// or VITE_API_URL in production builds.
const BASE = import.meta.env.VITE_API_URL ?? "";

async function req(path) {
  const res = await fetch(\`\${BASE}\${path}\`);
  if (!res.ok) throw new Error(\`API \${res.status}: \${await res.text()}\`);
  return res.json();
}

export function getHealth() {
  return req("/api/health");
}
`;
}

export const CLIENT_ENV_EXAMPLE = `# Used by the production build; dev uses the Vite proxy instead.
VITE_API_URL=http://localhost:5000
`;

export function tsconfig(base: "client" | "server", o: ProjectOptions): string {
  void o;
  const outDir = "dist";
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        skipLibCheck: true,
        outDir,
        rootDir: "src",
        ...(base === "client"
          ? { jsx: "react-jsx", lib: ["ES2022", "DOM", "DOM.Iterable"], types: ["vite/client"] }
          : { lib: ["ES2022"] }),
      },
      include: ["src"],
    },
    null,
    2,
  ) + "\n";
}

/** Assemble the shared Vite client file map. */
export function clientFiles(o: ProjectOptions): FileMap {
  const e = ext(o);
  const c = cext(o);
  const api = isTS(o) ? clientApiTsFixed(o) : clientApiJs();
  return {
    [`client/package.json`]: clientPackageJson(o),
    [`client/vite.config.${e}`]: viteConfig(o),
    [`client/index.html`]: clientIndexHtml(o.projectName).replace("__ENTRY_EXT__", c),
    [`client/src/main.${c}`]: clientMain(o),
    [`client/src/App.${c}`]: clientApp(o),
    [`client/src/App.css`]: CLIENT_APP_CSS,
    [`client/src/index.css`]: CLIENT_INDEX_CSS,
    [`client/src/lib/api.${e}`]: api,
    [`client/.env.example`]: CLIENT_ENV_EXAMPLE,
    ...(isTS(o) ? { [`client/tsconfig.json`]: tsconfig("client", o) } : {}),
  };
}
