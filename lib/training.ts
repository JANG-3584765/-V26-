import type { CardType, Grade, Role } from "./types";

// 최대 훈련 레벨 = 기본 훈련 + 훈련 돌파
export const TRAINING_MAX_LEVEL: Record<CardType, Partial<Record<Grade, number>>> = {
  라이브: { 1: 17, 2: 19, 3: 21, 4: 23, 5: 25 },
  시즌: { 3: 16, 4: 18, 5: 20 },
  임팩트: { 4: 18 },
  시그니처: { 5: 25 },
  골든글러브: { 4: 23, 5: 25 },
  국가대표: { 5: 22 },
  "라이브 올스타": { 5: 30 },
};

// 훈련 1레벨마다 6개 스탯 중 무작위로 총 3이 오른다 (중복 가능). 재분배해도 총량은 같다.
export const POINTS_PER_LEVEL = 3;

// 훈련 재분배 1회에서 핵심 스탯(타자 파정선, 투수 구변)으로 간 훈련 포인트 합이
// from + i 이상 나올 확률(%) = probs[i]. 커뮤니티에 공유된 확률표를 옮긴 값.
export interface RedistTable {
  from: number;
  probs: number[];
}

type RedistByCard = Partial<Record<CardType, Partial<Record<Grade, RedistTable>>>>;

// 표가 없는 카드(라이브, 시즌, 골글 4성, 타자 라이브 올스타)는 trainingBonus에서 추정한다.
// 실제 표를 구하면 여기에 추가하면 되고, 그 카드는 자동으로 추정 대상에서 빠진다.
export const REDIST_TABLE: Record<Role, RedistByCard> = {
  batter: {
    임팩트: {
      4: { from: 25, probs: [94.74, 89.72, 81.86, 71.06, 58.07, 44.41, 31.66, 21.02, 12.99, 7.46, 3.98, 1.97] },
    },
    시그니처: {
      5: { from: 39, probs: [92.38, 85.1, 74.48, 61.32, 47.31, 34.15, 23.08, 14.63, 8.72, 4.89, 2.59, 1.29] },
    },
    골든글러브: {
      5: {
        from: 36,
        probs: [91.15, 85.22, 77.09, 66.98, 55.6, 43.95, 33.04, 23.6, 16.01, 10.32, 6.31, 3.67, 2.02, 1.06, 0.52],
      },
    },
    국가대표: {
      5: { from: 28, probs: [94.3, 89.31, 81.72, 71.46, 59.2, 46.2, 33.86, 23.28, 15.01, 9.07, 5.13, 2.72] },
    },
  },
  pitcher: {
    임팩트: {
      4: { from: 16, probs: [92.34, 84.9, 74.15, 60.99, 47.07, 34.05, 23.07, 14.65, 8.72, 4.86, 2.54, 1.24] },
    },
    시그니처: {
      5: { from: 25, probs: [91.53, 83.24, 71.58, 58.0, 44.29, 31.93, 21.78, 14.08, 8.65, 5.05, 2.8, 1.48] },
    },
    골든글러브: {
      5: {
        from: 23,
        probs: [90.12, 83.01, 73.51, 62.3, 50.42, 38.92, 28.66, 20.13, 13.48, 8.61, 5.25, 3.05, 1.69, 0.89, 0.45],
      },
    },
    국가대표: {
      5: { from: 18, probs: [91.64, 84.27, 73.94, 61.43, 48.19, 35.66, 24.88, 16.37, 10.15, 5.94, 3.27, 1.7] },
    },
    "라이브 올스타": {
      5: {
        from: 28,
        probs: [
          88.94, 82.0, 73.31, 63.05, 52.15, 41.47, 31.7, 23.29, 16.45, 11.15, 7.29, 4.57, 2.75, 1.59, 0.88, 0.47, 0.24,
          0.12,
        ],
      },
    },
  },
};

// 목표 확률 이상으로 나오는 값 중 가장 큰 값 (확률은 값이 커질수록 줄어든다)
export function valueAtProb(table: RedistTable, targetPct: number): number {
  let value = table.from - 1;
  table.probs.forEach((p, i) => {
    if (p >= targetPct) value = table.from + i;
  });
  return value;
}

export interface Training {
  core: number;
  total: number;
  estimated: boolean; // 확률표 없이 추정한 값인지 (화면에 "추정" 표시용)
}

// 추정 기준 카드. 표가 있는 카드로 검증해 보면 같은 확률에서 "핵심 합 ÷ 훈련 총량"이
// 카드 종류와 무관하게 거의 일정해서(10% 기준 타자 약 0.6, 투수 약 0.41), 기준 카드 값에 총량 비율을 곱한다.
// 시그니처는 재분배 방식이 달라 기준으로 쓰지 않는다.
// 10% 기준 오차(실제 → 추정): 타자 임팩 33→32, 국대 36→40 / 투수 임팩 23→22, 국대 26→27, 올스타 37→37
const ESTIMATE_BASE = { type: "골든글러브", grade: 5 } as const;

// 최대 훈련 + 재분배를 목표 확률 수준까지 돌렸다고 가정했을 때 더해지는 양
export function trainingBonus(role: Role, type: CardType, grade: Grade, targetPct: number): Training {
  const level = TRAINING_MAX_LEVEL[type][grade] ?? 0;
  const total = level * POINTS_PER_LEVEL;

  const own = REDIST_TABLE[role][type]?.[grade];
  if (own) return { core: valueAtProb(own, targetPct), total, estimated: false };

  const base = REDIST_TABLE[role][ESTIMATE_BASE.type]![ESTIMATE_BASE.grade]!;
  const baseLevel = TRAINING_MAX_LEVEL[ESTIMATE_BASE.type][ESTIMATE_BASE.grade]!;
  const core = Math.round((valueAtProb(base, targetPct) * level) / baseLevel);
  return { core, total, estimated: true };
}
