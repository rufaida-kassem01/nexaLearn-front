import Quill from "quill";
import React, { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import uniqid from "uniqid";
import { assets } from "../../assets/assets";
import { useAuth } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import { useToast } from "../../hooks/useToast";
import DragHandle from "../../components/DragHandle";
import VideoAssetLibrary from "../../components/educator/VideoAssetLibrary";
import QuizBuilder from "../../components/educator/QuizBuilder";
import * as courseService from "../../services/courseService";
import * as categoryService from "../../services/categoryService";
import type { Category } from "../../types";

interface Lecture {
  lectureId: string;
  lectureTitle: string;
  lectureDuration: string;
  lectureUrl: string;
  lectureContentType: string;
  isPreviewFree: boolean;
  lectureOrder: number;
}

interface Chapter {
  chapterId: string;
  chapterTitle: string;
  chapterContent: Lecture[];
  collapsed: boolean;
  chapterOrder: number;
}

interface LectureDetails {
  lectureTitle: string;
  lectureDuration: string;
  lectureUrl: string;
  lectureContentType: string;
  isPreviewFree: boolean;
}

const INIT_LECTURE_DETAILS: LectureDetails = {
  lectureTitle: "",
  lectureDuration: "",
  lectureUrl: "",
  lectureContentType: "video",
  isPreviewFree: false,
};

const AddCourse = () => {
  const quillRef = useRef<Quill | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { fetchAllCourses } = React.useContext(AppContext);
  const { addToast } = useToast();

  const [courseTitle, setCourseTitle] = useState("");
  const [courseSubtitle, setCourseSubtitle] = useState("");
  const [coursePrice, setCoursePrice] = useState<number | string>(0);
  const [discount, setDiscount] = useState<number | string>(0);
  const [language, setLanguage] = useState("en");
  const [isFree, setIsFree] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);

  const [lectureDetails, setLectureDetails] = useState<LectureDetails>({ ...INIT_LECTURE_DETAILS });

  useEffect(() => {
    categoryService.getCategories().then((data: Category[]) => {
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        setCategoryId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, { theme: "snow" });
    }
  }, []);

  const handleChapter = (action: "add" | "remove" | "toggle", chapterId?: string) => {
    if (action === "add") {
      const title = prompt("Enter Chapter Name:");
      if (title) {
        const newChapter: Chapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder:
            chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === "remove" && chapterId) {
      setChapters(chapters.filter((c) => c.chapterId !== chapterId));
    } else if (action === "toggle" && chapterId) {
      setChapters(
        chapters.map((c) =>
          c.chapterId === chapterId ? { ...c, collapsed: !c.collapsed } : c,
        ),
      );
    }
  };

  const handleLecture = (action: "add" | "remove", chapterId: string, lectureIndex?: number) => {
    if (action === "add") {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === "remove" && lectureIndex !== undefined) {
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

  const handleMoveModule = (chapterIndex: number, direction: "up" | "down") => {
    const newChapters = [...chapters];
    if (direction === "up" && chapterIndex > 0) {
      [newChapters[chapterIndex], newChapters[chapterIndex - 1]] = [
        newChapters[chapterIndex - 1],
        newChapters[chapterIndex],
      ];
      setChapters(newChapters);
    } else if (direction === "down" && chapterIndex < chapters.length - 1) {
      [newChapters[chapterIndex], newChapters[chapterIndex + 1]] = [
        newChapters[chapterIndex + 1],
        newChapters[chapterIndex],
      ];
      setChapters(newChapters);
    }
  };

  const handleMoveLesson = (chapterId: string, lectureIndex: number, direction: "up" | "down") => {
    setChapters(
      chapters.map((c) => {
        if (c.chapterId === chapterId) {
          const newContent = [...c.chapterContent];
          if (direction === "up" && lectureIndex > 0) {
            [newContent[lectureIndex], newContent[lectureIndex - 1]] = [
              newContent[lectureIndex - 1],
              newContent[lectureIndex],
            ];
          } else if (
            direction === "down" &&
            lectureIndex < newContent.length - 1
          ) {
            [newContent[lectureIndex], newContent[lectureIndex + 1]] = [
              newContent[lectureIndex + 1],
              newContent[lectureIndex],
            ];
          }
          return { ...c, chapterContent: newContent };
        }
        return c;
      }),
    );
  };

  const addLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture: Lecture = {
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
    setLectureDetails({ ...INIT_LECTURE_DETAILS });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      const course = await courseService.createCourse({
        title: courseTitle,
        subtitle: courseSubtitle,
        description,
        categoryId,
        language,
        basePrice: isFree ? 0 : parseFloat(String(coursePrice)),
        isFree,
        instructorId: user?.id,
      });

      for (const chapter of chapters) {
        const mod = await courseService.addModule(course.id, {
          title: chapter.chapterTitle,
        });

        for (const lecture of chapter.chapterContent) {
          const durationSeconds =
            Math.round(parseFloat(lecture.lectureDuration) * 60) || 0;

          await courseService.addLesson(course.id, mod.id, {
            title: lecture.lectureTitle,
            contentType: (lecture.lectureContentType || "VIDEO").toUpperCase(),
            contentUrl: lecture.lectureUrl,
            durationSeconds,
          });
        }
      }

      setCourseId(course.id);

      await fetchAllCourses();

      setCourseTitle("");
      setCourseSubtitle("");
      setCoursePrice(0);
      setDiscount(0);
      setLanguage("en");
      setIsFree(false);
      setImage(null);
      setChapters([]);
      if (quillRef.current) quillRef.current.root.innerHTML = "";
      if (categories.length > 0) setCategoryId(categories[0].id);

      addToast("Course created successfully!", "success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md w-full text-gray-500"
      >
        <div className="flex flex-col gap-1">
          <p>Course Title</p>
          <input
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCourseTitle(e.target.value)}
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCourseSubtitle(e.target.value)}
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
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLanguage(e.target.value)}
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCoursePrice(e.target.value)}
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setIsFree(e.target.checked);
                if (e.target.checked) setCoursePrice(0);
              }}
              className="scale-125"
            />
            <label htmlFor="isFree" className="cursor-pointer select-none">
              Free course
            </label>
          </div>

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
                onChange={(e: ChangeEvent<HTMLInputElement>) => setImage(e.target.files?.[0] || null)}
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
        </div>

        <div className="flex flex-col gap-1">
          <p>Discount % <span className="text-xs text-gray-400">(coming soon)</span></p>
          <input
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDiscount(e.target.value)}
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
                        {lectureIndex + 1} {lecture.lectureTitle} {"\u2014"}{" "}
                        {lecture.lectureDuration} mins {"\u2014"}{" "}
                        <a
                          href={lecture.lectureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500"
                        >
                          Link
                        </a>{" "}
                        {"\u2014"} {lecture.isPreviewFree ? "Free Preview" : "Paid"}
                      </span>
                      <div className="flex items-center gap-2">
                        <DragHandle
                          canMoveUp={lectureIndex > 0}
                          canMoveDown={
                            lectureIndex < chapter.chapterContent.length - 1
                          }
                          onMoveUp={() =>
                            handleMoveLesson(
                              chapter.chapterId,
                              lectureIndex,
                              "up"
                            )
                          }
                          onMoveDown={() =>
                            handleMoveLesson(
                              chapter.chapterId,
                              lectureIndex,
                              "down"
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
              {courseId ? (
                <VideoAssetLibrary
                  courseId={courseId}
                  chapters={chapters}
                />
              ) : (
                <p className="text-sm text-gray-400">
                  Save the course first, then manage videos here.
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white w-max py-2.5 px-8 rounded my-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "ADD"}
        </button>
      </form>

      {showQuizBuilder && (
        <QuizBuilder
          courseId=""
          lessonId=""
          lessonTitle=""
          onClose={() => setShowQuizBuilder(false)}
        />
      )}
    </div>
  );
};

export default AddCourse;
