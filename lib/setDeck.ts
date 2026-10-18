import { canPotm } from "./potm";
import { STAT_KEYS, type CardInput, type CardType, type CommonCondition, type Role, type Stats } from "./types";

// 세트덱 스코어 단계별 효과. 단계마다 두 효과 중 하나를 고른다.
// 출처: 커뮤니티 세트덱 포인트 가이드 (2025-03) https://gall.dcinside.com/mgallery/board/view/?id=cpyv22&no=649224
// 기본 선택(rec) = 글에서 굵게 표시된 쪽, 없으면 화살표로 추천한 쪽.
// 선택팀 소속은 항상 만족한다고 본다 (골글은 6장까지 소속 인정, 실사용 덱의 대부분).

export type Lineup = "top" | "middle" | "bottom"; // 상위 1~2 / 중심 3~5 / 하위 6~9번
export type Position = "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "DH";
export type PitcherRole = "starter" | "bullpen";

export const POSITIONS: { value: Position; label: string }[] = [
  { value: "C", label: "포수" },
  { value: "1B", label: "1루" },
  { value: "2B", label: "2루" },
  { value: "3B", label: "3루" },
  { value: "SS", label: "유격" },
  { value: "LF", label: "좌익" },
  { value: "CF", label: "중견" },
  { value: "RF", label: "우익" },
  { value: "DH", label: "지명" },
];
const INFIELD: Position[] = ["C", "1B", "2B", "3B", "SS"];
export const LINEUPS: { value: Lineup; label: string }[] = [
  { value: "top", label: "상위" },
  { value: "middle", label: "중심" },
  { value: "bottom", label: "하위" },
];
export const PITCHER_ROLES: { value: PitcherRole; label: string }[] = [
  { value: "starter", label: "선발" },
  { value: "bullpen", label: "불펜" },
];

// 효과 조건을 판단하는 데 필요한 카드 정보
export interface CardContext {
  type: CardType;
  year: boolean; // 연도덱 해당 여부
  lineup: Lineup;
  infield: boolean; // 내야·포수 (아니면 외야·지명)
  starter: boolean;
  potm: boolean; // 이달의 선수
}

export function cardContext(card: CardInput, cond: CommonCondition): CardContext {
  return {
    type: card.type,
    // 임팩트는 모든 연도에 해당한다. 나머지는 카드별 설정, 없으면 일괄 설정을 따른다.
    year: card.type === "임팩트" || (card.yearMatch ?? cond.yearMatchAll),
    lineup: card.lineup ?? "middle",
    infield: INFIELD.includes(card.position ?? "DH"),
    starter: (card.pitcherRole ?? "starter") === "starter",
    potm: !!card.potm && canPotm(card.type),
  };
}

// 효과: 역할별로 오르는 스탯. 키가 없는 역할은 받지 못한다 (예: "타자+1"은 투수에게 없음).
type Effect = Partial<Record<Role, Stats>>;
const allStats = (role: Role, n: number): Stats => Object.fromEntries(STAT_KEYS[role].map((k) => [k, n]));
const all = (n: number): Effect => ({ batter: allStats("batter", n), pitcher: allStats("pitcher", n) });
const batter = (s: Stats | number): Effect => ({ batter: typeof s === "number" ? allStats("batter", s) : s });
const pitcher = (s: Stats | number): Effect => ({ pitcher: typeof s === "number" ? allStats("pitcher", s) : s });

interface Option {
  label: string;
  when?: (c: CardContext) => boolean; // 없으면 해당 역할 전원
  effect: Effect;
}
export interface Tier {
  score: number;
  options: [Option, Option];
  rec: 0 | 1;
}

// 카드 종류 조건
const is = (...types: CardType[]) => (c: CardContext) => types.includes(c.type);
// 스페셜: 임팩트·국가대표·시그니처·골든글러브, 그리고 이달의 선수로 선정된 라이브
const special = (c: CardContext) => is("임팩트", "국가대표", "시그니처", "골든글러브")(c) || (c.type === "라이브" && c.potm);
const regular = (c: CardContext) => !special(c);
const fourStar = is("임팩트"); // 지금 다루는 카드 중 4성은 임팩트뿐 (3성 카드는 비교 대상이 아니다)
const fiveStar = (c: CardContext) => c.type !== "임팩트";
const never = () => false;
const year = (c: CardContext) => c.year;

export const SET_DECK_TIERS: Tier[] = [
  { score: 30, rec: 0, options: [{ label: "선택팀 +1", effect: all(1) }, { label: "스페셜 +1", when: special, effect: all(1) }] },
  { score: 40, rec: 0, options: [{ label: "타자 +1", effect: batter(1) }, { label: "투수 +1", effect: pitcher(1) }] },
  { score: 50, rec: 1, options: [{ label: "시즌·라이브·올스타 +1", when: regular, effect: all(1) }, { label: "스페셜 +1", when: special, effect: all(1) }] },
  { score: 55, rec: 1, options: [
    { label: "연도타자 주루·수비 +2", when: year, effect: batter({ 주루: 2, 수비: 2 }) },
    { label: "연도투수 변화·지구력 +2", when: year, effect: pitcher({ 변화: 2, 지구력: 2 }) },
  ] },
  { score: 60, rec: 0, options: [{ label: "타자 +1", effect: batter(1) }, { label: "투수 +1", effect: pitcher(1) }] },
  { score: 65, rec: 1, options: [
    { label: "3성 +2", when: never, effect: all(2) },
    { label: "4성 (타자 정확·인내 / 투수 구속·제구 +2)", when: fourStar, effect: { batter: { 정확: 2, 인내: 2 }, pitcher: { 구속: 2, 제구: 2 } } },
  ] },
  { score: 70, rec: 0, options: [
    { label: "선발 +1", when: (c) => c.starter, effect: pitcher(1) },
    { label: "불펜 +2", when: (c) => !c.starter, effect: pitcher(2) },
  ] },
  { score: 75, rec: 0, options: [
    { label: "연도타자 파워·정확 +3", when: year, effect: batter({ 파워: 3, 정확: 3 }) },
    { label: "연도투수 구위·제구 +2", when: year, effect: pitcher({ 구위: 2, 제구: 2 }) },
  ] },
  // 오버롤 65 이상 카드만 받지만, 비교할 만한 카드는 사실상 모두 해당해 조건 없이 적용한다
  { score: 80, rec: 0, options: [{ label: "오버롤 65↑ 타자 +1", effect: batter(1) }, { label: "오버롤 65↑ 투수 +1", effect: pitcher(1) }] },
  { score: 85, rec: 0, options: [
    { label: "4성 (타자 파정선 / 투수 구위·제구·변화 +2)", when: fourStar, effect: { batter: { 파워: 2, 정확: 2, 선구: 2 }, pitcher: { 구위: 2, 제구: 2, 변화: 2 } } },
    { label: "5성 (파워 / 구위 +1)", when: fiveStar, effect: { batter: { 파워: 1 }, pitcher: { 구위: 1 } } },
  ] },
  { score: 90, rec: 0, options: [{ label: "선택팀 +2", effect: all(2) }, { label: "스페셜 +2", when: special, effect: all(2) }] },
  { score: 95, rec: 1, options: [
    { label: "내야·포수 인내·수비 +2", when: (c) => c.infield, effect: batter({ 인내: 2, 수비: 2 }) },
    { label: "외야·지명 선구·주루 +2", when: (c) => !c.infield, effect: batter({ 선구: 2, 주루: 2 }) },
  ] },
  { score: 100, rec: 0, options: [{ label: "타자 +1", effect: batter(1) }, { label: "투수 +1", effect: pitcher(1) }] },
  { score: 105, rec: 1, options: [
    { label: "3성 +2", when: never, effect: all(2) },
    { label: "4성 (타자 파워·선구 / 투수 구위·변화 +2)", when: fourStar, effect: { batter: { 파워: 2, 선구: 2 }, pitcher: { 구위: 2, 변화: 2 } } },
  ] },
  // 드림(두산·롯데·삼성·SSG·KT) / 나눔(KIA·한화·LG·NC·키움): 선택팀처럼 소속 팀 선수가 받는다 (골글은 6장까지 소속 인정)
  { score: 110, rec: 0, options: [{ label: "드림 +1", effect: all(1) }, { label: "나눔 +1", effect: all(1) }] },
  { score: 115, rec: 1, options: [
    { label: "하위타선 정확·주루·수비 +2", when: (c) => c.lineup === "bottom", effect: batter({ 정확: 2, 주루: 2, 수비: 2 }) },
    { label: "불펜 제구·구위·지구력 +2", when: (c) => !c.starter, effect: pitcher({ 제구: 2, 구위: 2, 지구력: 2 }) },
  ] },
  { score: 120, rec: 0, options: [
    { label: "중심타선 +2", when: (c) => c.lineup === "middle", effect: batter(2) },
    { label: "선발 +1", when: (c) => c.starter, effect: pitcher(1) },
  ] },
  { score: 125, rec: 0, options: [
    { label: "4성 (타자 정확·선구·인내 / 투수 구속·변화·구위 +2)", when: fourStar, effect: { batter: { 정확: 2, 선구: 2, 인내: 2 }, pitcher: { 구속: 2, 변화: 2, 구위: 2 } } },
    { label: "5성 (타자 인내 / 투수 제구 +1)", when: fiveStar, effect: { batter: { 인내: 1 }, pitcher: { 제구: 1 } } },
  ] },
  { score: 130, rec: 1, options: [{ label: "시즌·라이브·올스타 +1", when: regular, effect: all(1) }, { label: "스페셜 +1", when: special, effect: all(1) }] },
  { score: 135, rec: 1, options: [
    { label: "중심타선 정확·주루·수비 +2", when: (c) => c.lineup === "middle", effect: batter({ 정확: 2, 주루: 2, 수비: 2 }) },
    { label: "선발 제구·구위·지구력 +1", when: (c) => c.starter, effect: pitcher({ 제구: 1, 구위: 1, 지구력: 1 }) },
  ] },
  { score: 140, rec: 1, options: [
    { label: "하위타선 +1", when: (c) => c.lineup === "bottom", effect: batter(1) },
    { label: "불펜 +1", when: (c) => !c.starter, effect: pitcher(1) },
  ] },
  { score: 145, rec: 1, options: [
    { label: "상위타선 정확·선구·주루 +2", when: (c) => c.lineup === "top", effect: batter({ 정확: 2, 선구: 2, 주루: 2 }) },
    { label: "선발 제구·구위·지구력 +1", when: (c) => c.starter, effect: pitcher({ 제구: 1, 구위: 1, 지구력: 1 }) },
  ] },
  { score: 150, rec: 0, options: [{ label: "선택팀 +2", effect: all(2) }, { label: "스페셜 +2", when: special, effect: all(2) }] },
  { score: 155, rec: 0, options: [
    { label: "상위타선 파워·선구·인내 +2", when: (c) => c.lineup === "top", effect: batter({ 파워: 2, 선구: 2, 인내: 2 }) },
    { label: "선발 구속·변화·수비 +1", when: (c) => c.starter, effect: pitcher({ 구속: 1, 변화: 1, 수비: 1 }) },
  ] },
  { score: 160, rec: 0, options: [
    { label: "타자 정확·주루·수비 +1", effect: batter({ 정확: 1, 주루: 1, 수비: 1 }) },
    { label: "투수 구속·변화·수비 +1", effect: pitcher({ 구속: 1, 변화: 1, 수비: 1 }) },
  ] },
  { score: 165, rec: 1, options: [
    { label: "타자 정확·주루·수비 +1", effect: batter({ 정확: 1, 주루: 1, 수비: 1 }) },
    { label: "투수 구속·변화·수비 +1", effect: pitcher({ 구속: 1, 변화: 1, 수비: 1 }) },
  ] },
  { score: 170, rec: 0, options: [{ label: "선택팀 +1", effect: all(1) }, { label: "스페셜 +1", when: special, effect: all(1) }] },
  { score: 175, rec: 0, options: [
    { label: "타자 파워·선구·인내 +1", effect: batter({ 파워: 1, 선구: 1, 인내: 1 }) },
    { label: "투수 제구·구위·지구력 +1", effect: pitcher({ 제구: 1, 구위: 1, 지구력: 1 }) },
  ] },
  { score: 180, rec: 1, options: [{ label: "라이브·올스타 +2", when: is("라이브", "라이브 올스타"), effect: all(2) }, { label: "연도타자 +1", when: year, effect: batter(1) }] },
  { score: 185, rec: 1, options: [
    { label: "상위타선 파워·주루 +2", when: (c) => c.lineup === "top", effect: batter({ 파워: 2, 주루: 2 }) },
    { label: "연도타자 +1", when: year, effect: batter(1) },
  ] },
  { score: 190, rec: 1, options: [
    { label: "선발 구위·지구력 +1", when: (c) => c.starter, effect: pitcher({ 구위: 1, 지구력: 1 }) },
    { label: "연도투수 +1", when: year, effect: pitcher(1) },
  ] },
  { score: 195, rec: 1, options: [
    { label: "라이브·국대·올스타 +1", when: is("라이브", "국가대표", "라이브 올스타"), effect: all(1) },
    { label: "선택팀 시그니처 +1", when: is("시그니처"), effect: all(1) },
  ] },
  { score: 200, rec: 0, options: [{ label: "타자 +2", effect: batter(2) }, { label: "투수 +2", effect: pitcher(2) }] },
];

export const MAX_SET_DECK_SCORE = 200;
export const DEFAULT_PICKS = SET_DECK_TIERS.map((t) => t.rec);

// 스코어까지 열린 단계에서 고른 효과 중, 이 카드가 조건을 만족하는 것만 더한다
export function setDeckBonus(role: Role, card: CardInput, cond: CommonCondition): Stats {
  const ctx = cardContext(card, cond);
  const total: Stats = {};
  SET_DECK_TIERS.forEach((tier, i) => {
    if (tier.score > cond.setDeckScore) return;
    const option = tier.options[cond.setDeckPicks[i] ?? tier.rec];
    const stats = option.effect[role];
    if (!stats || (option.when && !option.when(ctx))) return;
    for (const [k, v] of Object.entries(stats) as [keyof Stats, number][]) total[k] = (total[k] ?? 0) + v;
  });
  return total;
}
