"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { AnswerValue } from "../../types";

interface RatingInputProps {
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  brandColor: string;
}

export const RatingInput = ({
  value,
  onChange,
  brandColor,
}: RatingInputProps) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const currentRating = (value as number) || 0;

  return (
    <div 
      className="flex gap-2" 
      onMouseLeave={() => setHoveredRating(null)}
    >
      {[1, 2, 3, 4, 5].map((rating) => {
        const isHovered = hoveredRating !== null && rating <= hoveredRating;
        const isSelected = hoveredRating === null && rating <= currentRating;
        const isFilled = isHovered || isSelected;

        const isPreviewing = hoveredRating !== null && hoveredRating !== currentRating;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
            className="cursor-pointer p-1 transition-transform hover:scale-110 focus:outline-none"
            aria-label={`Rate ${rating} out of 5 stars`}
          >
            <Star
              className={`w-12 h-12 transition-all duration-200 ${
                isFilled ? "fill-current" : "text-gray-300"
              }`}
              style={{
                color: isFilled ? brandColor : undefined,
                fill: isFilled ? brandColor : "transparent",
                stroke: isFilled ? brandColor : "currentColor",
                opacity: isHovered && isPreviewing ? 0.6 : 1,
              }}
              strokeWidth={1}
            />
          </button>
        );
      })}
    </div>
  );
};
