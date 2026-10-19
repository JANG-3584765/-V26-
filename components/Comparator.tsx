"use client";

// 입력값(useState)이 바뀔 때마다 다시 그려야 하므로 클라이언트 컴포넌트로 만든다.
// https://nextjs.org/docs/app/building-your-application/rendering/client-components
import { useEffect, useState } from "react";
import CardForm, { ROW_HEIGHT } from "./CardForm";
import Segmented from "./Segmented";
import EnhancePanel from "./EnhancePanel";
import ResultTable from "./ResultTable";
import SetDeckPanel from "./SetDeckPanel";
import ShareButton from "./ShareButton";
import SpecialPanel from "./SpecialPanel";
import TrainingPanel from "./TrainingPanel";
import { DEFAULT_CONDITION, maxAwaken, maxEnhance } from "@/lib/bonusTable";
import { compareCards } from "@/lib/compare";
import { decodeShare, encodeShare } from "@/lib/share";
import { CORE_STAT_KEYS, type CardInput, type CommonCondition, type Role } from "@/lib/types";

const MIN_CARDS = 2;
const MAX_CARDS = 3;

const newCard = (n: number): CardInput => ({
  name: `카드 ${n}`,
  type: "임팩트",
  base: {},
  enhanceLevel: maxEnhance("임팩트"),
  awakenLevel: maxAwaken("임팩트"),
});

export default function Comparator() {
  // 링크(?s=...)로 열면 그 상태로 시작한다. 브라우저에서만 그리는 컴포넌트라 window를 바로 읽을 수 있다 (ComparatorClient).
  // useState에 함수를 넘기면 첫 렌더에서 한 번만 실행된다. https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state
  const [shared] = useState(() => decodeShare(new URLSearchParams(window.location.search).get("s") ?? ""));
  const [role, setRole] = useState<Role>(shared?.role ?? "batter");
  const [cards, setCards] = useState<CardInput[]>(() => shared?.cards ?? [newCard(1), newCard(2)]);
  const [cond, setCond] = useState<CommonCondition>(shared?.cond ?? DEFAULT_CONDITION);

  // 입력이 바뀌면 주소창 링크도 바꿔 둔다 (새로고침·공유해도 그대로). 브라우저 주소(외부 시스템)를 맞추는 일이라 effect가 맞는 자리다.
  useEffect(() => {
    window.history.replaceState(null, "", `?s=${encodeShare({ role, cards, cond })}`);
  }, [role, cards, cond]);

  // 계산은 입력값에서 바로 구한다. 결과를 따로 state로 두면 입력과 어긋날 수 있다.
  const rows = compareCards(role, cards, cond);

  // 투수·타자는 스탯 항목이 달라 입력값을 이어 쓸 수 없으므로 능력치만 비운다
  const changeRole = (next: Role) => {
    setRole(next);
    setCards(cards.map((c) => ({ ...c, base: {}, customTraining: undefined, customSpecial: undefined })));
  };

  return (
    <div className="space-y-4">
      <Segmented
        options={[
          { value: "batter", label: "타자" },
          { value: "pitcher", label: "투수" },
        ]}
        value={role}
        onChange={changeRole}
      />

      <section className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="mb-3 text-xs text-zinc-500">훈련·강화·각성 전 능력치를 입력하세요</p>
        <div className="flex gap-1.5">
          {/* 항목 이름은 한 번만 두고, 카드는 오른쪽에 열로 나란히 놓는다 */}
          <div className="flex w-10 shrink-0 flex-col gap-1.5 text-xs text-zinc-500">
            {["이름", "종류", ...(role === "batter" ? ["타순", "포지션"] : ["보직"]), "포특", "연도", "이달", "훈련", ...CORE_STAT_KEYS[role]].map((label) => (
              <span key={label} className={`${ROW_HEIGHT} flex items-center`}>
                {label}
              </span>
            ))}
          </div>
          {cards.map((card, i) => (
            <CardForm
              key={i}
              role={role}
              card={card}
              yearMatchAll={cond.yearMatchAll}
              onChange={(next) => setCards(cards.map((c, j) => (j === i ? next : c)))}
              onRemove={cards.length > MIN_CARDS ? () => setCards(cards.filter((_, j) => j !== i)) : undefined}
            />
          ))}
        </div>
      </section>
      {cards.length < MAX_CARDS && (
        <button
          type="button"
          onClick={() => setCards([...cards, newCard(cards.length + 1)])}
          className="w-full rounded-xl border border-dashed border-zinc-300 py-3 text-sm text-zinc-500 dark:border-zinc-700"
        >
          + 카드 추가
        </button>
      )}

      <EnhancePanel role={role} cards={cards} onCardsChange={setCards} />

      <TrainingPanel
        role={role}
        cards={cards}
        onCardsChange={setCards}
        cond={cond}
        onCondChange={setCond}
      />

      <SpecialPanel role={role} cards={cards} onCardsChange={setCards} cond={cond} onCondChange={setCond} />

      <SetDeckPanel role={role} cards={cards} onCardsChange={setCards} cond={cond} onCondChange={setCond} />

      <ResultTable role={role} rows={rows} />

      <ShareButton />
    </div>
  );
}
