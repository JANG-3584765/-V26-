import { ROW_HEIGHT } from "./CardForm";
import { CORE_STAT_KEYS, type CardInput, type Role, type StatKey } from "@/lib/types";

interface Props {
  role: Role;
  cards: CardInput[];
  onCardsChange: (cards: CardInput[]) => void;
}

const field = `${ROW_HEIGHT} w-full min-w-0 rounded-md border border-zinc-300 bg-background px-1 text-center text-sm dark:border-zinc-700`;

// 특훈: 게임에서 본 스탯별 특훈 값을 그대로 입력한다 (입력하지 않으면 0).
// 공식 확률로 계산하는 재훈련 확률 모델은 lib/special.ts에 참고용으로 남겨 두었다.
export default function SpecialPanel({ role, cards, onCardsChange }: Props) {
  const keys = CORE_STAT_KEYS[role];

  const setStat = (i: number, key: StatKey, raw: string) =>
    onCardsChange(
      cards.map((c, j) => {
        if (j !== i) return c;
        const digits = raw.replace(/\D/g, "");
        return { ...c, special: { ...c.special, [key]: digits === "" ? 0 : Number(digits) } };
      }),
    );

  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="font-medium">특훈</h2>
      <p className="mt-1 text-xs text-zinc-500">게임 화면의 스탯별 특훈 값을 그대로 넣으세요. 비워두면 0입니다.</p>

      <div className="mt-3 flex gap-1.5">
        <div className="flex w-10 shrink-0 flex-col gap-1.5 text-xs text-zinc-500">
          {["", ...keys].map((label, i) => (
            <span key={i} className={`${ROW_HEIGHT} flex items-center`}>
              {label}
            </span>
          ))}
        </div>
        {cards.map((card, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={`${ROW_HEIGHT} truncate text-center text-sm leading-9`}>{card.name}</span>
            {keys.map((key) => (
              <input
                key={key}
                inputMode="numeric"
                className={field}
                value={card.special?.[key] ?? ""}
                placeholder="0"
                onChange={(e) => setStat(i, key, e.target.value)}
                aria-label={`${card.name} ${key} 특훈`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
