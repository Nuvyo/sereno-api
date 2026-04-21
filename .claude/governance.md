# Governance — sereno-api
# Inferred by crag analyze — review and adjust as needed

## Identity
- Project: sereno-api
- Stack: node, nestjs, typescript

## Gates (run in order, stop on failure)
### Lint
- npm run lint
- npx tsc --noEmit

### Test
- npm run test

### Build
- npm run build

### CI (inferred from workflow)
- npm run lint:prettier
- npm run migration:run
- npm run tests

## Advisories (informational, not enforced)
- actionlint  # [ADVISORY]

## Branch Strategy
- Trunk-based development
- Free-form commits
- Commit trailer: Co-Authored-By: Claude <noreply@anthropic.com>

## Security
- No hardcoded secrets — grep for sk_live, AKIA, password= before commit

## Autonomy
- Auto-commit after gates pass

## Deployment
- Target: docker-compose, vercel
- CI: github-actions

## Architecture
- Type: monolith

## Key Directories
- `.github/` — CI/CD
- `docs/` — documentation
- `scripts/` — tooling
- `src/` — source
- `test/` — tests

## Code Style
- Indent: 2 spaces
- Formatter: prettier
- Linter: eslint

## Dependencies
- Package manager: npm (package-lock.json)

## Import Conventions
- Module system: CJS
- TypeScript module: commonjs

## Anti-Patterns

Do not:
- Do not leave `console.log` in production code — use a proper logger
- Do not use synchronous filesystem APIs in request handlers
- Do not use `any` type — use `unknown` or proper types instead
- Do not use `@ts-ignore` — fix the type error or use `@ts-expect-error` with a reason
- Prefer `as const` over `enum` for string unions

