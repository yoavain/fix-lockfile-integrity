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
1. Parse CLI args (`src/cli.ts` via yargs)
2. Load config (`src/config.ts` via cosmiconfig — supports `.json`, `.js`, `.ts`, `.yaml`)
3. Find lockfiles (`package-lock.json` or `npm-shrinkwrap.json`) in configured paths
4. Process each lockfile via `fixLockFile()` in `src/fixLockfileIntegrity.ts`

Key modules:
- `src/fixLockfileIntegrity.ts` — Core logic: traverses lockfile JSON, finds SHA1 integrity entries, fetches SHA512 from registry API, rewrites file
- `src/jsonUtils.ts` — Detects and preserves original JSON formatting (indent style, EOL)
- `src/registries.ts` — Manages allowed registries (default: registry.npmjs.org)
- `src/logger.ts` — Shared logger respecting `--verbose`/`--quiet` flags
- `src/types.ts` — Shared types; `FixLockFileResult` enum for operation outcomes

Build output goes to `dist/`. The build adds a shebang to `dist/run.js` for CLI use.

## Code Style

- ESLint with `@typescript-eslint`, `eslint-plugin-security`, `eslint-plugin-import`
- Max line length: 200 chars
- Max function length: 50 lines
- Windows linebreak style (CRLF) enforced
- Consistent type imports required (`import type`)
- No eval, no prototype pollution patterns

## Testing

- Jest with `ts-jest` (no compilation step needed to run tests)
- Unit tests in `test/`
- Integration tests in `integration_test/`
- Coverage thresholds enforced; reported to codecov
