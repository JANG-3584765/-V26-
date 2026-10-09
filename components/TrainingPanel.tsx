import { useState } from "react";
import { ROW_HEIGHT, SHORT_NAME } from "./CardForm";
import Segmented from "./Segmented";
import { cardTraining } from "@/lib/compare";
import { ESTIMATE_BASE, probOfCore, trainingBonus, type CoreProb } from "@/lib/training";
import { CORE_STAT_KEYS, type CardInput, type CommonCondition, type Role, type StatKey, type Stats } from "@/lib/types";

interface Props {
  role: Role;
  cards: CardInput[];
  onCardsChange: (cards: CardInput[]) => void;
  cond: CommonCondition;
  onCondChange: (cond: CommonCondition) => void;
}

const TARGET_OPTIONS = [50, 30, 20, 10, 1];
const sumOf = (s: Stats) => Object.values(s).reduce((a, b) => a! + b!, 0)!;
const pick = (s: Stats, keys: readonly StatKey[]): Stats => Object.fromEntries(keys.map((k) => [k, s[k] ?? 0]));

const probText = (p: CoreProb) => `${p.cmp === "=" ? "" : p.cmp}${p.pct}%`;
// 확률이 p%면 평균 100/p번 돌려야 한 번 나온다 (기하분포의 기댓값)
const triesText = (p: CoreProb) => (p.cmp === ">" ? "1회" : `${p.cmp === "<" ? ">" : ""}${Math.max(1, Math.round(100 / p.pct))}회`);

export default function TrainingPanel({ role, cards, onCardsChange, cond, onCondChange }: Props) {
  const [showTable, setShowTable] = useState(false);
  const coreKeys = CORE_STAT_KEYS[role];

  const setTraining = (i: number, customTraining: Stats | undefined) =>
    onCardsChange(cards.map((c, j) => (j === i ? { ...c, customTraining } : c)));

  // 카드마다 지금 적용 중인 훈련값과, 그 핵심 합이 확률표에서 어디쯤인지
  const items = cards.map((card) => {
    const { training, estimated } = cardTraining(role, card, cond);
    const core = pick(training, coreKeys);
    const coreSum = sumOf(core);
    return {
      card,
      core,
      coreSum,
      estimated,
      max: trainingBonus(role, card.type, card.grade, cond.redistTargetPct).total,
      prob: probOfCore(role, card.type, card.grade, coreSum),
    };
  });

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
        {cond.applyTraining && (
          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            aria-expanded={showTable}
            aria-label="훈련 재분배 확률표 보기"
            className="size-7 rounded-full border border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700"
          >
            ?
          </button>
        )}
      </div>

      {cond.applyTraining && (
        <>
          <p className="mt-3 text-sm text-zinc-500">기본값: 재분배 결과가 이 확률 내외일 때</p>
          <div className="mt-1">
            <Segmented
              options={TARGET_OPTIONS.map((pct) => ({ value: pct, label: `${pct}%` }))}
              value={cond.redistTargetPct}
              onChange={(pct) => onCondChange({ ...cond, redistTargetPct: pct })}
            />
          </div>

          <div className="mt-4 flex gap-1.5">
            <div className="flex w-10 shrink-0 flex-col gap-1.5 text-xs text-zinc-500">
              {["", ...coreKeys, "합", "확률", "기대", ""].map((label, i) => (
                <span key={i} className={`${ROW_HEIGHT} flex items-center`}>
                  {label}
                </span>
              ))}
            </div>
            {items.map(({ card, core, coreSum, estimated, max, prob }, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className={`${ROW_HEIGHT} truncate text-center text-sm leading-9`}>
                  {card.name}
                  {estimated && <span className="text-amber-600">*</span>}
                </span>
                {coreKeys.map((key) => (
                  <input
                    key={key}
                    inputMode="numeric"
                    className={`${ROW_HEIGHT} w-full min-w-0 rounded-md border bg-background px-1 text-center text-sm ${card.customTraining ? "border-foreground" : "border-zinc-300 text-zinc-500 dark:border-zinc-700"}`}
                    value={core[key]}
                    onChange={(e) => setTraining(i, { ...core, [key]: Number(e.target.value.replace(/\D/g, "")) })}
                    aria-label={`${card.name} ${key} 훈련값`}
                  />
                ))}
                <span className={`${ROW_HEIGHT} text-center text-sm leading-9 ${coreSum > max ? "text-amber-600" : ""}`}>
                  {coreSum}
                  {coreSum > max && <span className="text-xs"> /{max}</span>}
                </span>
                <span className={`${ROW_HEIGHT} text-center text-sm leading-9 font-medium tabular-nums`}>
                  {probText(prob)}
                  {prob.estimated && <span className="text-amber-600">*</span>}
                </span>
                <span className={`${ROW_HEIGHT} text-center text-sm leading-9 text-zinc-500`}>{triesText(prob)}</span>
                <button
                  type="button"
                  disabled={!card.customTraining}
                  onClick={() => setTraining(i, undefined)}
                  className={`${ROW_HEIGHT} rounded-md text-xs text-zinc-500 disabled:opacity-30`}
                >
                  기본값
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            가진 카드는 실제 훈련 수치로 고쳐 넣으세요 (진한 테두리). 확률은 재분배 1회에 그 합 이상이 나올 확률,
            기대는 평균 재분배 횟수입니다. <span className="text-amber-600">*</span> 확률표가 없어 추정
          </p>

          {showTable && <RedistTables role={role} items={items} />}
        </>
      )}
    </section>
  );
}

// 카드별 확률표. 지금 입력한 핵심 합의 위치를 강조해서 입력을 바꾸면 바로 따라 움직인다.
function RedistTables({ role, items }: { role: Role; items: { card: CardInput; prob: CoreProb }[] }) {
  return (
    <div className="mt-3 rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
      <p className="font-medium">재분배 1회에 {role === "batter" ? "파정선" : "구변"} 합이 그 값 이상 나올 확률</p>
      <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ card, prob }, i) => (
          <table key={i} className="w-full tabular-nums">
            <caption className="pb-1 text-left">
              <span className="font-medium">{card.name}</span> {SHORT_NAME[card.type]} {card.grade}성
              {prob.estimated && (
                <span className="block text-amber-600">
                  {SHORT_NAME[ESTIMATE_BASE.type]} {ESTIMATE_BASE.grade}성 표로 환산 ({prob.value})
                </span>
              )}
            </caption>
            <tbody>
              {prob.table.probs.map((p, j) => (
                <tr key={j} className={prob.table.from + j === prob.value ? "bg-foreground text-background" : ""}>
                  <td className="px-1">{prob.table.from + j}</td>
                  <td className="px-1 text-right">{p}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
