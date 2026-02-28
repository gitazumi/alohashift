"use client";

import type { AIComment as AICommentType } from "@/lib/aiComments";

interface AICommentProps {
  comment: AICommentType;
}

export default function AIComment({ comment }: AICommentProps) {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
      <p className="text-xs font-medium text-stone-400 mb-3">What we&apos;re seeing</p>

      <h4 className="text-base font-semibold text-stone-800 mb-2 leading-snug">
        {comment.headline}
      </h4>
      <p className="text-sm text-stone-600 mb-4 leading-relaxed">
        {comment.detail}
      </p>
      {comment.tip && (
        <div className="bg-white rounded-xl px-4 py-3 border border-stone-200">
          <p className="text-xs text-stone-500 leading-relaxed">{comment.tip}</p>
        </div>
      )}
    </div>
  );
}
