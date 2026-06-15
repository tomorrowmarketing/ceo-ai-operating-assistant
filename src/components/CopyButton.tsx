"use client";

import { useState } from "react";

/** 텍스트를 클립보드로 복사하는 버튼 (카톡/메일 붙여넣기용) */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한 실패 시 무시 (사용자가 직접 선택 복사 가능)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
    >
      {copied ? "복사됨 ✓" : "보고서 복사"}
    </button>
  );
}
