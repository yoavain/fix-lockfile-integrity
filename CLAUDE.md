# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

`fix-lockfile-integrity` is a CLI tool that fixes npm lockfile integrity by reverting insecure SHA1 hashes back to secure SHA512 hashes. It fetches correct hashes from configured npm registries and rewrites the lockfile while preserving original JSON formatting.

## Commands

```bash
# Run all checks (eslint + type-check + jest)
npm test

# Run only unit tests
npm run jest:unit

# Run only integration tests
npm run jest:integration

# Run a single test file
npx jest path/to/test.ts

# Type checking only
npm run type-check

# Lint
npm run eslint

# Lint with auto-fix
npm run "eslint:fix"

# Build (runs tests first)
npm run build

# Build without tests
npm run build:no-test

# Run the tool locally (compiles + runs)
npm start
```

## Architecture

Entry points:
- `src/run.ts` — CLI entry point; calls `main()` and exits on error
- `src/index.ts` — Library entry point; re-exports public API

Core flow (`src/main.ts`):
1. Parse CLI args (`src/cli.ts` via `util.parseArgs`)
2. Load config (`src/config.ts` via lilconfig — `.fix-lockfile.{json,js,ts}` or `fix-lockfile.config.{json,js,ts}`)
3. Collect lookup paths: `includePaths` from config, plus the workspace folders found by `src/workspaces.ts` (unless `--disable-workspaces` or `includeWorkspaces: false`)
4. Find lockfiles (`package-lock.json` or `npm-shrinkwrap.json`) in those paths
5. Process each lockfile via `fixLockFile()` in `src/fixLockfileIntegrity.ts`

A lookup path holding no lockfile throws; an explicit file (positional arg or `includeFiles`) skips workspace detection.

Key modules:
- `src/fixLockfileIntegrity.ts` — Core logic: traverses lockfile JSON, finds SHA1 integrity entries, fetches SHA512 from registry API, rewrites file
- `src/cli.ts` — CLI parsing via `util.parseArgs` with `strict: true`, so an unknown option throws
- `src/config.ts` — lilconfig loader; merges the user config over `defaultFixLockFileIntegrityConfig`
- `src/workspaces.ts` — Detects monorepo workspace folders (npm/yarn `workspaces`, then legacy `lerna.json` `packages`); returns only folders that hold a lockfile
- `src/jsonUtils.ts` — Detects and preserves original JSON formatting (indent style, EOL)
- `src/registries.ts` — Manages allowed registries (default: registry.npmjs.org)
- `src/logger.ts` — Shared logger respecting `--verbose`/`--quiet` flags
- `src/consts.ts` — Default config and default prettier options
- `src/types.ts` — Shared types; `FixLockFileResult` enum for operation outcomes

Build output goes to `dist/`. The build adds a shebang to `dist/run.js` for CLI use.

## Code Style

Flat config in `eslint.config.mjs`:
- ESLint with `@typescript-eslint`, `eslint-plugin-security`, `eslint-plugin-import`, `eslint-plugin-n`, `eslint-plugin-jest`
- Max line length: 200 chars (`max-len`, error)
- Max function length: 75 lines (`max-lines-per-function`, warn — warnings do not fail the lint script)
- 4-space indent, double quotes, semicolons, stroustrup braces, no trailing commas
- Consistent type imports required (`import type`)
- No eval, no prototype pollution patterns
- `n/no-unsupported-features/node-builtins` ignores `fs.globSync`, which is experimental below Node 22.17 while `engines` allows `>=22`
- CRLF comes from `.prettierrc` (`endOfLine: crlf`); lint-staged runs prettier on `*.json` only, not on TS

## Testing

- Jest with `ts-jest` (no compilation step needed to run tests)
- Unit tests in `test/`
- Integration tests in `integration_test/`
- `test/workspaces.test.ts` builds temp folder trees in `os.tmpdir()` rather than using fixtures
- Coverage is collected on every run; there are no local thresholds in `jest.config.ts`. CI uploads it to codecov (`.github/workflows/nodejs.yml`)
