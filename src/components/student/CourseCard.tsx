import { useContext } from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import type { CourseCardProps } from "../../types";

const CourseCard = ({ course }: CourseCardProps) => {
  const { currency, calculateRating } = useContext(AppContext);

  return (
    <Link
      to={"/course/" + course.id}
      onClick={() => scrollTo(0, 0)}
      className="border border-gray-500/30 pb-6 overflow-hidden rounded-lg w-full"
    >
      <img className="w-full" src={(course as Record<string, string>).thumbnailUrl || ""} alt="" />
      <div className="p-3 text-left">
        <h3 className="text-base font-semibold">{course.title}</h3>
        <p className="text-gray-500">NexaLearn</p>
        <div className="flex items-center space-x-2">
          <p>{calculateRating(course).toFixed(1)}</p>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <img key={i} src={i < Math.floor(calculateRating(course)) ? assets.star : assets.star_blank} alt="" />
            ))}
          </div>
          <p className="text-gray-500">{(course as Record<string, number>).totalReviews}</p>
        </div>
        <p className="text-base font-semibold text-gray-800">
          {currency}
          {((course as Record<string, number>).basePrice || 0).toFixed(2)}
        </p>
      </div>
    </Link>
  );
};

export default CourseCard;
