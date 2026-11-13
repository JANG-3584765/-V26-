import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION } from "./bonusTable";
import { DEFAULT_PICKS, setDeckBonus, SET_DECK_TIERS, YEAR_DECK_DEFAULT } from "./setDeck";
import { CORE_STAT_KEYS, type CardInput, type Role } from "./types";

const card = (over: Partial<CardInput> = {}): CardInput => ({
  name: "테스트",
  type: "시그니처",
  base: {},
  enhanceLevel: 0,
  awakenLevel: 0,
  ...over,
});

// 세트덱으로 핵심 스탯이 오르는 합
const core = (role: Role, c: CardInput, cond = DEFAULT_CONDITION) => {
  const b = setDeckBonus(role, c, cond);
  return CORE_STAT_KEYS[role].reduce((s, k) => s + (b[k] ?? 0), 0);
};

describe("세트덱 데이터", () => {
  it("30~200 사이 33단계, 스코어 오름차순", () => {
    const scores = SET_DECK_TIERS.map((t) => t.score);
    expect([scores.length, scores[0], scores.at(-1)]).toEqual([33, 30, 200]);
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
  });
});

// 기대값은 원문 단계표를 기본 선택(굵은 글씨·추천)으로 손으로 더한 값
describe("200점 기본 선택 (중심타선·지명·선발·연도 적용)", () => {
  it("타자 핵심 상승: 시그 +73 / 임팩 +86 / 올스타 +64", () => {
    expect([core("batter", card()), core("batter", card({ type: "임팩트" })), core("batter", card({ type: "라이브 올스타" }))]).toEqual([
      73, 86, 64,
    ]);
  });

  it("시그와 올스타 차이 9 = 스페셜(50·130) +6, 선택팀 시그니처(195) +3", () => {
    expect(core("batter", card()) - core("batter", card({ type: "라이브 올스타" }))).toBe(9);
  });

  // 투수 연도 덱 기본은 "없음"이라 연도 효과(55·180·190점)를 받지 않는다
  it("투수 시그 핵심(변화+구위) 상승 +25 (연도 덱 없음)", () => {
    expect(core("pitcher", card())).toBe(25);
  });

  it("투수 연도 덱을 카드 연도와 맞추면 55·180·190점 연도 효과로 +6 (→ +31)", () => {
    const cond = { ...DEFAULT_CONDITION, yearDeck: { ...DEFAULT_CONDITION.yearDeck, pitcher: 2019 } };
    expect(core("pitcher", card({ year: 2019 }), cond)).toBe(31);
  });

  // 단계마다 연도를 따로 고를 수 있다: 21년 카드는 55점(21년)만 받고 190점(19년)은 못 받는다
  it("단계별 연도: 55점 21년·190점 19년이면 21년 카드는 55점 변화 +2만 (→ +27)", () => {
    const cond = { ...DEFAULT_CONDITION, tierYears: { 55: 2021, 190: 2019 } };
    expect(core("pitcher", card({ year: 2021 }), cond)).toBe(27);
  });

  it("단계별 연도가 연도 덱보다 먼저: 연도 덱 21년이어도 190점을 19년으로 고르면 190점(변화·구위 +1)은 못 받는다 (→ +29)", () => {
    const cond = { ...DEFAULT_CONDITION, yearDeck: { ...DEFAULT_CONDITION.yearDeck, pitcher: 2021 }, tierYears: { 190: 2019 } };
    expect(core("pitcher", card({ year: 2021 }), cond)).toBe(29);
  });

  it("스코어 0이면 효과 없음", () => {
    expect(setDeckBonus("batter", card(), { ...DEFAULT_CONDITION, setDeckScore: 0 })).toEqual({});
  });
});

describe("조건", () => {
  const batterYear = (deck: "all" | "none" | number) => ({ ...DEFAULT_CONDITION, yearDeck: { ...DEFAULT_CONDITION.yearDeck, batter: deck } });

  it("연도를 안 받으면 연도 효과(75 연도타자 +6, 180 연도 선수·185 연도타자 +3씩)가 빠진다: 73 → 61", () => {
    expect(core("batter", card(), batterYear("none"))).toBe(61);
  });

  it("연도 덱을 고르면 카드 연도가 같은 카드만 받는다", () => {
    expect(core("batter", card({ year: 2025 }), batterYear(2025))).toBe(73);
    expect(core("batter", card({ year: 2019 }), batterYear(2025))).toBe(61);
    expect(core("batter", card(), batterYear(2025))).toBe(61); // 카드 연도를 넣지 않으면 받지 않는다
  });

  it("임팩트는 모든 연도에 해당해 연도 덱이 없음이어도 그대로", () => {
    expect(core("batter", card({ type: "임팩트" }), batterYear("none"))).toBe(86);
  });

  it("단계 선택을 바꾸면 반영된다: 40점을 투수로 고르면 타자 -3", () => {
    const picks = [...DEFAULT_PICKS];
    picks[SET_DECK_TIERS.findIndex((t) => t.score === 40)] = 1;
    expect(core("batter", card(), { ...DEFAULT_CONDITION, setDeckPicks: picks })).toBe(70);
  });

  it("이달의 선수 라이브는 스페셜로 쳐서 50·130점 스페셜 +1을 받는다 (+6)", () => {
    const live = (potm: boolean) => core("batter", card({ type: "라이브", potm }));
    expect(live(true) - live(false)).toBe(6);
  });

  it("타순·포지션에 따라 달라진다: 내야면 95점 외야·지명(선구 +2)을 못 받는다", () => {
    expect(core("batter", card({ position: "SS" }))).toBe(71);
  });
});

describe("연도 기본값", () => {
  it("타자는 일괄 적용, 투수는 없음", () => {
    expect(YEAR_DECK_DEFAULT).toEqual({ batter: "all", pitcher: "none" });
    expect(DEFAULT_CONDITION.yearDeck).toEqual(YEAR_DECK_DEFAULT);
  });
});
