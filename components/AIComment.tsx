"use client";

import type { AIComment as AICommentType } from "@/lib/aiComments";

interface AICommentProps {
  comment: AICommentType;
}

export default function AIComment({ comment }: AICommentProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
            Pattern Analysis
          </p>
          <p className="text-xs text-slate-400">
            Data source: Google Maps ETA snapshots · Simulation values are assumption-based
          </p>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-800 mb-2 leading-snug">
        {comment.headline}
      </h4>
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">
        {comment.detail}
      </p>
      {comment.tip && (
        <div className="flex items-start gap-2 bg-white rounded-xl px-4 py-3 border border-blue-100">
          <svg
            className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-slate-500 leading-relaxed">{comment.tip}</p>
        </div>
      )}
    </div>
  );
}
