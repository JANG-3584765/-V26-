import { describe, expect, it } from "vitest";
import { canAwaken, maxAwaken, maxEnhance } from "./bonusTable";
import { awakenLevels, enhanceLevels } from "./enhance";
import type { CardType, Stats } from "./types";

const sum = (s: Stats) => Object.values(s).reduce((a, b) => a! + b!, 0);

// 게임 화면 "능력치 합계" 행 (파워·정확·선구·주루·인내·수비 순)
describe("강화 10강 누적 = 게임 화면 합계", () => {
  const batter = (type: CardType) => enhanceLevels("batter", type)[10];

  it.each([
    ["라이브 올스타", [24, 24, 22, 20, 20, 20]],
    ["시그니처", [24, 24, 22, 20, 20, 20]],
    ["라이브", [24, 24, 22, 20, 20, 20]],
    ["골든글러브", [25, 25, 23, 21, 21, 21]],
    ["임팩트", [14, 14, 12, 10, 10, 10]],
    ["시즌", [18, 18, 18, 17, 17, 17]],
  ] as const)("%s", (type, [파워, 정확, 선구, 주루, 인내, 수비]) => {
    expect(batter(type)).toEqual({ 파워, 정확, 선구, 주루, 인내, 수비 });
  });

  it("투수는 같은 열을 쓴다: 파워=구속, 정확=제구, 선구=구위, 주루=변화, 인내=지구력", () => {
    expect(enhanceLevels("pitcher", "라이브 올스타")[10]).toEqual({ 구속: 24, 제구: 24, 구위: 22, 변화: 20, 지구력: 20, 수비: 20 });
  });
});

describe("각성 9각 누적 = 게임 화면 합계", () => {
  it.each([
    ["임팩트", 15],
    ["시그니처", 27],
    ["골든글러브", 36],
    ["국가대표", 24],
  ] as const)("%s +%i (타자·투수 모두)", (type, total) => {
    expect(sum(awakenLevels("batter", type)![9])).toBe(total);
    expect(sum(awakenLevels("pitcher", type)![9])).toBe(total);
  });

  it("임팩트 타자 9각: 파정선 각 3, 인주수 각 2", () => {
    expect(awakenLevels("batter", "임팩트")![9]).toEqual({ 파워: 3, 정확: 3, 선구: 3, 인내: 2, 주루: 2, 수비: 2 });
  });

  it("올스타·라이브·시즌은 각성 불가", () => {
    for (const type of ["라이브 올스타", "라이브", "시즌"] as const) expect(awakenLevels("batter", type)).toBeNull();
  });
});

describe("강화·각성 단계", () => {
  it("최대 단계: 강화 10, 각성 9 (불가 카드는 0)", () => {
    expect([maxEnhance("시그니처"), maxAwaken("시그니처"), maxAwaken("라이브 올스타")]).toEqual([10, 9, 0]);
  });

  it("각성은 10강을 마친 카드만", () => {
    expect([canAwaken("임팩트", 9), canAwaken("임팩트", 10), canAwaken("라이브", 10)]).toEqual([false, true, false]);
  });
});
