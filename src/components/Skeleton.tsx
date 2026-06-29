import type { CSSProperties } from "react";

interface SkeletonProps {
  variant?: "text" | "card" | "avatar";
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

const Skeleton = ({
  variant = "text",
  width = "100%",
  height,
  borderRadius,
  className = "",
}: SkeletonProps) => {
  const baseClasses = "animate-pulse bg-gray-200";

  const variantClasses: Record<string, string> = {
    text: "h-4 rounded",
    card: "h-40 rounded-xl",
    avatar: "h-10 w-10 rounded-full",
  };

  const resolvedHeight = height ?? (variant === "avatar" ? "2.5rem" : variant === "card" ? "10rem" : "1rem");
  const resolvedWidth = width ?? (variant === "avatar" ? "2.5rem" : "100%");
  const resolvedRadius = borderRadius ?? (variant === "avatar" ? "9999px" : "0.75rem");

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.text} ${className}`}
      style={{ width: resolvedWidth, height: resolvedHeight, borderRadius: resolvedRadius } as CSSProperties}
    />
  );
};

export default Skeleton;
