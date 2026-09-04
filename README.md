# CollegeBuddy

CollegeBuddy is a secure Campus OS for IIIT Guwahati students. It combines academics, resources, events, lost-and-found, profiles, and moderation in an Express/MongoDB platform with a responsive browser experience and an Expo mobile client.

## What is included

- College-email signup, JWT login, logout, profile completion, and blocked-session enforcement
- Student/admin roles enforced by the API
- Course catalog with semester and department filters
- Notes, past papers, assignments, lab material, question banks, study material, and links
- Resource ownership, moderation, search, filters, bounded pagination, and private signed downloads
- Events with public discovery and admin CRUD
- Lost-and-found posts with images, ownership, lifecycle states, deletion, and admin removal
- Campus OS web interface with responsive navigation and loading/empty/error/offline states
- Expo mobile client with secure token storage and environment-based API configuration
- Integration tests for critical authentication, authorization, and feature paths

## Architecture

```text
collegebuddy/
|-- src/
|   |-- config/       # Environment, database, and Supabase clients
|   |-- controllers/  # HTTP request/response translation
|   |-- middleware/   # Auth, roles, validation, errors, rate limits, uploads
|   |-- models/       # Mongoose schemas and indexes
|   |-- routes/       # Express route declarations
|   |-- services/     # Resource and storage business logic
|   |-- utils/        # Errors, responses, serializers, async handling
|   |-- validators/   # Zod request schemas
|   `-- frontend/     # Static Campus OS browser client
|-- mobile/campus-connect/ # Expo/React Native client
|-- scripts/          # Syntax check and safe admin provisioning
|-- test/             # Node test runner + Supertest integration tests
|-- docs/API.md       # API reference
`-- PROJECT_AUDIT.md  # Original architecture/security audit
```

| Layer | Stack |
| --- | --- |
| API | Node.js, Express 5, Zod, Helmet, JWT, Multer |
| Data | MongoDB, Mongoose |
| Storage | Private Supabase academic bucket; Supabase or local development images |
| Web | Semantic HTML, CSS, vanilla JavaScript |
| Mobile | Expo 57, React Native 0.86, React Navigation 7, Axios, SecureStore |
| Tests | Node test runner, Supertest, MongoDB Memory Server |

## Local setup

Requirements: Node.js 22.13 or newer (required by Expo 57), npm, MongoDB, and a Supabase project for file uploads.

```bash
git clone <repository-url>
cd collegebuddy
npm install
```

Copy `.env.example` to `.env`, replace its placeholder values, then start the API:

```bash
npm run dev
```

The default URL is `http://localhost:3000`. `GET /health` can be used as a process health check. The server validates essential environment values before connecting to MongoDB.

### Web client

For a single-process production-like setup, set `SERVE_WEB_CLIENT=true`; the API will serve `src/frontend` and Campus OS will be available at `http://localhost:3000`.

During frontend-only development, serve `src/frontend` with a static server such as Live Server. Add that exact origin to `ALLOWED_ORIGINS`. The UI infers an API on port 3000 and also lets a developer override the API base URL in Settings.

### Mobile client

```bash
cd mobile/campus-connect
npm install
```

Copy `.env.example` to `.env` and set a reachable API address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
```

Then run `npm start`, `npm run android`, `npm run ios`, or `npm run web`. A physical device normally needs the backend computer's LAN address; Android Emulator can use `http://10.0.2.2:3000`, while iOS Simulator can use `http://localhost:3000`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production` |
| `PORT` | No | API port; defaults to `3000` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret; minimum 32 characters in production |
| `JWT_EXPIRES_IN` | No | JWT duration; defaults to `3d` |
| `ALLOWED_ORIGINS` | Production | Comma-separated permitted browser origins |
| `TRUST_PROXY` | For proxied rate limiting | Trust the first reverse proxy hop |
| `SERVE_WEB_CLIENT` | No | Serve the static browser client from Express |
| `JSON_BODY_LIMIT` | No | JSON/form body limit; defaults to `100kb` |
| `API_RATE_LIMIT_*` | No | General API rate-limit window and maximum |
| `AUTH_RATE_LIMIT_MAX` | No | Stricter login/signup maximum |
| `SUPABASE_URL` | File uploads | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | File uploads | Server-only service role key |
| `SUPABASE_RESOURCE_BUCKET` | No | Private academic bucket; defaults to `CBResources` |
| `SUPABASE_LOST_FOUND_BUCKET` | Production images | Public image bucket; defaults to `CBLostFound` |
| `SIGNED_URL_TTL_SECONDS` | No | Academic download lifetime, 60–3600 seconds |
| `MAX_RESOURCE_FILE_BYTES` | No | Academic upload maximum; defaults to 10 MB |
| `MAX_IMAGE_FILE_BYTES` | No | Image upload maximum; defaults to 5 MB |
| `AUTO_APPROVE_RESOURCES` | No | Defaults to `false`; keep false when moderation is required |

Never put MongoDB credentials, JWT secrets, or the Supabase service key in browser/mobile configuration.

## MongoDB and Supabase

MongoDB collections and indexes are created by Mongoose. Courses can be added through the admin API. Existing resources that only contain the legacy `courseId` string remain readable; new resources also resolve an optional Course reference when the course exists.

Create these Supabase buckets:

- `CBResources`: **private**. Academic files are stored with generated object keys. Clients request `/resources/:id/download`, and the backend returns a short-lived signed URL only after checking visibility/ownership.
- `CBLostFound`: public when persistent production images are enabled. Images contain no authentication material. Without Supabase configuration, development images fall back to `uploads/lost-found`.

Restrict the service role key to the backend environment. Do not add a public-read policy to `CBResources`.

## Authentication and roles

The browser uses a production-aware HttpOnly cookie. Mobile stores the returned bearer token in Expo SecureStore. Protected endpoints accept either transport; tokens expire according to `JWT_EXPIRES_IN`.

- Students can manage their own resources and lost-and-found posts, browse approved content, and view events/courses.
- Admins can manage courses/events/users, moderate resources, and remove inappropriate content.

The API re-loads the user on every authenticated request, so deleted or blocked accounts cannot continue with stale tokens. Password hashes are excluded at the schema and serializer levels.

To grant the first admin role, first register the account normally, verify its college email manually, then run:

```bash
npm run admin:promote -- person@iiitg.ac.in
```

This command validates the email, refuses blocked/missing accounts, connects using `MONGO_URI`, and changes only that user's role. Do not expose a public “create admin” endpoint.

## API and response format

Important routes and request fields are documented in [docs/API.md](docs/API.md). Successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`. Temporary top-level compatibility aliases support older bundled pages.

Authenticated API calls may send:

```http
Authorization: Bearer <token>
```

## Quality checks

```bash
npm run check
npm test
cd mobile/campus-connect
npx expo-doctor
npx expo export --platform web --output-dir dist
```

The API suite uses an isolated in-memory MongoDB and does not require real credentials. Storage file integration still requires a configured Supabase test project and is deliberately not faked in the production path.

## Production deployment

1. Use HTTPS and a long random `JWT_SECRET`.
2. Set `NODE_ENV=production`, exact `ALLOWED_ORIGINS`, and `TRUST_PROXY=true` only behind a trusted reverse proxy.
3. Use MongoDB authentication, backups, network restrictions, and TLS.
4. Configure the private/public Supabase buckets as described above and rotate any key that has ever been exposed.
5. Run `npm ci --omit=dev`, `npm run check`, and `npm test` in CI before deployment.
6. Start with `npm start` under a process/container manager and provide graceful termination signals.
7. Persist logs outside the container without logging tokens, cookies, credentials, or uploaded file contents.
8. Build the Expo app through a controlled EAS/native release pipeline and test signed Android/iOS builds on real devices.

## Security notes and known limitations

- Request validation, explicit CORS, Helmet, bounded bodies/files/pagination, rate limits, safe ObjectId handling, generated storage names, generic login errors, ownership enforcement, and centralized production-safe errors are enabled.
- The root production dependency audit is clean. Expo 57 removed the original critical/high toolchain advisories; npm still reports moderate transitive advisories in current Expo/React Navigation packages for which no non-breaking upstream fix is available.
- Image headers/extensions are checked, but production deployments that accept hostile files should add content-signature scanning and malware scanning.
- Old database resources containing permanent `fileUrl` values use a compatibility download path. Migrate those objects into the private bucket and unset `fileUrl` to obtain the same guarantee as new uploads.
- Rate limiting is process-local. Multi-instance deployments should configure a shared store such as Redis.

No license has been specified.
