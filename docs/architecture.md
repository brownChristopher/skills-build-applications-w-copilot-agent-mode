# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision:
    Add real fetch logic, loading/empty/error rendering, and accessible UI states in the route components under octofit-tracker/frontend/src/components.
    Only after the API contract is working should the frontend be wired to it.
- Logic tier decision:
    Implement createActivity, createTeam, getLeaderboard, and suggestWorkouts in octofit-tracker/backend/src/services/octofitService.ts.
    Keep validation behavior aligned with the API contract: 4xx for bad IDs / missing users or teams, never 500 from cast errors.
    This unlocks the backend contract tests and provides a stable API for the frontend.
- Data tier decision:
    Fix required validation/defaults in the Mongoose models.
    Confirm seeded demo records are valid and idempotent via the seed script.
    This is the foundation; API route tests assume correct persisted shape and constraints.
- Activity tracking approach:
- Team management approach:
- Leaderboard approach:
- Workout suggestions approach:



## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
    5 tests run, 4 fail
    Failing assertions are in octofit-tracker/backend/tests/data.contract.test.ts
    Root cause: model schemas in octofit-tracker/backend/src/models/User.ts, Team.ts, Activity.ts, and Workout.ts are not enforcing required fields/defaults, so validateSync() returns undefined where tests expect errors.
- API command: `npm run test:api --prefix octofit-tracker/backend`
    4 tests run, 4 fail
    Failing assertions are in octofit-tracker/backend/tests/api.contract.test.ts
    Root cause: service methods in octofit-tracker/backend/src/services/octofitService.ts are intentionally stubbed:
    createActivity and createTeam throw 501
    getLeaderboard returns []
    suggestWorkouts returns a random/first workout instead of matching the user’s actual activity pattern
    This also explains the 400-vs-501 mismatches and empty leaderboard behavior.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
    15 tests run, 15 fail
    Failing assertions are in octofit-tracker/frontend/tests/app.contract.test.tsx
    Root cause: the UI components are placeholders; Activities.tsx, Teams.tsx, Leaderboard.tsx, and Workouts.tsx all render a generic CapabilityCard, and CapabilityCard.tsx still says “Implementation pending.” There is no fetched data, loading state, empty state, or error alert handling.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
