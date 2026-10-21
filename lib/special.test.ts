import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION } from "./bonusTable";
import { compareCards } from "./compare";
import { canFA, defaultSpecialExtra, specialProbs, specialSpec } from "./special";
import type { CardInput } from "./types";

// 커뮤니티 재설정표: 무작위 추가분 중 파정(타자 파워·정확, 2스탯 → q = 1/3)에 들어간 합 ≥ x 확률(%)
const COMMUNITY = [
  { name: "임팩트", count: 3, impact: true, probs: [100, 82.85, 46.85, 16.5, 3.807, 0.48, 0.023] },
  { name: "임팩트 FA", count: 5, impact: true, probs: [100, 94.71, 76.19, 47.58, 22.45, 8.163, 2.359, 0.641, 0.233, 0.159, 0.15] },
  { name: "시그·골글", count: 3, impact: false, probs: [100, 89.67, 62.77, 31.63, 10.99, 2.706, 0.497, 0.0623, 0.0105, 0.0014] },
  {
    name: "시그 FA",
    count: 5,
    impact: false,
    probs: [100, 97.72, 87.85, 67.72, 43.14, 23.13, 10.91, 4.743, 2.214, 1.0, 0.448, 0.149, 0.043, 0.00841504, 0.00127723, 0.00002868],
  },
  { name: "국가대표", count: 4, impact: false, probs: [100, 95.15, 78.3, 51.11, 25.82, 10.33, 3.3172, 0.9359, 0.2634, 0.1217, 0.0175, 0.0024, 0.0002] },
];

describe("공식 특훈 확률 모델", () => {
  // 커뮤니티 표는 시뮬레이션 근사값이라 확률이 낮은 끝부분에서 최대 1.6%p 차이가 난다
  it.each(COMMUNITY)("$name: 커뮤니티 재설정표를 2%p 안에서 재현한다", ({ count, impact, probs }) => {
    const dist: [number, number][] = impact ? [[1, 0.5], [2, 0.5]] : [[1, 0.3334], [2, 0.3333], [3, 0.3333]];
    const model = specialProbs(count, dist, 1 / 3);
    probs.forEach((p, x) => expect(Math.abs(model[x] - p)).toBeLessThan(2));
  });

  it("추가분 최댓값 = 횟수 × 회당 최대 (임팩트 2, 나머지 3)", () => {
    const max = (t: ReturnType<typeof specialSpec>) => t.table!.probs.length - 1;
    expect([max(specialSpec("batter", "임팩트")), max(specialSpec("batter", "시그니처")), max(specialSpec("batter", "국가대표"))]).toEqual([6, 9, 12]);
  });

  it("재훈련권을 쓰면 추가 개수가 고정되어 분포가 높아진다", () => {
    const at6 = (ticket: boolean) => specialSpec("batter", "시그니처", false, ticket).table!.probs[6];
    expect(at6(true)).toBeGreaterThan(at6(false));
  });

  it("FA는 임팩트·시그니처만, 5회", () => {
    expect([canFA("임팩트"), canFA("시그니처"), canFA("골든글러브")]).toEqual([true, true, false]);
    expect([specialSpec("batter", "시그니처", true).count, specialSpec("batter", "골든글러브", true).count]).toEqual([5, 3]);
  });

  it("라이브는 특훈 불가", () => {
    expect(specialSpec("batter", "라이브")).toEqual({ table: null, count: 0 });
  });
});

describe("기본값 (10% 내외, 타자 파정선 / 투수 변구)", () => {
  it("타자 추가분: 임팩 4 / 시그·골글·올스타 5 / 국대 7", () => {
    const at = (type: "임팩트" | "시그니처" | "골든글러브" | "라이브 올스타" | "국가대표") => defaultSpecialExtra("batter", type, false, false, 10);
    expect([at("임팩트"), at("시그니처"), at("골든글러브"), at("라이브 올스타"), at("국가대표")]).toEqual([4, 5, 5, 5, 7]);
  });

  it("투수 추가분: 임팩 3 / 시그 4 / 국대 5", () => {
    expect([
      defaultSpecialExtra("pitcher", "임팩트", false, false, 10),
      defaultSpecialExtra("pitcher", "시그니처", false, false, 10),
      defaultSpecialExtra("pitcher", "국가대표", false, false, 10),
    ]).toEqual([3, 4, 5]);
  });
});

describe("비교에 반영 (입력한 값 그대로)", () => {
  const card = (over: Partial<CardInput> = {}): CardInput => ({
    name: "테스트",
    type: "시그니처",
    base: { 파워: 80, 정확: 70, 선구: 60 },
    enhanceLevel: 0,
    awakenLevel: 0,
    positionLevel: 0,
    ...over,
  });
  const only = { ...DEFAULT_CONDITION, applyTraining: false, setDeckScore: 0 };

  it("입력하지 않으면 0", () => {
    expect(compareCards("batter", [card()], only)[0].core).toBe(210);
  });

  it("스탯별 입력값을 그대로 더한다", () => {
    const [row] = compareCards("batter", [card({ special: { 파워: 4, 정확: 3, 선구: 2 } })], only);
    expect(row.stats).toEqual({ 파워: 84, 정확: 73, 선구: 62 });
  });
});
