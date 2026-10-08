import { useState } from "react";
import { ROW_HEIGHT, SHORT_NAME } from "./CardForm";
import Segmented from "./Segmented";
import { cardTraining } from "@/lib/compare";
import { ESTIMATE_BASE, probOfCore, REDIST_TABLE, valueAtProb } from "@/lib/training";
import { CORE_STAT_KEYS, type CardInput, type CardType, type CommonCondition, type Role, type StatKey, type Stats } from "@/lib/types";

interface Props {
  role: Role;
  statKeys: readonly StatKey[];
  cards: CardInput[];
  onCardsChange: (cards: CardInput[]) => void;
  cond: CommonCondition;
  onCondChange: (cond: CommonCondition) => void;
}

const TARGET_OPTIONS = [50, 30, 20, 10, 1];
const REMAINDER_NOTE = { batter: "파워·인내", pitcher: "구위·지구력" };
const sumOf = (s: Stats) => Object.values(s).reduce((a, b) => a! + b!, 0)!;
const pick = (s: Stats, keys: readonly StatKey[]): Stats => Object.fromEntries(keys.map((k) => [k, s[k] ?? 0]));

export default function TrainingPanel({ role, statKeys, cards, onCardsChange, cond, onCondChange }: Props) {
  const [showTable, setShowTable] = useState(false);

  const setTraining = (i: number, customTraining: Stats | undefined) =>
    onCardsChange(cards.map((c, j) => (j === i ? { ...c, customTraining } : c)));

  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={cond.applyTraining}
            onChange={(e) => onCondChange({ ...cond, applyTraining: e.target.checked })}
          />
          훈련 적용 (최대 레벨)
        </label>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          aria-expanded={showTable}
          aria-label="훈련 재분배 확률표 보기"
          className="size-7 rounded-full border border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700"
        >
          ?
        </button>
      </div>

      {showTable && <RedistTable role={role} targetPct={cond.redistTargetPct} />}

      {cond.applyTraining && (
        <>
          <p className="mt-3 text-sm text-zinc-500">재분배 결과 기준 (확률 내외)</p>
          <div className="mt-1">
            <Segmented
              options={TARGET_OPTIONS.map((pct) => ({ value: pct, label: `${pct}%` }))}
              value={cond.redistTargetPct}
              onChange={(pct) => onCondChange({ ...cond, redistTargetPct: pct })}
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            핵심 합은 확률표에서 고른 확률에 가장 가까운 값, 남은 훈련 포인트는 나머지 스탯에 균등 분배합니다.
            나누어떨어지지 않으면 {REMAINDER_NOTE[role]}에 더합니다.
          </p>

          {/* <details>는 펼치기/접기를 브라우저가 처리해 주는 기본 HTML 요소라 state가 필요 없다.
              https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details */}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium">카드별 세부 조정</summary>
            <p className="mt-2 text-xs text-zinc-500">가지고 있는 카드라면 실제 훈련 수치로 바꿔 넣으세요.</p>
            <div className="mt-2 flex gap-1.5">
              <div className="flex w-10 shrink-0 flex-col gap-1.5 text-xs text-zinc-500">
                {["", ...statKeys, "합계", "확률", ""].map((label, i) => (
                  <span key={i} className={`${ROW_HEIGHT} flex items-center`}>
                    {label}
                  </span>
                ))}
              </div>
              {cards.map((card, i) => {
                const { training, estimated } = cardTraining(role, card, cond);
                const auto = cardTraining(role, { ...card, customTraining: undefined }, cond).training;
                const used = sumOf(training);
                const max = sumOf(auto);
                // 지금 훈련값의 핵심 합이 재분배 1회에 나올 확률 (값을 고치면 바로 다시 계산된다)
                const prob = probOfCore(role, card.type, card.grade, sumOf(pick(training, CORE_STAT_KEYS[role])));
                return (
                  <div key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className={`${ROW_HEIGHT} truncate text-center text-sm leading-9`}>
                      {card.name}
                      {estimated && <span className="text-amber-600">*</span>}
                    </span>
                    {statKeys.map((key) => (
                      <input
                        key={key}
                        inputMode="numeric"
                        className={`${ROW_HEIGHT} w-full min-w-0 rounded-md border bg-background px-1 text-center text-sm ${card.customTraining ? "border-foreground" : "border-zinc-300 text-zinc-500 dark:border-zinc-700"}`}
                        value={training[key] ?? 0}
                        onChange={(e) => setTraining(i, { ...training, [key]: Number(e.target.value.replace(/\D/g, "")) })}
                        aria-label={`${card.name} ${key} 훈련값`}
                      />
                    ))}
                    <span className={`${ROW_HEIGHT} text-center text-sm leading-9 ${used === max ? "text-zinc-500" : "text-amber-600"}`}>
                      {used}/{max}
                    </span>
                    <span className={`${ROW_HEIGHT} text-center text-sm leading-9 font-medium tabular-nums`}>
                      {prob.cmp === "=" ? "" : prob.cmp}
                      {prob.pct}%
                      {prob.estimated && <span className="text-amber-600">*</span>}
                    </span>
                    <button
                      type="button"
                      disabled={!card.customTraining}
                      onClick={() => setTraining(i, undefined)}
                      className={`${ROW_HEIGHT} rounded-md text-xs text-zinc-500 disabled:opacity-30`}
                    >
                      기본값
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              회색은 기본값, 진한 테두리는 직접 입력한 값 · 확률은 재분배 1회에 그 핵심 합 이상이 나올 확률 ·{" "}
              <span className="text-amber-600">*</span> 확률표가 없어 추정한 값
            </p>
          </details>
        </>
      )}
    </section>
  );
}

// 현재 역할의 재분배 확률표. 고른 확률에 가장 가까운 줄을 강조한다.
function RedistTable({ role, targetPct }: { role: Role; targetPct: number }) {
  const tables = Object.entries(REDIST_TABLE[role]).flatMap(([type, byGrade]) =>
    Object.entries(byGrade!).map(([grade, table]) => ({ label: `${SHORT_NAME[type as CardType]} ${grade}성`, table: table! })),
  );

  return (
    <div className="mt-3 rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
      <p className="font-medium">
        재분배 1회에 {role === "batter" ? "파정선" : "구변"} 합이 그 값 이상 나올 확률
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {tables.map(({ label, table }) => {
          const picked = valueAtProb(table, targetPct);
          return (
            <table key={label} className="w-full tabular-nums">
              <caption className="pb-1 text-left font-medium">{label}</caption>
              <tbody>
                {table.probs.map((p, i) => (
                  <tr key={i} className={table.from + i === picked ? "bg-foreground text-background" : ""}>
                    <td className="px-1">{table.from + i}</td>
                    <td className="px-1 text-right">{p}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
      <p className="mt-2 text-zinc-500">
        표가 없는 카드는 {SHORT_NAME[ESTIMATE_BASE.type]} {ESTIMATE_BASE.grade}성 표를 최대 훈련 레벨 비율로 환산한 추정치를 씁니다.
      </p>
    </div>
  );
}
