import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION } from "./bonusTable";
import { compareCards } from "./compare";
import { canPotm, potmBonus } from "./potm";
import type { CardInput, CardType } from "./types";

const card = (type: CardType, potm = true): CardInput => ({
  name: "테스트",
  type,
  base: { 파워: 80, 정확: 70, 선구: 60 },
  enhanceLevel: 0,
  awakenLevel: 0,
  positionLevel: 0,
  potm,
});

describe("이달의 선수", () => {
  it("모든 능력치 상승: 임팩·국대·시그 +2, 골글 +1, 라이브(5성) +8", () => {
    const n = (type: CardType) => potmBonus("batter", card(type)).파워;
    expect(["임팩트", "국가대표", "시그니처", "골든글러브", "라이브"].map((t) => n(t as CardType))).toEqual([2, 2, 2, 1, 8]);
    expect(potmBonus("pitcher", card("라이브"))).toEqual({ 구속: 8, 변화: 8, 구위: 8, 제구: 8, 지구력: 8, 수비: 8 });
  });

  it("올스타·시즌은 대상이 아니다", () => {
    expect([canPotm("라이브 올스타"), canPotm("시즌")]).toEqual([false, false]);
    expect(potmBonus("batter", card("라이브 올스타"))).toEqual({});
  });

  it("최종 핵심 합계에 반영된다: 시그 타자 +2 × 3 = +6 (기본 보너스 +6 포함 222)", () => {
    const only = { ...DEFAULT_CONDITION, setDeckScore: 0, applyTraining: false };
    expect(compareCards("batter", [card("시그니처")], only)[0].core).toBe(222);
  });
});
