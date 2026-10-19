import { describe, expect, it } from "vitest";
import { DEFAULT_CONDITION } from "./bonusTable";
import { decodeShare, encodeShare, type ShareState } from "./share";

const state: ShareState = {
  role: "batter",
  cond: { ...DEFAULT_CONDITION, redistTargetPct: 30, applySpecial: false, setDeckScore: 150, yearMatchAll: false, setDeckPicks: DEFAULT_CONDITION.setDeckPicks.map((p, i) => (i === 1 ? 1 : p)) },
  cards: [
    { name: "김도영 시그", type: "시그니처", base: { 파워: 80, 정확: 75, 선구: 70 }, enhanceLevel: 10, awakenLevel: 9 },
    {
      name: "내 임팩",
      type: "임팩트",
      base: { 파워: 78 }, // 일부만 입력
      enhanceLevel: 7,
      awakenLevel: 0,
      customTraining: { 파워: 20, 정확: 10, 선구: 4 },
      customSpecial: 6,
      specialFA: true,
      potm: true,
      yearMatch: true,
      lineup: "top",
      position: "SS",
      positionLevel: 15,
    },
  ],
};

describe("encodeShare / decodeShare", () => {
  it("인코딩한 상태를 그대로 복원한다 (한글 이름, 빈칸, 직접 입력값 포함)", () => {
    expect(decodeShare(encodeShare(state))).toEqual({
      ...state,
      cards: [
        {
          ...state.cards[0],
          customTraining: undefined,
          customSpecial: undefined,
          specialFA: undefined,
          potm: undefined,
          yearMatch: undefined,
          lineup: undefined,
          position: undefined,
          pitcherSlot: undefined,
          positionLevel: undefined,
        },
        { ...state.cards[1], pitcherSlot: undefined },
      ],
    });
  });

  it("URL에 그대로 넣을 수 있는 문자만 쓴다", () => {
    expect(encodeShare(state)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("깨진 문자열이면 null", () => {
    expect(decodeShare("!!!")).toBeNull();
    expect(decodeShare("")).toBeNull();
  });

  // 링크는 누구나 고칠 수 있으므로 범위를 벗어난 값은 받지 않는다
  type Raw = { c: { pk: string; ds: number }; k: { t: number; b: number[]; e: number; a: number; fa?: number; po?: number; pl?: number }[] };
  const tamper = (fn: (p: Raw) => void) => {
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encodeShare(state).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))));
    fn(json);
    const b = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(json))));
    return decodeShare(b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
  };

  it("범위를 벗어난 값이 하나라도 있으면 null", () => {
    expect(tamper((p) => (p.k[0].e = 11))).toBeNull(); // 강화 11
    expect(tamper((p) => (p.k[0].t = 99))).toBeNull(); // 없는 카드 종류
    expect(tamper((p) => (p.k[0].b[0] = -5))).toBeNull(); // 음수 스탯
    expect(tamper((p) => (p.k[1].a = 3))).toBeNull(); // 7강인데 각성
    expect(tamper((p) => p.k.push(p.k[0], p.k[0]))).toBeNull(); // 4장
    expect(tamper((p) => (p.c.pk = "01"))).toBeNull(); // 세트덱 선택 개수가 단계 수와 다름
    expect(tamper((p) => (p.c.ds = 999))).toBeNull(); // 세트덱 스코어 범위 밖
    expect(tamper((p) => (p.k[1].po = 20))).toBeNull(); // 없는 포지션
    expect(tamper((p) => (p.k[1].pl = 21))).toBeNull(); // 포지션 특훈 21단계
  });

  it("FA가 안 되는 카드의 FA 표시는 무시한다", () => {
    const r = tamper((p) => ((p.k[0].t = 4), (p.k[0].a = 0), (p.k[0].fa = 1))); // 골든글러브
    expect(r?.cards[0].specialFA).toBeUndefined();
  });
});
