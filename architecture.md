# CollegeBuddy Architecture

## System overview

CollegeBuddy is a modular monolith. A single Express application owns authentication, authorization, validation, business rules, MongoDB access, and storage access. It supports two clients:

- A static Campus OS browser application in `src/frontend`
- An Expo/React Native application in `mobile/campus-connect`

```text
Browser Campus OS                 Expo mobile app
        |                               |
        | HttpOnly cookie               | Bearer JWT from SecureStore
        +---------------+---------------+
                        |
                  Express REST API
                        |
          +-------------+-------------+
          |                           |
       MongoDB                  Supabase Storage
 users, courses, events,      private academic files
 resources, lost & found       and production images
```

The project intentionally remains a single Express service. There are no microservices or separate authentication servers.

## Repository layout

```text
collegebuddy/
|-- src/
|   |-- app.js                    # Express middleware and route composition
|   |-- server.js                 # Environment checks, MongoDB, HTTP lifecycle
|   |-- config/
|   |   |-- env.js                # Parsed environment configuration
|   |   |-- database.js           # MongoDB connection
|   |   `-- supabase.js           # Lazy server-only Supabase client
|   |-- routes/                   # URL and middleware declarations
|   |-- controllers/              # HTTP request/response translation
|   |-- services/                 # Resource and storage business operations
|   |-- validators/               # Zod schemas for untrusted input
|   |-- middleware/               # Auth, roles, validation, uploads, errors
|   |-- models/                   # Mongoose models and indexes
|   |-- utils/                    # Errors, serializers, responses, async wrapper
|   `-- frontend/                 # Browser application
|-- mobile/campus-connect/        # Expo application
|-- test/                         # API integration tests
|-- scripts/                      # Syntax check and admin provisioning
`-- docs/API.md                   # Endpoint reference
```

## Backend lifecycle

`src/server.js` is the process entry point:

1. Load and validate environment configuration.
2. Refuse startup when `MONGO_URI` or `JWT_SECRET` is missing.
3. Require Supabase credentials in production.
4. Connect Mongoose to MongoDB.
5. Start the HTTP server on `PORT`.
6. Close the HTTP server and MongoDB connection on `SIGINT` or `SIGTERM`.

`src/app.js` constructs the Express application without starting a network listener. This separation allows Supertest to test the same application used in production.

## Request pipeline

Requests pass through the following layers:

```text
HTTP request
  -> request ID
  -> Helmet security headers
  -> explicit CORS policy
  -> JSON/form body limits
  -> cookie parsing
  -> general rate limiter
  -> route matching
  -> authentication, when required
  -> role authorization, when required
  -> upload parser, when required
  -> Zod validation
  -> controller
  -> service/model operation
  -> normalized response
  -> centralized error handler
```

Unknown routes return a normalized `404` response. Operational errors use stable error codes. Unexpected production errors do not expose stack traces or database/storage internals.

## Authentication

Signup accepts only syntactically valid addresses ending exactly in `@iiitg.ac.in`. Passwords are hashed by bcrypt before storage, and the password field is excluded from normal Mongoose queries.

After signup or login, the API creates an expiring JWT containing the user ID. The token can be transported in two ways:

- Browser: secure, HttpOnly cookie
- Mobile: bearer token stored with Expo SecureStore

For every protected request, `requireAuth`:

1. Reads the cookie or bearer token.
2. Verifies its signature and expiration.
3. Loads the current user from MongoDB.
4. Rejects deleted accounts and blocked users.
5. Attaches the user document to `req.user`.

Role checks happen separately in `adminOnly`. Frontend visibility checks are only a user-experience feature; the API remains the authority.

## Authorization and ownership

Students can browse approved content and manage content they own. Administrators can manage users, courses, events, resources, and inappropriate lost-and-found posts.

Resource and lost-and-found update/delete operations compare the authenticated database user ID with the stored uploader ID. Changing an ID in the request therefore cannot grant access to another user's content.

New student resources default to `pending`. An administrator can move them to `approved` or `rejected`. Editing an approved resource as a student returns it to moderation unless automatic approval is explicitly enabled.

## Data model

### User

Stores identity, college email, password hash, academic profile, role, blocked state, and profile-completion state. Public/private serializers decide which fields leave the API.

### Course

Stores code, name, semester, department, credits, active state, timestamps, and search indexes. Archiving marks a course inactive instead of deleting related academic history.

### Resource

Stores:

- Title and description
- Course reference and compatible course code
- Semester and academic year
- Academic resource type and exam type
- File/link delivery type
- Moderation state and note
- Uploader and moderator references
- Safe file metadata and private storage object path
- Timestamps and discovery indexes

### Event

Stores title, description, organizer, category/type, start/end dates, registration deadline/link, location, image URL, creator, and timestamps.

### Lost & Found

Stores lost/found type, category, description, location, incident date, image, contact number, owner, lifecycle status, and timestamps. Public list responses omit contact numbers; authenticated detail views can use them.

## File storage

Academic files are never uploaded directly by a client to Supabase:

```text
Client multipart upload
  -> Multer memory buffer and size limit
  -> MIME + extension + binary signature checks
  -> generated random object name
  -> private Supabase bucket
  -> MongoDB metadata record
```

Downloads follow a separate authorization path:

```text
Authenticated download request
  -> resource visibility/ownership check
  -> Supabase signed URL
  -> short expiration
  -> client opens URL
```

Lost-and-found images use persistent Supabase storage when configured. Local development can fall back to `uploads/lost-found`, with generated filenames and automatic directory creation.

## Browser client

The main browser application is a responsive Campus OS interface. Its navigation exposes Home, Courses, Resources, Events, Lost & Found, Profile, Settings, and the role-gated Admin area.

`src/frontend/js/api-client.js` owns:

- API base URL selection
- Cookies
- Timeouts and cancellation
- Consistent response/error parsing
- Query-string generation
- Feature-level API methods

The main UI renders server values with DOM text nodes rather than interpolating untrusted values as HTML. It includes loading skeletons, empty states, partial-service errors, authentication redirects, and network failure messages.

The web client can be served by Express when `SERVE_WEB_CLIENT=true`, or independently during development when its origin is included in `ALLOWED_ORIGINS`.

## Mobile client

The Expo application uses:

- `src/api/client.js` for Axios, base URL configuration, bearer tokens, and normalized errors
- `AuthContext` for session restoration and authentication state
- `RootNavigator` to choose authentication, profile completion, or the application
- Nested stacks and bottom tabs for feature navigation
- Reusable cards, inputs, buttons, spinners, and empty states

The mobile API address comes from `EXPO_PUBLIC_API_URL`. Academic file buttons request a new authorized signed URL rather than using a permanent public URL.

## Testing

The backend test suite starts an isolated MongoDB Memory Server and exercises the real Express routes through Supertest. It currently covers authentication validation, duplicate accounts, generic login failures, invalid/expired JWTs, student/admin authorization, blocked sessions, resource moderation and ownership, search/pagination, spoofed file rejection, lost-and-found ownership/lifecycle, and event permissions.

`npm run check` performs JavaScript syntax validation. The mobile production web bundle can be verified with Expo export.

## Production topology

A typical deployment uses:

```text
HTTPS reverse proxy / load balancer
              |
      CollegeBuddy Node process
        |                 |
 MongoDB service    Supabase Storage
```

Set `TRUST_PROXY=true` only when the application is actually behind a trusted proxy. Use exact CORS origins, HTTPS, managed MongoDB backups, private academic storage, a long random JWT secret, centralized logs without credentials, and a shared rate-limit store when running multiple API instances.

## Compatibility notes

- Existing route prefixes remain available.
- `PUT` and `PATCH` are both accepted for existing lost-and-found updates.
- Legacy `file`/`link` resource submissions are normalized to the expanded academic model.
- Legacy resources with a public `fileUrl` remain downloadable during migration, but should be moved into the private bucket.
- Normalized response envelopes retain temporary top-level aliases for older bundled pages.
