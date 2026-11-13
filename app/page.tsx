import ComparatorClient from "@/components/ComparatorClient";
import { GA_ID } from "@/lib/analytics";

export default function Home() {
  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-10">
      <h1 className="text-2xl font-bold tracking-tight">카드 비교</h1>
      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">같은 조건에서 카드 최종 능력치를 1:1로 비교해요</p>
      {/* 비교 화면은 브라우저에서 그려진다. 높이를 미리 잡아 두어, 그려질 때 아래 안내문이 밀려 화면이 흔들리지 않게 한다 (CLS) */}
      <div className="mt-6 min-h-dvh">
        <ComparatorClient />
      </div>
      <footer className="mt-10 space-y-1 text-center text-xs text-zinc-600 dark:text-zinc-400">
        <p>비공식 팬 사이트입니다. 게임사와 관련이 없습니다.</p>
        {GA_ID && <p>방문 통계를 위해 Google Analytics를 사용합니다.</p>}
        <p>
          <a href="https://github.com/JANG-3584765/-V26-" className="underline underline-offset-2">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
