import { describe, expect, it } from "vitest";
import { CARD_GRADES, CARD_TYPES } from "./types";
import { REDIST_TABLE, TRAINING_MAX_LEVEL, trainingBonus, valueAtProb } from "./training";

describe("데이터 점검", () => {
  it("존재하는 모든 등급에 최대 훈련 레벨이 있다", () => {
    for (const type of CARD_TYPES) {
      for (const g of CARD_GRADES[type]) expect(TRAINING_MAX_LEVEL[type][g], `${type} ${g}성`).toBeGreaterThan(0);
    }
  });

  // 옮겨 적다 생긴 오타는 대개 확률이 줄지 않는 지점으로 드러난다
  it("확률표는 값이 커질수록 확률이 줄어든다", () => {
    for (const byCard of Object.values(REDIST_TABLE)) {
      for (const byGrade of Object.values(byCard)) {
        for (const table of Object.values(byGrade ?? {})) {
          table!.probs.forEach((p, i) => i > 0 && expect(p).toBeLessThan(table!.probs[i - 1]));
        }
      }
    }
  });
});

describe("valueAtProb", () => {
  const t = { from: 25, probs: [94.74, 89.72, 12.99, 7.46] };

  it("목표 확률 이상인 값 중 가장 큰 값", () => {
    expect(valueAtProb(t, 10)).toBe(27); // 12.99% ≥ 10%, 다음 값은 7.46%
    expect(valueAtProb(t, 7.46)).toBe(28); // 경계값 포함
  });
});

describe("trainingBonus (기본 10%)", () => {
  it("임팩트 타자: 파정선 +33, 전체 +18레벨×3", () => {
    expect(trainingBonus("batter", "임팩트", 4, 10)).toEqual({ core: 33, total: 54, estimated: false });
  });

  it("라이브 올스타 투수: 구변 +37, 전체 +90", () => {
    expect(trainingBonus("pitcher", "라이브 올스타", 5, 10)).toEqual({ core: 37, total: 90, estimated: false });
  });

  // 표가 없는 카드: 골글 5성 값(타자 10% → 45) × 훈련 레벨 비율
  it("골글 4성 추정: 45 × 23/25 = 41.4 → 41", () => {
    expect(trainingBonus("batter", "골든글러브", 4, 10)).toEqual({ core: 41, total: 69, estimated: true });
  });

  it("타자 라이브 올스타 추정: 45 × 30/25 = 54", () => {
    expect(trainingBonus("batter", "라이브 올스타", 5, 10)).toEqual({ core: 54, total: 90, estimated: true });
  });

  it("시즌 3성 추정: 45 × 16/25 = 28.8 → 29", () => {
    expect(trainingBonus("batter", "시즌", 3, 10)).toEqual({ core: 29, total: 48, estimated: true });
  });

  it("추정 방식 검증: 표가 있는 투수 올스타를 추정해도 실제값과 같다", () => {
    // 골글 5성 투수 10% → 31, × 30/25 = 37.2 → 37 (실제 37)
    const base = trainingBonus("pitcher", "골든글러브", 5, 10).core;
    expect(Math.round((base * 30) / 25)).toBe(trainingBonus("pitcher", "라이브 올스타", 5, 10).core);
  });
});
