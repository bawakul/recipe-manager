'use client';

import { useState } from 'react';

interface AdjustPanelProps {
  isOpen: boolean;
  onClose: () => void;
  originalTranscript: string;
  onAdjust: (newTranscript: string) => void;
}

export function AdjustPanel({
  isOpen,
  onClose,
  originalTranscript,
  onAdjust,
}: AdjustPanelProps) {
  const [adjustmentText, setAdjustmentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = adjustmentText.trim().length > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    // Combine original transcript with adjustments
    const combinedTranscript =
      originalTranscript + '\n\nADJUSTMENTS:\n' + adjustmentText;

    // Parent handles the API call, so reset submitting state there
    onAdjust(combinedTranscript);

    // Reset state for next time
    setAdjustmentText('');
    setIsSubmitting(false);
  };

  // Don't render anything if not open (but keep in DOM for transitions)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop overlay - click to close */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel slides in from right */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-96 bg-[#1a1a1a] border-l border-[#2d2d2d] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2d2d2d]">
          <h2 className="text-xl font-semibold text-white">Adjust Recipe</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
            aria-label="Close panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Panel content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-73px)]">
          {/* Original transcript display */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Original transcript
            </label>
            <div className="max-h-48 overflow-y-auto bg-[#2d2d2d] p-3 rounded-lg">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {originalTranscript}
              </p>
            </div>
          </div>

          {/* Adjustment input */}
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">
              Add corrections or changes
            </label>
            <textarea
              value={adjustmentText}
              onChange={(e) => setAdjustmentText(e.target.value)}
              placeholder="e.g., 'Actually use 2 chicken breasts, not thighs' or 'Add a step to preheat oven to 400F'"
              className="w-full bg-[#2d2d2d] text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#39FF6D] placeholder:text-gray-500"
              rows={4}
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full mt-4 bg-[#39FF6D] text-black font-semibold rounded-xl py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2dd15f] transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Re-parsing...
              </>
            ) : (
              'Re-parse with changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
