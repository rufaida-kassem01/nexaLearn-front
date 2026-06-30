import humanizeDuration from "humanize-duration";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyCourses } from "../assets/assets";
import * as courseService from "../services/courseService";
import * as enrollmentService from "../services/enrollmentService";
import { useAuth } from "./AuthContext";

export const createSafeAppContext = () => ({
  currency: "$",
  allCourses: [],
  setAllCourses: () => {},
  enrolledCourses: [],
  setEnrolledCourses: () => {},
  isEducator: false,
  navigate: () => {},
  fetchAllCourses: async () => {},
  fetchUserEnrolledCourses: async () => {},
  enrollCourse: async () => {},
  calculateRating: () => 0,
  calculateChapterTime: () => "0 minutes",
  calculateCourseDuration: () => "0 minutes",
  calculateNoOfLectures: () => 0,
});

export const AppContext = createContext(createSafeAppContext());

export const AppContextProvider = (props) => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // ── Educator flag derived from server-side roles ────────────────────────────
  // isEducator is now derived from user.roles.includes("INSTRUCTOR"), not localStorage.
  // This ensures authorization always reflects the server state, not client-side hacks.
  const isEducator = user?.roles?.includes("INSTRUCTOR") ?? false;

  // ── Fetch all published courses ───────────────────────────────────────────
  // GET /courses has no server-side status/category/instructor filter (see
  // courseService.getCourses) and already returns each course's
  // modules[].lessons[] nested — so we filter to PUBLISHED client-side and
  // normalize directly, with no extra per-course requests.
  const fetchAllCourses = async () => {
    try {
      // limit:100 is a pragmatic cap, not real pagination — fine for now,
      // but if the catalog grows past that, fetchAllCourses needs to walk
      // nextCursor/hasMore instead of assuming everything fits on one page.
      const { items } = await courseService.getCourses({ limit: 100 });
      const published = (items ?? []).filter(
        (course) => course.status === "PUBLISHED",
      );

      if (published.length === 0) {
        setAllCourses(dummyCourses);
        return;
      }

      setAllCourses(published);
    } catch (err) {
      console.error("Failed to fetch courses:", err.message);
      setAllCourses(dummyCourses);
    }
  };

  // ── Fetch a single course by ID ───────────────────────────────────────────
  // Used as a fallback for enrolled courses that aren't in the public
  // published list (e.g. the course was unpublished after enrollment).
  const fetchCourseById = async (courseId) => {
    return courseService.getCourse(courseId);
  };

  // ── Fetch the current user's enrolled courses ─────────────────────────────
  // 1. Reads GET /users/me/enrollments for active course IDs.
  // 2. Cross-references with allCourses (published catalog).
  // 3. For any enrolled course missing from the catalog (unpublished, archived,
  //    or not yet loaded), fetches it individually via GET /courses/:id so it
  //    still appears in the student's My Enrollments list.
  const fetchUserEnrolledCourses = async () => {
    if (!user?.id || !accessToken) {
      setEnrolledCourses([]);
      return;
    }
    try {
      const enrollments = await enrollmentService.getMyEnrollments();
      const activeCourseIds = (Array.isArray(enrollments) ? enrollments : [])
        .filter((e) => e.status === "ACTIVE")
        .map((e) => String(e.courseId));

      if (activeCourseIds.length === 0) {
        setEnrolledCourses([]);
        return;
      }

      // Split into found (in catalog) and missing (need individual fetch)
      const catalogById = new Map(allCourses.map((c) => [String(c.id), c]));
      const found = [];
      const missingIds = [];

      for (const id of activeCourseIds) {
        if (catalogById.has(id)) {
          found.push(catalogById.get(id));
        } else {
          missingIds.push(id);
        }
      }

      // Fetch missing courses individually (best-effort — skip any that 404)
      const fetched = await Promise.allSettled(
        missingIds.map((id) => fetchCourseById(id)),
      );
      const recovered = fetched
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);

      if (fetched.some((r) => r.status === "rejected")) {
        fetched.forEach((r, i) => {
          if (r.status === "rejected") {
            console.error(
              `Could not fetch enrolled course ${missingIds[i]}:`,
              r.reason?.message,
            );
          }
        });
      }

      setEnrolledCourses([...found, ...recovered]);
    } catch (err) {
      console.error("Failed to fetch enrolled courses:", err.message);
      setEnrolledCourses([]);
    }
  };

  /**
   * Enroll the current user in a course, then refresh the enrolled list.
   * Throws on failure so the caller can surface the error to the user.
   */
  const enrollCourse = async (course) => {
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

  // ── Data helpers ─────────────────────────────────────────────────────────

  const calculateRating = (course) => course?.ratingAvg ?? 0;

  const calculateChapterTime = (module) => {
    if (!Array.isArray(module?.lessons)) return "0 minutes";
    const totalSeconds = module.lessons.reduce(
      (sum, lesson) => sum + (lesson.durationSecs ?? 0),
      0,
    );
    return humanizeDuration(totalSeconds * 1000, { units: ["h", "m"] });
  };

  const calculateCourseDuration = (course) => {
    if (!Array.isArray(course?.modules)) return "0 minutes";
    const totalSeconds = course.modules.reduce((sum, mod) => {
      if (!Array.isArray(mod.lessons)) return sum;
      return sum + mod.lessons.reduce((s, lesson) => s + (lesson.durationSecs ?? 0), 0);
    }, 0);
    return humanizeDuration(totalSeconds * 1000, { units: ["h", "m"] });
  };

  const calculateNoOfLectures = (course) => {
    if (!Array.isArray(course?.modules)) return 0;
    return course.modules.reduce(
      (sum, mod) => sum + (Array.isArray(mod.lessons) ? mod.lessons.length : 0),
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
