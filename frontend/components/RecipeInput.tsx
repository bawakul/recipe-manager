'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';

interface RecipeInputProps {
  onSubmit: (transcript: string) => void;
  disabled?: boolean;
  error?: string;
}

export function RecipeInput({ onSubmit, disabled, error }: RecipeInputProps) {
  const [transcript, setTranscript] = useState('');

  const canSubmit = transcript.trim().length >= 10 && !disabled;

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    onSubmit(transcript);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits, Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Auto-growing textarea using CSS Grid technique */}
      <div
        className="grid after:invisible after:whitespace-pre-wrap after:content-[attr(data-cloned-val)_'_'] after:rounded-xl after:bg-[#2d2d2d] after:px-4 after:py-3 after:text-lg after:[grid-area:1/1/2/2]"
        data-cloned-val={transcript}
      >
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste or dictate your recipe here..."
          disabled={disabled}
          className="resize-none overflow-hidden rounded-xl bg-[#2d2d2d] px-4 py-3 text-white text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39FF6D] disabled:opacity-50 [grid-area:1/1/2/2]"
          rows={1}
          aria-label="Recipe transcript input"
        />
      </div>

      {/* Error display */}
      {error && (
        <p className="mt-3 text-red-400 text-sm">{error}</p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-4 w-full rounded-xl bg-[#39FF6D] py-3 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2dd15f] transition-colors"
      >
        Parse Recipe
      </button>
    </form>
  );
}
