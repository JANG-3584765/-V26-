import { useState } from "react";

// 지금 주소(입력 상태가 ?s=...로 담긴 링크)를 클립보드에 복사한다.
// 클립보드 API는 https나 localhost에서만 동작하므로, 실패하면 링크를 보여줘서 직접 복사하게 한다.
// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
export default function ShareButton() {
  const [status, setStatus] = useState<"idle" | "copied" | { manual: string }>("idle");

  const copy = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus({ manual: url });
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={copy}
        className="w-full rounded-xl bg-foreground py-3 font-medium text-background"
      >
        {status === "copied" ? "복사됐어요" : "비교 링크 복사"}
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
      <p className="mt-2 text-center text-xs text-zinc-500">링크를 열면 지금 입력한 카드와 조건이 그대로 보입니다</p>
    </div>
  );
}
