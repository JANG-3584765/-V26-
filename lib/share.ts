import { canAwaken, DEFAULT_CONDITION, maxAwaken, maxEnhance } from "./bonusTable";
import { LINEUPS, MAX_SET_DECK_SCORE, PITCHER_ROLES, POSITIONS, SET_DECK_TIERS } from "./setDeck";
import { canFA } from "./special";
import { CARD_TYPES, CORE_STAT_KEYS, type CardInput, type CommonCondition, type Role, type Stats } from "./types";

// 입력 상태를 URL 한 줄(?s=...)로 주고받는다. 서버 없이 링크만으로 공유하려는 용도.
// JSON → UTF-8 → base64url. 한글 이름은 퍼센트 인코딩(%EC%B9%B4...)보다 base64가 훨씬 짧다.

export interface ShareState {
  role: Role;
  cards: CardInput[];
  cond: CommonCondition;
}

// 키를 짧게 줄인 저장 형식. 형식을 바꾸면 v를 올려서 예전 링크와 구분한다.
interface PackedCard {
  n: string; // 이름
  t: number; // 카드 종류 (CARD_TYPES 순번)
  b: (number | null)[]; // 핵심 스탯 (CORE_STAT_KEYS 순서, 빈칸 null)
  e: number; // 강화
  a: number; // 각성
  tr?: number[]; // 직접 입력한 훈련값 (핵심 스탯 순서)
  sp?: number; // 직접 입력한 특훈 재설정 결과
  fa?: 1; // FA 특훈
  y?: 0 | 1; // 연도 (카드별로 따로 정했을 때만)
  lu?: number; // 타순 (LINEUPS 순번)
  po?: number; // 포지션 (POSITIONS 순번)
  pr?: number; // 투수 보직 (PITCHER_ROLES 순번)
}
interface Packed {
  v: 1;
  r: "b" | "p";
  c: { at: boolean; tp: number; as: boolean; sp: number; ds: number; pk: string; ya: boolean };
  k: PackedCard[];
}

const MAX_CARDS = 3;
const MAX_STAT = 999;

// base64url: URL에 그대로 넣을 수 있게 +/= 를 바꾼 base64
// btoa/atob는 한 글자 = 1바이트 문자열만 다루므로, 한글은 TextEncoder로 UTF-8 바이트로 바꾼 뒤 넣는다.
// https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
function toBase64Url(text: string): string {
  const binary = String.fromCharCode(...new TextEncoder().encode(text));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s: string): string {
  const binary = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeShare({ role, cards, cond }: ShareState): string {
  const keys = CORE_STAT_KEYS[role];
  const packed: Packed = {
    v: 1,
    r: role === "batter" ? "b" : "p",
    c: {
      at: cond.applyTraining,
      tp: cond.redistTargetPct,
      as: cond.applySpecial,
      sp: cond.specialTargetPct,
      ds: cond.setDeckScore,
      pk: cond.setDeckPicks.join(""), // 단계별 선택을 "0110…" 한 줄로
      ya: cond.yearMatchAll,
    },
    k: cards.map((card) => ({
      n: card.name,
      t: CARD_TYPES.indexOf(card.type),
      b: keys.map((k) => card.base[k] ?? null),
      e: card.enhanceLevel,
      a: card.awakenLevel,
      ...(card.customTraining && { tr: keys.map((k) => card.customTraining![k] ?? 0) }),
      ...(card.customSpecial !== undefined && { sp: card.customSpecial }),
      ...(card.specialFA && { fa: 1 as const }),
      ...(card.yearMatch !== undefined && { y: card.yearMatch ? (1 as const) : (0 as const) }),
      ...(card.lineup && { lu: LINEUPS.findIndex((l) => l.value === card.lineup) }),
      ...(card.position && { po: POSITIONS.findIndex((p) => p.value === card.position) }),
      ...(card.pitcherRole && { pr: PITCHER_ROLES.findIndex((r) => r.value === card.pitcherRole) }),
    })),
  };
  return toBase64Url(JSON.stringify(packed));
}

// ---- 복원: 링크는 누구나 고칠 수 있으니 값마다 범위를 확인하고, 하나라도 이상하면 통째로 버린다 ----

const isInt = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

function unpackCard(p: PackedCard, role: Role): CardInput | null {
  const keys = CORE_STAT_KEYS[role];
  if (typeof p.n !== "string" || !isInt(p.t, 0, CARD_TYPES.length - 1)) return null;
  const type = CARD_TYPES[p.t];
  if (!Array.isArray(p.b) || p.b.length !== keys.length) return null;
  if (!isInt(p.e, 0, maxEnhance(type)) || !isInt(p.a, 0, maxAwaken(type))) return null;
  if (p.a > 0 && !canAwaken(type, p.e)) return null;

  const base: Stats = {};
  for (const [i, k] of keys.entries()) {
    const v = p.b[i];
    if (v === null) continue;
    if (!isInt(v, 0, MAX_STAT)) return null;
    base[k] = v;
  }

  let customTraining: Stats | undefined;
  if (p.tr !== undefined) {
    if (!Array.isArray(p.tr) || p.tr.length !== keys.length || !p.tr.every((v) => isInt(v, 0, MAX_STAT))) return null;
    customTraining = Object.fromEntries(keys.map((k, i) => [k, p.tr![i]]));
  }
  if (p.sp !== undefined && !isInt(p.sp, 0, MAX_STAT)) return null;
  if (p.y !== undefined && p.y !== 0 && p.y !== 1) return null;
  if (p.lu !== undefined && !isInt(p.lu, 0, LINEUPS.length - 1)) return null;
  if (p.po !== undefined && !isInt(p.po, 0, POSITIONS.length - 1)) return null;
  if (p.pr !== undefined && !isInt(p.pr, 0, PITCHER_ROLES.length - 1)) return null;

  return {
    name: p.n.slice(0, 20),
    type,
    base,
    enhanceLevel: p.e,
    awakenLevel: p.a,
    customTraining,
    customSpecial: p.sp,
    specialFA: p.fa === 1 && canFA(type) ? true : undefined,
    yearMatch: p.y === undefined ? undefined : p.y === 1,
    lineup: p.lu === undefined ? undefined : LINEUPS[p.lu].value,
    position: p.po === undefined ? undefined : POSITIONS[p.po].value,
    pitcherRole: p.pr === undefined ? undefined : PITCHER_ROLES[p.pr].value,
  };
}

export function decodeShare(s: string): ShareState | null {
  try {
    const p = JSON.parse(fromBase64Url(s)) as Packed;
    if (p.v !== 1 || (p.r !== "b" && p.r !== "p") || !Array.isArray(p.k)) return null;
    if (p.k.length < 1 || p.k.length > MAX_CARDS) return null;
    const role: Role = p.r === "b" ? "batter" : "pitcher";

    const { at, tp, as, sp, ds, pk, ya } = p.c ?? {};
    if (typeof at !== "boolean" || typeof as !== "boolean" || !isInt(tp, 1, 100) || !isInt(sp, 1, 100)) return null;
    if (!isInt(ds, 0, MAX_SET_DECK_SCORE) || typeof ya !== "boolean") return null;
    if (typeof pk !== "string" || !new RegExp(`^[01]{${SET_DECK_TIERS.length}}$`).test(pk)) return null;
    const cond: CommonCondition = {
      ...DEFAULT_CONDITION,
      applyTraining: at,
      redistTargetPct: tp,
      applySpecial: as,
      specialTargetPct: sp,
      setDeckScore: ds,
      setDeckPicks: [...pk].map((ch) => (ch === "1" ? 1 : 0)),
      yearMatchAll: ya,
    };

    const cards = p.k.map((c) => unpackCard(c, role));
    if (cards.some((c) => c === null)) return null;
    return { role, cards: cards as CardInput[], cond };
  } catch {
    // base64·JSON이 깨진 링크
    return null;
  }
}
