import ComparatorClient from "@/components/ComparatorClient";

export default function Home() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold">카드 비교</h1>
      <p className="mt-2 text-sm text-zinc-500">비공식 팬 사이트입니다. 게임사와 관련이 없습니다.</p>
      <div className="mt-6">
        <ComparatorClient />
      </div>
    </main>
  );
}
