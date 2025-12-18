MMDB Project Development Guidelines (Advanced)

This document captures project-specific knowledge that will speed up development and reduce friction when building, testing, and operating this repository.

1. Build and Configuration

- Stack overview
  - Next.js 15 (app router) with React 19.
  - TypeScript with strict mode; moduleResolution: bundler.
  - Prisma 6 for PostgreSQL; dbml generator enabled.
  - Auth via next-auth; email/JWT secrets required.
  - Tooling: ESLint (Flat config) + Prettier, Jest 30 + Testing Library.

- Environment and .env
  - The project relies on the following env vars (see .env):
    - DATABASE_URL and DIRECT_URL for Postgres.
    - NEXTAUTH_SECRET and NEXTAUTH_URL for next-auth.
    - JWT_SECRET_KEY for application tokens.
    - RESEND_API_KEY for email provider.
  - For local dev, ensure a Postgres DB is reachable and set DATABASE_URL and DIRECT_URL accordingly. DIRECT_URL is used by Prisma CLI (migrations) to bypass pgBouncer.
  - Do not commit production secrets. The current .env contains example values; rotate/change secrets for non-local environments.

- Install, dev, build, start
  - Install: npm ci (preferred in CI) or npm i.
  - Dev (Turbopack): npm run dev
  - Build: npm run build
  - Start (production): npm run start (after build)
  - Vercel build: npm run vercel-build runs prisma generate, prisma migrate deploy, then next build.

- TypeScript/Paths
  - TS is strict. Avoid any with noImplicitAny=false only as needed.
  - Path aliases: use @/* and @/auth as configured in tsconfig.json. Keep these in sync if re-organizing folders.

- ESLint/Prettier
  - Run lint: npm run lint
  - The flat ESLint config (eslint.config.mjs) combines next/core-web-vitals, Prettier, and TypeScript rules. Testing-library plugin is active for test files.
  - Prefer fixing warnings (e.g., @typescript-eslint/no-unused-vars with underscore ignore patterns) rather than suppressing them.

2. Testing: How to configure and run

- Framework
  - Jest 30 with next/jest integration (jest.config.js). Test environment is jsdom; jest.setup.ts loads @testing-library/jest-dom.
  - React Testing Library (@testing-library/react and user-event) is available for component tests.

- Test discovery and naming
  - Files in __tests__/ and files matching *.(spec|test).(ts|tsx|js|jsx) are discovered.

- Commands
  - Full suite (watch): npm test
  - CI mode (no watch): npm run test:ci
  - Run a specific suite:
    - npx jest path/to/file.spec.ts --ci
    - npx jest -t "test name substring" --ci

- Known Jest 30 matcher change
  - The toThrowError alias has been removed in Jest 30. Use toThrow instead:
    - expect(() => fn()).toThrow('message')
  - If you see TypeError: expect(...).toThrowError is not a function, replace toThrowError with toThrow in that spec.

- Add new tests
  - Place unit tests next to the module or in __tests__/; prefer colocating for small utilities.
  - For React components, use Testing Library; avoid implementation details. Example patterns:
    - render(<Component />) and assert via screen.getByRole/getByText.
    - Prefer userEvent to simulate interactions.
  - If you need Node environment (non-DOM), set testEnvironment per-file via @jest-environment node docblock.

- Demo: Creating and running a simple test (verified)
  - Example test file content (React component + RTL):
    - Create a file __tests__/smoke.test.tsx with:
      import { render, screen } from '@testing-library/react'
      import React from 'react'
      function Hello({ name }: { name: string }) { return <div>Hello, {name}!</div> }
      describe('smoke test', () => {
        it('renders a simple component', () => {
          render(<Hello name="World" />)
          expect(screen.getByText('Hello, World!')).toBeInTheDocument()
        })
      })
  - Run only this test to validate setup:
    - npx jest __tests__/smoke.test.tsx --ci
  - Result: should be 1 passed, 0 failed. This path was executed successfully during guideline authoring.

3. Database and Prisma

- Migrations and client
  - Generate client: npx prisma generate
  - Create + apply migration: npx prisma migrate dev
  - Create migration only: npx prisma migrate dev --create-only then review SQL and run npx prisma migrate dev
  - Reset DB (drops all, re-applies, seeds): npx prisma migrate reset

- Seed data
  - prisma.seed script is defined in package.json and uses tsx with tsconfig-seed.json:
    - npx prisma db seed
  - The seeding pipeline parses Excel files and caches an intermediate output in prisma/output/parsedDataOutput.js. If this file exists, the slow parsing steps are skipped. Delete it to re-run full parsing.

- DBML
  - prisma-dbml-generator produces prisma/dbml/schema.dbml during migrations/generate. Keep this in VC for architectural review.

- Review-process hypothesis
  - Triggers and an AuditLog table are envisioned for the review process (see prisma/README.md for details). If you implement triggers, ensure transactional integrity when writing audit rows + business updates.

4. Next.js/React specifics

- App router and middleware: middleware.ts is present; check routing/edge cases before introducing server actions or middlewares that depend on env.
- React 19 implications
  - Strict Effects can double-invoke in dev; avoid side-effects in render. Use useEffect/useActionEffect patterns carefully.
  - Testing: Prefer screen.findBy* for async UI. Wrap state updates in act only when necessary; Testing Library usually handles it.

5. Code Style and Conventions

- Prefer functional, pure utilities in utils/ with comprehensive unit tests.
- Keep enums and domain types centralized in Prisma schema; mirror types in /types only when needed by the client.
- naming conventions:
  - Types: use PascalCase.
  - Functions: use camelCase.
  - Variables: use camelCase.
  - Constants: use UPPER_CASE.
  - Files: use camelCase.
  - Directories: use camelCase and singular for entity folders.
  - Classes: use PascalCase.
  - Enums: use PascalCase.
  - Interfaces: use PascalCase.
- Error messages: prefix with component or function names between brackets, using initials if two long (e.g., [gNPSFNPB]) as seen in existing utils tests to make triage easier.
- Comments: capture invariants and constraints near model definitions (e.g., XOR constraints) and reference migrations when enforced in SQL only.

6. Types

- Build types using Prisma provided types like you can see in the file `types/formTypes.ts`

7. Git

- Always add to git new created files

8. CI/CD and deployment notes

- vercel-build script expects a reachable database and runs migrations with prisma migrate deploy. Ensure DATABASE_URL/DIRECT_URL are set in Vercel project settings. Use pooled URL for runtime (DATABASE_URL with pgbouncer) and direct URL for migrations (DIRECT_URL).

9. Troubleshooting

- Jest failing on toThrowError: replace with toThrow (Jest 30 change).
- Module resolution errors in tests: remember tsconfig uses bundler resolution; when importing path aliases in tests, run via next/jest which respects next config (dir: './').
- Prisma migrations failing with pgBouncer: use DIRECT_URL.

Housekeeping

- When adding example or scratch test files for docs or debugging, prefer running them explicitly (npx jest path --ci) and remove them before committing unless intended to stay. During authoring of this guide, a smoke test was created and run, then removed.
