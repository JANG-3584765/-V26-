import type { Lineup, PitcherSlot, Position } from "./setDeck";

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

// 입력값: 훈련·강화·각성 전 능력치
export interface CardInput {
  name: string;
  type: CardType;
  base: Stats;
  enhanceLevel: number; // 0~10강
  awakenLevel: number; // 0~9각 (10강 이후, 각성 가능한 카드만)
  customTraining?: Stats; // 직접 입력한 스탯별 훈련값 (없으면 확률 기준 기본값)
  special?: Stats; // 스탯별 특훈 값 (사용자가 게임에서 본 값을 그대로 입력)
  potm?: boolean; // 이달의 선수로 선정됐는지
  // 세트덱·포지션 특훈 조건 (없으면 기본값: 연도는 일괄 설정, 중심타선, 지명타자, 선발1, 특훈 20단계)
  yearMatch?: boolean;
  lineup?: Lineup;
  position?: Position;
  pitcherSlot?: PitcherSlot;
  positionLevel?: number; // 포지션 특훈 단계 (0~20)
  positionBonus?: Stats; // 포지션 특훈 5·15단 보너스 (게임에서 본 값을 그대로 입력)
}

// 비교하는 모든 카드에 똑같이 적용되는 조건
export interface CommonCondition {
  setDeckScore: number;
  setDeckPicks: (0 | 1)[]; // 세트덱 단계별로 고른 효과 (SET_DECK_TIERS 순서)
  yearMatchAll: boolean; // 연도 효과 일괄 적용
  lockerLevel: number;
  applyTraining: boolean;
  redistTargetPct: number; // 훈련 재분배 목표 확률(%)
}
