import { gradeBonus, type BonusTable } from "./bonusTable";
import type { Training } from "./training";
import {
  CORE_STAT_KEYS,
  STAT_KEYS,
  type CardInput,
  type CommonCondition,
  type Role,
  type Stats,
} from "./types";

// 점수가 구간 하한 이상인 구간 중 가장 높은 구간의 보너스
function setDeckBonus(tiers: BonusTable["setDeck"][Role], score: number): Stats {
  let bonus: Stats = {};
  for (const tier of tiers) {
    if (score >= tier.minScore) bonus = tier.bonus;
  }
  return bonus;
}

// 입력 능력치에 모든 보너스를 더한 최종 능력치.
// 사용자가 입력하지 않은 스탯은 결과에서도 비워 둔다 (보너스만으로 값을 만들어내지 않기 위해).
export function normalize(
  role: Role,
  card: CardInput,
  cond: CommonCondition,
  table: BonusTable,
): Stats {
  const typeBonus = gradeBonus(table, role, card.type, card.grade);
  const bonuses: (Stats | null | undefined)[] = [
    typeBonus.enhance[card.enhanceLevel],
    card.awakened ? typeBonus.awaken : null,
    setDeckBonus(table.setDeck[role], cond.setDeckScore),
    table.locker[role][cond.lockerLevel],
    table.position[role][cond.positionLevel],
  ];

  const result: Stats = {};
  for (const key of STAT_KEYS[role]) {
    const base = card.base[key];
    if (base === undefined) continue;
    result[key] = bonuses.reduce((sum, b) => sum + (b?.[key] ?? 0), base);
  }
  return result;
}

// 필요한 스탯이 하나라도 비어 있으면 null — 일부만 더한 합계끼리 비교하면 순위가 왜곡되기 때문.
function sum(stats: Stats, keys: readonly (keyof Stats)[]): number | null {
  let total = 0;
  for (const key of keys) {
    const v = stats[key];
    if (v === undefined) return null;
    total += v;
  }
  return total;
}

// 훈련은 어느 스탯에 오를지 무작위라 스탯별로 더하지 않고 합계에만 더한다.
export function score(role: Role, stats: Stats, training: Training) {
  const core = sum(stats, CORE_STAT_KEYS[role]);
  const total = sum(stats, STAT_KEYS[role]);
  return {
    core: core === null ? null : core + training.core,
    total: total === null ? null : total + training.total,
  };
}
