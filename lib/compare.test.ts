import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION } from "./bonusTable";
import { compareCards } from "./compare";
import type { CardInput } from "./types";

const card = (name: string, over: Partial<CardInput> = {}): CardInput => ({
  name,
  type: "임팩트",
  grade: 4,
  base: { 파워: 80, 정확: 70, 선구: 60, 인내: 50, 주루: 40, 수비: 30 },
  enhanceLevel: 0,
  awakened: false,
  ...over,
});

describe("compareCards", () => {
  it("핵심 합계 내림차순, 같으면 전체 합계로 정렬", () => {
    const rows = compareCards(
      "batter",
      [card("A"), card("B", { base: { 파워: 90, 정확: 70, 선구: 60 } }), card("C", { base: { 파워: 90, 정확: 70, 선구: 60, 인내: 1, 주루: 1, 수비: 1 } })],
      { ...DEFAULT_CONDITION, applyTraining: false },
    );
    expect(rows.map((r) => r.card.name)).toEqual(["C", "B", "A"]);
    expect(rows.map((r) => r.index)).toEqual([2, 1, 0]);
  });

  it("훈련을 끄면 더하지 않고, 켜면 카드별 훈련값을 더한다", () => {
    const cards = [card("임팩"), card("시그", { type: "시그니처", grade: 5 })];
    const off = compareCards("batter", cards, { ...DEFAULT_CONDITION, applyTraining: false });
    const on = compareCards("batter", cards, DEFAULT_CONDITION);
    // 10% 기준 시그 타자 +46 / 임팩 타자 +33, 전체는 75 / 54
    expect(off.map((r) => r.core)).toEqual([210, 210]);
    expect(on.map((r) => [r.card.name, r.core, r.total])).toEqual([
      ["시그", 256, 405],
      ["임팩", 243, 384],
    ]);
  });
});
