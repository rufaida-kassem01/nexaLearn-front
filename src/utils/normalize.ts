// ─────────────────────────────────────────────────────────────────────────
// Normalization layer — DEPRECATED
//
// All components have been updated to consume backend API responses
// directly (see Task 9.1). This file is kept only as a reference and
// should not be imported by any new code.
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

const placeholderThumbnail = (id: string | number | undefined | null): string => {
  if (!id) return PLACEHOLDER_THUMBNAILS[0];
  const sum = String(id)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PLACEHOLDER_THUMBNAILS[sum % PLACEHOLDER_THUMBNAILS.length];
};

const secondsToMinutes = (seconds: number | undefined | null): number => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return 0;
  return seconds / 60;
};

export const normalizeLesson = (lesson: Record<string, unknown> | null | undefined): Record<string, unknown> | null => {
  if (!lesson) return null;
  return {
    lectureId: lesson.id,
    lectureTitle: lesson.title,
    lectureDuration: secondsToMinutes(lesson.durationSecs as number),
    lectureUrl: lesson.contentUrl,
    contentType: lesson.contentType,
    lectureOrder: lesson.orderIndex,
    isPreviewFree: !!lesson.isPreview,
  };
};

export const normalizeModule = (module: Record<string, unknown> | null | undefined, lessons: Record<string, unknown>[] = []): Record<string, unknown> | null => {
  if (!module) return null;
  return {
    chapterId: module.id,
    chapterOrder: module.orderIndex,
    chapterTitle: module.title,
    chapterContent: lessons.map(normalizeLesson),
  };
};

export const normalizeCourse = (course: Record<string, unknown> | null | undefined, modulesWithLessons: Record<string, unknown>[] = (course?.modules as Record<string, unknown>[]) ?? []): Record<string, unknown> | null => {
  if (!course) return null;

  const courseId = (course.id ?? course.courseId) as string;

  const courseContent = modulesWithLessons
    .slice()
    .sort((a, b) => ((a.orderIndex ?? 0) as number) - ((b.orderIndex ?? 0) as number))
    .map((mod) => normalizeModule(mod, (mod.lessons || []) as Record<string, unknown>[]));

  return {
    _id: courseId,
    id: courseId,
    courseTitle: course.title,
    courseSubtitle: course.subtitle,
    courseDescription: course.description || "",
    coursePrice: (course.basePrice ?? (course.priceInCents != null ? (course.priceInCents as number) / 100 : 0)) as number,
    isFree: !!course.isFree,
    isPublished: course.status === "PUBLISHED" || course.status === "published",
    status: course.status,
    instructorId: course.instructorId,
    categoryId: course.categoryId,
    language: course.language,
    ratingAvg: course.ratingAvg ?? 0,

    discount: 0,

    courseRatings: course.totalReviews
      ? new Array(course.totalReviews as number).fill({ rating: course.ratingAvg ?? 0 })
      : [],

    totalEnrollments: course.totalEnrollments ?? 0,

    enrolledStudents: [],

    courseThumbnail: (course.thumbnailUrl as string) || placeholderThumbnail(courseId),

    courseContent,
    modules: modulesWithLessons,

    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
};

export const normalizeCourseDetail = (course: Record<string, unknown> | null | undefined): Record<string, unknown> | null => {
  if (!course) return null;
  const adapted: Record<string, unknown> = {
    ...course,
    price: course.price ?? course.basePrice,
    thumbnailUrl: course.thumbnail ?? course.thumbnailUrl,
    ratingAvg: course.rating ?? course.ratingAvg,
    totalReviews: course.reviewCount ?? course.totalReviews,
    totalEnrollments: course.enrollmentCount ?? course.totalEnrollments,
    instructorId: course.instructorId || (course.instructor as Record<string, unknown>)?.id,
    modules: ((course.modules || []) as Record<string, unknown>[]).map((mod: Record<string, unknown>, mi: number) => ({
      ...mod,
      orderIndex: mod.orderIndex ?? mi,
      lessons: ((mod.lessons || []) as Record<string, unknown>[]).map((lesson: Record<string, unknown>, li: number) => ({
        ...lesson,
        durationSecs: lesson.durationSeconds ?? lesson.durationSecs,
        orderIndex: lesson.orderIndex ?? li,
      })),
    })),
  };
  return normalizeCourse(adapted);
};

export const normalizeSearchCourse = (course: Record<string, unknown> | null | undefined): Record<string, unknown> | null => {
  if (!course) return null;
  return {
    _id: course.courseId ?? course.id,
    id: course.courseId ?? course.id,
    courseTitle: course.title,
    courseThumbnail: course.thumbnailUrl || course.thumbnail || placeholderThumbnail((course.courseId ?? course.id) as string),
    coursePrice: course.priceInCents != null ? (course.priceInCents as number) / 100 : (course.price ?? 0),
    ratingAvg: course.ratingAvg ?? course.rating ?? 0,
    courseRatings: course.ratingAvg ? new Array(Math.round(course.ratingAvg as number)).fill({ rating: course.ratingAvg }) : [] as Record<string, unknown>[],
    totalEnrollments: course.enrollmentCount ?? 0,
    instructorName: course.instructorName || ((course.instructor as Record<string, unknown>)?.firstName
      ? `${(course.instructor as Record<string, unknown>).firstName} ${(course.instructor as Record<string, unknown>).lastName}`.trim()
      : "NexaLearn"),
    categoryName: course.categoryName ?? (course.category as Record<string, unknown>)?.name ?? "",
    categoryId: course.categoryId ?? (course.category as Record<string, unknown>)?.id,
    discount: 0,
    enrolledStudents: [] as Record<string, unknown>[],
    isFree: course.isFree ?? ((course.priceInCents as number) === 0 || course.price == null),
    courseContent: [] as Record<string, unknown>[],
    modules: [] as Record<string, unknown>[],
    status: "PUBLISHED",
  };
};
