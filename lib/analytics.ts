// 방문 통계: Google Analytics 4. 측정 ID는 배포 환경 변수(NEXT_PUBLIC_GA_ID)로 넣고, 없으면 통계를 아예 켜지 않는다.
// NEXT_PUBLIC_ 으로 시작하는 변수만 빌드할 때 브라우저 코드에 들어간다.
// https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void; // GA 스크립트가 만든다 (@next/third-parties의 GoogleAnalytics)
  }
}

// 이벤트 하나를 보낸다. GA가 꺼져 있거나 스크립트가 아직 안 떴으면 아무 일도 하지 않는다.
// https://developers.google.com/analytics/devguides/collection/ga4/events
export function track(event: string, params?: Record<string, string | number>) {
  window.gtag?.("event", event, params);
}
