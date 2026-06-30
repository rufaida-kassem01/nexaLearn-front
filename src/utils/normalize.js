// ─────────────────────────────────────────────────────────────────────────
// DEPRECATED — Normalization layer removed.
//
// All consumers have been updated to use backend API field names directly.
// See Task 9.1 in IMPLEMENTATION_PLAN.md.
//
// Exports kept as no-ops to avoid breaking imports during transition;
// no file should import from here anymore.
// ─────────────────────────────────────────────────────────────────────────

export const normalizeLesson = () => null;
export const normalizeModule = () => null;
export const normalizeCourse = (course) => course;
export const normalizeCourseDetail = (course) => course;
export const normalizeSearchCourse = (course) => course;
