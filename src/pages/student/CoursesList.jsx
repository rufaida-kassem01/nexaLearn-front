import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import CourseCard from "../../components/student/CourseCard";
import Footer from "../../components/student/Footer";
import SearchBar from "../../components/student/SearchBar";
import Skeleton from "../../components/Skeleton";
import { getCourses, searchCourses } from "../../services/courseService";
import { getCategories } from "../../services/categoryService";

const PAGE_LIMIT = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "highest_rated", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const CoursesList = () => {
  const navigate = useNavigate();
  const { input } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";

  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data ?? []))
      .catch(() => {});
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const hasQuery = (input || "").trim().length > 0;
      const useSearch = hasQuery || categoryId || sort;
      const data = useSearch
        ? await searchCourses({
            query: input || undefined,
            categoryId: categoryId || undefined,
            sort: sort || undefined,
            limit: PAGE_LIMIT,
          })
        : await getCourses({ limit: PAGE_LIMIT });
      const list = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data)
            ? data
            : [];
      setCourses(list.filter(Boolean));
      setTotal(data.total ?? list.length);
    } catch (err) {
      setError("Failed to load courses. Please try again.");
      setCourses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [input, categoryId, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchCourses]);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    setSearchParams(params);
  };

  return (
    <>
      <div className="relative md:px-36 px-8 pt-20 text-left">
        <div className="flex md:flex-row flex-col gap-6 items-start justify-between w-full">
          <div>
            <h1 className="text-4xl font-semibold text-gray-800">Course List</h1>
            <p className="text-gray-500">
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => navigate("/")}
              >
                Home
              </span>{" "}
              / <span>Course List</span>
            </p>
          </div>
          <SearchBar data={input} />
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-8">
          {input && (
            <div className="inline-flex items-center gap-4 px-4 py-2 border text-gray-600">
              <p>{input}</p>
              <img
                src={assets.cross_icon}
                alt="clear"
                className="cursor-pointer"
                onClick={() => navigate("/course-list")}
              />
            </div>
          )}

          <select
            value={categoryId}
            onChange={handleCategoryChange}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={handleSortChange}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            aria-label="Sort courses"
          >
            <option value="">Sort by</option>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="my-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <Skeleton variant="card" width="100%" height="180px" />
                <Skeleton width="70%" height="1rem" />
                <Skeleton width="40%" height="0.9rem" />
                <Skeleton width="100%" height="0.9rem" />
                <Skeleton width="60%" height="0.9rem" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchCourses}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No courses found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your search or filter.
            </p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            <div className="grid grid-cols-auto my-8 gap-6 px-2 md:p-0">
              {courses.map((course) => (
                <CourseCard key={course.id ?? course.courseId} course={course} />
              ))}
            </div>

            {total > PAGE_LIMIT && (
              <div className="text-center my-12 text-sm text-gray-500">
                Showing {PAGE_LIMIT} of {total} courses
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CoursesList;
