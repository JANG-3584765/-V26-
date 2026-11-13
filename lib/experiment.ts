// A/B 테스트: 공유 버튼 문구에 따라 링크 복사율이 달라지는지 본다.
// 방문자를 처음 한 번 무작위로 나누고 브라우저에 저장해서, 다시 와도 같은 문구를 보게 한다.
// 결과는 GA에서 이벤트(experiment_view, share_copy)의 variant 값별로 비교한다.
export type Variant = "A" | "B";

export const SHARE_LABEL: Record<Variant, string> = {
  A: "비교 링크 복사",
  B: "이 비교 공유하기",
};

const KEY = "ab_share_label";

export function shareVariant(): Variant {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "A" || saved === "B") return saved;
    const variant: Variant = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem(KEY, variant);
    return variant;
  } catch {
    return "A"; // 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)는 기본 문구
  }
}
