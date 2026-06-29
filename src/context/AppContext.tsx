import humanizeDuration from "humanize-duration";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyCourses } from "../assets/assets";
import * as courseService from "../services/courseService";
import * as enrollmentService from "../services/enrollmentService";
import { useAuth } from "./AuthContext";
import type { Course } from "../types";

export const createSafeAppContext = () => ({
  currency: "$",
  allCourses: [] as Course[],
  setAllCourses: (_: Course[]) => {},
  enrolledCourses: [] as Course[],
  setEnrolledCourses: (_: Course[]) => {},
  isEducator: false,
  navigate: (_: string) => {},
  fetchAllCourses: async () => {},
  fetchUserEnrolledCourses: async () => {},
  enrollCourse: async (_: Course) => {},
  calculateRating: (_: Course) => 0,
  calculateChapterTime: (_: { lessons?: { durationSecs?: number }[] }) => "0 minutes",
  calculateCourseDuration: (_: { modules?: { lessons?: { durationSecs?: number }[] }[] }) => "0 minutes",
  calculateNoOfLectures: (_: { modules?: { lessons?: unknown[] }[] }) => 0,
});

export type SafeAppContext = ReturnType<typeof createSafeAppContext>;

export const AppContext = createContext<SafeAppContext>(createSafeAppContext());

export const AppContextProvider = (props: { children: React.ReactNode }) => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);

  const isEducator = user?.roles?.includes("INSTRUCTOR") ?? false;

  const fetchAllCourses = async () => {
    try {
      const result = await courseService.getCourses({ limit: 100 });
      const items = (result as { items?: Course[] })?.items ?? [];
      const published = items.filter(
        (course: Course) => course.status === "PUBLISHED",
      );

      if (published.length === 0) {
        setAllCourses(dummyCourses as unknown as Course[]);
        return;
      }

      setAllCourses(published);
    } catch (err) {
      console.error("Failed to fetch courses:", (err as Error).message);
      setAllCourses(dummyCourses as unknown as Course[]);
    }
  };

  const fetchAndNormalizeCourse = async (courseId: string): Promise<Course> => {
    return courseService.getCourse(courseId) as Promise<Course>;
  };

  const fetchUserEnrolledCourses = async () => {
    if (!user?.id || !accessToken) {
      setEnrolledCourses([]);
      return;
    }
    try {
      const enrollments = await enrollmentService.getMyEnrollments();
      const activeCourseIds = (Array.isArray(enrollments) ? enrollments : [])
        .filter((e: { status: string }) => e.status === "ACTIVE")
        .map((e: { courseId: string }) => String(e.courseId));

      if (activeCourseIds.length === 0) {
        setEnrolledCourses([]);
        return;
      }

      const catalogById = new Map(allCourses.map((c: Course) => [String(c.id), c]));
      const found: Course[] = [];
      const missingIds: string[] = [];

      for (const id of activeCourseIds) {
        if (catalogById.has(id)) {
          found.push(catalogById.get(id) as Course);
        } else {
          missingIds.push(id);
        }
      }

      const fetched = await Promise.allSettled(
        missingIds.map((id) => fetchAndNormalizeCourse(id)),
      );
      const recovered = fetched
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<Course>).value);

      if (fetched.some((r) => r.status === "rejected")) {
        fetched.forEach((r, i) => {
          if (r.status === "rejected") {
            console.error(
              `Could not fetch enrolled course ${missingIds[i]}:`,
              (r as PromiseRejectedResult).reason?.message,
            );
          }
        });
      }

      setEnrolledCourses([...found, ...recovered]);
    } catch (err) {
      console.error("Failed to fetch enrolled courses:", (err as Error).message);
      setEnrolledCourses([]);
    }
  };

  const enrollCourse = async (course: Course) => {
    if (!accessToken) {
      throw new Error("Please log in to enroll in this course.");
    }
    await enrollmentService.enrollFree(course.id);
    await fetchUserEnrolledCourses();
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  useEffect(() => {
    fetchUserEnrolledCourses();
  }, [user?.id, accessToken, allCourses]);

  const calculateRating = (course: Course): number => course?.ratingAvg ?? 0;

  const calculateChapterTime = (mod: { lessons?: { durationSecs?: number }[] }): string => {
    if (!Array.isArray(mod?.lessons)) return "0 minutes";
    const totalMinutes = mod.lessons.reduce(
      (sum, lesson) => sum + ((lesson.durationSecs ?? 0) / 60),
      0,
    );
    return humanizeDuration(totalMinutes * 60 * 1000, { units: ["h", "m"] });
  };

  const calculateCourseDuration = (course: { modules?: { lessons?: { durationSecs?: number }[] }[] }): string => {
    if (!Array.isArray(course?.modules)) return "0 minutes";
    const totalMinutes = course.modules.reduce((sum, mod) => {
      if (!Array.isArray(mod.lessons)) return sum;
      return (
        sum +
        mod.lessons.reduce(
          (s, lesson) => s + ((lesson.durationSecs ?? 0) / 60),
          0,
        )
      );
    }, 0);
    return humanizeDuration(totalMinutes * 60 * 1000, { units: ["h", "m"] });
  };

  const calculateNoOfLectures = (course: { modules?: { lessons?: unknown[] }[] }): number => {
    if (!Array.isArray(course?.modules)) return 0;
    return course.modules.reduce(
      (sum, mod) =>
        sum + (Array.isArray(mod.lessons) ? mod.lessons.length : 0),
      0,
    );
  };

  const value = {
    currency,
    allCourses,
    setAllCourses,
    enrolledCourses,
    setEnrolledCourses,
    isEducator,
    navigate,
    fetchAllCourses,
    fetchUserEnrolledCourses,
    enrollCourse,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
