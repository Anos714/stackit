# stackit ⚡

Opinionated full-stack project scaffolder. Like `create-next-app`, but you pick the
whole stack — **MERN, PERN, React + Hono + Postgres, Go + Fiber** — and get a
best-practice monorepo in one command.

Published as [`create-stackit-app`](https://www.npmjs.com/package/create-stackit-app):

```bash
bunx create-stackit-app@latest create my-app --stack mern -y
```

🌐 **Live site & docs: [stackitcli.vercel.app](https://stackitcli.vercel.app/)**

```
cli/        # the stackit CLI (Bun + TypeScript)
frontend/   # landing page + docs site (Next.js 16 + Tailwind v4)
```

## CLI — quickstart

```bash
cd cli
bun install
bun run src/index.ts create my-app --stack mern --language typescript --runtime bun --pm bun -y
```

Full CLI guide (flags, stacks, generated layouts, troubleshooting): [`cli/README.md`](cli/README.md).

## Site — landing + docs

```bash
cd frontend
bun install
bun run dev    # http://localhost:3000  ( / + /docs )
```

## Repo scripts

| Where | Command | What |
| ----- | ------- | ---- |
| `cli/` | `bun test` | 13 tests: semver, registry, scaffold file-maps |
| `cli/` | `bunx tsc --noEmit` | typecheck |
| `cli/` | `bun run build` | compile to `cli/dist/stackit` |
| `frontend/` | `bun run dev` / `bun run build` | site dev / production build |
