import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION } from "./bonusTable";
import { breakdown, compareCards } from "./compare";
import type { CardInput } from "./types";

const card = (name: string, over: Partial<CardInput> = {}): CardInput => ({
  name,
  type: "임팩트",
  base: { 파워: 80, 정확: 70, 선구: 60 },
  enhanceLevel: 0,
  awakenLevel: 0,
  positionLevel: 0,
  ...over,
});

// 훈련만 검사하려고 세트덱은 끈다 (setDeck.test.ts). 특훈은 입력하지 않으면 0이다.
const trainingOnly = { ...DEFAULT_CONDITION, setDeckScore: 0 };
const noTraining = { ...trainingOnly, applyTraining: false };

describe("compareCards", () => {
  it("핵심 합계 내림차순, 비어 있는 카드는 맨 뒤", () => {
    const rows = compareCards(
      "batter",
      [card("A"), card("빈칸", { base: { 파워: 99 } }), card("B", { base: { 파워: 90, 정확: 70, 선구: 60 } })],
      noTraining,
    );
    expect(rows.map((r) => [r.card.name, r.core])).toEqual([
      ["B", 220],
      ["A", 210],
      ["빈칸", null],
    ]);
    expect(rows.map((r) => r.index)).toEqual([2, 0, 1]);
  });

  it("훈련을 켜면 카드별 기본 훈련값을 스탯마다 더한다", () => {
    const cards = [card("임팩"), card("시그", { type: "시그니처" })];
    expect(compareCards("batter", cards, noTraining).map((r) => r.core)).toEqual([210, 210]);

    // 10% 기준 시그 타자 핵심 +47 / 임팩 타자 +34
    const on = compareCards("batter", cards, trainingOnly);
    expect(on.map((r) => [r.card.name, r.core])).toEqual([
      ["시그", 257],
      ["임팩", 244],
    ]);
    expect(on[0].stats).toEqual({ 파워: 97, 정확: 85, 선구: 75 }); // +17, +15, +15
  });

  it("직접 입력한 훈련값이 있으면 기본값 대신 쓴다", () => {
    const customTraining = { 파워: 20, 정확: 20, 선구: 0 };
    const [row] = compareCards("batter", [card("내 카드", { customTraining })], trainingOnly);
    expect(row.core).toBe(250);
  });
});

describe("breakdown", () => {
  it("요소별 값을 모두 더하면 최종 능력치와 같다 (기본 조건 전부 켠 상태)", () => {
    const c = card("시그", { type: "시그니처", positionLevel: 20, potm: true });
    const [row] = compareCards("batter", [c], DEFAULT_CONDITION);
    const sum = (key: "파워" | "정확" | "선구") => breakdown("batter", c, DEFAULT_CONDITION).reduce((s, r) => s + (r.stats[key] ?? 0), 0);
    expect({ 파워: sum("파워"), 정확: sum("정확"), 선구: sum("선구") }).toEqual(row.stats);
  });

  it("시그 10강 9각: 강화 24·24·22, 각성 5·5·5", () => {
    const rows = breakdown("batter", card("시그", { type: "시그니처", enhanceLevel: 10, awakenLevel: 9 }), DEFAULT_CONDITION);
    expect(rows.find((r) => r.label === "강화")!.stats).toMatchObject({ 파워: 24, 정확: 24, 선구: 22 });
    expect(rows.find((r) => r.label === "각성")!.stats).toMatchObject({ 파워: 5, 정확: 5, 선구: 5 });
  });
});
