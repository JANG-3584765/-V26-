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

const noTraining = { ...DEFAULT_CONDITION, applyTraining: false };

describe("compareCards", () => {
  it("핵심 합계 내림차순, 같으면 전체 합계로 정렬", () => {
    const rows = compareCards(
      "batter",
      [card("A"), card("B", { base: { 파워: 90, 정확: 70, 선구: 60 } }), card("C", { base: { 파워: 90, 정확: 70, 선구: 60, 인내: 1, 주루: 1, 수비: 1 } })],
      noTraining,
    );
    expect(rows.map((r) => r.card.name)).toEqual(["C", "B", "A"]);
    expect(rows.map((r) => r.index)).toEqual([2, 1, 0]);
  });

  it("훈련을 켜면 카드별 기본 훈련값을 스탯마다 더한다", () => {
    const cards = [card("임팩"), card("시그", { type: "시그니처", grade: 5 })];
    expect(compareCards("batter", cards, noTraining).map((r) => r.core)).toEqual([210, 210]);

    // 10% 기준 시그 타자 핵심 +47·총량 75 / 임팩 타자 +34·54
    const on = compareCards("batter", cards, DEFAULT_CONDITION);
    expect(on.map((r) => [r.card.name, r.core, r.total])).toEqual([
      ["시그", 257, 405],
      ["임팩", 244, 384],
    ]);
    expect(on[0].stats).toMatchObject({ 파워: 97, 인내: 60 }); // 80+17, 50+10
  });

  it("직접 입력한 훈련값이 있으면 기본값 대신 쓴다", () => {
    const customTraining = { 파워: 20, 정확: 20, 선구: 0, 인내: 0, 주루: 7, 수비: 7 };
    const [row] = compareCards("batter", [card("내 카드", { customTraining })], DEFAULT_CONDITION);
    expect([row.core, row.total, row.trainingEstimated]).toEqual([250, 384, false]);
  });

  it("입력하지 않은 스탯에는 훈련값도 더하지 않는다", () => {
    const [row] = compareCards("batter", [card("핵심만", { base: { 파워: 80, 정확: 70, 선구: 60 } })], DEFAULT_CONDITION);
    expect(row.stats).toEqual({ 파워: 92, 정확: 81, 선구: 71 });
    expect(row.total).toBeNull();
  });
});
