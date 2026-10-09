import { maxEnhance } from "@/lib/bonusTable";
import { TRAINING_MAX_LEVEL } from "@/lib/training";
import { CARD_GRADES, CARD_TYPES, CORE_STAT_KEYS, type CardInput, type CardType, type Grade, type Role, type StatKey } from "@/lib/types";

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
  // 종류를 바꾸면 그 종류에 없는 등급이 남을 수 있으므로 가장 높은 등급으로 맞춘다
  const changeType = (type: CardType) => {
    const grades = CARD_GRADES[type];
    const grade = grades[grades.length - 1];
    onChange({ ...card, type, grade, enhanceLevel: maxEnhance(role, type, grade), customTraining: undefined });
  };

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
      <select
        className={field}
        value={card.grade}
        onChange={(e) => {
          const grade = Number(e.target.value) as Grade;
          onChange({ ...card, grade, enhanceLevel: maxEnhance(role, card.type, grade), customTraining: undefined });
        }}
        aria-label="등급"
      >
        {CARD_GRADES[card.type].map((g) => (
          <option key={g} value={g}>
            {g}성
          </option>
        ))}
      </select>
      <p className={`${ROW_HEIGHT} text-center text-sm leading-9 text-zinc-500`}>
        {TRAINING_MAX_LEVEL[card.type][card.grade]}Lv
      </p>

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
