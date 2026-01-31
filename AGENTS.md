# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: React + TypeScript + Vite SPA. Key areas: `pages/` for screens, `components/` for shared UI, `services/api.ts` for API + mock fallback, `constants.ts` for mock data, `types.ts` for shared types.
- `backend/`: Spring Boot 3 app. Source in `backend/src/main/java`, resources in `backend/src/main/resources`, tests in `backend/src/test/java`.
- Frontend uses mock mode by default (see `frontend/services/api.ts`); backend runs at `http://localhost:8080`.

## Build, Test, and Development Commands
Frontend (from repo root):
- `cd frontend && npm install` — install dependencies
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build

Backend:
- `cd backend && mvn spring-boot:run` — run Spring Boot server (requires JDK 21)
- `mvn test` — run backend tests

## Coding Style & Naming Conventions
- Frontend: TypeScript/React with 2-space indentation, PascalCase components (`MyLeaves.tsx`), camelCase functions/variables, Tailwind utility classes in JSX.
- Backend: Java with standard Spring Boot style, package `com.company` (see `backend/src/main/java`), PascalCase classes, camelCase fields.
- No enforced formatter/linter configured; follow existing file style and keep diffs minimal.

## Testing Guidelines
- Backend tests use Spring Boot starter test (JUnit). Place tests in `backend/src/test/java` and name classes `*Test`.
- Frontend has no test setup yet; add tests only if introducing a framework.

## Commit & Pull Request Guidelines
- Commit history is minimal; use short, imperative messages (e.g., “Update team calendar header”).
- PRs should include: concise summary, steps to test, and screenshots for UI changes. Link relevant issues if available.
- Call out whether frontend is in mock mode or using the live backend.

## Configuration & Tips
- H2 console (dev) at `http://localhost:8080/h2-console`, JDBC URL `jdbc:h2:mem:easytimeoffdb`.
- Favorites and view history persist in the backend database; clear H2 data if you need a clean slate.
