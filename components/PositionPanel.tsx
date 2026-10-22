import { ROW_HEIGHT } from "./CardForm";
import { MAX_POSITION_LEVEL, maxPositionBonus, positionTrainingBonus } from "@/lib/positionTraining";
import { CORE_STAT_KEYS, type CardInput, type Role, type StatKey } from "@/lib/types";

interface Props {
  role: Role;
  cards: CardInput[];
  onCardsChange: (cards: CardInput[]) => void;
}

const field = `${ROW_HEIGHT} w-full min-w-0 rounded-md border border-zinc-300 bg-background px-1 text-center text-sm disabled:opacity-40 dark:border-zinc-700`;
const LEVELS = Array.from({ length: MAX_POSITION_LEVEL + 1 }, (_, n) => MAX_POSITION_LEVEL - n);

// 포지션 특훈: 단계는 카드 입력 칸에서 고른 포지션(투수는 보직 칸)의 표로 계산하고,
// 5·15단 보너스는 게임에서 본 값을 그대로 입력한다 (비워두면 0).
export default function PositionPanel({ role, cards, onCardsChange }: Props) {
  const keys = CORE_STAT_KEYS[role];
  const update = (i: number, next: Partial<CardInput>) => onCardsChange(cards.map((c, j) => (j === i ? { ...c, ...next } : c)));

  const setBonus = (i: number, key: StatKey, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    update(i, { positionBonus: { ...cards[i].positionBonus, [key]: digits === "" ? 0 : Number(digits) } });
  };

  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-medium">포지션 특훈</h2>
      <p className="mt-1 text-xs leading-5 text-zinc-500">
        단계는 카드의 포지션(투수는 보직) 표로 계산합니다. 5·15단 보너스는 게임 화면 값을 그대로 넣으세요. 비워두면 0입니다.
      </p>

      <div className="mt-3 flex gap-1.5">
        <div className="flex w-10 shrink-0 flex-col gap-1.5 text-xs text-zinc-500">
          {["", "단계", ...keys.map((k) => `${k}`), "보너스"].map((label, i) => (
            <span key={i} className={`${ROW_HEIGHT} flex items-center`}>
              {label}
            </span>
          ))}
        </div>
        {cards.map((card, i) => {
          const level = card.positionLevel ?? MAX_POSITION_LEVEL;
          const max = maxPositionBonus(level);
          const table = positionTrainingBonus(role, card);
          const used = keys.reduce((s, k) => s + (card.positionBonus?.[k] ?? 0), 0);
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className={`${ROW_HEIGHT} truncate text-center text-sm leading-9`}>{card.name}</span>
              <select
                className={field}
                value={level}
                onChange={(e) => update(i, { positionLevel: Number(e.target.value) })}
                aria-label={`${card.name} 포지션 특훈 단계`}
              >
                {LEVELS.map((n) => (
                  <option key={n} value={n}>
                    {n}단
                  </option>
                ))}
              </select>
              {/* 스탯마다: 왼쪽은 단계 표 값(자동), 오른쪽 칸은 보너스 입력 */}
              {keys.map((key) => (
                <div key={key} className={`${ROW_HEIGHT} flex items-center gap-1`}>
                  <span className="w-8 shrink-0 text-right text-xs text-zinc-500 tabular-nums">+{table[key] ?? 0}</span>
                  <input
                    inputMode="numeric"
                    className={field}
                    disabled={max === 0}
                    value={max === 0 ? "" : (card.positionBonus?.[key] ?? "")}
                    placeholder="0"
                    onChange={(e) => setBonus(i, key, e.target.value)}
                    aria-label={`${card.name} ${key} 포지션 특훈 보너스`}
                  />
                </div>
              ))}
              <span className={`${ROW_HEIGHT} text-center text-xs leading-9 tabular-nums ${used > max ? "text-amber-600" : "text-zinc-500"}`}>
                {max === 0 ? "5단부터" : `${used}/${max}`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-zinc-500">각 줄 왼쪽 숫자는 단계 표로 오른 값, 칸은 보너스입니다. 보너스 최대: 5~14단 3, 15단 이상 6.</p>
    </section>
  );
}
