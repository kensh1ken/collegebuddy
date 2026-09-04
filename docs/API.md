# CollegeBuddy API

Base URL examples: `http://localhost:3000` in development or `https://api.example.edu` in production.

## Conventions

Protected routes accept the HttpOnly `jwt` cookie or `Authorization: Bearer <token>`. JSON success responses contain `success: true` and `data`; errors contain `success: false` and an `error` with stable `code` and safe `message`. Validation failures may include `error.details`.

List endpoints use `page` and `limit` (default 1/20, maximum 100) and return:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": { "page": 1, "limit": 20, "total": 0, "pages": 0 }
  }
}
```

## Authentication and users

| Method | Path | Access | Body/purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public/rate-limited | `name`, exact `@iiitg.ac.in` email, password (8–128 chars) |
| POST | `/api/auth/login` | Public/rate-limited | `email`, `password` |
| POST | `/api/auth/logout` | Public | Clears the browser cookie |
| GET | `/users/me` | Authenticated | Current private account view, never a password |
| PUT | `/users/complete-profile` | Authenticated | `course`, `branch`, `currentSem`, `rollNumber` |

## Courses

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/courses` | Authenticated | Filter by `search`, `semester`, `department`, `active` |
| POST | `/courses` | Admin | Create `code`, `name`, `semester`, `department`, optional `credits` |
| PATCH | `/courses/:id` | Admin | Update course fields |
| DELETE | `/courses/:id` | Admin | Archive by setting `active=false` |

## Academic resources

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/resources` | Authenticated | Search/filter visible and owned resources |
| POST | `/resources` | Authenticated | Submit a link or multipart file |
| GET | `/resources/:id` | Authenticated/visible | Resource metadata |
| GET | `/resources/:id/download` | Authenticated/visible | Short-lived file URL or validated external link |
| PATCH | `/resources/:id` | Owner/admin | Update metadata; student edits return to pending |
| DELETE | `/resources/:id` | Owner/admin | Delete metadata and stored object |
| PATCH | `/resources/:id/moderate` | Admin | Set `approved`/`rejected` plus optional note |

Filters: `search`, `course`/`courseId`, `semester`, `academicYear`, `resourceType`, `examType`, `status`, `page`, `limit`.

Resource types: `notes`, `previous_year_paper`, `assignment`, `lab_material`, `question_bank`, `study_material`, `external_link`. Exam types: `midsem`, `endsem`, `quiz`, `practical`, `other`, `none`. Delivery type is `file` or `link`. Files use the multipart field `file` and support PDF, PPT, PPTX, DOC, and DOCX up to the configured limit.

Admin aliases are available at `GET /admin/resources`, `PATCH /admin/resources/:id/moderate`, and `DELETE /admin/resources/:id`.

## Events

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/events` | Public | Filter by `search`, `type`, `upcoming`, pagination |
| GET | `/events/:id` | Public | Get an event |
| POST | `/events` | Admin | Create an event |
| PATCH | `/events/:id` | Admin | Update an event |
| DELETE | `/events/:id` | Admin | Delete an event |

Event URLs must be HTTP(S); end time cannot precede start time, and registration cannot close after start.

## Lost & Found

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/lost-found` | Public | Filter/search/paginate reports |
| POST | `/lost-found` | Authenticated | Multipart report; optional `image` |
| GET | `/lost-found/my-posts` | Authenticated | Current user's reports |
| GET | `/lost-found/:id` | Authenticated | Get report |
| PATCH/PUT | `/lost-found/:id` | Owner/admin | Edit or set `Open`, `Claimed`, `Resolved` |
| DELETE | `/lost-found/:id` | Owner/admin | Delete report and managed image |
| DELETE | `/admin/lost-found/:id` | Admin | Moderation alias |

Images support JPEG, PNG, and WebP up to the configured limit. Public listing exposes the poster's display name, not their email.

## Admin users

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/users` | Admin | Search/filter/paginate users |
| GET | `/admin/users/:id` | Admin | Inspect safe account data |
| PATCH | `/admin/users/:id/block` | Admin | Block a non-admin user |
| PATCH | `/admin/users/:id/unblock` | Admin | Unblock a non-admin user |

The API prevents self-blocking and blocking administrators through these routes.
