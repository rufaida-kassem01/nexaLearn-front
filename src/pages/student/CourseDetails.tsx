import humanizeDuration from "humanize-duration";
import React, { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/student/Footer";
import ReviewSection from "../../components/student/ReviewSection";
import Skeleton from "../../components/Skeleton";
import { getCourse } from "../../services/courseService";
import { checkEnrollment, enrollFree, startCheckout } from "../../services/enrollmentService";
import type { Course, CourseContent } from "../../types";

type OpenSections = Record<number, boolean>;

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    currency,
    navigate,
    calculateRating,
    calculateNoOfLectures,
    calculateCourseDuration,
    calculateChapterTime,
  } = React.useContext(AppContext);

  const [courseData, setCourseData] = useState<Course | CourseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openSections, setOpenSections] = useState<OpenSections>({});
  const [playerData, setPlayerData] = useState<{ videoId: string } | null>(null);

  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCourse(id);
      setCourseData(data);
    } catch {
      setError("Failed to load course details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchEnrollment = useCallback(async () => {
    if (!user) {
      setEnrolled(false);
      return;
    }
    try {
      const data = await checkEnrollment(id);
      setEnrolled(!!data.enrolled);
    } catch {
      setEnrolled(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    if (courseData) {
      fetchEnrollment();
    }
  }, [courseData, fetchEnrollment]);

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setEnrollError("");
    setEnrollSuccess("");
    setEnrollmentLoading(true);
    try {
      if (courseData?.isFree) {
        await enrollFree(id);
        setEnrolled(true);
        setEnrollSuccess("Enrolled successfully! Redirecting\u2026");
        setTimeout(() => navigate("/my-enrollments"), 1500);
      } else {
        const data = await startCheckout(id);
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setEnrollError("Failed to start checkout. Please try again.");
        }
      }
    } catch (err) {
      setEnrollError(
        err instanceof Error ? err.message : "Couldn't enroll right now.",
      );
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const instructorName =
    (courseData as Course)?.instructorName ||
    ((courseData as Course)?.instructor?.firstName
      ? `${(courseData as Course).instructor!.firstName} ${(courseData as Course).instructor!.lastName}`.trim()
      : null) ||
    "NexaLearn";

  if (loading) {
    return (
      <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left">
        <div className="absolute top-0 left-0 w-full h-section-height -z-1 bg-linear-to-b from-cyan-100/70" />
        <div className="max-w-xl z-10 flex-1 space-y-4">
          <Skeleton width="75%" height="2.5rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="85%" height="1rem" />
          <div className="flex gap-2 pt-4">
            <Skeleton width="4rem" height="1rem" />
            <Skeleton width="6rem" height="1rem" />
            <Skeleton width="5rem" height="1rem" />
          </div>
          <Skeleton width="10rem" height="1rem" />
          <div className="pt-8 space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} width="100%" height="3.5rem" />
            ))}
          </div>
        </div>
        <div className="max-w-course-card z-10 min-w-75 sm:min-w-105 w-full space-y-4">
          <Skeleton variant="card" width="100%" height="14rem" />
          <Skeleton width="6rem" height="2rem" />
          <Skeleton width="100%" height="2.5rem" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchCourse}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left">
        <div className="absolute top-0 left-0 w-full h-section-height -z-1 bg-linear-to-b from-cyan-100/70" />

        <div className="max-w-xl z-10 text-gray-500">
          <h1 className="md:text-course-deatails-heading-large text-course-deatails-heading-small font-semibold text-gray-800">
            {courseData?.title}
          </h1>
          <p
            className="pt-4 md:text-base text-sm"
            dangerouslySetInnerHTML={{
              __html: courseData?.description?.slice(0, 200) || "",
            }}
          />

          <div className="flex items-center space-x-2 pt-3 pb-1 text-sm">
            <p>{calculateRating(courseData).toFixed(1)}</p>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={
                    i < Math.floor(calculateRating(courseData))
                      ? assets.star
                      : assets.star_blank
                  }
                  alt=""
                />
              ))}
            </div>
            <p className="text-gray-600">
              {courseData?.totalReviews}
              {courseData?.totalReviews !== 1 ? " Ratings" : " Rating"}
            </p>
            <p>
              {courseData?.totalEnrollments}{" "}
              {courseData?.totalEnrollments !== 1 ? "students" : "student"}
            </p>
          </div>
          <p className="text-sm">
            Course by{" "}
            <span className="text-blue-600 underline">{instructorName}</span>
          </p>

          <div className="pt-8 text-gray-800">
            <h2 className="text-xl font-semibold">Course Structure</h2>
            <div className="pt-5">
              {(courseData as Course)?.modules?.map((mod, index) => (
                <div
                  key={index}
                  className="border border-gray-300 bg-white mb-2 rounded"
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleSection(index)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        className={`transform transition-transform ${
                          openSections[index] ? "rotate-180" : "rotate-0"
                        }`}
                        src={assets.down_arrow_icon}
                        alt="arrow icon"
                      />
                      <p className="font-medium md:text-base text-sm">
                        {mod.title}
                      </p>
                    </div>
                    <p className="text-sm md:text-default">
                      {mod.lessons.length} lecture
                      {mod.lessons.length !== 1 ? "s" : ""} -{" "}
                      {calculateChapterTime(mod)}
                    </p>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openSections[index] ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                      {mod.lessons.map((lesson, i) => (
                        <li key={i} className="flex items-start gap-2 py-1">
                          <img
                            src={assets.play_icon}
                            alt="play icon"
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                            <p>{lesson.title}</p>
                            <div className="flex gap-2">
                              {lesson.isPreview && (
                                <p
                                  onClick={() =>
                                    setPlayerData({
                                      videoId: lesson.contentUrl
                                        ?.split("/")
                                        .pop() || "",
                                    })
                                  }
                                  className="text-blue-500 cursor-pointer"
                                >
                                  Preview
                                </p>
                              )}
                              <p>
                                {humanizeDuration(
                                  (lesson.durationSecs || 0) * 1000,
                                  { units: ["h", "m"] },
                                )}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="py-10 text-sm md:text-default">
            <h3 className="text-xl font-semibold text-gray-800">
              Course Description
            </h3>
            <p
              className="pt-3 rich-text"
              dangerouslySetInnerHTML={{
                __html: courseData?.description || "",
              }}
            />
          </div>

          <ReviewSection
            courseId={id || ""}
            user={user}
            enrolled={enrolled === true}
          />
        </div>

        <div className="max-w-course-card z-10 shadow-custom-card rounded-t md:rounded-none overflow-hidden bg-white min-w-75 sm:min-w-105 sticky top-24">
          {playerData ? (
            <iframe
              width="100%"
              className="aspect-video"
              src={`https://www.youtube.com/embed/${playerData.videoId}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Course preview"
            />
          ) : (
            <img
              src={courseData?.thumbnailUrl}
              alt={courseData?.title}
              className="w-full"
            />
          )}

          <div className="p-5">
            <div className="flex gap-3 items-center pt-2">
              {courseData?.isFree ? (
                <p className="text-gray-800 md:text-4xl text-2xl font-semibold text-green-600">
                  Free
                </p>
              ) : (
                <p className="text-gray-800 md:text-4xl text-2xl font-semibold">
                  {currency}
                  {Number(courseData?.basePrice || 0).toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500">
              <div className="flex items-center gap-1">
                <img src={assets.star} alt="star icon" />
                <p>{calculateRating(courseData)}</p>
              </div>
              <div className="h-4 w-px bg-gray-500/40" />
              <div className="flex items-center gap-1">
                <img src={assets.time_clock_icon} alt="clock icon" />
                <p>{calculateCourseDuration(courseData)}</p>
              </div>
              <div className="h-4 w-px bg-gray-500/40" />
              <div className="flex items-center gap-1">
                <img src={assets.lesson_icon} alt="lesson icon" />
                <p>{calculateNoOfLectures(courseData)} lessons</p>
              </div>
            </div>

            {enrolled === true ? (
              <button
                onClick={() => navigate(`/player/${courseData?.id}`)}
                className="md:mt-6 mt-4 w-full py-3 rounded bg-green-600 hover:bg-green-700 text-white font-medium transition"
              >
                Go to course
              </button>
            ) : !user ? (
              <button
                onClick={() => navigate("/login")}
                className="md:mt-6 mt-4 w-full py-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                Login to enroll
              </button>
            ) : (
              <>
                <button
                  onClick={handleEnroll}
                  disabled={enrollmentLoading}
                  className="md:mt-6 mt-4 w-full py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium transition"
                >
                  {enrollmentLoading
                    ? "Enrolling\u2026"
                    : courseData?.isFree
                      ? "Enroll for Free"
                      : "Enroll Now"}
                </button>
                {enrollSuccess && (
                  <p className="text-green-600 text-sm pt-2 font-medium">{enrollSuccess}</p>
                )}
                {enrollError && (
                  <p className="text-red-500 text-sm pt-2">{enrollError}</p>
                )}
              </>
            )}

            <div className="pt-6">
              <p className="md:text-xl text-lg font-medium text-gray-800">
                What's in the course?
              </p>
              <ul className="ml-4 pt-2 text-sm md:text-default list-disc text-gray-500">
                <li>Lifetime access with free updates.</li>
                <li>Step-by-step, hands-on project guidance.</li>
                <li>Downloadable resources and source code.</li>
                <li>Quizzes to test your knowledge.</li>
                <li>Certificate of completion.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetails;
