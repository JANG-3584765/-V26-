export type Role = "pitcher" | "batter";

// `as const`로 선언하면 배열이 readonly 튜플이 되고, `[number]`로 원소 타입(문자열 리터럴 유니온)을 뽑을 수 있다.
// 배열은 화면에서 입력칸을 순서대로 그릴 때, 타입은 오타 검사에 쓴다 — 한 곳에서 같이 관리하려는 목적.
// https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
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

export const STAT_KEYS = {
  pitcher: ["구속", "변화", "구위", "제구", "지구력", "수비"],
  batter: ["파워", "정확", "선구", "인내", "주루", "수비"],
} as const;

// `satisfies`로 핵심 스탯이 그 역할의 스탯 중 하나인지 검사한다 (오타를 내면 여기서 타입 오류).
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator
export const CORE_STAT_KEYS = {
  pitcher: ["변화", "구위"],
  batter: ["파워", "정확", "선구"],
} as const satisfies { [R in Role]: readonly (typeof STAT_KEYS)[R][number][] };

export type StatKey = (typeof STAT_KEYS)[Role][number];

// 사용자가 주요 스탯만 입력할 수도 있으므로 모든 키가 선택값이다.
export type Stats = Partial<Record<StatKey, number>>;

// 배치: 세트덱 조건과 포지션 특훈 표를 고르는 데 쓴다
export type Lineup = "top" | "middle" | "bottom"; // 상위 1~2 / 중심 3~5 / 하위 6~9번
export type Position = "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "DH";
// 투수 배치 칸: 선발 1~5, 중계 1~8, 마무리
export type PitcherSlot = "SP1" | "SP2" | "SP3" | "SP4" | "SP5" | "RP1" | "RP2" | "RP3" | "RP4" | "RP5" | "RP6" | "RP7" | "RP8" | "CP";

export interface CardInput {
  name: string;
  type: CardType;
  base: Stats; // 훈련·강화·각성 전 능력치
  enhanceLevel: number; // 0~10강
  awakenLevel: number; // 0~9각 (10강 이후, 각성 가능한 카드만)
  customTraining?: Stats; // 직접 입력한 스탯별 훈련값 (없으면 확률 기준 기본값)
  special?: Stats; // 스탯별 특훈 값 (사용자가 게임에서 본 값을 그대로 입력)
  potm?: boolean; // 이달의 선수로 선정됐는지
  // 세트덱·포지션 특훈 조건 (비어 있으면 CARD_DEFAULTS)
  year?: number; // 카드 연도 (1982~2026). 임팩트는 모든 연도에 해당해 쓰지 않는다
  lineup?: Lineup;
  position?: Position;
  pitcherSlot?: PitcherSlot;
  positionLevel?: number; // 포지션 특훈 단계 (0~20)
  positionBonus?: Stats; // 포지션 특훈 5·15단 보너스 (게임에서 본 값을 그대로 입력)
}

// 선택 속성이 비어 있을 때 쓰는 기본값. 계산과 화면이 같은 값을 쓰도록 여기 한 곳에만 둔다.
export const CARD_DEFAULTS = {
  lineup: "middle",
  position: "DH", // 지명타자는 어느 타자나 설 수 있다
  pitcherSlot: "SP1",
  positionLevel: 20, // 포지션 특훈 최대 단계 (positionTraining.ts MAX_POSITION_LEVEL과 같음, 테스트로 확인)
} as const satisfies { lineup: Lineup; position: Position; pitcherSlot: PitcherSlot; positionLevel: number };

// 연도 덱: 모든 카드가 받음 / 아무도 안 받음(임팩트 제외) / 그 연도 카드만 받음
export type YearDeck = "all" | "none" | number;

// 비교하는 모든 카드에 똑같이 적용되는 조건
export interface CommonCondition {
  setDeckScore: number;
  setDeckPicks: (0 | 1)[]; // 세트덱 단계별로 고른 효과 (SET_DECK_TIERS 순서)
  yearDeck: Record<Role, YearDeck>; // 역할별 연도 기본값 (단계별 연도를 고르지 않은 연도 효과에 쓴다)
  tierYears: Partial<Record<number, number>>; // 세트덱 연도 단계별로 고른 연도 (단계 점수 → 연도). 단계마다 다를 수 있다
  lockerLevel: number;
  applyTraining: boolean;
  redistTargetPct: number; // 훈련 재분배 목표 확률(%)
}
