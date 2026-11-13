"use client";

import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  info?: ReactNode; // 설명: 제목 옆 ⓘ를 누를 때만 펼친다
  actions?: ReactNode; // 제목 오른쪽에 둘 조작 (체크박스, 선택 칸 등)
  children: ReactNode;
}

// 각 입력 칸의 공통 틀. 설명을 접어 두어 화면을 짧게 유지한다.
export default function Panel({ title, info, actions, children }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <section className="rounded-xl border border-zinc-200 bg-background p-4 shadow-sm dark:border-zinc-800 dark:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h2 className="font-medium">{title}</h2>
          {info && (
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              aria-expanded={showInfo}
              aria-label={`${title} 설명`}
              className={`size-5 rounded-full border text-[11px] leading-[18px] ${showInfo ? "border-foreground bg-foreground text-background" : "border-zinc-300 text-zinc-500 dark:border-zinc-700"}`}
            >
              i
            </button>
          )}
        </div>
        {actions}
      </div>
      {showInfo && (
        <div className="mt-2 rounded-md bg-zinc-100 px-2.5 py-2 text-xs leading-5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">{info}</div>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}
