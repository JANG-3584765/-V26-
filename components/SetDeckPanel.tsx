import { ROW_HEIGHT } from "./CardForm";
import { MAX_SET_DECK_SCORE, SET_DECK_TIERS, setDeckBonus } from "@/lib/setDeck";
import { CORE_STAT_KEYS, type CardInput, type CommonCondition, type Role } from "@/lib/types";

interface Props {
  role: Role;
  cards: CardInput[];
  onCardsChange: (cards: CardInput[]) => void;
  cond: CommonCondition;
  onCondChange: (cond: CommonCondition) => void;
}

const SCORES = [0, ...SET_DECK_TIERS.map((t) => t.score)];

export default function SetDeckPanel({ role, cards, onCardsChange, cond, onCondChange }: Props) {
  const pick = (i: number, choice: 0 | 1) =>
    onCondChange({ ...cond, setDeckPicks: cond.setDeckPicks.map((p, j) => (j === i ? choice : p)) });

  // 일괄 설정을 바꾸면 카드별로 따로 정한 연도 설정은 지우고 일괄 값을 따르게 한다
  const setYearAll = (yearMatchAll: boolean) => {
    onCondChange({ ...cond, yearMatchAll });
    onCardsChange(cards.map((c) => ({ ...c, yearMatch: undefined })));
  };

  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">세트덱</h2>
        <select
          className="rounded-md border border-zinc-300 bg-background px-2 py-1 text-sm dark:border-zinc-700"
          value={cond.setDeckScore}
          onChange={(e) => onCondChange({ ...cond, setDeckScore: Number(e.target.value) })}
          aria-label="세트덱 스코어"
        >
          {SCORES.map((s) => (
            <option key={s} value={s}>
              {s}점{s === MAX_SET_DECK_SCORE ? " (최대)" : ""}
            </option>
          ))}
        </select>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={cond.yearMatchAll} onChange={(e) => setYearAll(e.target.checked)} />
        연도 효과 일괄 적용 <span className="text-xs text-zinc-500">(카드별로는 위 &lsquo;연도&rsquo; 칸에서)</span>
      </label>

      <div className="mt-3 flex gap-1.5">
        <span className={`${ROW_HEIGHT} flex w-10 shrink-0 items-center text-xs text-zinc-500`}>핵심</span>
        {cards.map((card, i) => {
          const bonus = setDeckBonus(role, card, cond);
          const core = CORE_STAT_KEYS[role].reduce((s, k) => s + (bonus[k] ?? 0), 0);
          return (
            <span key={i} className={`${ROW_HEIGHT} min-w-0 flex-1 truncate text-center text-sm leading-9 text-zinc-500`}>
              {card.name} +{core}
            </span>
          );
        })}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium">단계별 선택</summary>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          기본은 커뮤니티 가이드의 추천(★) 선택입니다. 선택팀 소속은 항상 만족한다고 봅니다.
        </p>
        <ol className="mt-2 space-y-1.5">
          {SET_DECK_TIERS.map((tier, i) => {
            const open = tier.score <= cond.setDeckScore;
            return (
              <li key={tier.score} className={`flex items-stretch gap-1.5 text-xs ${open ? "" : "opacity-40"}`}>
                <span className="w-9 shrink-0 self-center tabular-nums text-zinc-500">{tier.score}</span>
                {tier.options.map((option, j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => pick(i, j as 0 | 1)}
                    className={`flex-1 rounded-md px-1.5 py-1.5 text-left leading-4 ${cond.setDeckPicks[i] === j ? "bg-foreground text-background" : "border border-zinc-300 dark:border-zinc-700"}`}
                  >
                    {tier.rec === j && "★ "}
                    {option.label}
                  </button>
                ))}
              </li>
            );
          })}
        </ol>
      </details>
    </section>
  );
}
