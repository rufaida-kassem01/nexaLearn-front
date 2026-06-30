# NexaLearn Frontend

A React-based learning management platform with three role-specific interfaces: **students** browse and enroll in courses, **educators** create and manage content, and **admins** oversee the platform.

---

## Tech Stack

| Category        | Libraries                                                                 |
|-----------------|---------------------------------------------------------------------------|
| UI Framework    | React 19.2.7                                                              |
| Build Tool      | Vite 8.0.10                                                               |
| Styling         | Tailwind CSS v4.3.1 (via `@tailwindcss/vite`)                             |
| Routing         | React Router DOM 7.17.0                                                   |
| HTTP Client     | Axios 1.18.1                                                              |
| Video           | @mux/mux-player-react 3.13.0                                              |
| Payments        | @stripe/react-stripe-js 6.6.0, @stripe/stripe-js 9.8.0                   |
| Rich Text       | Quill 2.0.3                                                               |
| Uploads         | tus-js-client 4.3.1 (resumable video uploads)                             |
| Utilities       | humanize-duration 3.33.2, uniqid 5.4.0, rc-progress 4.0.0                |
| E2E Testing     | Playwright 1.61.1                                                         |
| Linting         | ESLint 10.2.1                                                             |

---

## Project Structure

```
nexaLearn-front/
├── src/
│   ├── main.jsx                  # Entry point — mounts the provider hierarchy
│   ├── App.jsx                   # Root component — all 28 route definitions
│   ├── index.css                 # Tailwind v4 import + custom font/theme tokens
│   ├── context/                  # React Context providers for global state
│   │   ├── AuthContext.jsx       #   JWT auth state (user, tokens, login/logout)
│   │   ├── AppContext.jsx        #   App state (courses, enrollments, helpers)
│   │   ├── ToastContext.js       #   Toast context creation
│   │   └── ToastContext.jsx      #   Toast provider + queue management
│   ├── services/                 # 19 API service modules (one per backend resource)
│   │   ├── authService.js        #   signup, login, refresh, logout, verifyEmail, etc.
│   │   ├── courseService.js      #   CRUD courses, modules, lessons, reorder, search
│   │   ├── enrollmentService.js  #   enroll, cancel, refund, checkout
│   │   ├── paymentService.js     #   Stripe payment intent, status polling
│   │   ├── progressService.js    #   lesson progress tracking
│   │   ├── assessmentService.js  #   quiz CRUD, attempts, grading
│   │   ├── reviewService.js      #   course reviews
│   │   ├── discussionService.js  #   threads, posts, upvotes, pinning
│   │   ├── certificateService.js #   get, verify, download PDF
│   │   ├── mediaService.js       #   video upload URL, asset management
│   │   ├── chatService.js        #   SSE streaming AI chat
│   │   ├── analyticsService.js   #   instructor analytics
│   │   ├── instructorService.js  #   apply, getApplicationStatus
│   │   ├── adminService.js       #   dashboard stats, applications, audit logs
│   │   ├── categoryService.js    #   CRUD categories
│   │   ├── moduleService.js      #   createModule
│   │   ├── lessonService.js      #   getLesson, getCoursePlayer, playback
│   │   ├── streakService.js      #   getStreak
│   │   └── notificationService.js#   list, markAsRead, poll
│   ├── utils/
│   │   ├── apiClient.js          # Axios instance with JWT refresh interceptor
│   │   └── normalize.js          # Deprecated normalization (now no-ops)
│   ├── hooks/
│   │   └── useToast.js           # Hook to fire toast notifications
│   ├── components/
│   │   ├── ErrorBoundary.jsx     # Class-based error boundary with reload
│   │   ├── ProtectedRoute.jsx    # Auth guard + role-based access control
│   │   ├── Toast.jsx             # Toast notification display
│   │   ├── Skeleton.jsx          # Loading placeholder (text/card/avatar)
│   │   ├── ConfirmDialog.jsx     # Confirmation modal
│   │   ├── DragHandle.jsx        # Up/down arrows for reordering
│   │   ├── NotificationBell.jsx  # Bell icon with unread count + polling
│   │   ├── NotificationList.jsx  # Dropdown notification list
│   │   ├── student/              # Student-facing components
│   │   │   ├── Navbar.jsx        #   Main navigation (streak, notifs, user menu)
│   │   │   ├── Footer.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── CourseCard.jsx
│   │   │   ├── CoursesSection.jsx
│   │   │   ├── TestimonialsSection.jsx
│   │   │   ├── CallToAction.jsx
│   │   │   ├── Rating.jsx
│   │   │   ├── ReviewSection.jsx
│   │   │   ├── RefundModal.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── discussion/       #   Q&A forum components
│   │   │       ├── ThreadList.jsx
│   │   │       ├── ThreadCard.jsx
│   │   │       ├── ThreadDetail.jsx
│   │   │       ├── CreateThreadForm.jsx
│   │   │       ├── PostCard.jsx
│   │   │       └── PostForm.jsx
│   │   └── educator/             # Educator-facing components
│   │       ├── Navbar.jsx
│   │       ├── Sidebar.jsx
│   │       ├── Footer.jsx
│   │       ├── QuizBuilder.jsx
│   │       ├── QuizPreview.jsx
│   │       ├── QuestionEditor.jsx
│   │       ├── VideoUploader.jsx
│   │       ├── VideoAssetLibrary.jsx
│   │       └── AssignVideoModal.jsx
│   ├── pages/
│   │   ├── auth/                 # Public authentication pages
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── VerifyEmail.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── student/              # Student pages
│   │   │   ├── Home.jsx
│   │   │   ├── CoursesList.jsx
│   │   │   ├── CategoryCourses.jsx
│   │   │   ├── CourseDetails.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── MyEnrollments.jsx
│   │   │   ├── Player.jsx
│   │   │   ├── QuizPage.jsx
│   │   │   └── VerifyCertificate.jsx
│   │   ├── educator/             # Educator pages
│   │   │   ├── Educator.jsx          # Application gate + layout outlet
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AddCourse.jsx
│   │   │   ├── EditCourse.jsx
│   │   │   ├── MyCourses.jsx
│   │   │   ├── StudentsEnrolled.jsx
│   │   │   ├── LessonAnalytics.jsx
│   │   │   ├── RevenueAnalytics.jsx
│   │   │   └── QuizAnalytics.jsx
│   │   └── admin/                # Admin pages
│   │       ├── AdminLayout.jsx
│   │       ├── AdminDashboard.jsx
│   │       ├── CategoryManager.jsx
│   │       ├── InstructorApplications.jsx
│   │       ├── InstructorApplicationDetail.jsx
│   │       └── AuditLogs.jsx
│   └── assets/                   # SVGs, PNGs, dummy data (dummyCourses)
├── e2e/                          # Playwright E2E test suites
├── public/                       # Static files (favicon.svg, icons.svg)
├── .env                          # Environment variables
├── vite.config.js                # Vite + React + Tailwind + API proxy
├── eslint.config.js
├── playwright.config.js
└── package.json
```

---

## Architecture

### Provider Hierarchy

The app is constructed in `src/main.jsx` as a nested provider tree:

```
<BrowserRouter>
  └─ <AuthContextProvider>          ← JWT authentication state
      └─ <AppContextProvider>       ← Global app state (courses, enrollments)
          └─ <App>
              ├─ <ToastProvider>    ← Toast notification queue
              │  └─ <ErrorBoundary> ← Catches render errors
              │     ├─ <Navbar />   ← Student navigation bar
              │     ├─ <Toast />    ← Toast renderer
              │     └─ <Routes>     ← 28 route definitions
```

### Three-Layer Data Flow

```
Pages (UI + user interaction)
  │  call service functions
  ▼
Services (request builders, no axios logic)
  │  call apiClient methods
  ▼
apiClient (Axios instance with interceptors)
  │  HTTP requests to backend API
  ▼
Backend API (NestJS, port 3000)
```

- **Pages** (in `src/pages/`) handle rendering and user events. They import service functions and context hooks.
- **Services** (in `src/services/`) are thin wrappers around `apiClient` calls — one file per backend resource.
- **apiClient** (in `src/utils/apiClient.js`) manages token injection, response unwrapping, and automatic 401 refresh.

---

## Routing

All 28 routes are defined in `src/App.jsx`. Routes are grouped by role, with nested layouts for educator and admin sections.

### Auth (public)
| Path               | Component        |
|--------------------|------------------|
| `/login`           | Login            |
| `/signup`          | Signup           |
| `/verify-email`    | VerifyEmail      |
| `/reset-password`  | ResetPassword    |

### Student (public)
| Path                        | Component            |
|-----------------------------|----------------------|
| `/`                         | Home                 |
| `/course-list`              | CoursesList          |
| `/course-list/:input`       | CoursesList (search) |
| `/category/:slug`           | CategoryCourses      |
| `/course/:id`               | CourseDetails        |
| `/verify/:code`             | VerifyCertificate    |

### Student (protected — requires login)
| Path                   | Component        | Guards                    |
|------------------------|------------------|---------------------------|
| `/checkout/:courseId`  | CheckoutPage     | ProtectedRoute            |
| `/my-enrollments`      | MyEnrollments    | ProtectedRoute            |
| `/player/:courseId`    | Player           | ProtectedRoute            |
| `/quiz/:lessonId`      | QuizPage         | ProtectedRoute            |

### Educator (protected — requires INSTRUCTOR role)
All under parent route `/educator` (`ProtectedRoute` → `Educator` layout with Sidebar + Outlet):

| Path                                          | Component           |
|-----------------------------------------------|---------------------|
| `/educator`                                   | Dashboard           |
| `/educator/add-course`                        | AddCourse           |
| `/educator/edit-course/:courseId`             | EditCourse          |
| `/educator/my-courses`                        | MyCourses           |
| `/educator/student-enrolled`                  | StudentsEnrolled    |
| `/educator/course/:id/analytics/lessons`      | LessonAnalytics     |
| `/educator/course/:id/analytics/revenue`      | RevenueAnalytics    |
| `/educator/course/:id/analytics/quiz-stats`   | QuizAnalytics       |

### Admin (protected — requires ADMIN role)
All under parent route `/admin` (`ProtectedRoute requiredRole="ADMIN"` → `AdminLayout` with Sidebar + Outlet):

| Path                                              | Component                     |
|---------------------------------------------------|-------------------------------|
| `/admin`                                          | AdminDashboard                |
| `/admin/categories`                               | CategoryManager               |
| `/admin/instructor-applications`                  | InstructorApplications        |
| `/admin/instructor-applications/:id`              | InstructorApplicationDetail   |
| `/admin/audit-logs`                               | AuditLogs                     |

---

## State Management

Three React Context providers manage global state (no external state library).

### AuthContext (`src/context/AuthContext.jsx`)

| State         | Description                                       |
|---------------|---------------------------------------------------|
| `user`        | User object from backend (`/auth/me`)             |
| `accessToken` | In-memory JWT access token                        |
| `loading`     | True while restoring session on mount             |
| `isAuthenticated` | Derived from `!!user`                         |

| Action     | Description                                                     |
|------------|-----------------------------------------------------------------|
| `login`    | Calls `authService.login`, stores tokens, sets user             |
| `signup`   | Calls `authService.signup`, stores tokens, sets user            |
| `logout`   | Calls `authService.logout`, clears user + tokens, redirects     |
| `storeRefreshToken` | Persists refresh token to `localStorage`               |
| `updateToken` | Sets in-memory access token + syncs to apiClient module   |

On mount, the provider reads the refresh token from `localStorage`, calls `/auth/refresh` to get a new access token, then calls `/auth/me` to populate the user.

### AppContext (`src/context/AppContext.jsx`)

| State              | Description                                              |
|--------------------|----------------------------------------------------------|
| `allCourses`       | Array of published courses fetched from backend          |
| `enrolledCourses`  | Courses the current user is enrolled in                  |
| `isEducator`       | Derived from `user.roles.includes("INSTRUCTOR")`         |
| `currency`         | From `VITE_CURRENCY` env var (default `$`)               |

| Action                     | Description                                         |
|----------------------------|-----------------------------------------------------|
| `fetchAllCourses`          | GET `/courses` → filter PUBLISHED → fallback to `dummyCourses` |
| `fetchUserEnrolledCourses` | Cross-references enrollment IDs with catalog, fetches missing individually |
| `enrollCourse`             | POST enrollment → refreshes enrolled list           |
| `calculateRating`          | Returns `course.ratingAvg`                          |
| `calculateChapterTime`     | Sums lesson durations in a module                   |
| `calculateCourseDuration`  | Sums all lesson durations across entire course      |
| `calculateNoOfLectures`    | Counts total lessons across all modules             |

**Mock fallback:** When the backend is unavailable, `dummyCourses` (from `src/assets/assets.js`) are used so the UI remains functional during development.

### ToastContext (`src/context/ToastContext.jsx`)

A simple notification queue:

- `addToast(message, type, duration)` — type: `success`, `error`, or `info`
- Toasts auto-dismiss after `duration` (default 4 seconds)
- Used via the `useToast()` hook

---

## API Layer

### apiClient (`src/utils/apiClient.js`)

A custom Axios instance that handles authentication transparently.

```js
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',  // '/api' in dev
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
```

**Request interceptor:**
- Attaches `Authorization: Bearer <accessToken>` to every request
- For `/auth/refresh`, sends the refresh token in the request body instead

**Response interceptor:**
1. Unwraps `{ data: ... }` envelope — consumers get the raw payload
2. On 401 errors:
   - Skips retry for `/auth/me` and `/auth/refresh` (would cause loops)
   - If a refresh token exists, queues concurrent 401s
   - Performs a single `/auth/refresh` call
   - On success: replays all queued requests with the new access token
   - On failure: clears tokens, calls `_onAuthFailure` callback → redirects to `/login`

### Vite Dev Proxy (`vite.config.js`)

In development, all `/api` requests are proxied to the NestJS backend:

```js
proxy: {
  '/api': {
    target: `http://localhost:${BACKEND_PORT}`,
    changeOrigin: true,
    rewrite: (path) => `/api/v1${path.replace(/^\/api/, '')}`,
  },
}
```

So a service call to `/courses` becomes `http://localhost:3000/api/v1/courses`.

---

## Authentication Flow

```
1. User logs in → POST /auth/login
2. Backend returns { accessToken, refreshToken, user }
3. AuthContext stores accessToken in memory, refreshToken in localStorage
4. On page reload:
   a. Read refreshToken from localStorage
   b. POST /auth/refresh → get new accessToken
   c. GET /auth/me → populate user object
5. On 401 from any other API call:
   a. Queue the failed request
   b. POST /auth/refresh (single request, even if multiple 401s)
   c. Replay all queued requests with new token
   d. If refresh fails → clear state → redirect to /login
```

---

## Access Control

### ProtectedRoute (`src/components/ProtectedRoute.jsx`)

```jsx
<ProtectedRoute requiredRole="INSTRUCTOR">
  <Educator />
</ProtectedRoute>
```

- If `loading` → renders nothing
- If not authenticated → redirects to `/login`
- If no `requiredRole` → renders children for any authenticated user
- If `requiredRole` is set → checks user roles with inheritance:
  - **ADMIN** can access everything
  - **INSTRUCTOR** can access student routes
  - **STUDENT** can only access student routes

### Educator Gate

The `Educator` page (`src/pages/educator/Educator.jsx`) doubles as a gate:
- Users without INSTRUCTOR role see the application flow
- Approved instructors see the educator layout (Navbar + Sidebar + Outlet)

---

## Key Features

### Authentication
- Email/password login and signup, email verification, password reset
- JWT access + refresh token pair with automatic rotation
- Files: `src/pages/auth/*`, `src/services/authService.js`

### Course Browsing
- Home page with featured courses, categories, and testimonials
- Full-text search with filters (category, level, sort)
- Per-category course listing
- Files: `src/pages/student/Home.jsx`, `CoursesList.jsx`, `CategoryCourses.jsx`, `components/student/CourseCard.jsx`

### Course Details & Enrollment
- Detailed course view with syllabus, reviews, instructor info
- Free or paid enrollment via Stripe checkout
- Payment intent creation + status polling
- Files: `src/pages/student/CourseDetails.jsx`, `CheckoutPage.jsx`, `services/paymentService.js`

### Video Player
- Mux-powered video player with chapter navigation
- Progress tracking per lesson
- AI chat panel (SSE streaming) for transcript Q&A
- Files: `src/pages/student/Player.jsx`, `services/chatService.js`, `services/progressService.js`

### Quiz System
- Educator quiz builder with multiple question types
- Student quiz taker with auto-grading and pass/fail
- Attempt tracking and score persistence
- Files: `src/pages/student/QuizPage.jsx`, `components/educator/QuizBuilder.jsx`, `services/assessmentService.js`

### Discussion Forum
- Per-lesson Q&A threads
- Create threads, reply, upvote, accept answers
- Instructor can pin/unpin, delete
- Files: `src/components/student/discussion/*`, `services/discussionService.js`

### Course Management (Educator)
- Create/edit courses with Quill rich-text descriptions
- Add/reorder modules and lessons
- Publish/unpublish courses
- Resumable video upload via tus to Mux
- Files: `src/pages/educator/AddCourse.jsx`, `EditCourse.jsx`, `MyCourses.jsx`, `components/educator/VideoUploader.jsx`

### Analytics (Educator)
- Lesson-level engagement metrics
- Revenue tracking per course
- Quiz performance statistics
- Files: `src/pages/educator/LessonAnalytics.jsx`, `RevenueAnalytics.jsx`, `QuizAnalytics.jsx`

### Admin Panel
- Dashboard with platform-wide stats
- Category management (CRUD)
- Instructor application review (approve/reject)
- Audit logs for sensitive actions
- Files: `src/pages/admin/*`, `services/adminService.js`

### Certificate Verification
- Public page to verify certificate by code
- Download certificate PDF
- Files: `src/pages/student/VerifyCertificate.jsx`, `services/certificateService.js`

### Notifications
- Bell icon with unread count (polls backend)
- Dropdown list with mark-as-read
- Files: `src/components/NotificationBell.jsx`, `NotificationList.jsx`, `services/notificationService.js`

### Streak Tracking
- Daily login streak display in navbar
- File: `services/streakService.js`

---

## Reusable Components

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| `ErrorBoundary` | `src/components/ErrorBoundary.jsx` | Catches render errors, shows reload button | `children` |
| `ProtectedRoute` | `src/components/ProtectedRoute.jsx` | Auth guard with optional role check | `children`, `requiredRole` |
| `Skeleton` | `src/components/Skeleton.jsx` | Loading placeholder | `variant` ("text"\|"card"\|"avatar"), `width`, `height` |
| `ConfirmDialog` | `src/components/ConfirmDialog.jsx` | Confirmation modal | `message`, `onConfirm`, `onCancel`, `open` |
| `Toast` | `src/components/Toast.jsx` | Renders toast notifications | (reads from ToastContext) |
| `DragHandle` | `src/components/DragHandle.jsx` | Up/down arrows for reordering | `onMoveUp`, `onMoveDown`, `isFirst`, `isLast` |
| `Rating` | `src/components/student/Rating.jsx` | Star rating display | `value`, `onChange` (optional) |

---

## How To — Usage Examples

### 1. Add a new API service

Create a file in `src/services/`. Import `apiClient` and export async functions:

```js
// src/services/exampleService.js
import apiClient from "../utils/apiClient";

export const getExamples = async (params) => {
  return apiClient.get("/examples", { params });
};

export const createExample = async (data) => {
  return apiClient.post("/examples", data);
};

export const updateExample = async (id, data) => {
  return apiClient.patch(`/examples/${id}`, data);
};

export const deleteExample = async (id) => {
  return apiClient.delete(`/examples/${id}`);
};
```

The `apiClient` automatically attaches the auth token and handles token refresh. No manual header management needed.

### 2. Add a new page

**Step 1:** Create the page component:

```jsx
// src/pages/student/NewFeature.jsx
import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import useToast from "../../hooks/useToast";

const NewFeature = () => {
  const { user } = useAuth();
  const { currency } = useContext(AppContext);
  const addToast = useToast();

  const handleAction = () => {
    addToast("Action completed!", "success");
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Hello, {user?.firstName}</h1>
      <button onClick={handleAction} className="btn-primary">
        Do something
      </button>
    </div>
  );
};

export default NewFeature;
```

**Step 2:** Add the route in `src/App.jsx`:

```jsx
import NewFeature from "./pages/student/NewFeature";

// Inside <Routes>, add:
<Route
  path="/new-feature"
  element={
    <ErrorBoundary>
      <ProtectedRoute>
        <NewFeature />
      </ProtectedRoute>
    </ErrorBoundary>
  }
/>
```

Wrap with `ErrorBoundary` for resilience and `ProtectedRoute` for auth gating (omit `ProtectedRoute` for public pages).

### 3. Access global state

```jsx
import { useAuth } from "../context/AuthContext";
import { AppContext } from "../context/AppContext";
import { useContext } from "react";

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { allCourses, enrolledCourses, fetchAllCourses, calculateCourseDuration } =
    useContext(AppContext);

  if (!isAuthenticated) return <p>Please log in</p>;

  return (
    <div>
      <p>Welcome, {user.firstName}</p>
      <p>Courses available: {allCourses.length}</p>
      <p>Enrolled: {enrolledCourses.length}</p>
    </div>
  );
};
```

### 4. Show a toast notification

```jsx
import useToast from "../hooks/useToast";

const MyComponent = () => {
  const addToast = useToast();

  const handleSave = async () => {
    try {
      await someApiCall();
      addToast("Saved successfully", "success");
    } catch {
      addToast("Failed to save", "error");
    }
  };

  const handleInfo = () => {
    addToast("Processing your request...", "info", 8000); // 8 second duration
  };
};
```

### 5. Add a new educator analytics page

**Step 1:** Create the page:

```jsx
// src/pages/educator/EngagementAnalytics.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getLessonAnalytics } from "../../services/analyticsService";

const EngagementAnalytics = () => {
  const { courseId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    getLessonAnalytics(courseId).then(setData).catch(console.error);
  }, [courseId]);

  if (!data) return <div className="animate-pulse h-40 bg-gray-200 rounded" />;

  return (
    <div>
      <h1 className="text-xl font-bold">Engagement</h1>
      {/* render charts/tables */}
    </div>
  );
};

export default EngagementAnalytics;
```

**Step 2:** Add the route inside the educator `<Route>` block in `App.jsx`:

```jsx
<Route path="course/:courseId/analytics/engagement" element={<EngagementAnalytics />} />
```

The educator sidebar already provides navigation links — add a corresponding `NavLink` in `src/components/educator/Sidebar.jsx`.

---

## Testing

E2E tests use Playwright and are located in `e2e/`:

```bash
npx playwright test                        # Run all test suites
npx playwright test e2e/auth.spec.js       # Run a specific suite
npx playwright test --ui                   # Interactive UI mode
npx playwright show-report                 # View HTML report
```

| Test Suite | File | Coverage |
|------------|------|----------|
| Auth | `e2e/auth.spec.js` | Login, signup, logout, session persistence |
| Course Management | `e2e/course-management.spec.js` | Create/edit/publish courses, manage modules/lessons |
| Student Learning | `e2e/student-learning.spec.js` | Browse, enroll, play videos, take quizzes |
| Discussion | `e2e/discussion.spec.js` | Thread CRUD, replies, upvotes |
| Reviews | `e2e/reviews.spec.js` | Create, edit, delete reviews |

---

## Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `VITE_API_URL` | `/api` | No | Backend API base URL |
| `VITE_CURRENCY` | `$` | No | Currency symbol for price display |
| `VITE_STRIPE_PUBLIC_KEY` | — | For payments | Stripe publishable key |

Copy `.env.example` to `.env` and fill in as needed.

---

## Development

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server (default: http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint check
```

The dev server proxies `/api` requests to the NestJS backend at `http://localhost:3000/api/v1`. Make sure the backend is running before making API calls.
