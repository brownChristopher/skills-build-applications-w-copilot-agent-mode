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

- Presentation tier decision: Keep the frontend as a route-driven React app with dedicated capability components that fetch from the REST API, render data from the response payload, and surface loading, empty, and error states via accessible roles and text. The shared `CapabilityCard` pattern is used to keep layout consistent while the concrete pages fill in their own data and user feedback.
- Logic tier decision: Build the Express service layer in `octofit-tracker/backend/src/services` and keep route files thin. Validate request bodies and identifiers before database writes, map model errors to deliberate 4xx responses, and leave auth unimplemented as required by the exercise.
- Data tier decision: Use Mongoose schemas with required fields and sensible defaults for `User`, `Team`, `Activity`, and `Workout`. Maintain references to related documents and use `seed.ts` with upsert semantics so seeded demo data is idempotent without deleting unrelated application data.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; reject malformed or unknown IDs with a 4xx instead of a cast error; confirm the user and team exist; store `user`, `team`, `type`, `minutes`, and computed `points` and `occurredAt` on the Activity document.
- Team management approach: Require `name` and `mascot` when creating a team, initialize `members` to an empty array, and keep the submitted member IDs in the team record so listing teams exposes the expected membership collection.
- Leaderboard approach: Aggregate activity points by team, sum totals, sort descending, and assign a 1-based rank. The response shape is `{ leaderboard: [{ teamName, totalPoints, rank }] }` to match the contract.
- Workout suggestions approach: Resolve the user email to a seeded user, inspect the user’s recent activity pattern or fitness goal, and return the most relevant workout(s) with a matching `focus` and explanatory `reason`. Unknown emails should return a deliberate 4xx (for example, 404) instead of a generic success response.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Validates Mongoose required-field validation and idempotent seed behavior. Failures here indicate missing schema constraints or incorrect upsert logic; the current failure pattern shows `User`, `Team`, `Activity`, and `Workout` validators are not enforcing required fields.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Validates the Express route contract for activities, teams, leaderboard ranking, and workout suggestions. Failures here indicate incomplete service implementation, not frontend issues: the API currently returns 501s and empty arrays because the service functions are stubs.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Validates the client-side rendering contract for loading, empty, error, and success states. Failures here indicate placeholder UI components or missing fetch-driven state updates; current failures are consistent with the programmatic `CapabilityCard` placeholder content.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Confirms the TypeScript backend compiles cleanly after the service and model changes. This catches type issues before the app is considered ready.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Confirms the React client builds successfully and the Vite/Bundler setup remains valid after the route components are implemented.

The execution order should remain data -> API -> frontend, because the data model and service contracts are the root dependencies for the UI. This order keeps the smallest safe test-driven loop while preventing frontend work from masking backend contract issues.
