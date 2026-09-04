# CollegeBuddy Project Audit

Audit date: 2026-09-04

## Scope and current architecture

CollegeBuddy is a single repository with three application surfaces:

1. **Express API** in `src/`, started by `src/server.js`. It connects to MongoDB with Mongoose before listening and mounts feature routers from `src/app.js`.
2. **Static web client** in `src/frontend/`. Each page has page-specific vanilla JavaScript and CSS and is expected to be served separately, commonly by Live Server on port 5500 or 5501.
3. **Expo mobile client** in `mobile/campus-connect/`. It uses React Navigation, Axios, Expo SecureStore, image/document pickers, and reusable loading/empty-state components.

The API uses MongoDB for application data, local disk storage for lost-and-found images, and Supabase Storage for academic files. No service or validator layer, automated tests, production process configuration, or lint configuration currently exists.

## Backend inventory

- Entry point: `src/server.js`
- Express configuration: `src/app.js`
- Configuration: `src/config/supabase.js`
- Controllers: authentication, users, resources, events, lost-and-found, and admin users
- Middleware: JWT authentication, admin authorization, local image uploads, memory-backed resource uploads
- Models: `User`, `Notes`, `Event`, and `LostFound`
- Authentication: JWT accepted from an HttpOnly cookie or bearer token
- Password hashing: bcrypt through a Mongoose pre-save hook
- Storage: public Supabase URLs for resources; local `uploads/lost-found` paths for images
- CORS: four hardcoded development origins
- Environment values currently consumed: `PORT`, `MONGO_URI`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`

## Client inventory

### Web

The web app has authentication/profile pages, a home page, events, resources, lost-and-found, and separate admin pages. API calls are duplicated across page scripts, most base URLs are hardcoded, response parsing is inconsistent, logout calls a nonexistent endpoint, and several templates interpolate server values with incomplete or no HTML escaping.

### Mobile

The mobile app has a centralized Axios client and feature API modules. JWTs are stored in Expo SecureStore and attached as bearer tokens. Navigation correctly separates unauthenticated, incomplete-profile, student, and admin states. Most list screens implement loading, refresh, empty, and error states. The backend URL is hardcoded to a developer LAN address, filters are limited, and the client assumes the legacy API response shape.

## Existing endpoint map

| Method | Path | Current access | Current protection |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | College-domain suffix check only |
| POST | `/api/auth/login` | Public | None beyond password verification |
| PUT | `/users/complete-profile` | Authenticated | Current user from JWT |
| GET | `/users/me` | Authenticated | Current user from JWT |
| GET | `/events` | Public | None |
| POST | `/events` | Admin | Authentication + role check |
| PATCH | `/events/:id` | Admin | Authentication + role check |
| DELETE | `/events/:id` | Admin | Authentication + role check |
| GET | `/lost-found` | Public | None |
| POST | `/lost-found` | Authenticated | Current user forced as owner |
| GET | `/lost-found/my-posts` | Authenticated | Current user filter |
| GET | `/lost-found/:id` | Authenticated | Authentication only |
| PUT | `/lost-found/:id` | Owner intended | Ownership comparison is incorrect |
| GET | `/resources` | Authenticated | Authentication only |
| POST | `/resources` | Authenticated | Current user forced as uploader |
| GET | `/resources/:id` | Authenticated | Authentication only |
| GET | `/admin/users` | Admin | Authentication + role check |
| PATCH | `/admin/users/:id/block` | Admin | Authentication + role check |
| PATCH | `/admin/users/:id/unblock` | Admin | Authentication + role check |

There are no existing course, resource moderation, signed-download, resource update/delete, lost-and-found delete/status, lost-and-found moderation, logout, health, or API documentation endpoints.

## Existing data models

### User

Name, email, password hash, course, branch, semester, role, blocked state, profile-completed state, roll number, and timestamps.

Issues: password is selected by default and leaks from profile responses; the password hook runs on every save; `rollNumber` is numeric and unique without a sparse index; email-domain validation is not part of the schema.

### Notes (academic resource)

Title, description, string `courseId`, semester, resource type (`file` or `link`), permanent file URL/external URL, uploader reference, and timestamps.

Issues: academic resource types are too coarse; no course reference, academic year, exam type, moderation state, safe file metadata, storage object key, ownership operations, pagination, or signed download flow.

### Event

Title, description, organizer, event date, registration deadline, location, registration URL, image URL, type, and timestamps.

Issues: no input/URL/date validation, end date, query filtering, pagination, or creator reference.

### LostFound

Title, description, category, lost/found type, location, image URL, open/claimed status, contact number, owner reference, and timestamps.

Issues: no incident date or resolved state; update ownership comparison uses an ObjectId/string mismatch; no delete/status routes; public listing populates owner email and may disclose more personal information than necessary.

## Security and correctness findings

Priority is based on exploitability and effect, not aesthetics.

### Critical/high

- Authenticated user/profile responses can include the password hash because the password field is selected by default.
- Resource files are exposed through permanent public Supabase URLs instead of authorization-gated short-lived URLs.
- The lost-and-found update ownership comparison is incorrect (`ObjectId !== string`), making legitimate updates fail and leaving authorization logic fragile.
- Blocked users are rejected at login and in admin middleware, but an already-authenticated blocked user can continue using normal protected routes.
- Authentication has no rate limiting, and malformed/oversized requests have no deliberate global limits.
- Controllers return raw database/storage error messages, leaking implementation details.

### Medium

- Signup accepts strings such as `attackeriiitg.ac.in`; it does not validate an actual `@iiitg.ac.in` mailbox.
- Login failures disclose whether an email or password was incorrect and thrown login errors are not consistently handled.
- Password hashing runs whenever a user document is saved, not only when the password changes.
- User serialization is inconsistent; several endpoints can expose internal moderation/security fields.
- MongoDB ObjectIds, bodies, queries, dates, URLs, enums, pagination, and file extensions are not consistently validated.
- Lost-and-found images trust the MIME header and original extension and use local ephemeral storage.
- Supabase upload object names contain unsanitized client filenames.
- Resource upload MIME validation does not also validate the extension.
- Admin routes allow unsafe operations such as blocking another administrator, with no explicit guard.
- Cookies do not set explicit `sameSite`, `secure`, or production-aware options, and no logout route clears them.
- CORS configuration is hardcoded instead of environment-driven.
- No Helmet headers, API rate limits, request IDs, controlled 404 handling, or production-safe logger exist.

### Client correctness/maintainability

- Web requests are scattered across scripts with hardcoded API origins and inconsistent escaping/state handling.
- The browser logout button calls `/api/auth/logout`, which does not exist.
- DOM `innerHTML` rendering of API values creates cross-site scripting risk on several pages.
- The mobile API URL is a hardcoded private LAN address.
- Existing clients depend on ad hoc top-level response keys and have no common pagination/error contract.

### Operational gaps

- No `.env.example`, startup environment validation, health endpoint, graceful shutdown, production start script, automated tests, CI, linting, or deployment guidance.
- The local lost-and-found upload directory is assumed to exist.
- No committed credential was found in the current tree or in commits matched by the audited secret variable names. This is not a substitute for a dedicated secret-scanning tool in CI.

## Recommended target architecture

Keep the existing Express application and directory layout, adding narrowly scoped modules rather than moving everything:

```text
src/
|-- config/       # validated environment, database, and Supabase clients
|-- controllers/  # HTTP translation only
|-- middleware/   # auth, roles, validation, errors, uploads, rate limits
|-- models/       # Mongoose schemas and indexes
|-- routes/       # route declarations
|-- services/     # resource storage and domain operations
|-- utils/        # errors, async wrappers, responses, serialization
|-- validators/   # shared request schemas
|-- app.js
`-- server.js
```

For compatibility during migration, normalized responses can temporarily retain documented legacy aliases while all bundled clients move to `success` and `data`.

## Implementation order

1. Add environment validation, standard errors/responses, safe async handling, 404 handling, Helmet, rate limits, JSON limits, and environment-based CORS.
2. Harden User serialization, signup/login/logout, cookies, JWT verification, and blocked-user enforcement.
3. Add a reusable validation layer for bodies, queries, params, URLs, dates, enums, pagination, and uploads.
4. Add Course and expanded Resource schemas with indexes, ownership, moderation, pagination, and backward-compatible course-code handling.
5. Make the academic bucket private, store generated object keys/metadata, and issue short-lived signed download URLs after authorization.
6. Complete lost-and-found ownership, status lifecycle, deletion, validation, safe public owner fields, and admin moderation.
7. Complete event validation/filtering and admin CRUD semantics.
8. Expand admin routes for resource and lost-and-found moderation and protect dangerous user operations.
9. Centralize the browser API layer and environment configuration; update mobile modules for normalized responses, pagination, moderation, and configurable base URLs.
10. Apply a shared responsive Campus OS design and verify loading, empty, error, unauthenticated, forbidden, and offline states.
11. Add critical API tests, run syntax/test/build checks, and document API, storage, admin bootstrap, deployment, and remaining infrastructure-specific limits.

## Compatibility strategy

- Preserve current route prefixes and existing request field names where safe.
- Add new endpoints rather than removing existing reads.
- Accept legacy `courseId` course codes during the resource migration.
- Return compatibility aliases until both bundled clients use the normalized `data` envelope.
- Keep local lost-and-found image storage in development while allowing persistent external storage in production.
- Require an explicit environment opt-in for automatic resource approval; otherwise new resources enter moderation.
