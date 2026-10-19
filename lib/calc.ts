import type { BonusTable } from "./bonusTable";
import { positionTrainingBonus } from "./positionTraining";
import { potmBonus } from "./potm";
import { setDeckBonus } from "./setDeck";
import {
  CORE_STAT_KEYS,
  STAT_KEYS,
  type CardInput,
  type CommonCondition,
  type Role,
  type Stats,
} from "./types";

// 입력 능력치에 모든 보너스를 더한 최종 능력치.
// 사용자가 입력하지 않은 스탯은 결과에서도 비워 둔다 (보너스만으로 값을 만들어내지 않기 위해).
export function normalize(
  role: Role,
  card: CardInput,
  cond: CommonCondition,
  table: BonusTable,
): Stats {
  const typeBonus = table.cardType[role][card.type];
  const bonuses: (Stats | null | undefined)[] = [
    typeBonus.enhance[card.enhanceLevel],
    typeBonus.awaken?.[card.awakenLevel],
    setDeckBonus(role, card, cond),
    potmBonus(role, card),
    table.locker[role][cond.lockerLevel],
    positionTrainingBonus(role, card),
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

// 핵심 합계: 타자 파워+정확+선구, 투수 변화+구위
export const coreScore = (role: Role, stats: Stats) => sum(stats, CORE_STAT_KEYS[role]);
