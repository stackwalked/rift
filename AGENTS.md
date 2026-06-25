# AGENTS.md — Rift

## Repository Overview

Rift is a Bun/Elysia monorepo for building backend services. It uses Bun workspaces with two packages: `pkg/lib` (the `rift` core library) and `pkg/demo` (a demo application with Drizzle ORM).

---

## Tech Stack

| Layer        | Choice                          |
|--------------|---------------------------------|
| Runtime      | Bun                             |
| Framework    | Elysia                          |
| ORM          | Drizzle ORM (demo only)         |
| Validation   | TypeBox (via Elysia)            |
| Language     | TypeScript (strict)             |
| Monorepo     | Bun workspaces                  |

---

## Workspace Packages

### `rift` (`pkg/lib`) — Core Library
- Entry point: `pkg/lib/src/index.ts`
- Subpath export: `rift/env` → `pkg/lib/src/env/index.ts`
- Only dependency: `elysia`

### `demo` (`pkg/demo`) — Demo Application
- Entry point: `pkg/demo/src/index.ts`
- Path alias: `@/*` maps to `./src/*`
- Dependencies: `elysia`, `drizzle-orm`, `rift` (workspace)

---

## Scripts

Run from `pkg/demo/`:

| Command         | What it does                                                  |
|-----------------|---------------------------------------------------------------|
| `bun run --hot src/index.ts` | Start dev server with hot reload                       |
| `bun build --compile --production --target bun --outfile dist/server src/index.ts && bun run dist/server` | Compile to standalone binary and run |

---

## TypeScript Configuration

Key rules (root `tsconfig.json`):

- `strict: true` — all strict checks enabled
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `noUncheckedIndexedAccess: true` — access to `Record<K, V>` returns `V | undefined`
- `noImplicitOverride: true` — `override` keyword required when overriding methods
- `noEmit: true` — Bun handles compilation
- `module: "Preserve"` — keeps `import`/`export` syntax as-is
- `moduleResolution: "bundler"` — Bun-style resolution

---

## Code Style Conventions

### General
- 2-space indentation
- Semicolons: use them (consistent with `validate.ts`)
- Double quotes for strings (preferred)
- Use `const` generics (`<const T>`) for schema/literal inference
- Keep files small and focused

### Imports
- Use `import type` for type-only imports (required by `verbatimModuleSyntax`)
- Use workspace references: `"rift": "workspace:*"` in package.json
- Subpath imports: `import { ... } from 'rift/env'`

### Naming
- Types and interfaces: PascalCase
- Functions and variables: camelCase
- Constants: camelCase (not SCREAMING_SNAKE_CASE)
- Files: kebab-case (e.g., `validate.ts`, not `validateEnv.ts`)

### Exports
- Named exports preferred over default exports
- Barrel files (`index.ts`) re-export from sibling modules

---

## Environment Validation Pattern

Use `rift/env` to validate environment variables:

```ts
import { validateEnv, t } from 'rift/env'

export const env = validateEnv(Bun.env,
  t.Object({
    DATABASE_URL: t.String(),
    PORT: t.Number(),
  }),
)
```

The `validateEnv` function takes a source object and a TypeBox schema, returns the validated static type, or throws `EnvValidationError` with path/message details.

---

## Project Structure

```
pkg/
  lib/                          # "rift" core library
    src/
      index.ts                  # Package entry point
      core/
        app.ts                  # App bootstrap
      env/
        index.ts                # Re-exports validate.ts
        validate.ts             # env validation utility
      observability/            # Observability utilities (TBD)
  demo/                         # "demo" application
    src/
      index.ts                  # Server entry point
      data/
        env.ts                  # Env validation (DATABASE_URL, PORT)
        domain/
          accounts/             # customer.ts, member.ts, tenant.ts
          aggregates/           # plan.ts, subscription.ts
          events/               # log.ts, usage.ts, webhook.ts
        sql/
          db.ts                 # DB connection
          migrations/           # Drizzle migrations
          schemas/              # Drizzle schema definitions
        val/                    # Shared value objects (TBD)
      http/
        errors/                 # Error handlers
        routes/                 # Route handlers
tsconfig.json                   # Root TypeScript config
package.json                    # Root monorepo config
```

---

## Testing

No testing framework is configured yet. When adding tests:
- Place test files next to the module they test (co-located)
- Use `*.test.ts` naming convention
- Configure the test framework when chosen

---

## Linting & Formatting

No linter or formatter is configured yet. When adding:
- ESLint for linting
- Prettier for formatting
- Configure to align with tsconfig strict rules

---

## Git Conventions

- Commits are concise and descriptive
- No commit hooks configured yet
- `.gitignore` covers node_modules, build artifacts, env files, logs, and archives

---

## Adding New Code

1. Place library code in `pkg/lib/src/` under the appropriate subdirectory
2. Place application code in `pkg/demo/src/` following the domain structure
3. Add subpath exports to `pkg/lib/package.json` under `"exports"`
4. Add workspace dependency as `"rift": "workspace:*"` in consumer package.json
5. Use `import type` for type-only imports
6. Follow the existing pattern in `validate.ts` for consistency
