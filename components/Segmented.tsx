interface Props<T> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// 여러 버튼 중 하나를 고르는 선택 버튼 묶음 (타자/투수, 전체/핵심, 재분배 확률)
export default function Segmented<T extends string | number | boolean>({ options, value, onChange }: Props<T>) {
  return (
    // Tailwind는 빌드할 때 소스에 적힌 클래스만 만들어서 `grid-cols-${n}` 같은 조합 문자열은 동작하지 않는다.
    // 그래서 열 개수는 style로 직접 지정한다. https://tailwindcss.com/docs/detecting-classes-in-source-files#dynamic-class-names
    <div className="grid gap-1 text-sm" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg py-2 ${o.value === value ? "bg-foreground font-medium text-background" : "border border-zinc-300 dark:border-zinc-700"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
