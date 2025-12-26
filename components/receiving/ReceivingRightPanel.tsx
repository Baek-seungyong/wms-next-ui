"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  title: string;
  imageSrc: string;
  imageAlt: string;
  children: ReactNode; // 내역(텍스트/리스트) 영역
};

export function ReceivingRightPanel({ title, imageSrc, imageAlt, children }: Props) {
  return (
    <div className="flex-1 flex flex-col border-l pl-4 min-w-0">
      <h3 className="text-xs font-semibold text-gray-700 mb-2">{title}</h3>

      {/* ✅ 핵심: 내역(왼쪽) + 이미지(오른쪽) */}
      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* 내역 */}
        <div className="flex-1 border rounded-lg bg-gray-50 px-3 py-2 overflow-auto text-[11px] text-gray-700 space-y-1 min-w-0">
          {children}
        </div>

        {/* 이미지(오른쪽 크게) */}
        <div className="w-[42%] min-w-[260px] rounded-lg border bg-white overflow-hidden flex items-center justify-center pointer-events-none select-none">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={900}
            height={900}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
