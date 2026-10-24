import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION } from "./bonusTable";
import { DEFAULT_PICKS, setDeckBonus, SET_DECK_TIERS } from "./setDeck";
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

  it("투수 시그 핵심(변화+구위) 상승 +31 (180점 연도 선수 +1 포함)", () => {
    expect(core("pitcher", card())).toBe(31);
  });

  it("스코어 0이면 효과 없음", () => {
    expect(setDeckBonus("batter", card(), { ...DEFAULT_CONDITION, setDeckScore: 0 })).toEqual({});
  });
});

describe("조건", () => {
  it("연도를 안 받으면 연도 효과(75 연도타자 +6, 180 연도 선수·185 연도타자 +3씩)가 빠진다: 73 → 61", () => {
    expect(core("batter", card({ yearMatch: false }))).toBe(61);
    expect(core("batter", card(), { ...DEFAULT_CONDITION, yearMatchAll: false })).toBe(61);
  });

  it("카드별 연도 설정이 일괄 설정보다 우선", () => {
    expect(core("batter", card({ yearMatch: true }), { ...DEFAULT_CONDITION, yearMatchAll: false })).toBe(73);
  });

  it("임팩트는 모든 연도에 해당해 연도를 꺼도 그대로", () => {
    expect(core("batter", card({ type: "임팩트", yearMatch: false }))).toBe(86);
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
