export type Role = "pitcher" | "batter";

export const CARD_TYPES = [
  "시즌",
  "라이브",
  "임팩트",
  "시그니처",
  "골든글러브",
  "국가대표",
  "라이브 올스타",
] as const;
export type CardType = (typeof CARD_TYPES)[number];

// `as const`로 선언하면 배열이 readonly 튜플이 되고, `[number]`로 원소 타입(문자열 리터럴 유니온)을 뽑을 수 있다.
// 배열은 화면에서 입력칸을 순서대로 그릴 때, 타입은 오타 검사에 쓴다 — 한 곳에서 같이 관리하려는 목적.
// https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
export const STAT_KEYS = {
  pitcher: ["구속", "변화", "구위", "제구", "지구력", "수비"],
  batter: ["파워", "정확", "선구", "인내", "주루", "수비"],
} as const;

export const CORE_STAT_KEYS = {
  pitcher: ["변화", "구위"],
  batter: ["파워", "정확", "선구"],
} as const;

export type StatKey = (typeof STAT_KEYS)[Role][number];

// 사용자가 주요 스탯만 입력할 수도 있으므로 모든 키가 선택값이다.
export type Stats = Partial<Record<StatKey, number>>;

// 입력값: 강화·각성 전, 훈련·훈련 재분배·특훈은 반영된 능력치
export interface CardInput {
  name: string;
  type: CardType;
  base: Stats;
  enhanceLevel: number;
  awakened: boolean;
}

// 비교하는 모든 카드에 똑같이 적용되는 조건
export interface CommonCondition {
  setDeckScore: number;
  lockerLevel: number;
  positionLevel: number;
}
