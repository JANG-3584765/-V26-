import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { SHARE_LABEL, shareVariant } from "@/lib/experiment";

// 지금 주소(입력 상태가 ?s=...로 담긴 링크)를 클립보드에 복사한다.
// 클립보드 API는 https나 localhost에서만 동작하므로, 실패하면 링크를 보여줘서 직접 복사하게 한다.
// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
export default function ShareButton() {
  const [status, setStatus] = useState<"idle" | "copied" | { manual: string }>("idle");
  // 브라우저에서만 그리는 컴포넌트라 첫 렌더에서 바로 저장소를 읽을 수 있다 (ComparatorClient)
  const [variant] = useState(shareVariant);

  // 어떤 문구를 봤는지 한 번 기록한다 (복사율 = share_copy ÷ experiment_view). GA(외부 시스템)에 알리는 일이라 effect에 둔다.
  useEffect(() => {
    track("experiment_view", { experiment: "share_label", variant });
  }, [variant]);

  const copy = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
      track("share_copy", { variant, method: "clipboard" });
    } catch {
      setStatus({ manual: url });
      track("share_copy", { variant, method: "manual" });
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={copy}
        className="w-full rounded-xl bg-accent py-3 font-medium text-accent-foreground shadow-sm transition-opacity active:opacity-80"
      >
        {status === "copied" ? "복사됐어요" : SHARE_LABEL[variant]}
      </button>
      {typeof status === "object" && (
        <input
          readOnly
          value={status.manual}
          onFocus={(e) => e.target.select()}
          className="mt-2 w-full rounded-md border border-zinc-300 bg-background px-2 py-2 text-xs dark:border-zinc-700"
          aria-label="공유 링크"
        />
      )}
      <p className="mt-2 text-center text-xs text-zinc-600 dark:text-zinc-400">링크를 열면 지금 입력한 카드와 조건이 그대로 보입니다</p>
    </div>
  );
}
