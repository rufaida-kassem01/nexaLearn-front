import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import CourseCard from "../../components/student/CourseCard";
import Footer from "../../components/student/Footer";
import SearchBar from "../../components/student/SearchBar";
import Skeleton from "../../components/Skeleton";
import { getCategoryCourses } from "../../services/courseService";
import { getCategories } from "../../services/categoryService";
import type { Category, SearchCourseResult } from "../../types";

interface SortOption {
  value: string;
  label: string;
}

const PAGE_LIMIT = 12;

const SORT_OPTIONS: SortOption[] = [
  { value: "newest", label: "Newest" },
  { value: "highest_rated", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const findCategoryBySlug = (categories: Category[], slug: string): Category | null => {
  for (const category of categories) {
    if (category.slug === slug) return category;
    if (category.children?.length) {
      const match = findCategoryBySlug(category.children, slug);
      if (match) return match;
    }
  }
  return null;
};

const formatSlugLabel = (slug: string) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const CategoryCourses = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "";

  const [courses, setCourses] = useState<SearchCourseResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const category = useMemo(
    () => findCategoryBySlug(categories, slug || ""),
    [categories, slug],
  );
  const categoryName = category?.name || formatSlugLabel(slug || "");

  useEffect(() => {
    getCategories()
      .then((data: Category[]) => setCategories(data ?? []))
      .catch(() => {});
  }, []);

  const fetchCourses = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError("");
    try {
      const data = await getCategoryCourses(slug, {
        query: query || undefined,
        sort: sort || undefined,
        limit: PAGE_LIMIT,
      });
      const list = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
      const normalized: SearchCourseResult[] = list.map((c: SearchCourseResult) => ({
        ...c,
        basePrice: c.basePrice ?? (c.priceInCents != null ? c.priceInCents / 100 : 0),
        totalReviews: c.totalReviews ?? 0,
        thumbnailUrl: c.thumbnailUrl || c.thumbnail,
      })).filter(Boolean);
      setCourses(normalized);
      setTotal(data.total ?? list.length);
    } catch {
      setError("Failed to load courses. Please try again.");
      setCourses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [slug, query, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchCourses]);

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    setSearchParams(params);
  };

  const buildSearchUrl = (searchText: string) => {
    const params = new URLSearchParams(searchParams);
    const trimmed = searchText.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    const queryString = params.toString();
    return queryString ? `/category/${slug}?${queryString}` : `/category/${slug}`;
  };

  return (
    <>
      <div className="relative md:px-36 px-8 pt-20 text-left">
        <div className="flex md:flex-row flex-col gap-6 items-start justify-between w-full">
          <div>
            <h1 className="text-4xl font-semibold text-gray-800">{categoryName}</h1>
            <p className="text-gray-500">
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => navigate("/")}
              >
                Home
              </span>{" "}
              /{" "}
              <Link to="/course-list" className="text-blue-600 hover:underline">
                Course List
              </Link>{" "}
              / <span>{categoryName}</span>
            </p>
            <Link
              to="/course-list"
              className="inline-block mt-3 text-sm text-blue-600 hover:underline"
            >
              {"\u2190"} Back to all courses
            </Link>
          </div>
          <SearchBar data={query} buildSearchUrl={buildSearchUrl} />
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-8">
          {query && (
            <div className="inline-flex items-center gap-4 px-4 py-2 border text-gray-600">
              <p>{query}</p>
              <img
                src={assets.cross_icon}
                alt="clear search"
                className="cursor-pointer"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete("q");
                  const queryString = params.toString();
                  navigate(
                    queryString
                      ? `/category/${slug}?${queryString}`
                      : `/category/${slug}`,
                  );
                }}
              />
            </div>
          )}

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
            <p className="text-gray-500 text-lg">No courses found in this category.</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your search or sort options.
            </p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <>
            <div className="grid grid-cols-auto my-8 gap-6 px-2 md:p-0">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
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

export default CategoryCourses;
