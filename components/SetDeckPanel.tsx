import { ROW_HEIGHT } from "./CardForm";
import Panel from "./Panel";
import { MAX_SET_DECK_SCORE, SET_DECK_TIERS, setDeckBonus, YEARS } from "@/lib/setDeck";
import { CORE_STAT_KEYS, type CardInput, type CommonCondition, type Role, type YearDeck } from "@/lib/types";

interface Props {
  role: Role;
  cards: CardInput[];
  cond: CommonCondition;
  onCondChange: (cond: CommonCondition) => void;
}

const SCORES = [0, ...SET_DECK_TIERS.map((t) => t.score)];

export default function SetDeckPanel({ role, cards, cond, onCondChange }: Props) {
  const pick = (i: number, choice: 0 | 1) =>
    onCondChange({ ...cond, setDeckPicks: cond.setDeckPicks.map((p, j) => (j === i ? choice : p)) });

  // 연도 덱은 역할마다 따로 저장한다 (타자 25년, 투수 19년처럼 다르게 맞추기도 한다)
  const setYearDeck = (value: string) => {
    const deck: YearDeck = value === "all" || value === "none" ? value : Number(value);
    onCondChange({ ...cond, yearDeck: { ...cond.yearDeck, [role]: deck } });
  };

  // 연도 효과 단계는 단계마다 연도를 따로 고를 수 있다 (예: 55점은 21년, 190점은 19년). 빈칸이면 위의 연도 덱을 따른다
  const setTierYear = (score: number, value: string) => {
    const tierYears = { ...cond.tierYears };
    if (value === "") delete tierYears[score];
    else tierYears[score] = Number(value);
    onCondChange({ ...cond, tierYears });
  };

  return (
    <Panel
      title="세트덱"
      info={
        <>
          <p>단계별 기본 선택은 커뮤니티 가이드의 추천(★)이에요. 선택팀 소속은 항상 만족한다고 봐요. </p>
          <p className="mt-1">연도 덱: 일괄 적용은 모든 카드, 연도를 고르면 카드 탭의 연도가 같은 카드만 연도 효과를 받아요. 임팩트는 전 연도. 기본은 타자 일괄 적용, 투수 없음(투수는 연도가 흩어진 경우가 대부분).</p>
          <p className="mt-1">단계별 선택에서 연도 효과를 고르면 그 단계만 다른 연도로 정할 수 있어요.</p>
          <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2">
            <dt className="font-medium">스페셜</dt>
            <dd>임팩·국대·시그·골글, 이달의 선수 라이브</dd>
            <dt className="font-medium">시즌·라이브·올스타</dt>
            <dd>스페셜이 아닌 카드</dd>
            <dt className="font-medium">4성 / 5성</dt>
            <dd>4성은 임팩트, 나머지는 5성</dd>
          </dl>
        </>
      }
      actions={
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
      }
    >
      <label className="flex items-center gap-2 text-sm">
        연도 덱 ({role === "batter" ? "타자" : "투수"})
        <select
          className="rounded-md border border-zinc-300 bg-background px-2 py-1 text-sm dark:border-zinc-700"
          value={String(cond.yearDeck[role])}
          onChange={(e) => setYearDeck(e.target.value)}
        >
          <option value="all">일괄 적용</option>
          <option value="none">없음</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </label>

      {/* 카드별로 세트덱이 스탯마다 얼마나 올렸는지 */}
      <div className="mt-3 flex gap-1.5">
        <div className="flex w-10 shrink-0 flex-col gap-1.5 text-xs text-zinc-500">
          {["", ...CORE_STAT_KEYS[role]].map((label, i) => (
            <span key={i} className={`${ROW_HEIGHT} flex items-center`}>
              {label}
            </span>
          ))}
        </div>
        {cards.map((card, i) => {
          const bonus = setDeckBonus(role, card, cond);
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className={`${ROW_HEIGHT} truncate text-center text-sm leading-9`}>{card.name}</span>
              {CORE_STAT_KEYS[role].map((key) => (
                <span key={key} className={`${ROW_HEIGHT} text-center text-sm leading-9 text-zinc-500 tabular-nums`}>
                  +{bonus[key] ?? 0}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium">단계별 선택</summary>
        <ol className="mt-2 space-y-1.5">
          {SET_DECK_TIERS.map((tier, i) => {
            const open = tier.score <= cond.setDeckScore;
            const year = tier.options[cond.setDeckPicks[i]].year;
            return (
              <li key={tier.score} className={`text-xs ${open ? "" : "opacity-40"}`}>
                <div className="flex items-stretch gap-1.5">
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
                </div>
                {year && (
                  <select
                    className="mt-1 ml-10.5 rounded-md border border-zinc-300 bg-background px-1.5 py-1 dark:border-zinc-700"
                    value={cond.tierYears[tier.score] ?? ""}
                    onChange={(e) => setTierYear(tier.score, e.target.value)}
                    aria-label={`${tier.score}점 연도`}
                  >
                    <option value="">연도 덱 따름</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}년
                      </option>
                    ))}
                  </select>
                )}
              </li>
            );
          })}
        </ol>
      </details>
    </Panel>
  );
}
