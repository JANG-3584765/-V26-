"use client";

// 입력값(useState)이 바뀔 때마다 다시 그려야 하므로 클라이언트 컴포넌트로 만든다.
// https://nextjs.org/docs/app/building-your-application/rendering/client-components
import { useState } from "react";
import CardForm, { ROW_HEIGHT } from "./CardForm";
import Segmented from "./Segmented";
import EnhancePanel from "./EnhancePanel";
import TrainingPanel from "./TrainingPanel";
import { DEFAULT_CONDITION, maxAwaken, maxEnhance } from "@/lib/bonusTable";
import { compareCards } from "@/lib/compare";
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
  const [role, setRole] = useState<Role>("batter");
  const [cards, setCards] = useState<CardInput[]>(() => [newCard(1), newCard(2)]);
  const [cond, setCond] = useState<CommonCondition>(DEFAULT_CONDITION);

  // 계산은 입력값에서 바로 구한다. 결과를 따로 state로 두면 입력과 어긋날 수 있다.
  const rows = compareCards(role, cards, cond);

  // 투수·타자는 스탯 항목이 달라 입력값을 이어 쓸 수 없으므로 능력치만 비운다
  const changeRole = (next: Role) => {
    setRole(next);
    setCards(cards.map((c) => ({ ...c, base: {}, customTraining: undefined })));
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
            {["이름", "종류", "훈련", ...CORE_STAT_KEYS[role]].map((label) => (
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

      <section>
        <h2 className="font-semibold">결과 (핵심 합계 순)</h2>
        <ol className="mt-2 space-y-2">
          {rows.map((r, rank) => (
            <li key={r.index} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">
                  {rank + 1}. {r.card.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {r.card.type}
                </span>
              </div>
              <div className="mt-1 flex gap-4 text-sm">
                <span>핵심 {r.core ?? "–"}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-zinc-500">
          핵심: {role === "batter" ? "파워+정확+선구" : "변화+구위"} · 입력하지 않은 스탯이 있으면 합계는 –
        </p>
      </section>
    </div>
  );
}
