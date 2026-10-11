import { describe, expect, it } from "vitest";
import { CARD_TYPES, type CardType } from "./types";
import { distribute, probOfCore, REDIST_TABLE, TRAINING_MAX_LEVEL, trainingBonus, valueAtProb } from "./training";

describe("데이터 점검", () => {
  it("모든 카드 종류에 최대 훈련 레벨이 있다", () => {
    for (const type of CARD_TYPES) expect(TRAINING_MAX_LEVEL[type], type).toBeGreaterThan(0);
  });

  // 옮겨 적다 생긴 오타는 대개 확률이 줄지 않는 지점으로 드러난다
  it("확률표는 값이 커질수록 확률이 줄어든다", () => {
    for (const byCard of Object.values(REDIST_TABLE)) {
      for (const table of Object.values(byCard)) {
        table.probs.forEach((p, i) => i > 0 && expect(p).toBeLessThan(table.probs[i - 1]));
      }
    }
  });
});

describe("valueAtProb", () => {
  const t = { from: 25, probs: [94.74, 89.72, 12.99, 7.46] };

  it("확률이 목표에 가장 가까운 값", () => {
    expect(valueAtProb(t, 10)).toBe(28); // 7.46%(차이 2.54)가 12.99%(차이 2.99)보다 가깝다
    expect(valueAtProb(t, 13)).toBe(27);
    expect(valueAtProb(t, 99)).toBe(25); // 범위 밖이면 끝값
  });

  // 국대는 업데이트로 22레벨이 되어 커뮤니티 기준(26)보다 높다
  it("10% 기준 투수 값: 임팩 24 / 시그 33 / 골글 32 / 국대 28", () => {
    const at = (type: CardType) => trainingBonus("pitcher", type, 10).core;
    expect([at("임팩트"), at("시그니처"), at("골든글러브"), at("국가대표")]).toEqual([24, 33, 32, 28]);
  });
});

describe("trainingBonus (기본 10%)", () => {
  it("임팩트 타자: 파정선 +34, 전체 +18레벨×3", () => {
    expect(trainingBonus("batter", "임팩트", 10)).toEqual({ core: 34, total: 54 });
  });

  it("모델로 채운 카드도 같은 방식: 타자 시즌 +37 (9.07%), 타자 라이브 올스타 +53 (11.09%)", () => {
    expect(trainingBonus("batter", "시즌", 10)).toEqual({ core: 37, total: 60 });
    expect(trainingBonus("batter", "라이브 올스타", 10)).toEqual({ core: 53, total: 90 });
  });
});

describe("probOfCore", () => {
  it("표에 있는 값이면 그 확률", () => {
    expect(probOfCore("batter", "임팩트", 34)).toMatchObject({ pct: 7.46, cmp: "=" });
  });

  it("표 범위를 벗어나면 끝값과 비교 표시", () => {
    expect(probOfCore("batter", "임팩트", 20)).toMatchObject({ pct: 94.74, cmp: ">" });
    expect(probOfCore("batter", "임팩트", 40)).toMatchObject({ pct: 1.97, cmp: "<" });
  });

  it("기본값의 확률은 고른 확률 근처로 돌아온다", () => {
    const core = trainingBonus("pitcher", "시그니처", 10).core;
    expect(probOfCore("pitcher", "시그니처", core).pct).toBe(8.65);
  });
});

describe("distribute", () => {
  it("타자: 핵심 합을 파정선에 나누고 남는 값은 파워", () => {
    expect(distribute("batter", 47)).toEqual({ 파워: 17, 정확: 15, 선구: 15 });
  });

  it("투수: 변화·구위에 나누고 남는 값은 구위", () => {
    expect(distribute("pitcher", 33)).toEqual({ 변화: 16, 구위: 17 });
  });
});
