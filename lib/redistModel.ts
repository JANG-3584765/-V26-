// 훈련 재분배 확률 모델
//
// 가정
// 1. 훈련 포인트 N개가 6개 스탯에 하나씩, 각각 1/6 확률로 들어간다 (레벨당 3포인트, 중복 가능).
// 2. 재분배하면 6개 묶음 중 가장 작은 묶음 dump개가 사용자가 고른 버릴 스탯(주루·수비 등)으로 가고,
//    나머지 묶음은 남은 스탯에 무작위로 배정된다. 시그니처는 2개, 나머지 카드는 1개를 고른다.
// 3. 핵심 합 = 핵심 스탯(타자 3개, 투수 2개)에 배정된 묶음의 합.
//
// 커뮤니티 확률표 9개를 0.15%p 이내로 재현한다 (redistModel.test.ts).

const STATS = 6;

// 0..n 의 log(n!) — 큰 수의 다항계수를 안전하게 계산하려고 로그로 다룬다
function logFactorials(n: number): number[] {
  const lf = [0];
  for (let i = 1; i <= n; i++) lf.push(lf[i - 1] + Math.log(i));
  return lf;
}

// 배열에서 k개를 고르는 모든 조합의 합 목록
function subsetSums(values: number[], k: number): number[] {
  if (k === 0) return [0];
  if (values.length < k) return [];
  const [head, ...tail] = values;
  return [...subsetSums(tail, k - 1).map((s) => s + head), ...subsetSums(tail, k)];
}

// 재분배 1회에서 핵심 합이 x 이상일 확률(%)을 x별로 돌려준다
export function redistProbs(points: number, dump: number, core: number): number[] {
  const lf = logFactorials(points);
  const exact = new Array(points + 1).fill(0); // exact[x] = P(핵심 합 = x)

  // 6개 묶음을 크기 오름차순으로 나열한 경우(분할)만 훑고, 같은 분할이 나오는 순서의 수를 곱한다.
  // 순서까지 다 훑는 것보다 경우의 수가 수백 배 적다.
  const parts: number[] = [];
  const walk = (remaining: number, slots: number, min: number) => {
    if (slots === 1) {
      if (remaining < min) return;
      parts.push(remaining);
      add(parts);
      parts.pop();
      return;
    }
    for (let v = min; v * slots <= remaining; v++) {
      parts.push(v);
      walk(remaining - v, slots - 1, v);
      parts.pop();
    }
  };

  const add = (sorted: number[]) => {
    // 이 크기 조합이 나올 확률 = 순서 수 × 다항분포 확률
    let logP = lf[points] - points * Math.log(STATS);
    for (const c of sorted) logP -= lf[c];
    let orderings = lf[STATS];
    const counts = new Map<number, number>();
    for (const c of sorted) counts.set(c, (counts.get(c) ?? 0) + 1);
    for (const m of counts.values()) orderings -= lf[m];
    const p = Math.exp(logP + orderings);

    // 작은 묶음 dump개를 버리고, 남은 묶음 중 core개가 핵심 스탯에 갈 확률은 모두 같다
    const sums = subsetSums(sorted.slice(dump), core);
    for (const s of sums) exact[s] += p / sums.length;
  };

  walk(points, STATS, 0);

  // P(합 ≥ x) 로 바꾸고 %로
  const atLeast = new Array(points + 1).fill(0);
  let acc = 0;
  for (let x = points; x >= 0; x--) {
    acc += exact[x];
    atLeast[x] = acc * 100;
  }
  return atLeast;
}
