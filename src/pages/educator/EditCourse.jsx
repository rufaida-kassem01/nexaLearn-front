import Quill from "quill";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import uniqid from "uniqid";
import { assets } from "../../assets/assets";
import { useAuth } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import { useToast } from "../../hooks/useToast";
import Skeleton from "../../components/Skeleton";
import DragHandle from "../../components/DragHandle";
import VideoAssetLibrary from "../../components/educator/VideoAssetLibrary";
import QuizBuilder from "../../components/educator/QuizBuilder";
import * as courseService from "../../services/courseService";
import * as categoryService from "../../services/categoryService";

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const quillRef = useRef(null);
  const editorRef = useRef(null);
  const { user } = useAuth();
  const { fetchAllCourses } = React.useContext(AppContext);
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseSubtitle, setCourseSubtitle] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [language, setLanguage] = useState("en");
  const [isFree, setIsFree] = useState(false);
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [quizBuilderLessonId, setQuizBuilderLessonId] = useState(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: "",
    lectureDuration: "",
    lectureUrl: "",
    lectureContentType: "video",
    isPreviewFree: false,
  });

  // Load categories on mount
  useEffect(() => {
    categoryService.getCategories().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    });
  }, []);

  // Initialize Quill editor
  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, { theme: "snow" });
    }
  }, []);

  // Load existing course data
  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const course = await courseService.getCourse(courseId);
        if (!course) {
          setFetchError("Course not found.");
          return;
        }

        // Populate form fields
        setCourseTitle(course.title || "");
        setCourseSubtitle(course.subtitle || "");
        setCoursePrice(course.basePrice || 0);
        setLanguage(course.language || "en");
        setIsFree(course.isFree || false);
        setCategoryId(course.categoryId || "");

        // Set description in Quill editor
        if (quillRef.current && course.description) {
          quillRef.current.root.innerHTML = course.description;
        }

        // Reconstruct chapters and lectures from modules (sorted by orderIndex)
        const reconstructedChapters = (course.modules || [])
          .slice()
          .sort(
            (a, b) =>
              (a.orderIndex ?? a.order ?? 0) - (b.orderIndex ?? b.order ?? 0),
          )
          .map((module) => ({
            chapterId: module.id || uniqid(),
            chapterTitle: module.title || "",
            chapterContent: (module.lessons || [])
              .slice()
              .sort(
                (a, b) =>
                  (a.orderIndex ?? a.order ?? 0) -
                  (b.orderIndex ?? b.order ?? 0),
              )
              .map((lesson) => ({
                lectureId: lesson.id || uniqid(),
                lectureTitle: lesson.title || "",
                lectureDuration: lesson.durationSeconds
                  ? Math.round(lesson.durationSeconds / 60)
                  : lesson.durationSecs
                    ? Math.round(lesson.durationSecs / 60)
                    : "",
                lectureUrl: lesson.contentUrl || "",
                lectureContentType: lesson.contentType
                  ? lesson.contentType.toLowerCase()
                  : "video",
                isPreviewFree: lesson.isPreviewFree || lesson.isPreview || false,
              })),
            chapterOrder: module.orderIndex ?? module.order ?? 0,
            collapsed: false,
          }));

        setChapters(reconstructedChapters);
      } catch (err) {
        setFetchError(err.message || "Failed to load course.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleChapter = (action, chapterId) => {
    if (action === "add") {
      const title = prompt("Enter Chapter Name:");
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder:
            chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === "remove") {
      setChapters(chapters.filter((c) => c.chapterId !== chapterId));
    } else if (action === "toggle") {
      setChapters(
        chapters.map((c) =>
          c.chapterId === chapterId ? { ...c, collapsed: !c.collapsed } : c,
        ),
      );
    }
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === "add") {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === "remove") {
      setChapters(
        chapters.map((c) => {
          if (c.chapterId === chapterId) {
            return {
              ...c,
              chapterContent: c.chapterContent.filter(
                (_, i) => i !== lectureIndex,
              ),
            };
          }
          return c;
        }),
      );
    }
  };

  const isPersistedId = (id) => /^\d+$/.test(String(id));

  const handleMoveModule = async (chapterIndex, direction) => {
    const newChapters = [...chapters];
    let swapped = false;

    if (direction === "up" && chapterIndex > 0) {
      [newChapters[chapterIndex], newChapters[chapterIndex - 1]] = [
        newChapters[chapterIndex - 1],
        newChapters[chapterIndex],
      ];
      swapped = true;
    } else if (direction === "down" && chapterIndex < chapters.length - 1) {
      [newChapters[chapterIndex], newChapters[chapterIndex + 1]] = [
        newChapters[chapterIndex + 1],
        newChapters[chapterIndex],
      ];
      swapped = true;
    }

    if (!swapped) return;

    const previousChapters = chapters;
    setChapters(newChapters);

    const moduleIdsInOrder = newChapters
      .map((c) => c.chapterId)
      .filter(isPersistedId);

    if (
      moduleIdsInOrder.length === 0 ||
      moduleIdsInOrder.length !== newChapters.length
    ) {
      return;
    }

    try {
      await courseService.reorderModules(courseId, moduleIdsInOrder);
    } catch (err) {
      setChapters(previousChapters);
      addToast(err.message || "Failed to reorder modules.", "error");
    }
  };

  const handleMoveLesson = async (chapterId, lectureIndex, direction) => {
    const chapter = chapters.find((c) => c.chapterId === chapterId);
    if (!chapter) return;

    const newContent = [...chapter.chapterContent];
    let swapped = false;

    if (direction === "up" && lectureIndex > 0) {
      [newContent[lectureIndex], newContent[lectureIndex - 1]] = [
        newContent[lectureIndex - 1],
        newContent[lectureIndex],
      ];
      swapped = true;
    } else if (
      direction === "down" &&
      lectureIndex < newContent.length - 1
    ) {
      [newContent[lectureIndex], newContent[lectureIndex + 1]] = [
        newContent[lectureIndex + 1],
        newContent[lectureIndex],
      ];
      swapped = true;
    }

    if (!swapped) return;

    const previousChapters = chapters;
    setChapters(
      chapters.map((c) =>
        c.chapterId === chapterId ? { ...c, chapterContent: newContent } : c,
      ),
    );

    if (!isPersistedId(chapterId)) return;

    const lessonIdsInOrder = newContent
      .map((l) => l.lectureId)
      .filter(isPersistedId);

    if (
      lessonIdsInOrder.length === 0 ||
      lessonIdsInOrder.length !== newContent.length
    ) {
      return;
    }

    try {
      await courseService.reorderLessons(courseId, chapterId, lessonIdsInOrder);
    } catch (err) {
      setChapters(previousChapters);
      addToast(err.message || "Failed to reorder lessons.", "error");
    }
  };

  const addLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder:
              chapter.chapterContent.length > 0
                ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1
                : 1,
            lectureId: uniqid(),
          };
          chapter.chapterContent.push(newLecture);
        }
        return chapter;
      }),
    );
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: "",
      lectureDuration: "",
      lectureUrl: "",
      lectureContentType: "video",
      isPreviewFree: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!categoryId) {
      setSubmitError("Please select a category.");
      return;
    }

    const description = quillRef.current
      ? quillRef.current.root.innerHTML
      : "";

    setIsSubmitting(true);
    try {
      // Update course basic info
      await courseService.updateCourse(courseId, {
        title: courseTitle,
        subtitle: courseSubtitle,
        description,
        categoryId,
        language,
        basePrice: isFree ? 0 : parseFloat(coursePrice),
        isFree,
      });

      // Refresh global course list
      await fetchAllCourses();

      addToast("Course updated successfully!", "success");
      setTimeout(() => {
        navigate("/educator/my-courses");
      }, 1500);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
        <div className="flex flex-col gap-4 max-w-md w-full space-y-6">
          <Skeleton width="12rem" height="1.5rem" />
          <Skeleton width="100%" height="2.5rem" />
          <Skeleton width="100%" height="2.5rem" />
          <Skeleton width="100%" height="2.5rem" />
          <Skeleton width="100%" height="2.5rem" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-red-500">{fetchError}</p>
        <button
          onClick={() => navigate("/educator/my-courses")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Back to My Courses
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md w-full text-gray-500"
      >
        <h1 className="text-2xl font-semibold text-gray-800">Edit Course</h1>

        <div className="flex flex-col gap-1">
          <p>Course Title</p>
          <input
            onChange={(e) => setCourseTitle(e.target.value)}
            value={courseTitle}
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <p>Course Subtitle</p>
          <input
            onChange={(e) => setCourseSubtitle(e.target.value)}
            value={courseSubtitle}
            type="text"
            placeholder="A short subtitle"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <p>Course Description</p>
          <div ref={editorRef}></div>
        </div>

        <div className="flex flex-col gap-1">
          <p>Category</p>
          {categories.length > 0 ? (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500 bg-white"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-red-400">
              No categories found. Please create one first.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p>Language</p>
          <input
            onChange={(e) => setLanguage(e.target.value)}
            value={language}
            type="text"
            placeholder="en"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
            required
          />
        </div>

        <div className="flex items-center justify-between flex-wrap">
          <div className="flex flex-col gap-1">
            <p>Course Price</p>
            <input
              onChange={(e) => setCoursePrice(e.target.value)}
              value={coursePrice}
              type="number"
              placeholder="0"
              min={0}
              step="0.01"
              disabled={isFree}
              className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500 disabled:opacity-40"
              required={!isFree}
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isFree"
              checked={isFree}
              onChange={(e) => {
                setIsFree(e.target.checked);
                if (e.target.checked) setCoursePrice(0);
              }}
              className="scale-125"
            />
            <label htmlFor="isFree" className="cursor-pointer select-none">
              Free course
            </label>
          </div>
        </div>

        {/* Thumbnail: captured but not yet sent */}
        <div className="flex md:flex-row flex-col items-center gap-3">
          <p>Course Thumbnail</p>
          <label htmlFor="thumbnailImage" className="flex items-center gap-3">
            <img
              src={assets.file_upload_icon}
              alt=""
              className="p-3 bg-blue-500 rounded"
            />
            <input
              type="file"
              id="thumbnailImage"
              onChange={(e) => setImage(e.target.files[0])}
              accept="image/*"
              hidden
            />
            <img
              className="max-h-10"
              src={image ? URL.createObjectURL(image) : ""}
              alt=""
            />
          </label>
        </div>

        {/* Discount */}
        <div className="flex flex-col gap-1">
          <p>Discount % <span className="text-xs text-gray-400">(coming soon)</span></p>
          <input
            onChange={(e) => setDiscount(e.target.value)}
            value={discount}
            type="number"
            placeholder="0"
            min={0}
            max={100}
            disabled
            className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500 opacity-40 cursor-not-allowed"
          />
        </div>

        <div>
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapter.chapterId} className="bg-white border rounded-lg mb-4">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-2">
                  <img
                    src={assets.dropdown_icon}
                    width={14}
                    alt=""
                    className={`mr-2 cursor-pointer transition-all ${
                      chapter.collapsed && "-rotate-90"
                    }`}
                    onClick={() => handleChapter("toggle", chapter.chapterId)}
                  />
                  <span className="font-semibold">
                    {chapterIndex + 1} {chapter.chapterTitle}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 mr-2">
                    {chapter.chapterContent.length} Lectures
                  </span>
                  <DragHandle
                    canMoveUp={chapterIndex > 0}
                    canMoveDown={chapterIndex < chapters.length - 1}
                    onMoveUp={() => handleMoveModule(chapterIndex, "up")}
                    onMoveDown={() => handleMoveModule(chapterIndex, "down")}
                  />
                  <img
                    src={assets.cross_icon}
                    alt=""
                    className="cursor-pointer"
                    onClick={() => handleChapter("remove", chapter.chapterId)}
                  />
                </div>
              </div>

              {!chapter.collapsed && (
                <div className="p-4">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div
                      key={lecture.lectureId}
                      className="flex justify-between items-center mb-2"
                    >
                      <span>
                        {lectureIndex + 1} {lecture.lectureTitle} —{" "}
                        {lecture.lectureDuration} mins —{" "}
                        <a
                          href={lecture.lectureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500"
                        >
                          Link
                        </a>{" "}
                        — {lecture.isPreviewFree ? "Free Preview" : "Paid"}
                      </span>
                      <div className="flex items-center gap-2">
                        {isPersistedId(lecture.lectureId) && (
                          <button
                            type="button"
                            onClick={() => setQuizBuilderLessonId(lecture.lectureId)}
                            className="text-[10px] text-purple-600 hover:text-purple-800 px-1.5 py-0.5 border border-purple-200 rounded"
                          >
                            Quiz
                          </button>
                        )}
                        <DragHandle
                          canMoveUp={lectureIndex > 0}
                          canMoveDown={
                            lectureIndex < chapter.chapterContent.length - 1
                          }
                          onMoveUp={() =>
                            handleMoveLesson(
                              chapter.chapterId,
                              lectureIndex,
                              "up",
                            )
                          }
                          onMoveDown={() =>
                            handleMoveLesson(
                              chapter.chapterId,
                              lectureIndex,
                              "down",
                            )
                          }
                        />
                        <img
                          src={assets.cross_icon}
                          alt=""
                          className="cursor-pointer"
                          onClick={() =>
                            handleLecture("remove", chapter.chapterId, lectureIndex)
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <div
                    className="inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2"
                    onClick={() => handleLecture("add", chapter.chapterId)}
                  >
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}

          <div
            className="flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer"
            onClick={() => handleChapter("add")}
          >
            + Add Chapter
          </div>

          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="bg-white text-gray-700 p-4 rounded relative w-full max-w-80">
                <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>

                <div className="mb-2">
                  <p>Lecture Title</p>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureTitle}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureTitle: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mb-2">
                  <p>Content Type</p>
                  <select
                    className="mt-1 block w-full border rounded py-1 px-2 bg-white"
                    value={lectureDetails.lectureContentType}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureContentType: e.target.value,
                      })
                    }
                  >
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>

                <div className="mb-2">
                  <p>Duration (minutes)</p>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureDuration}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureDuration: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mb-2">
                  <p>Lecture URL</p>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded py-1 px-2"
                    value={lectureDetails.lectureUrl}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        lectureUrl: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowPopup(false);
                      setShowVideoLibrary(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Upload Video
                  </button>
                </div>
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPopup(false);
                      setShowQuizBuilder(true);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 mt-1"
                  >
                    Add Quiz
                  </button>
                </div>

                <div className="flex gap-2 my-4">
                  <p>Is Preview Free?</p>
                  <input
                    type="checkbox"
                    className="mt-1 scale-125"
                    checked={lectureDetails.isPreviewFree}
                    onChange={(e) =>
                      setLectureDetails({
                        ...lectureDetails,
                        isPreviewFree: e.target.checked,
                      })
                    }
                  />
                </div>

                <button
                  type="button"
                  className="w-full bg-blue-400 text-white px-4 py-2 rounded"
                  onClick={addLecture}
                >
                  Add
                </button>

                <img
                  onClick={() => setShowPopup(false)}
                  src={assets.cross_icon}
                  className="absolute top-4 right-4 w-4 cursor-pointer"
                  alt=""
                />
              </div>
            </div>
          )}
        </div>

        {submitError && (
          <p className="text-red-500 text-sm">{submitError}</p>
        )}

        <div className="border-t pt-6 mt-4">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setShowVideoLibrary(!showVideoLibrary)}
          >
            <img
              src={assets.dropdown_icon}
              width={14}
              alt=""
              className={`transition-all ${!showVideoLibrary && "-rotate-90"}`}
            />
            <h3 className="text-base font-semibold text-gray-700">
              Video Library
            </h3>
          </div>
          {showVideoLibrary && (
            <div className="mt-4">
              <VideoAssetLibrary
                courseId={courseId}
                chapters={chapters}
                onAssetAssigned={(asset) => {
                  if (asset.lessonId) {
                    setChapters((prev) =>
                      prev.map((ch) => ({
                        ...ch,
                        chapterContent: ch.chapterContent.map((lec) =>
                          lec.lectureId === asset.lessonId
                            ? { ...lec, lectureUrl: asset.playbackUrl || asset.lectureUrl || lec.lectureUrl }
                            : lec
                        ),
                      }))
                    );
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 my-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-black text-white w-max py-2.5 px-8 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "SAVE CHANGES"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/educator/my-courses")}
            className="bg-gray-300 text-gray-700 w-max py-2.5 px-8 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </form>

      {quizBuilderLessonId && (
        <QuizBuilder
          courseId={courseId}
          lessonId={quizBuilderLessonId}
          lessonTitle={
            chapters
              .flatMap((c) => c.chapterContent)
              .find((l) => l.lectureId === quizBuilderLessonId)?.lectureTitle || ""
          }
          onClose={() => setQuizBuilderLessonId(null)}
        />
      )}
    </div>
  );
};

export default EditCourse;
