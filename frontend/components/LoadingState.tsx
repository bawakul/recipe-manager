'use client';

interface LoadingStateProps {
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="fixed inset-0 bg-[#1a1a1a] flex flex-col items-center justify-center">
      {/* Spinner */}
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#39FF6D] border-t-transparent" />

      {/* Message */}
      <p className="mt-4 text-white text-lg">{message}</p>
    </div>
  );
}
