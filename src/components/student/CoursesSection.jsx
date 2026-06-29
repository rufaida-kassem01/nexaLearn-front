import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "./CourseCard";
import Loading from "./Loading";
import { getCourses } from "../../services/courseService";
import { getCategories } from "../../services/categoryService";
import { normalizeCourse } from "../../utils/normalize";

const flattenCategories = (categories) => {
  const result = [];
  for (const category of categories) {
    if (category.isActive !== false) {
      result.push(category);
    }
    if (category.children?.length) {
      result.push(...flattenCategories(category.children));
    }
  }
  return result;
};

const CoursesSection = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCourses({ limit: 6 }), getCategories()])
      .then(([coursesData, categoriesData]) => {
        const list = Array.isArray(coursesData.items)
          ? coursesData.items
          : Array.isArray(coursesData)
            ? coursesData
            : [];
        setCourses(list.map((c) => normalizeCourse(c)).filter(Boolean));
        setCategories(flattenCategories(categoriesData ?? []));
      })
      .catch((e) => {
        console.error("fetchCourses error:", e);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-16 md:px-40 px-8">
      <h2 className="text-3xl font-medium text-gray-800">Learn from the best</h2>
      <p className="text-sm md:text-base text-gray-500 mt-3">
        Discover our top-rated courses across various categories. From coding
        and design to business <br /> and wellness, our courses are crafted to
        deliver results.
      </p>

      {categories.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Browse by category</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                onClick={() => scrollTo(0, 0)}
                className="text-gray-600 border border-gray-500/30 px-4 py-2 rounded hover:border-blue-500 hover:text-blue-600 transition"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-auto gap-6 py-8">
          {courses.slice(0, 4).map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}

      <Link
        to={"/course-list"}
        onClick={() => scrollTo(0, 0)}
        className="text-gray-500 border border-gray-500/30 px-10 py-3 rounded inline-block mt-10"
      >
        Show all courses
      </Link>
    </div>
  );
};

export default CoursesSection;
