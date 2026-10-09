import { describe, expect, it } from "vitest";
import type { BonusTable, CardTypeBonus, GradeBonus } from "./bonusTable";
import { coreScore, normalize } from "./calc";
import type { CardInput, CardType } from "./types";

// 실제 수치가 채워지기 전이라 계산 규칙만 검증하는 가짜 표를 쓴다.
const none: CardTypeBonus = { enhance: [{}], awaken: null };

const batterTable = {
  시즌: {},
  라이브: {},
  임팩트: { 4: { enhance: [{}, { 파워: 1 }, { 파워: 3, 정확: 1 }], awaken: { 선구: 5 } } },
  시그니처: {},
  골든글러브: {
    4: { enhance: [{}, { 파워: 10 }], awaken: null },
    5: { enhance: [{}, { 파워: 20 }], awaken: null },
  },
  국가대표: {},
  "라이브 올스타": {},
} satisfies Record<CardType, GradeBonus>;

const table: BonusTable = {
  cardType: { pitcher: { ...batterTable, 임팩트: { 4: none } }, batter: batterTable },
  setDeck: {
    pitcher: [],
    batter: [
      { minScore: 100, bonus: { 파워: 1 } },
      { minScore: 200, bonus: { 파워: 2 } },
    ],
  },
  locker: { pitcher: [{}], batter: [{}, { 주루: 2 }] },
  position: { pitcher: [{}], batter: [{}, { 수비: 3 }] },
};

const card = (over: Partial<CardInput> = {}): CardInput => ({
  name: "테스트",
  type: "임팩트",
  grade: 4,
  base: { 파워: 80, 정확: 70, 선구: 60, 인내: 50, 주루: 40, 수비: 30 },
  enhanceLevel: 0,
  awakened: false,
  ...over,
});

const noBonus = { setDeckScore: 0, lockerLevel: 0, positionLevel: 0, applyTraining: false, redistTargetPct: 10 };

describe("normalize", () => {
  it("보너스가 없으면 입력값 그대로", () => {
    expect(normalize("batter", card(), noBonus, table)).toEqual(card().base);
  });

  it("강화 단계의 누적 보너스와 각성을 더한다", () => {
    const r = normalize("batter", card({ enhanceLevel: 2, awakened: true }), noBonus, table);
    expect(r).toMatchObject({ 파워: 83, 정확: 71, 선구: 65 });
  });

  it("같은 종류라도 등급별 보너스를 따로 적용한다", () => {
    const gg = (grade: 4 | 5) =>
      normalize("batter", card({ type: "골든글러브", grade, enhanceLevel: 1 }), noBonus, table).파워;
    expect([gg(4), gg(5)]).toEqual([90, 100]);
  });

  it("표에 없는 등급이면 오류로 알린다", () => {
    expect(() => normalize("batter", card({ grade: 5 }), noBonus, table)).toThrow("임팩트 5성");
  });

  it("세트덱은 도달한 가장 높은 구간만 적용한다", () => {
    const at = (setDeckScore: number) =>
      normalize("batter", card(), { ...noBonus, setDeckScore }, table).파워;
    expect([at(99), at(100), at(250)]).toEqual([80, 81, 82]);
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
