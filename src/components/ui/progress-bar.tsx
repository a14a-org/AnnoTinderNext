interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showCount?: boolean;
  color?: "coral" | "blue" | "green" | "gray";
  className?: string;
}

const colorClasses = {
  coral: "bg-chili-coral",
  blue: "bg-blue-500",
  green: "bg-green-500",
  gray: "bg-gray-500",
} as const;

export const ProgressBar = ({
  current,
  total,
  label,
  showCount = true,
  color = "coral",
  className = "",
}: ProgressBarProps) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={className}>
      {(label || showCount) && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          {label && <span>{label}</span>}
          {showCount && (
            <span>
              {current} / {total}
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
