import { describe, expect, it } from "vitest";
import { redistProbs } from "./redistModel";
import { POINTS_PER_LEVEL, REDIST_TABLE, TRAINING_MAX_LEVEL } from "./training";

// 커뮤니티에 공유된 확률표 (포인트 = 최대 훈련 레벨 × 3)
const COMMUNITY = [
  { name: "타자 임팩", points: 54, dump: 1, core: 3, from: 25, probs: [94.74, 89.72, 81.86, 71.06, 58.07, 44.41, 31.66, 21.02, 12.99, 7.46, 3.98, 1.97] },
  { name: "타자 시그", points: 75, dump: 2, core: 3, from: 39, probs: [92.38, 85.1, 74.48, 61.32, 47.31, 34.15, 23.08, 14.63, 8.72, 4.89, 2.59, 1.29] },
  { name: "타자 골글", points: 75, dump: 1, core: 3, from: 36, probs: [91.15, 85.22, 77.09, 66.98, 55.6, 43.95, 33.04, 23.6, 16.01, 10.32, 6.31, 3.67, 2.02, 1.06, 0.52] },
  { name: "타자 국대(업데이트 전 20레벨)", points: 60, dump: 1, core: 3, from: 28, probs: [94.3, 89.31, 81.72, 71.46, 59.2, 46.2, 33.86, 23.28, 15.01, 9.07, 5.13, 2.72] },
  { name: "투수 임팩", points: 54, dump: 1, core: 2, from: 16, probs: [92.34, 84.9, 74.15, 60.99, 47.07, 34.05, 23.07, 14.65, 8.72, 4.86, 2.54, 1.24] },
  { name: "투수 시그", points: 75, dump: 2, core: 2, from: 25, probs: [91.53, 83.24, 71.58, 58.0, 44.29, 31.93, 21.78, 14.08, 8.65, 5.05, 2.8, 1.48] },
  { name: "투수 골글", points: 75, dump: 1, core: 2, from: 23, probs: [90.12, 83.01, 73.51, 62.3, 50.42, 38.92, 28.66, 20.13, 13.48, 8.61, 5.25, 3.05, 1.69, 0.89, 0.45] },
  { name: "투수 국대(업데이트 전 20레벨)", points: 60, dump: 1, core: 2, from: 18, probs: [91.64, 84.27, 73.94, 61.43, 48.19, 35.66, 24.88, 16.37, 10.15, 5.94, 3.27, 1.7] },
  { name: "투수 올스타", points: 90, dump: 1, core: 2, from: 28, probs: [88.94, 82.0, 73.31, 63.05, 52.15, 41.47, 31.7, 23.29, 16.45, 11.15, 7.29, 4.57, 2.75, 1.59, 0.88, 0.47, 0.24, 0.12] },
];

// REDIST_TABLE에서 [모델]로 채운 표 (포인트 = 최대 훈련 레벨 × 3)
const MODELED = [
  { role: "batter", type: "라이브 올스타", dump: 1, core: 3 },
  { role: "batter", type: "라이브", dump: 1, core: 3 },
  { role: "batter", type: "시즌", dump: 1, core: 3 },
  { role: "batter", type: "국가대표", dump: 1, core: 3 },
  { role: "pitcher", type: "국가대표", dump: 1, core: 2 },
  { role: "pitcher", type: "라이브", dump: 1, core: 2 },
  { role: "pitcher", type: "시즌", dump: 1, core: 2 },
] as const;

describe("redistProbs", () => {
  it.each(COMMUNITY)("$name: 커뮤니티 확률표를 반올림 오차 안에서 재현한다", ({ points, dump, core, from, probs }) => {
    const model = redistProbs(points, dump, core);
    // 올스타 표는 원본이 근사값이라 최대 0.12%p 차이가 나서 0.15%p까지 허용한다
    probs.forEach((p, i) => expect(Math.abs(model[from + i] - p)).toBeLessThan(0.15));
  });

  it.each(MODELED)("$role $type: REDIST_TABLE 값이 모델 계산(소수 둘째 자리 반올림)과 같다", ({ role, type, dump, core }) => {
    const model = redistProbs(TRAINING_MAX_LEVEL[type] * POINTS_PER_LEVEL, dump, core);
    const { from, probs } = REDIST_TABLE[role][type];
    probs.forEach((p, i) => expect(p).toBe(Math.round(model[from + i] * 100) / 100));
  });
});
