import { useEffect, useState } from "react";

interface RatingProps {
  initialRating?: number;
  onRate?: (rating: number) => void;
}

const Rating = ({ initialRating, onRate }: RatingProps) => {
  const [rating, setRating] = useState<number>(initialRating || 0);

  const handleRating = (value: number) => {
    setRating(value);
    if (onRate) onRate(value);
  };

  useEffect(() => {
    if (initialRating) {
      setRating(initialRating);
    }
  }, [initialRating]);

  return (
    <div>
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        return (
          <span
            key={index}
            className={`text-xl sm:text-2xl cursor-pointer transition-colors ${starValue <= rating ? "text-yellow-500" : "text-gray-400"}`}
            onClick={() => handleRating(starValue)}
          >
            &#9733;
          </span>
        );
      })}
    </div>
  );
};

export default Rating;
