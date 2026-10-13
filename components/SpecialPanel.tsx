import { ROW_HEIGHT } from "./CardForm";
import Segmented from "./Segmented";
import { probText, TARGET_OPTIONS, triesText } from "./TrainingPanel";
import { cardSpecialExtra } from "@/lib/compare";
import { canFA, specialCore, specialSpec } from "@/lib/special";
import { probAt } from "@/lib/training";
import type { CardInput, CommonCondition, Role } from "@/lib/types";

interface Props {
  role: Role;
  cards: CardInput[];
  onCardsChange: (cards: CardInput[]) => void;
  cond: CommonCondition;
  onCondChange: (cond: CommonCondition) => void;
}

const cell = `${ROW_HEIGHT} text-center text-sm leading-9`;

export default function SpecialPanel({ role, cards, onCardsChange, cond, onCondChange }: Props) {
  const coreLabel = role === "batter" ? "파정" : "변구";

  const update = (i: number, next: Partial<CardInput>) =>
    onCardsChange(cards.map((c, j) => (j === i ? { ...c, ...next } : c)));
  const setExtra = (i: number, customSpecial: number | undefined) => update(i, { customSpecial });

  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={cond.applySpecial}
          onChange={(e) => onCondChange({ ...cond, applySpecial: e.target.checked })}
        />
        특훈 적용
      </label>

      {cond.applySpecial && (
        <>
          <p className="mt-3 text-sm text-zinc-500">기본값: 재설정 결과가 이 확률 내외일 때</p>
          <div className="mt-1">
            <Segmented
              options={TARGET_OPTIONS.map((pct) => ({ value: pct, label: `${pct}%` }))}
              value={cond.specialTargetPct}
              onChange={(pct) => onCondChange({ ...cond, specialTargetPct: pct })}
            />
          </div>

          <div className="mt-4 flex gap-1.5">
            <div className="flex w-10 shrink-0 flex-col gap-1.5 text-xs text-zinc-500">
              {["", "FA", coreLabel, "확률", "기대", "핵심", ""].map((label, i) => (
                <span key={i} className={`${ROW_HEIGHT} flex items-center`}>
                  {label}
                </span>
              ))}
            </div>
            {cards.map((card, i) => {
              const { table } = specialSpec(card.type, card.specialFA);
              if (!table)
                return (
                  <div key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className={`${cell} truncate`}>{card.name}</span>
                    <span className={`${cell} text-zinc-400`}>특훈 불가</span>
                  </div>
                );
              const extra = cardSpecialExtra(card, cond);
              const prob = probAt(table, extra);
              return (
                <div key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className={`${cell} truncate`}>{card.name}</span>
                  {/* FA는 회수와 재설정표가 달라서, 바꾸면 직접 입력한 결과는 초기화한다 */}
                  <label className={`${cell} flex items-center justify-center gap-1 ${canFA(card.type) ? "" : "text-zinc-400"}`}>
                    <input
                      type="checkbox"
                      disabled={!canFA(card.type)}
                      checked={!!card.specialFA && canFA(card.type)}
                      onChange={(e) => update(i, { specialFA: e.target.checked, customSpecial: undefined })}
                    />
                    {canFA(card.type) ? "5회" : "–"}
                  </label>
                  <input
                    inputMode="numeric"
                    className={`${ROW_HEIGHT} w-full min-w-0 rounded-md border bg-background px-1 text-center text-sm ${card.customSpecial !== undefined ? "border-foreground" : "border-zinc-300 text-zinc-500 dark:border-zinc-700"}`}
                    value={extra}
                    onChange={(e) => setExtra(i, Number(e.target.value.replace(/\D/g, "")))}
                    aria-label={`${card.name} 특훈 ${coreLabel} 추가분`}
                  />
                  <span className={`${cell} font-medium tabular-nums`}>{probText(prob)}</span>
                  <span className={`${cell} text-zinc-500`}>{triesText(prob)}</span>
                  <span className={`${cell} text-zinc-500`}>+{specialCore(card.type, !!card.specialFA, extra)}</span>
                  <button
                    type="button"
                    disabled={card.customSpecial === undefined}
                    onClick={() => setExtra(i, undefined)}
                    className={`${ROW_HEIGHT} rounded-md text-xs text-zinc-500 disabled:opacity-30`}
                  >
                    기본값
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            {coreLabel}: 재설정 결과 중 무작위 추가분이 {coreLabel}에 들어간 합. 핵심 상승은 특훈 횟수(고른 스탯 +1, 국대 4회·FA 5회·나머지 3회)를
            더한 값입니다. 올스타·시즌은 시그/골글 재설정표로 계산합니다.
            {role === "batter" && " 표가 선구를 세지 않아 선구에 들어간 특훈은 빠집니다."}
          </p>
        </>
      )}
    </section>
  );
}
