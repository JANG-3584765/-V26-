import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION } from "./bonusTable";
import { MAX_POSITION_LEVEL, maxPositionBonus, positionBonus, positionRows, positionTrainingBonus } from "./positionTraining";
import { setDeckBonus } from "./setDeck";
import { CARD_DEFAULTS, type CardInput, type PitcherSlot, type Position, type Role } from "./types";

const card = (over: Partial<CardInput> = {}): CardInput => ({
  name: "테스트",
  type: "시그니처",
  base: {},
  enhanceLevel: 0,
  awakenLevel: 0,
  ...over,
});

// 20단계 누적을 화면 열 순서(타자 파정선인주수, 투수 구속·변화·구위·제구·지구력·수비)로
const totals = (role: Role, slot: Position | PitcherSlot) =>
  positionRows(role, slot).reduce<number[]>((acc, row) => acc.map((v, i) => v + row[i]), [0, 0, 0, 0, 0, 0]);

// 게임 화면 "종합" 줄
describe("20단계 합 = 게임 화면 종합", () => {
  it.each([
    ["C", [7, 6, 4, 7, 4, 8]],
    ["1B", [8, 7, 7, 6, 4, 4]],
    ["2B", [5, 6, 6, 7, 6, 6]],
    ["3B", [8, 7, 7, 6, 4, 4]],
    ["SS", [5, 6, 6, 7, 6, 6]],
    ["LF", [7, 6, 6, 7, 5, 5]],
    ["CF", [4, 6, 6, 5, 7, 8]],
    ["RF", [5, 6, 7, 5, 6, 7]],
    ["DH", [7, 7, 7, 7, 4, 4]],
  ] as const)("타자 %s", (slot, expected) => {
    expect(totals("batter", slot)).toEqual(expected);
  });

  it.each([
    ["SP1", [6, 6, 8, 6, 6, 4]],
    ["SP2", [7, 6, 7, 6, 6, 4]],
    ["SP3", [6, 6, 7, 7, 6, 4]],
    ["SP4", [6, 6, 7, 6, 7, 4]],
    ["SP5", [6, 7, 7, 6, 6, 4]],
    ["RP1", [7, 6, 8, 6, 5, 4]],
    ["RP2", [7, 7, 7, 6, 4, 5]],
    ["RP3", [6, 7, 7, 6, 6, 4]],
    ["RP4", [6, 6, 8, 7, 5, 4]],
    ["RP5", [5, 6, 7, 6, 7, 5]],
    ["RP6", [5, 6, 7, 6, 7, 5]],
    ["RP7", [5, 6, 7, 6, 7, 5]],
    ["RP8", [5, 6, 7, 6, 7, 5]],
    ["CP", [7, 7, 8, 6, 4, 4]],
  ] as const)("투수 %s", (slot, expected) => {
    expect(totals("pitcher", slot)).toEqual(expected);
  });

  it("모든 표는 20단계", () => {
    expect([positionRows("batter", "C").length, positionRows("pitcher", "CP").length]).toEqual([20, 20]);
  });
});

describe("positionTrainingBonus", () => {
  it("기본값은 지명타자 20단계: 파정선 +21", () => {
    expect(positionTrainingBonus("batter", card())).toEqual({ 파워: 7, 정확: 7, 선구: 7, 인내: 7, 주루: 4, 수비: 4 });
  });

  it("단계만큼만 더한다: 포수 3단계 = 정확·인내·수비 +1", () => {
    expect(positionTrainingBonus("batter", card({ position: "C", positionLevel: 3 }))).toEqual({ 정확: 1, 인내: 1, 수비: 1 });
  });

  it("투수는 보직 칸 표를 쓴다: 기본 선발1, 마무리 20단계 구위 +8", () => {
    expect(positionTrainingBonus("pitcher", card()).구위).toBe(8);
    expect(positionTrainingBonus("pitcher", card({ pitcherSlot: "CP" })).구위).toBe(8);
    expect(positionTrainingBonus("pitcher", card({ pitcherSlot: "RP5" })).구위).toBe(7);
  });
});

describe("세트덱 선발/불펜 조건은 보직 칸에서 정해진다", () => {
  // 115점까지 열면 구위는 선발이 70점(선발 +1), 불펜이 115점(불펜 구위 +2)을 받아 1 차이
  it("중계·마무리는 불펜, 선발 칸은 선발 효과를 받는다", () => {
    const cond = { ...DEFAULT_CONDITION, setDeckScore: 115 };
    const at = (pitcherSlot: PitcherSlot) => setDeckBonus("pitcher", card({ pitcherSlot }), cond).구위 ?? 0;
    expect(at("RP1") - at("SP1")).toBe(1);
    expect(at("CP")).toBe(at("RP1"));
    expect(at("SP5")).toBe(at("SP1"));
  });
});

describe("5·15단 보너스 (직접 입력)", () => {
  it("보너스 최대: 4단 이하 0, 5~14단 3, 15단 이상 6", () => {
    expect([maxPositionBonus(4), maxPositionBonus(5), maxPositionBonus(14), maxPositionBonus(15), maxPositionBonus(20)]).toEqual([0, 3, 3, 6, 6]);
  });

  it("입력한 값을 그대로 쓴다 (비우면 없음)", () => {
    expect(positionBonus(card({ positionBonus: { 파워: 3, 정확: 2 } }))).toEqual({ 파워: 3, 정확: 2 });
    expect(positionBonus(card())).toEqual({});
  });

  it("5단 미만이면 입력값이 있어도 무시한다", () => {
    expect(positionBonus(card({ positionLevel: 4, positionBonus: { 파워: 3 } }))).toEqual({});
  });
});

describe("기본값", () => {
  it("카드 기본 포지션 특훈 단계 = 최대 단계", () => {
    expect(CARD_DEFAULTS.positionLevel).toBe(MAX_POSITION_LEVEL);
  });
});
