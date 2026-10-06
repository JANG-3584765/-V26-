import { BONUS_TABLE } from "./bonusTable";
import { normalize, score } from "./calc";
import { trainingBonus, type Training } from "./training";
import type { CardInput, CommonCondition, Role, Stats } from "./types";

export interface ResultRow {
  index: number; // 입력 순서 (정렬 후에도 어느 카드인지 알 수 있게)
  card: CardInput;
  stats: Stats; // 훈련 제외 최종 능력치
  training: Training;
  core: number | null;
  total: number | null;
}

const NO_TRAINING: Training = { core: 0, total: 0, estimated: false };

// 합계가 비어 있는(null) 카드는 맨 뒤로 보낸다. 합계는 항상 0 이상이라 -1로 대신한다.
const rank = (v: number | null) => v ?? -1;

// 카드별 최종 합계를 계산해 핵심 합계 → 전체 합계 순으로 정렬한다.
export function compareCards(role: Role, cards: CardInput[], cond: CommonCondition): ResultRow[] {
  return cards
    .map((card, index) => {
      const stats = normalize(role, card, cond, BONUS_TABLE);
      const training = cond.applyTraining
        ? trainingBonus(role, card.type, card.grade, cond.redistTargetPct)
        : NO_TRAINING;
      return { index, card, stats, training, ...score(role, stats, training) };
    })
    .sort((a, b) => rank(b.core) - rank(a.core) || rank(b.total) - rank(a.total));
}
