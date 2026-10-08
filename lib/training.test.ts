import { describe, expect, it } from "vitest";
import { CARD_GRADES, CARD_TYPES } from "./types";
import { distribute, estimateCore, probOfCore, REDIST_TABLE, TRAINING_MAX_LEVEL, trainingBonus, valueAtProb } from "./training";

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

  it("확률이 목표에 가장 가까운 값", () => {
    expect(valueAtProb(t, 10)).toBe(28); // 7.46%(차이 2.54)가 12.99%(차이 2.99)보다 가깝다
    expect(valueAtProb(t, 13)).toBe(27);
    expect(valueAtProb(t, 99)).toBe(25); // 범위 밖이면 끝값
  });

  it("10% 기준 투수 값이 커뮤니티 기준과 같다 (임팩 24 / 시그 33 / 골글 32 / 국대 26)", () => {
    const at = (type: "임팩트" | "시그니처" | "골든글러브" | "국가대표", grade: 4 | 5) =>
      trainingBonus("pitcher", type, grade, 10).core;
    expect([at("임팩트", 4), at("시그니처", 5), at("골든글러브", 5), at("국가대표", 5)]).toEqual([24, 33, 32, 26]);
  });
});

describe("trainingBonus (기본 10%)", () => {
  it("임팩트 타자: 파정선 +34, 전체 +18레벨×3", () => {
    expect(trainingBonus("batter", "임팩트", 4, 10)).toEqual({ core: 34, total: 54, estimated: false });
  });

  // 표가 없는 카드: 골글 5성 값(타자 10% → 45) × 훈련 레벨 비율
  it("골글 4성 추정: 45 × 23/25 = 41.4 → 41", () => {
    expect(trainingBonus("batter", "골든글러브", 4, 10)).toEqual({ core: 41, total: 69, estimated: true });
  });

  it("타자 라이브 올스타 추정: 45 × 30/25 = 54", () => {
    expect(trainingBonus("batter", "라이브 올스타", 5, 10)).toEqual({ core: 54, total: 90, estimated: true });
  });

  it("추정 오차: 표가 있는 카드(시그 제외)를 추정해도 실제와 3 이내", () => {
    for (const role of ["batter", "pitcher"] as const) {
      for (const [type, byGrade] of Object.entries(REDIST_TABLE[role])) {
        if (type === "시그니처") continue;
        for (const [g, table] of Object.entries(byGrade!)) {
          const level = TRAINING_MAX_LEVEL[type as keyof typeof TRAINING_MAX_LEVEL][Number(g) as 4 | 5]!;
          const diff = estimateCore(role, level, 10) - valueAtProb(table!, 10);
          expect(Math.abs(diff), `${role} ${type} ${g}성`).toBeLessThanOrEqual(3);
        }
      }
    }
  });
});

describe("probOfCore", () => {
  it("표에 있는 값이면 그 확률", () => {
    expect(probOfCore("batter", "임팩트", 4, 34)).toEqual({ pct: 7.46, cmp: "=", estimated: false });
  });

  it("표 범위를 벗어나면 끝값과 비교 표시", () => {
    expect(probOfCore("batter", "임팩트", 4, 20)).toEqual({ pct: 94.74, cmp: ">", estimated: false });
    expect(probOfCore("batter", "임팩트", 4, 40)).toEqual({ pct: 1.97, cmp: "<", estimated: false });
  });

  it("표가 없는 카드는 골글 5성 값으로 환산: 골글 4성 41 × 25/23 = 44.6 → 45 → 10.32%", () => {
    expect(probOfCore("batter", "골든글러브", 4, 41)).toEqual({ pct: 10.32, cmp: "=", estimated: true });
  });

  it("기본값의 확률은 고른 확률 근처로 돌아온다", () => {
    const core = trainingBonus("pitcher", "시그니처", 5, 10).core;
    expect(probOfCore("pitcher", "시그니처", 5, core).pct).toBe(8.65);
  });
});

describe("distribute", () => {
  it("타자: 핵심은 파정선에, 남는 값은 파워 / 나머지는 인주수에, 남는 값은 인내", () => {
    expect(distribute("batter", { core: 47, total: 75 })).toEqual({
      파워: 17, 정확: 15, 선구: 15, 인내: 10, 주루: 9, 수비: 9,
    });
  });

  it("투수: 핵심은 변화·구위에, 남는 값은 구위 / 나머지는 4개에, 남는 값은 지구력", () => {
    // 시그 투수 총량 75, 핵심 33 → 16·17 / 42 ÷ 4 = 10 나머지 2
    expect(distribute("pitcher", { core: 33, total: 75 })).toEqual({
      변화: 16, 구위: 17, 구속: 10, 제구: 10, 지구력: 12, 수비: 10,
    });
  });

  it("나눈 값의 합은 총량과 같다", () => {
    const d = distribute("batter", { core: 34, total: 54 });
    expect(Object.values(d).reduce((a, b) => a! + b!, 0)).toBe(54);
  });
});
