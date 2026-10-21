import { awakenLevels, enhanceLevels } from "./enhance";
import { DEFAULT_PICKS, MAX_SET_DECK_SCORE } from "./setDeck";
import { CARD_TYPES, type CardType, type CommonCondition, type Role, type Stats } from "./types";

// 레벨별 표는 "그 레벨까지의 누적 보너스"를 담는다. 인덱스 = 레벨, [0]은 보너스 없음.
// 단계마다 오르는 양이 일정하지 않아도 그대로 적을 수 있고, 최대 레벨은 길이 - 1로 정해진다.
export type LevelTable = Stats[];

export interface CardTypeBonus {
  enhance: LevelTable;
  awaken: LevelTable | null; // null = 각성 불가
}

export interface BonusTable {
  cardType: Record<Role, Record<CardType, CardTypeBonus>>;
  locker: Record<Role, LevelTable>;
}

const byType = (role: Role) =>
  Object.fromEntries(
    CARD_TYPES.map((type) => [type, { enhance: enhanceLevels(role, type), awaken: awakenLevels(role, type) }]),
  ) as Record<CardType, CardTypeBonus>;

// TODO: 라커룸 수치를 받으면 채운다. 지금은 보너스 0인 틀. (세트덱은 setDeck.ts, 포지션 특훈은 positionTraining.ts)
export const BONUS_TABLE: BonusTable = {
  cardType: { pitcher: byType("pitcher"), batter: byType("batter") },
  locker: { pitcher: [{}], batter: [{}] },
};

// 세트덱은 다 맞춘 덱 기준(200)과 추천 선택, 라커룸은 최대 레벨이 기본
export const DEFAULT_CONDITION: CommonCondition = {
  setDeckScore: MAX_SET_DECK_SCORE,
  setDeckPicks: DEFAULT_PICKS,
  yearMatchAll: true,
  lockerLevel: BONUS_TABLE.locker.batter.length - 1,
  applyTraining: true,
  redistTargetPct: 10,
};

// 최대 단계 (타자·투수 표 길이가 같아서 타자 기준으로 센다). 각성 불가 카드는 0.
export const maxEnhance = (type: CardType) => BONUS_TABLE.cardType.batter[type].enhance.length - 1;
export const maxAwaken = (type: CardType) => (BONUS_TABLE.cardType.batter[type].awaken?.length ?? 1) - 1;

// 각성은 최대 강화(10강)를 마친 카드만 할 수 있다
export const canAwaken = (type: CardType, enhanceLevel: number) =>
  maxAwaken(type) > 0 && enhanceLevel === maxEnhance(type);
