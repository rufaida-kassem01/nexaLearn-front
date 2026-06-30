import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = React.useContext(AppContext);

  const courseId = course.id ?? course.courseId;
  const title = course.title;
  const thumbnail = course.thumbnailUrl || course.thumbnail || assets.course_1_thumbnail;
  const price = course.basePrice ?? (course.priceInCents != null ? course.priceInCents / 100 : 0);

  return (
    <Link
      to={"/course/" + courseId}
      onClick={() => scrollTo(0, 0)}
      className="border border-gray-500/30 pb-6 overflow-hidden rounded-lg w-full"
    >
      <img className="w-full" src={thumbnail} alt="" />
      <div className="p-3 text-left">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-gray-500">NexaLearn</p>
        <div className="flex items-center space-x-2">
          <p>{calculateRating(course).toFixed(1)}</p>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <img key={i} src={i < Math.floor(calculateRating(course)) ? assets.star : assets.star_blank} alt="" />
            ))}
          </div>
        </div>
        <p className="text-base font-semibold text-gray-800">
          {currency}{price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
};

export default CourseCard;
