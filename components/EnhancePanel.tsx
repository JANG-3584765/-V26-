import { ROW_HEIGHT } from "./CardForm";
import Panel from "./Panel";
import { BONUS_TABLE, canAwaken, maxAwaken, maxEnhance } from "@/lib/bonusTable";
import { CORE_STAT_KEYS, type CardInput, type Role, type StatKey } from "@/lib/types";

interface Props {
  role: Role;
  cards: CardInput[];
  onCardsChange: (cards: CardInput[]) => void;
}

const field = `${ROW_HEIGHT} w-full min-w-0 rounded-md border border-zinc-300 bg-background px-1 text-center text-sm disabled:opacity-40 dark:border-zinc-700`;
const range = (n: number) => Array.from({ length: n + 1 }, (_, i) => i);

// 강화·각성으로 스탯 하나가 얼마나 오르는지: "+29 (24+5)"처럼 강화와 각성을 나눠 보여준다
function statBonus(role: Role, card: CardInput, key: StatKey) {
  const { enhance, awaken } = BONUS_TABLE.cardType[role][card.type];
  const e = enhance[card.enhanceLevel]?.[key] ?? 0;
  const a = awaken?.[card.awakenLevel]?.[key] ?? 0;
  return a ? `+${e + a} (${e}+${a})` : `+${e}`;
}

export default function EnhancePanel({ role, cards, onCardsChange }: Props) {
  const update = (i: number, next: Partial<CardInput>) =>
    onCardsChange(cards.map((c, j) => (j === i ? { ...c, ...next } : c)));

  return (
    <Panel title="강화·각성" info="기본은 최대 단계(10강·9각). 각성은 10강 이후, 임팩·시그·골글·국대만 가능해요. 스탯 줄은 강화+각성 합(괄호 안은 각각)이에요.">

      <div className="flex gap-1.5">
        <div className="flex w-10 shrink-0 flex-col gap-1.5 text-xs text-zinc-500">
          {["", "강화", "각성", ...CORE_STAT_KEYS[role]].map((label, i) => (
            <span key={i} className={`${ROW_HEIGHT} flex items-center`}>
              {label}
            </span>
          ))}
        </div>
        {cards.map((card, i) => {
          const awakenable = canAwaken(card.type, card.enhanceLevel);
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className={`${ROW_HEIGHT} truncate text-center text-sm leading-9`}>{card.name}</span>
              <select
                className={field}
                value={card.enhanceLevel}
                onChange={(e) => {
                  const enhanceLevel = Number(e.target.value);
                  // 10강 아래로 내리면 각성도 풀린다
                  update(i, { enhanceLevel, awakenLevel: canAwaken(card.type, enhanceLevel) ? card.awakenLevel : 0 });
                }}
                aria-label={`${card.name} 강화`}
              >
                {range(maxEnhance(card.type)).map((n) => (
                  <option key={n} value={n}>
                    {n}강
                  </option>
                ))}
              </select>
              <select
                className={field}
                value={card.awakenLevel}
                disabled={!awakenable}
                onChange={(e) => update(i, { awakenLevel: Number(e.target.value) })}
                aria-label={`${card.name} 각성`}
              >
                {maxAwaken(card.type) === 0 ? (
                  <option value={0}>불가</option>
                ) : (
                  range(maxAwaken(card.type)).map((n) => (
                    <option key={n} value={n}>
                      {n}각
                    </option>
                  ))
                )}
              </select>
              {CORE_STAT_KEYS[role].map((key) => (
                <span key={key} className={`${ROW_HEIGHT} text-center text-sm leading-9 text-zinc-500 tabular-nums`}>
                  {statBonus(role, card, key)}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
