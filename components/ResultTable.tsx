import { ROW_HEIGHT, SHORT_NAME } from "./CardForm";
import type { ResultRow } from "@/lib/compare";
import { CORE_STAT_KEYS, type Role } from "@/lib/types";

interface Props {
  role: Role;
  rows: ResultRow[]; // 핵심 합계 순으로 정렬된 결과
}

const cell = `${ROW_HEIGHT} flex flex-col items-center justify-center rounded-md text-sm tabular-nums`;

// 한 줄(스탯 하나)의 값들 중 최댓값 — 그 줄에서 가장 높은 카드를 강조하고, 나머지는 차이를 보여준다
function Value({ value, best }: { value: number | null | undefined; best: number }) {
  if (value == null) return <span className={`${cell} text-zinc-400`}>–</span>;
  if (value === best) return <span className={`${cell} bg-foreground font-semibold text-background`}>{value}</span>;
  return (
    <span className={cell}>
      <span className="leading-4">{value}</span>
      <span className="text-[11px] leading-3 text-amber-600">−{best - value}</span>
    </span>
  );
}

const bestOf = (values: (number | null | undefined)[]) => Math.max(...values.map((v) => v ?? -Infinity));

export default function ResultTable({ role, rows }: Props) {
  // 열은 입력 순서대로 두고, 순위는 이름 옆에 표시한다 (위쪽 입력 칸과 같은 열 = 같은 카드)
  const rankOf = new Map(rows.map((r, i) => [r.index, i + 1]));
  const columns = [...rows].sort((a, b) => a.index - b.index);
  const statKeys = CORE_STAT_KEYS[role];

  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-medium">비교 결과</h2>
      <p className="mt-1 text-xs text-zinc-500">강화·각성·훈련·특훈·세트덱까지 반영한 최종 능력치 · 줄마다 가장 높은 값을 강조합니다</p>

      <div className="mt-3 flex gap-1.5">
        <div className="flex w-10 shrink-0 flex-col gap-1.5 text-xs text-zinc-500">
          {["", ...statKeys, "핵심"].map((label, i) => (
            <span key={i} className={`${ROW_HEIGHT} flex items-center ${label === "핵심" ? "font-medium text-foreground" : ""}`}>
              {label}
            </span>
          ))}
        </div>
        {columns.map((r) => (
          <div key={r.index} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={`${ROW_HEIGHT} truncate text-center text-sm leading-9`}>
              <span className="font-semibold">{rankOf.get(r.index)}위</span> {r.card.name}
              <span className="text-xs text-zinc-500"> {SHORT_NAME[r.card.type]}</span>
            </span>
            {statKeys.map((key) => (
              <Value key={key} value={r.stats[key]} best={bestOf(columns.map((c) => c.stats[key]))} />
            ))}
            <Value value={r.core} best={bestOf(columns.map((c) => c.core))} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        핵심: {role === "batter" ? "파워+정확+선구" : "변화+구위"} · 입력하지 않은 스탯이 있으면 –
      </p>
    </section>
  );
}
