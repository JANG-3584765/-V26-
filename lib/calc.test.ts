import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION, type BonusTable, type CardTypeBonus } from "./bonusTable";
import { coreScore, normalize } from "./calc";
import type { CardInput, CardType } from "./types";

// 실제 수치가 채워지기 전이라 계산 규칙만 검증하는 가짜 표를 쓴다.
const none: CardTypeBonus = { enhance: [{}], awaken: null };

const batterTable = {
  시즌: none,
  라이브: none,
  임팩트: { enhance: [{}, { 파워: 1 }, { 파워: 3, 정확: 1 }], awaken: [{}, { 선구: 5 }] },
  시그니처: none,
  골든글러브: none,
  국가대표: none,
  "라이브 올스타": none,
} satisfies Record<CardType, CardTypeBonus>;

const table: BonusTable = {
  cardType: { pitcher: { ...batterTable, 임팩트: none }, batter: batterTable },
  locker: { pitcher: [{}], batter: [{}, { 주루: 2 }] },
  position: { pitcher: [{}], batter: [{}, { 수비: 3 }] },
};

const card = (over: Partial<CardInput> = {}): CardInput => ({
  name: "테스트",
  type: "임팩트",
  base: { 파워: 80, 정확: 70, 선구: 60, 인내: 50, 주루: 40, 수비: 30 },
  enhanceLevel: 0,
  awakenLevel: 0,
  ...over,
});

// 세트덱은 setDeck.test.ts에서 따로 검사한다
const noBonus = { ...DEFAULT_CONDITION, setDeckScore: 0, lockerLevel: 0, positionLevel: 0, applyTraining: false, applySpecial: false };

describe("normalize", () => {
  it("보너스가 없으면 입력값 그대로", () => {
    expect(normalize("batter", card(), noBonus, table)).toEqual(card().base);
  });

  it("강화 단계의 누적 보너스와 각성을 더한다", () => {
    const r = normalize("batter", card({ enhanceLevel: 2, awakenLevel: 1 }), noBonus, table);
    expect(r).toMatchObject({ 파워: 83, 정확: 71, 선구: 65 });
  });

  it("라커룸·포지션 특훈 레벨 보너스를 더한다", () => {
    const r = normalize("batter", card(), { ...noBonus, lockerLevel: 1, positionLevel: 1 }, table);
    expect(r).toMatchObject({ 주루: 42, 수비: 33 });
  });

  it("입력하지 않은 스탯은 보너스가 있어도 비워 둔다", () => {
    const r = normalize("batter", card({ base: { 파워: 80 }, enhanceLevel: 2 }), noBonus, table);
    expect(r).toEqual({ 파워: 83 });
  });
});

describe("coreScore", () => {
  it("타자: 파워+정확+선구", () => {
    expect(coreScore("batter", card().base)).toBe(210);
  });

  it("투수: 변화+구위", () => {
    expect(coreScore("pitcher", { 구속: 70, 변화: 80, 구위: 75 })).toBe(155);
  });

  it("핵심 스탯이 하나라도 비어 있으면 null", () => {
    expect(coreScore("batter", { 파워: 80, 정확: 70 })).toBeNull();
  });
});
