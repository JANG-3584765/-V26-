import { valueAtProb, type RedistTable } from "./training";
import { CORE_STAT_KEYS, type CardType, type Role } from "./types";

// 특훈(포지션 특훈과 별개): 특훈 1회마다 고른 스탯에 +1, 그리고 "추가 능력치 개수"만큼
// 6개 스탯 중 하나에 각각 +1이 붙는다 (스탯마다 1/6, 독립 시행, 중복 가능).
// 공식 확률 (게임 공지):
//   추가 개수   임팩트(FA 포함)   시즌·국가대표·시그니처(FA 포함)·골든글러브
//   +1 GOOD       50%               33.34%
//   +2 GREAT      50%               33.33%
//   +3 PERFECT     -                33.33%
// 재훈련은 같은 확률로 다시 정하고, 재훈련권을 쓰면 추가 개수가 고정된다 (임팩트 +2, 나머지 +3).
// 커뮤니티 재설정표 5종을 이 규칙으로 재현한다 (special.test.ts).
//
// ※ 지금 화면에서는 쓰지 않는다. 특훈은 사용자가 게임에서 본 값을 스탯별로 직접 입력한다 (compare.ts cardSpecial).
//   재훈련 확률·기대 횟수 기능을 다시 쓰게 되면 여기서 가져다 쓴다.

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

// FA: 필요할 때 추가로 하는 특훈 5회. 임팩트·시그니처만 할 수 있다.
export const FA_COUNT = 5;
export const canFA = (type: CardType) => type === "임팩트" || type === "시그니처";

// [추가 개수, 확률]
type ExtraDist = [number, number][];
const IMPACT_EXTRA: ExtraDist = [
  [1, 0.5],
  [2, 0.5],
];
const OTHER_EXTRA: ExtraDist = [
  [1, 0.3334],
  [2, 0.3333],
  [3, 0.3333],
];
const extraDist = (type: CardType, ticket: boolean): ExtraDist => {
  const impact = type === "임팩트";
  if (ticket) return [[impact ? 2 : 3, 1]];
  return impact ? IMPACT_EXTRA : OTHER_EXTRA;
};

const binom = (n: number, k: number, p: number) => {
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return c * p ** k * (1 - p) ** (n - k);
};
// 두 분포를 합친 분포 (합성곱)
const convolve = (a: number[], b: number[]) => {
  const r = new Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => (r[i + j] += x * y)));
  return r;
};

// 특훈 count회의 무작위 추가분 중 핵심 스탯에 들어간 합이 x 이상일 확률(%) 표.
// 추가분 하나가 핵심 스탯에 들어갈 확률 q = 핵심 스탯 수 / 6 (타자 파정선 1/2, 투수 변구 1/3).
export function specialProbs(count: number, dist: ExtraDist, q: number): number[] {
  // 1회 분포: 핵심 스탯에 0 ~ (회당 최대 추가 개수)개가 들어갈 확률
  const once = new Array(Math.max(...dist.map(([k]) => k)) + 1).fill(0);
  for (const [k, w] of dist) for (let j = 0; j <= k; j++) once[j] += w * binom(k, j, q);
  let exact = [1];
  for (let i = 0; i < count; i++) exact = convolve(exact, once);
  const atLeast: number[] = [];
  let acc = 0;
  for (let x = exact.length - 1; x >= 0; x--) {
    acc += exact[x];
    atLeast[x] = acc * 100;
  }
  return atLeast;
}

// 카드에 적용할 특훈 횟수와 확률표 (특훈 불가 카드는 table null)
export function specialSpec(
  role: Role,
  type: CardType,
  fa = false,
  ticket = false,
): { table: RedistTable | null; count: number } {
  const count = fa && canFA(type) ? FA_COUNT : SPECIAL_COUNT[type];
  if (count === 0) return { table: null, count };
  const q = CORE_STAT_KEYS[role].length / 6;
  return { table: { from: 0, probs: specialProbs(count, extraDist(type, ticket), q) }, count };
}

// 특훈으로 핵심 스탯에 오르는 양 = 횟수(고른 스탯 +1, 핵심을 고른다고 가정) + 무작위 추가분
export const specialCore = (count: number, extra: number) => count + extra;

// 목표 확률 내외의 무작위 추가분 (특훈 불가 카드는 0)
export function defaultSpecialExtra(role: Role, type: CardType, fa: boolean, ticket: boolean, targetPct: number): number {
  const { table } = specialSpec(role, type, fa, ticket);
  return table ? valueAtProb(table, targetPct) : 0;
}
