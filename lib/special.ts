import { valueAtProb, type RedistTable } from "./training";
import type { CardType } from "./types";

// 특훈(포지션 특훈과 별개): 6개 스탯 중 하나를 골라 올린다. 결과 등급에 따라
// GOOD +2 / GREAT +3 / PERFECT +4 — 고른 스탯에 +1, 나머지(1~3)는 6개 스탯에 무작위(중복 가능).
// 결과는 무제한 재설정할 수 있어서, 훈련 재분배처럼 "재설정 1회에 이 값 이상 나올 확률" 표로 기준을 잡는다.

// 카드별 특훈 횟수
export const SPECIAL_COUNT: Record<CardType, number> = {
  라이브: 0,
  국가대표: 4,
  임팩트: 3,
  시그니처: 3,
  골든글러브: 3,
  "라이브 올스타": 3,
  시즌: 3,
};

// 커뮤니티 재설정표: 무작위 추가분 중 파정(타자 파워·정확) / 변구(투수 변화·구위)에 들어간 합이
// from + i 이상일 확률(%). GOOD·GREAT·PERFECT 확률은 공개되지 않아 모델로 계산하지 않고 표를 그대로 쓴다.
// 타자는 표가 선구를 세지 않아서 선구에 들어간 특훈 포인트만큼 낮게 잡힌다.
const IMPACT: RedistTable = { from: 0, probs: [100, 82.85, 46.85, 16.5, 3.807, 0.48, 0.023] }; // 3회, 회당 추가 최대 2
const SIG_GG: RedistTable = { from: 0, probs: [100, 89.67, 62.77, 31.63, 10.99, 2.706, 0.497, 0.0623, 0.0105, 0.0014] };
const NATIONAL: RedistTable = {
  from: 0,
  probs: [100, 95.15, 78.3, 51.11, 25.82, 10.33, 3.3172, 0.9359, 0.2634, 0.1217, 0.0175, 0.0024, 0.0002],
};

// 올스타·시즌은 표가 없어 같은 3회·PERFECT까지 나오는 시그/골글 표를 쓴다 (가정)
export const SPECIAL_TABLE: Record<CardType, RedistTable | null> = {
  라이브: null,
  국가대표: NATIONAL,
  임팩트: IMPACT,
  시그니처: SIG_GG,
  골든글러브: SIG_GG,
  "라이브 올스타": SIG_GG,
  시즌: SIG_GG,
};

// FA: 필요할 때 추가로 하는 특훈, 5회 (표 최댓값과도 맞음: 임팩트 10 = 5×2, 시그니처 15 = 5×3).
// FA 재설정표가 있는 카드만 고를 수 있다.
export const FA_COUNT = 5;
export const FA_TABLE: Partial<Record<CardType, RedistTable>> = {
  임팩트: {
    from: 0,
    probs: [100, 94.71, 76.19, 47.58, 22.45, 8.163, 2.359, 0.641, 0.233, 0.159, 0.15],
  },
  시그니처: {
    from: 0,
    probs: [
      100, 97.72, 87.85, 67.72, 43.14, 23.13, 10.91, 4.743, 2.214, 1.0, 0.448, 0.149, 0.043, 0.00841504, 0.00127723,
      0.00002868,
    ],
  },
};

export const canFA = (type: CardType) => FA_TABLE[type] !== undefined;

// 카드에 적용할 재설정표와 특훈 횟수 (FA를 켰고 가능한 카드면 FA 기준)
export function specialSpec(type: CardType, fa = false): { table: RedistTable | null; count: number } {
  const faTable = fa ? FA_TABLE[type] : undefined;
  return faTable ? { table: faTable, count: FA_COUNT } : { table: SPECIAL_TABLE[type], count: SPECIAL_COUNT[type] };
}

// 특훈으로 핵심 스탯에 오르는 양 = 횟수(고른 스탯 +1, 핵심을 고른다고 가정) + 무작위 추가분
export const specialCore = (type: CardType, fa: boolean, extra: number) => specialSpec(type, fa).count + extra;

// 목표 확률 내외의 무작위 추가분 (특훈 불가 카드는 0)
export function defaultSpecialExtra(type: CardType, fa: boolean, targetPct: number): number {
  const { table } = specialSpec(type, fa);
  return table ? valueAtProb(table, targetPct) : 0;
}
