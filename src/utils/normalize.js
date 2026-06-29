// ─────────────────────────────────────────────────────────────────────────
// Normalization layer
//
// The UI (components/pages) was originally built against a "Udemy clone"
// style mock data shape (courseTitle, courseContent[].chapterContent[],
// _id, courseThumbnail, courseRatings, discount, enrolledStudents, etc).
//
// The real NexaLearn API returns a different shape (id, title, description,
// ratingAvg, status, and modules/lessons fetched via separate nested
// endpoints).
//
// Rather than rewrite every component, these helpers translate API
// responses into the legacy shape the UI already expects. This keeps the
// existing JSX working while the data underneath comes from the real
// backend.
// ─────────────────────────────────────────────────────────────────────────

import { assets } from "../assets/assets";

const PLACEHOLDER_THUMBNAILS = [
  assets.course_1_thumbnail,
  assets.course_2_thumbnail,
  assets.course_3_thumbnail,
  assets.course_4_thumbnail,
];

/**
 * Deterministically pick a placeholder thumbnail based on the course id,
 * so the same course always shows the same placeholder image.
 * Used only when thumbnailUrl is absent or null.
 */
const placeholderThumbnail = (id) => {
  if (!id) return PLACEHOLDER_THUMBNAILS[0];
  const sum = String(id)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PLACEHOLDER_THUMBNAILS[sum % PLACEHOLDER_THUMBNAILS.length];
};

/**
 * Convert a lesson duration from seconds (API) to minutes (legacy UI
 * fields like lectureDuration are expressed in minutes).
 */
const secondsToMinutes = (seconds) => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return 0;
  return seconds / 60;
};

/**
 * Map a single API lesson -> legacy "lecture" shape.
 */
export const normalizeLesson = (lesson) => {
  if (!lesson) return null;
  return {
    lectureId: lesson.id,
    lectureTitle: lesson.title,
    // API field is `durationSecs` (seconds); legacy UI expects minutes.
    lectureDuration: secondsToMinutes(lesson.durationSecs),
    lectureUrl: lesson.contentUrl,
    contentType: lesson.contentType,
    lectureOrder: lesson.orderIndex,
    // Real field from the API (LessonResponseDto.isPreview) — free-preview
    // lessons are watchable without enrollment.
    isPreviewFree: !!lesson.isPreview,
  };
};

/**
 * Map a single API module (with its lessons already attached) -> legacy
 * "chapter" shape.
 */
export const normalizeModule = (module, lessons = []) => {
  if (!module) return null;
  return {
    chapterId: module.id,
    chapterOrder: module.orderIndex,
    chapterTitle: module.title,
    chapterContent: lessons.map(normalizeLesson),
  };
};

/**
 * Map a single API course (with its modules/lessons already nested by the
 * API — see CourseDetailsResponseDto) -> the legacy "course" shape the
 * existing UI expects.
 *
 * @param {object} course - course object as returned by GET /courses or
 *   GET /courses/{id} — already includes `course.modules[].lessons[]`.
 * @param {Array}  [modulesWithLessons] - optional override; defaults to
 *   `course.modules`. Kept as a parameter only for callers that already
 *   have a modules array handy.
 */
export const normalizeCourse = (course, modulesWithLessons = course?.modules ?? []) => {
  if (!course) return null;

  const courseId = course.id ?? course.courseId;

  const courseContent = modulesWithLessons
    .slice()
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map((module) => normalizeModule(module, module.lessons || []));

  return {
    _id: courseId,
    id: courseId,
    courseTitle: course.title,
    courseSubtitle: course.subtitle,
    // API description is plain text; legacy UI renders it as HTML via
    // dangerouslySetInnerHTML, so plain text still displays fine.
    courseDescription: course.description || "",
    coursePrice: course.basePrice ?? (course.priceInCents != null ? course.priceInCents / 100 : 0),
    isFree: !!course.isFree,
    isPublished: course.status === "PUBLISHED" || course.status === "published",
    status: course.status,
    instructorId: course.instructorId,
    categoryId: course.categoryId,
    language: course.language,
    ratingAvg: course.ratingAvg ?? 0,

    // No discount concept in the backend schema.
    discount: 0,

    // The API returns totalReviews. Synthesize an array of that length so
    // `.length` checks ("N Ratings" labels) keep working without touching
    // every component.
    courseRatings: course.totalReviews
      ? new Array(course.totalReviews).fill({ rating: course.ratingAvg ?? 0 })
      : [],

    // Real enrollment count from the API (display only — actual
    // enroll/unenroll actions use the enrollment endpoints).
    totalEnrollments: course.totalEnrollments ?? 0,

    // enrolledStudents is kept as an empty array so any legacy code that
    // checks .length doesn't crash. Enrollment state is now derived from
    // GET /users/me/enrollments (see AppContext.fetchUserEnrolledCourses).
    enrolledStudents: [],

    // Use the real thumbnail URL from the API; fall back to a deterministic
    // placeholder only when the field is absent or null.
    courseThumbnail: course.thumbnailUrl || placeholderThumbnail(courseId),

    courseContent,
    modules: modulesWithLessons,

    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
};

/**
 * Map a single search result course (returned by GET /search/courses) to the
 * legacy shape the existing CourseCard and CoursesList UI expects.
 *
 * Search shape: { id, title, price, thumbnail, instructor: { firstName, lastName },
 *                 rating, enrollmentCount, category }
 */
/**
 * Adapt the GET /courses/:id response shape to the fields normalizeCourse
 * already knows, then delegate.
 *
 * Detail shape: { id, title, description, price, thumbnail,
 *                 modules: [{ id, title, lessons: [{ id, title, durationSeconds }] }],
 *                 instructor, rating, reviewCount, enrollmentCount }
 */
export const normalizeCourseDetail = (course) => {
  if (!course) return null;
  const adapted = {
    ...course,
    price: course.price ?? course.basePrice,
    thumbnailUrl: course.thumbnail ?? course.thumbnailUrl,
    ratingAvg: course.rating ?? course.ratingAvg,
    totalReviews: course.reviewCount ?? course.totalReviews,
    totalEnrollments: course.enrollmentCount ?? course.totalEnrollments,
    instructorId: course.instructorId || course.instructor?.id,
    modules: (course.modules || []).map((mod, mi) => ({
      ...mod,
      orderIndex: mod.orderIndex ?? mi,
      lessons: (mod.lessons || []).map((lesson, li) => ({
        ...lesson,
        durationSecs: lesson.durationSeconds ?? lesson.durationSecs,
        orderIndex: lesson.orderIndex ?? li,
      })),
    })),
  };
  return normalizeCourse(adapted);
};

export const normalizeSearchCourse = (course) => {
  if (!course) return null;
  return {
    _id: course.courseId ?? course.id,
    id: course.courseId ?? course.id,
    courseTitle: course.title,
    courseThumbnail: course.thumbnailUrl || course.thumbnail || placeholderThumbnail(course.courseId ?? course.id),
    coursePrice: course.priceInCents != null ? course.priceInCents / 100 : (course.price ?? 0),
    ratingAvg: course.ratingAvg ?? course.rating ?? 0,
    courseRatings: course.ratingAvg ? new Array(Math.round(course.ratingAvg)).fill({ rating: course.ratingAvg }) : [],
    totalEnrollments: course.enrollmentCount ?? 0,
    instructorName: course.instructorName || course.instructor?.firstName
      ? `${course.instructor?.firstName} ${course.instructor?.lastName}`.trim()
      : "NexaLearn",
    categoryName: course.categoryName ?? course.category?.name ?? "",
    categoryId: course.categoryId ?? course.category?.id,
    discount: 0,
    enrolledStudents: [],
    isFree: course.isFree ?? (course.priceInCents === 0 || course.price == null),
    courseContent: [],
    modules: [],
    status: "PUBLISHED",
  };
};
