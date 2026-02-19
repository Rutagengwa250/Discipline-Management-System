# Discipline Management System: How It Works

## 1) Purpose
This system is a school discipline platform used by three roles:
- `director`
- `admin`
- `teacher`

It tracks students, faults, permissions, removal requests, and discipline reports.

## 2) High-Level Architecture
- Backend: `Node.js + Express` in `admin/server.js`
- Database access layer: `admin/Admin-form/database.js`
- Database: MySQL-compatible (now configured for TiDB using TLS)
- Frontend pages:
  - Login: `admin/Admin-form/login.html`
  - Role pages: `admin/pages/*.html`
  - Student registration page: `student/signup.html`

## 3) Authentication and Sessions
- Endpoint: `POST /login`
- Input: `username`, `password`
- Password check: `bcryptjs.compare(...)`
- On success:
  - Issues JWT token (8-hour expiry)
  - Returns user role and redirect URL
- Token is required for protected APIs using `Authorization: Bearer <token>`.

## 4) Roles and Access
- `teacher`:
  - Can view students
  - Can submit faults/removal requests
  - Can interact with teacher dashboard features
- `admin`:
  - Can manage permissions and student operations
  - Can access profile/admin pages and reports
- `director`:
  - Full oversight, dashboards, analytics, reports, teacher registration, admin credential management

Role checks are enforced with middleware (`authorizeRole(...)`) in `admin/server.js`.

## 5) Core Business Flows

### A) Student Registration
- Endpoint: `POST /register`
- Validates names/class
- Prevents duplicate student entries
- Inserts into `student` table with default conduct score.

### B) Student Listing/Search
- Endpoint: `GET /students` (token required)
- Returns active students (excludes `Graduated`)
- Additional endpoints support search and class filtering.

### C) Fault Management
- Faults are stored in `faults` table
- Each fault can deduct conduct points
- Created by teacher/admin identities (`created_by`)
- Used for discipline history and analytics.

### D) Permission Management
- Endpoint: `GET /api/permissions`
- Supports pagination + filters (status/date/student name)
- TiDB-compatible implementation uses:
  - one paginated `SELECT`
  - one `COUNT(*)` query for total items
- Status updates:
  - `PATCH /api/permissions/:id/status`
  - logs history in `permission_history`.

### E) Removal Requests
- Teachers can request removal/review of penalties
- Director/Admin can approve/reject
- Requests stored in `removal_requests`.

### F) Expulsion/Graduation
- Endpoints:
  - `POST /api/students/:id/expel`
  - `POST /api/director/students/:id/expel`
- Current logic marks student class as `Graduated`.

### G) Director Dashboard and Reports
- Dashboard stats endpoint:
  - `GET /api/director/dashboard-stats`
- Returns:
  - top-level summary fields (`totalStudents`, etc.)
  - nested `overview` (same summary)
  - `classStats`
- Recent activity, reports, and trend endpoints provide analytics.

## 6) Key Routes and Static Pages
- Root route serves login page:
  - `/` -> `admin/Admin-form/login.html`
- Main pages are served from static folders:
  - `admin/Admin-form`
  - `admin/pages`
  - `student`
  - `files`
- Director page route fix:
  - `/director-dashboard.html` -> `admin/pages/Director-dashboard.html`
- Backward-compatibility fallback:
  - `/dashboard.html` -> `admin/pages/profile-page.html`

## 7) Database Configuration
Configured from `.env`:
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_SSL=true` (required for TiDB)

Pool is created in `admin/Admin-form/database.js`.

## 8) Deployment Runtime (Render/TiDB)
1. Render runs: `node admin/server.js`
2. App binds to `process.env.PORT` (fallback `5000`)
3. App connects to TiDB using TLS
4. Frontend calls backend endpoints over same host origin.

## 9) Operational Notes
- Render free services may sleep when idle.
- First request after idle may be slow (cold start).
- Always keep secrets only in environment variables (not committed).
- Rotate credentials if exposed.

## 10) Current Stability Fixes Applied
- Removed TiDB-incompatible `SQL_CALC_FOUND_ROWS` usage.
- Fixed incorrect director dashboard file path.
- Removed duplicate admin credential update route.
- Added favicon support across pages.
- Added password show/hide toggle on login.
- Switched from native `bcrypt` to `bcryptjs` to avoid build issues in deployment.

## 11) Recommended Future Improvements
- Add automated API tests for critical flows (login, permissions, dashboard).
- Add centralized error logging/monitoring.
- Add input validation layer (schema-based).
- Split `admin/server.js` into route modules (`auth`, `students`, `permissions`, `director`, etc.) for maintainability.
