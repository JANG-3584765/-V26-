import { BONUS_TABLE } from "./bonusTable";
import { normalize, score } from "./calc";
import { distribute, trainingBonus } from "./training";
import type { CardInput, CommonCondition, Role, Stats } from "./types";

export interface ResultRow {
  index: number; // 입력 순서 (정렬 후에도 어느 카드인지 알 수 있게)
  card: CardInput;
  training: Stats; // 스탯별 훈련값
  trainingEstimated: boolean; // 확률표 없이 추정한 기본값을 쓰는지
  stats: Stats; // 훈련 포함 최종 능력치
  core: number | null;
  total: number | null;
}

// 카드에 적용할 스탯별 훈련값: 직접 입력한 값이 있으면 그것, 없으면 확률 기준 기본값
export function cardTraining(role: Role, card: CardInput, cond: CommonCondition) {
  if (!cond.applyTraining) return { training: {}, estimated: false };
  if (card.customTraining) return { training: card.customTraining, estimated: false };
  const t = trainingBonus(role, card.type, card.grade, cond.redistTargetPct);
  return { training: distribute(role, t), estimated: t.estimated };
}

// 합계가 비어 있는(null) 카드는 맨 뒤로 보낸다. 합계는 항상 0 이상이라 -1로 대신한다.
const rank = (v: number | null) => v ?? -1;

// 카드별 최종 능력치·합계를 계산해 핵심 합계 → 전체 합계 순으로 정렬한다.
export function compareCards(role: Role, cards: CardInput[], cond: CommonCondition): ResultRow[] {
  return cards
    .map((card, index) => {
      const { training, estimated } = cardTraining(role, card, cond);
      const stats = normalize(role, card, cond, BONUS_TABLE);
      // 입력한 스탯에만 더한다 (빈칸은 계속 빈칸)
      for (const key of Object.keys(stats) as (keyof Stats)[]) stats[key]! += training[key] ?? 0;
      return { index, card, training, trainingEstimated: estimated, stats, ...score(role, stats) };
    })
    .sort((a, b) => rank(b.core) - rank(a.core) || rank(b.total) - rank(a.total));
}
