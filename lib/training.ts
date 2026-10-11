import { CORE_STAT_KEYS, type CardType, type Role, type Stats } from "./types";

// 최대 훈련 레벨 = 기본 훈련 + 훈련 돌파
export const TRAINING_MAX_LEVEL: Record<CardType, number> = {
  라이브: 25,
  시즌: 20,
  임팩트: 18,
  시그니처: 25,
  골든글러브: 25,
  국가대표: 22,
  "라이브 올스타": 30,
};

// 훈련 1레벨마다 6개 스탯 중 무작위로 총 3이 오른다 (중복 가능). 재분배해도 총량은 같다.
export const POINTS_PER_LEVEL = 3;

// 훈련 재분배 1회에서 핵심 스탯(타자 파정선, 투수 구변)으로 간 훈련 포인트 합이
// from + i 이상 나올 확률(%) = probs[i].
// 커뮤니티에 공유된 확률표를 옮겼고, 표가 없던 카드는 같은 규칙의 확률 모델(redistModel.ts)로 계산해 채웠다.
export interface RedistTable {
  from: number;
  probs: number[];
}

// [모델] 표시가 붙은 표는 redistModel.ts로 계산한 값 (redistModel.test.ts에서 모델과 일치하는지 검사)
// 국가대표는 업데이트로 최대 22레벨이 되어, 20레벨 기준이던 커뮤니티 표 대신 모델 값을 쓴다.
export const REDIST_TABLE: Record<Role, Record<CardType, RedistTable>> = {
  batter: {
    임팩트: { from: 25, probs: [94.74, 89.72, 81.86, 71.06, 58.07, 44.41, 31.66, 21.02, 12.99, 7.46, 3.98, 1.97] },
    시그니처: { from: 39, probs: [92.38, 85.1, 74.48, 61.32, 47.31, 34.15, 23.08, 14.63, 8.72, 4.89, 2.59, 1.29] },
    골든글러브: {
      from: 36,
      probs: [91.15, 85.22, 77.09, 66.98, 55.6, 43.95, 33.04, 23.6, 16.01, 10.32, 6.31, 3.67, 2.02, 1.06, 0.52],
    },
    // [모델]
    국가대표: {
      from: 31,
      probs: [93.9, 88.94, 81.59, 71.81, 60.16, 47.76, 35.81, 25.34, 16.91, 10.65, 6.32, 3.53, 1.86, 0.92, 0.43, 0.19],
    },
    // [모델]
    "라이브 올스타": {
      from: 43,
      probs: [92.55, 87.79, 81.21, 72.82, 62.99, 52.39, 41.81, 31.99, 23.46, 16.48, 11.09, 7.15, 4.42, 2.62, 1.48, 0.8, 0.42, 0.21],
    },
    // [모델] 골든글러브와 같은 75포인트라 표도 같다
    라이브: {
      from: 36,
      probs: [91.15, 85.22, 77.09, 66.98, 55.6, 43.95, 33.04, 23.6, 16.01, 10.32, 6.31, 3.67, 2.02, 1.06, 0.52, 0.24, 0.11],
    },
    // [모델] 업데이트 전(20레벨) 국가대표 커뮤니티 표와 같은 60포인트 기준
    시즌: {
      from: 28,
      probs: [94.3, 89.31, 81.72, 71.46, 59.2, 46.2, 33.86, 23.28, 15.01, 9.07, 5.13, 2.72, 1.34, 0.62, 0.27, 0.11],
    },
  },
  pitcher: {
    임팩트: { from: 16, probs: [92.34, 84.9, 74.15, 60.99, 47.07, 34.05, 23.07, 14.65, 8.72, 4.86, 2.54, 1.24] },
    시그니처: { from: 25, probs: [91.53, 83.24, 71.58, 58.0, 44.29, 31.93, 21.78, 14.08, 8.65, 5.05, 2.8, 1.48] },
    골든글러브: {
      from: 23,
      probs: [90.12, 83.01, 73.51, 62.3, 50.42, 38.92, 28.66, 20.13, 13.48, 8.61, 5.25, 3.05, 1.69, 0.89, 0.45],
    },
    // [모델]
    국가대표: {
      from: 20,
      probs: [91, 83.72, 73.75, 61.81, 49.17, 37.08, 26.5, 17.95, 11.53, 7.02, 4.05, 2.21, 1.15, 0.56, 0.26, 0.11],
    },
    "라이브 올스타": {
      from: 28,
      probs: [
        88.94, 82.0, 73.31, 63.05, 52.15, 41.47, 31.7, 23.29, 16.45, 11.15, 7.29, 4.57, 2.75, 1.59, 0.88, 0.47, 0.24, 0.12,
      ],
    },
    // [모델]
    라이브: {
      from: 22,
      probs: [94.83, 90.12, 83.01, 73.51, 62.3, 50.42, 38.92, 28.66, 20.13, 13.48, 8.61, 5.25, 3.05, 1.69, 0.89, 0.45, 0.21],
    },
    // [모델]
    시즌: {
      from: 18,
      probs: [91.64, 84.27, 73.94, 61.43, 48.19, 35.66, 24.88, 16.37, 10.15, 5.94, 3.27, 1.7, 0.83, 0.38, 0.17],
    },
  },
};

// 확률이 목표에 가장 가까운 값. 차이가 같으면 확률이 높은(값이 작은) 쪽을 고른다.
export function valueAtProb(table: RedistTable, targetPct: number): number {
  let best = 0;
  table.probs.forEach((p, i) => {
    if (Math.abs(p - targetPct) < Math.abs(table.probs[best] - targetPct)) best = i;
  });
  return table.from + best;
}

export interface Training {
  core: number;
  total: number;
}

export interface CoreProb {
  pct: number;
  cmp: "=" | ">" | "<"; // 표 범위를 벗어나면 끝값보다 크다/작다로 표시
  table: RedistTable;
}

// valueAtProb의 반대: 핵심 합이 주어졌을 때 재분배 1회에 그 값 이상이 나올 확률
export function probOfCore(role: Role, type: CardType, core: number): CoreProb {
  const table = REDIST_TABLE[role][type];
  const i = core - table.from;
  if (i < 0) return { pct: table.probs[0], cmp: ">", table };
  if (i >= table.probs.length) return { pct: table.probs[table.probs.length - 1], cmp: "<", table };
  return { pct: table.probs[i], cmp: "=", table };
}

// 최대 훈련 + 재분배 결과가 목표 확률 수준일 때의 핵심 합과 총량
export function trainingBonus(role: Role, type: CardType, targetPct: number): Training {
  return {
    core: valueAtProb(REDIST_TABLE[role][type], targetPct),
    total: TRAINING_MAX_LEVEL[type] * POINTS_PER_LEVEL,
  };
}

// 핵심 합을 핵심 스탯에 균등하게 나누고, 나누어떨어지지 않는 나머지는 가장 중요하게 보는 스탯에 더한다.
// 예) 타자 핵심 47 → 파워 17·정확 15·선구 15
const REMAINDER_TO = { batter: "파워", pitcher: "구위" } as const;

export function distribute(role: Role, core: number): Stats {
  const keys = CORE_STAT_KEYS[role];
  const each = Math.floor(core / keys.length);
  const result: Stats = Object.fromEntries(keys.map((k) => [k, each]));
  result[REMAINDER_TO[role]] = each + (core % keys.length);
  return result;
}
