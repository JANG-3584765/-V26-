import { BONUS_TABLE } from "./bonusTable";
import { coreScore, normalize } from "./calc";
import { positionTrainingBonus } from "./positionTraining";
import { potmBonus } from "./potm";
import { setDeckBonus } from "./setDeck";
import { distribute, trainingBonus } from "./training";
import type { CardInput, CommonCondition, Role, Stats } from "./types";

export interface ResultRow {
  index: number; // 입력 순서 (정렬 후에도 어느 카드인지 알 수 있게)
  card: CardInput;
  training: Stats; // 스탯별 훈련값
  special: Stats; // 스탯별 특훈값
  stats: Stats; // 훈련·특훈 포함 최종 능력치
  core: number | null;
}

// 카드에 적용할 스탯별 훈련값: 직접 입력한 값이 있으면 그것, 없으면 확률 기준 기본값
export function cardTraining(role: Role, card: CardInput, cond: CommonCondition): Stats {
  if (!cond.applyTraining) return {};
  if (card.customTraining) return card.customTraining;
  return distribute(role, trainingBonus(role, card.type, cond.redistTargetPct).core);
}

// 카드에 적용할 스탯별 특훈값: 사용자가 입력한 값 그대로 (입력하지 않으면 0).
// 특훈 확률 모델(special.ts)은 참고용으로 남겨 두고 비교에는 쓰지 않는다.
export const cardSpecial = (card: CardInput): Stats => card.special ?? {};

export interface BreakdownRow {
  label: string;
  stats: Stats;
}

// 최종 능력치가 어디서 얼마씩 왔는지 (게임 화면 수치와 대조할 때 어느 요소가 다른지 찾는 용도).
// 모두 더하면 compareCards의 최종 능력치와 같다. 라커룸은 수치가 아직 없어 뺐다.
export function breakdown(role: Role, card: CardInput, cond: CommonCondition): BreakdownRow[] {
  const { enhance, awaken } = BONUS_TABLE.cardType[role][card.type];
  return [
    { label: "기본", stats: card.base },
    { label: "강화", stats: enhance[card.enhanceLevel] ?? {} },
    { label: "각성", stats: awaken?.[card.awakenLevel] ?? {} },
    { label: "훈련", stats: cardTraining(role, card, cond) },
    { label: "특훈", stats: cardSpecial(card) },
    { label: "세트덱", stats: setDeckBonus(role, card, cond) },
    { label: "포지션 특훈", stats: positionTrainingBonus(role, card) },
    { label: "이달의 선수", stats: potmBonus(role, card) },
  ];
}

// 합계가 비어 있는(null) 카드는 맨 뒤로 보낸다. 합계는 항상 0 이상이라 -1로 대신한다.
const rank = (v: number | null) => v ?? -1;

// 카드별 최종 능력치·핵심 합계를 계산해 핵심 합계 내림차순으로 정렬한다.
export function compareCards(role: Role, cards: CardInput[], cond: CommonCondition): ResultRow[] {
  return cards
    .map((card, index) => {
      const training = cardTraining(role, card, cond);
      const special = cardSpecial(card);
      const stats = normalize(role, card, cond, BONUS_TABLE);
      // 입력한 스탯에만 더한다 (빈칸은 계속 빈칸)
      for (const key of Object.keys(stats) as (keyof Stats)[]) stats[key]! += (training[key] ?? 0) + (special[key] ?? 0);
      return { index, card, training, special, stats, core: coreScore(role, stats) };
    })
    .sort((a, b) => rank(b.core) - rank(a.core));
}
