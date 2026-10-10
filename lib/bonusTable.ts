import { CARD_TYPES, type CardType, type CommonCondition, type Role, type Stats } from "./types";

// 레벨별 표는 "그 레벨까지의 누적 보너스"를 담는다. 인덱스 = 레벨, [0]은 보너스 없음.
// 단계마다 오르는 양이 일정하지 않아도 그대로 적을 수 있고, 최대 레벨은 길이 - 1로 정해진다.
export type LevelTable = Stats[];

export interface CardTypeBonus {
  enhance: LevelTable;
  awaken: Stats | null; // null = 각성 불가
}

export interface SetDeckTier {
  minScore: number;
  bonus: Stats;
}

export interface BonusTable {
  cardType: Record<Role, Record<CardType, CardTypeBonus>>;
  setDeck: Record<Role, SetDeckTier[]>; // minScore 오름차순
  locker: Record<Role, LevelTable>;
  position: Record<Role, LevelTable>;
}

// TODO: 실제 수치를 받으면 채운다. 지금은 모든 보너스가 0인 틀.
// 우선순위: 임팩트·골든글러브·시그니처·라이브 올스타 (실사용 덱의 대부분)
const emptyByType = () =>
  Object.fromEntries(CARD_TYPES.map((type) => [type, { enhance: [{}], awaken: {} }])) as Record<CardType, CardTypeBonus>;

export const BONUS_TABLE: BonusTable = {
  cardType: { pitcher: emptyByType(), batter: emptyByType() },
  setDeck: { pitcher: [], batter: [] },
  locker: { pitcher: [{}], batter: [{}] },
  position: { pitcher: [{}], batter: [{}] },
};

// TODO: 보편적인 세트덱 스코어를 받으면 바꾼다. 라커룸·포지션 특훈은 최대 레벨이 기본.
export const DEFAULT_CONDITION: CommonCondition = {
  setDeckScore: 0,
  lockerLevel: BONUS_TABLE.locker.batter.length - 1,
  positionLevel: BONUS_TABLE.position.batter.length - 1,
  applyTraining: true,
  redistTargetPct: 10,
};

export const maxEnhance = (role: Role, type: CardType) => BONUS_TABLE.cardType[role][type].enhance.length - 1;
