import { STAT_KEYS, type CardInput, type CardType, type Role, type Stats } from "./types";

// 이달의 선수: 팀마다 타자·투수 한 명씩 선정되어 한 달 동안 모든 능력치가 오른다.
// 선정 명단은 매달 바뀌므로 사이트가 관리하지 않고, 사용자가 자기 카드에 직접 표시한다.
// 선정된 라이브는 세트덱에서 스페셜로도 친다 (setDeck.ts). 세트덱 스코어 변화는 덱 전체 점수라 다루지 않는다.
export const POTM_BONUS: Partial<Record<CardType, number>> = {
  임팩트: 2,
  국가대표: 2,
  시그니처: 2,
  골든글러브: 1,
  라이브: 8, // 5성 기준 (1~3성 +18, 4성 +14)
};

export const canPotm = (type: CardType) => POTM_BONUS[type] !== undefined;

export function potmBonus(role: Role, card: CardInput): Stats {
  const n = card.potm ? POTM_BONUS[card.type] : undefined;
  return n ? Object.fromEntries(STAT_KEYS[role].map((k) => [k, n])) : {};
}
