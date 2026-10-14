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
    1. Replace the placeholder capability cards with real data-fetching route components that render the API responses and empty/loading/error states.
    2. Keep the shared API client and route structure isolated so the UI only consumes the contract exposed by the backend.
    3. Verify accessible rendering and fetch behavior with the frontend contract tests before widening styling or feature polish.
- Logic tier decision:
    1. Implement the shared service layer contract for activities, teams, leaderboard, and workout suggestions without changing router structure.
    2. Add deliberate 4xx validation for invalid IDs, missing records, and missing users before any extra business logic.
    3. Confirm the returned payload shapes match the API contract, then handle edge cases like duplicate IDs or unknown users.
- Data tier decision:
    1. Define required Mongoose field validation and defaults for users, teams, activities, and workouts.
    2. Confirm the seed script preserves existing app data while upserting stable demo records and relationships.
    3. Validate idempotent seeding and schema constraints before touching API behavior.
- Activity tracking approach:
    1. Validate `userId` and `teamId` as well-formed IDs and ensure those records exist.
    2. Persist `user`, `team`, `type`, `minutes`, `occurredAt`, and computed `points` in one creation flow.
    3. Ensure the list endpoint returns the stored documents and the POST route rejects bad payloads with a 4xx rather than a 500.
- Team management approach:
    1. Reject missing or empty team names with a 400 response and validate member IDs.
    2. Persist the team and update the member array relationship in a single write path.
    3. Return the created team and list teams with populated members for the frontend.
- Leaderboard approach:
    1. Aggregate activity points per team and sort by highest total first.
    2. Add a 1-based rank to each result while preserving deterministic ordering.
    3. Expose only the fields required by the contract: `teamName`, `totalPoints`, and `rank`.
- Workout suggestions approach:
    1. Match the requested user email to a seeded user and reject unknown emails with a deliberate 4xx.
    2. Inspect the user’s recent activity pattern and goal to pick the best workout focus.
    3. Return ranked suggestions and a human-readable reason that explains the recommendation.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Current failing tests: 4 failed, 1 passed. The schema validation tests fail because the required field constraints are missing from the Mongoose models, and the seed contract still passes because the idempotent demo seeding logic already works.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Current failing tests: 4 failed. The API tests fail because the service layer is still stubbed (`501` responses, empty leaderboard, and workout suggestions that do not match the user pattern), which prevents validation, creation, and ranking behavior from satisfying the contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Current failing tests: 15 failed. The frontend tests fail because the route components are still placeholder cards without real fetch logic, loading, empty-state, or alert handling, so the app never renders the expected activity, team, leaderboard, or workout content.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Current failing tests: not yet run; this build should confirm TypeScript and backend integration compile cleanly after the data and API implementations are in place.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Current failing tests: not yet run; this build should confirm the React app compiles after the route-level UI and fetch logic are implemented.
