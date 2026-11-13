import { maxAwaken, maxEnhance } from "@/lib/bonusTable";
import { canPotm } from "@/lib/potm";
import { LINEUPS, PITCHER_SLOTS, POSITIONS, YEARS } from "@/lib/setDeck";
import { TRAINING_MAX_LEVEL } from "@/lib/training";
import {
  CARD_DEFAULTS,
  CARD_TYPES,
  CORE_STAT_KEYS,
  type CardInput,
  type CardType,
  type Lineup,
  type PitcherSlot,
  type Position,
  type Role,
  type StatKey,
} from "@/lib/types";

interface Props {
  role: Role;
  card: CardInput;
  onChange: (card: CardInput) => void;
  onRemove?: () => void; // 없으면 삭제 버튼을 숨긴다 (최소 2장 유지)
}

// 좁은 열에 들어가도록 화면에서는 커뮤니티 약칭으로 보여준다
export const SHORT_NAME: Record<CardType, string> = {
  시즌: "시즌",
  라이브: "라이브",
  임팩트: "임팩",
  시그니처: "시그",
  골든글러브: "골글",
  국가대표: "국대",
  "라이브 올스타": "올스타",
};

// 모든 칸의 높이를 ROW_HEIGHT로 맞춰야 왼쪽 항목 이름 열과 줄이 맞는다 (Comparator의 라벨 열과 같은 값)
export const ROW_HEIGHT = "h-9";
const field = `${ROW_HEIGHT} w-full min-w-0 rounded-md border border-zinc-300 bg-background px-1 text-center text-sm dark:border-zinc-700`;

export default function CardForm({ role, card, onChange, onRemove }: Props) {
  // 종류가 바뀌면 강화·각성은 그 종류의 최대로 맞추고, 훈련 총량이 달라지므로 직접 입력한 훈련값은 초기화한다
  const changeType = (type: CardType) =>
    onChange({ ...card, type, enhanceLevel: maxEnhance(type), awakenLevel: maxAwaken(type), customTraining: undefined, special: undefined, potm: undefined });

  // 빈칸은 "입력 안 함"(undefined)으로 둔다. 0으로 바꾸면 합계 계산에 섞여 들어간다.
  const changeStat = (key: StatKey, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    onChange({ ...card, base: { ...card.base, [key]: digits === "" ? undefined : Number(digits) } });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className={`relative ${ROW_HEIGHT}`}>
        <input
          className={`${field} font-medium`}
          value={card.name}
          onChange={(e) => onChange({ ...card, name: e.target.value })}
          aria-label="카드 이름"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-1 size-5 rounded-full bg-zinc-200 text-xs leading-5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
            aria-label={`${card.name} 삭제`}
          >
            ×
          </button>
        )}
      </div>

      <select className={field} value={card.type} onChange={(e) => changeType(e.target.value as CardType)} aria-label="카드 종류">
        {CARD_TYPES.map((t) => (
          <option key={t} value={t}>
            {SHORT_NAME[t]}
          </option>
        ))}
      </select>
      {/* 세트덱 효과 조건: 타자는 타순·포지션, 투수는 보직 */}
      {role === "batter" ? (
        <>
          <select className={field} value={card.lineup ?? CARD_DEFAULTS.lineup} onChange={(e) => onChange({ ...card, lineup: e.target.value as Lineup })} aria-label="타순">
            {LINEUPS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <select className={field} value={card.position ?? CARD_DEFAULTS.position} onChange={(e) => onChange({ ...card, position: e.target.value as Position })} aria-label="포지션">
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </>
      ) : (
        <select className={field} value={card.pitcherSlot ?? CARD_DEFAULTS.pitcherSlot} onChange={(e) => onChange({ ...card, pitcherSlot: e.target.value as PitcherSlot })} aria-label="보직">
          {PITCHER_SLOTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      )}
      {/* 카드 연도: 세트덱 탭에서 고른 연도(단계별 연도, 없으면 연도 덱)와 같으면 연도 효과를 받는다. 임팩트는 모든 연도에 해당한다 */}
      {card.type === "임팩트" ? (
        <span className={`${ROW_HEIGHT} text-center text-xs leading-9 text-zinc-500`} title="임팩트는 모든 연도에 해당해요">
          전 연도
        </span>
      ) : (
        <select
          className={field}
          value={card.year ?? ""}
          onChange={(e) => onChange({ ...card, year: e.target.value === "" ? undefined : Number(e.target.value) })}
          aria-label={`${card.name} 카드 연도`}
        >
          <option value="">연도</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {String(y).slice(2)}년
            </option>
          ))}
        </select>
      )}
      {/* 이달의 선수: 선정 여부는 사용자가 직접 표시한다 (올스타·시즌은 대상 아님) */}
      <label className={`${ROW_HEIGHT} flex items-center justify-center`}>
        <input
          type="checkbox"
          checked={!!card.potm && canPotm(card.type)}
          disabled={!canPotm(card.type)}
          onChange={(e) => onChange({ ...card, potm: e.target.checked })}
          aria-label={`${card.name} 이달의 선수`}
        />
      </label>
      <p className={`${ROW_HEIGHT} text-center text-sm leading-9 text-zinc-500`}>{TRAINING_MAX_LEVEL[card.type]}Lv</p>

      {CORE_STAT_KEYS[role].map((key) => (
        // type="number" 대신 inputMode="numeric": 모바일에서 숫자 키패드를 띄우면서
        // 스크롤 시 값이 바뀌거나 e가 입력되는 number 입력칸의 문제를 피한다.
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode
        <input
          key={key}
          className={field}
          inputMode="numeric"
          value={card.base[key] ?? ""}
          onChange={(e) => changeStat(key, e.target.value)}
          aria-label={`${card.name} ${key}`}
        />
      ))}
    </div>
  );
}
