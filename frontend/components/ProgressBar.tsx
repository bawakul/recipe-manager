'use client';

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  // Avoid division by zero
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#39FF6D] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[#39FF6D] font-medium whitespace-nowrap">
        {completed} of {total} steps
      </span>
    </div>
  );
}
