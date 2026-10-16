"use client";

// 비교 화면은 링크(?s=...)에 담긴 상태로 시작해야 하는데, 서버는 그 값을 모른 채 미리 그린다.
// 그래서 이 부분만 서버에서 그리지 않고 브라우저에서만 그린다 (ssr: false는 클라이언트 컴포넌트에서만 쓸 수 있다).
// https://nextjs.org/docs/app/guides/lazy-loading#skipping-ssr
import dynamic from "next/dynamic";

const ComparatorClient = dynamic(() => import("./Comparator"), { ssr: false });

export default ComparatorClient;
