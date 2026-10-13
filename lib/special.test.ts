import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION } from "./bonusTable";
import { compareCards } from "./compare";
import { canFA, defaultSpecialExtra, FA_COUNT, FA_TABLE, SPECIAL_COUNT, SPECIAL_TABLE, specialCore } from "./special";
import { CARD_TYPES, type CardInput } from "./types";

describe("특훈 데이터", () => {
  it("재설정표 최댓값 = 특훈 횟수 × 회당 최대 추가분 (임팩트 2, 나머지 3)", () => {
    for (const type of CARD_TYPES) {
      const table = SPECIAL_TABLE[type];
      if (!table) continue;
      const perTry = type === "임팩트" ? 2 : 3;
      expect(table.from + table.probs.length - 1, type).toBe(SPECIAL_COUNT[type] * perTry);
    }
  });

  it("FA 재설정표 최댓값 = 5회 × 회당 최대 추가분", () => {
    expect(FA_TABLE.임팩트!.probs.length - 1).toBe(FA_COUNT * 2);
    expect(FA_TABLE.시그니처!.probs.length - 1).toBe(FA_COUNT * 3);
  });

  it("FA는 임팩트·시그니처만", () => {
    expect(["임팩트", "시그니처", "골든글러브", "국가대표"].map((t) => canFA(t as never))).toEqual([true, true, false, false]);
  });

  it("라이브는 특훈 불가", () => {
    expect([SPECIAL_COUNT.라이브, SPECIAL_TABLE.라이브]).toEqual([0, null]);
  });
});

describe("기본값 (10% 내외)", () => {
  it("추가분: 임팩 4 (3.81%) / 시그·골글 4 (10.99%) / 국대 5 (10.33%)", () => {
    expect(["임팩트", "시그니처", "골든글러브", "국가대표"].map((t) => defaultSpecialExtra(t as never, false, 10))).toEqual([4, 4, 4, 5]);
  });

  it("핵심 상승 = 횟수 + 추가분: 시그 3 + 4 = 7, 국대 4 + 5 = 9", () => {
    expect([specialCore("시그니처", false, 4), specialCore("국가대표", false, 5)]).toEqual([7, 9]);
  });
});

describe("비교에 반영", () => {
  const card = (over: Partial<CardInput> = {}): CardInput => ({
    name: "테스트",
    type: "시그니처",
    base: { 파워: 80, 정확: 70, 선구: 60 },
    enhanceLevel: 0,
    awakenLevel: 0,
    ...over,
  });
  const onlySpecial = { ...DEFAULT_CONDITION, applyTraining: false };

  it("기본값이면 시그 타자 핵심 +7", () => {
    expect(compareCards("batter", [card()], onlySpecial)[0].core).toBe(217);
  });

  it("직접 입력한 재설정 결과가 있으면 그것을 쓴다: 3 + 6 = 9", () => {
    expect(compareCards("batter", [card({ customSpecial: 6 })], onlySpecial)[0].core).toBe(219);
  });

  it("FA를 켜면 5회 + FA 표: 시그 FA 10% 내외 6 (10.91%) → +11", () => {
    expect(compareCards("batter", [card({ specialFA: true })], onlySpecial)[0].core).toBe(221);
  });

  it("FA가 없는 카드는 FA를 켜도 일반 특훈", () => {
    expect(compareCards("batter", [card({ type: "골든글러브", specialFA: true })], onlySpecial)[0].core).toBe(217);
  });

  it("특훈을 끄거나 라이브면 더하지 않는다", () => {
    expect(compareCards("batter", [card()], { ...onlySpecial, applySpecial: false })[0].core).toBe(210);
    expect(compareCards("batter", [card({ type: "라이브" })], onlySpecial)[0].core).toBe(210);
  });
});
