import type { RecommendedAction } from "@/lib/types";
import type { DataSource } from "@/lib/data";

/**
 * AI 추천 액션 (제안 only, 실행 아님).
 *
 * AI는 읽고·요약하고·우선순위를 정하고·추천하고·요청 시 초안을 작성한다.
 * 추천은 대표의 의사결정을 돕기 위한 것이며 자동 실행되지 않는다.
 */
export function buildRecommendations(ds: DataSource): RecommendedAction[] {
  // 예시 항목은 해당 광고주가 현재 데이터에 존재할 때만 노출 (실데이터에선 자동 숨김)
  const names = new Set(ds.advertisers.map((a) => a.name));
  const items: RecommendedAction[] = [
    {
      id: "rec1",
      title: "한결법률사무소: 오늘 14시 상담콜 전 회복 플랜 확정",
      advertiserName: "한결법률사무소",
      rationale:
        "리드 52% 급감 + 부정 커뮤니케이션 + 계약 만료 임박이 겹쳐 이탈 위험이 가장 큼.",
      expectedImpact: "선제 대응 시 계약 갱신 및 9,000만원/연 매출 방어 가능.",
    },
    {
      id: "rec2",
      title: "강남미소치과: 증액 제안서 오전 미팅에서 바로 제시",
      advertiserName: "강남미소치과",
      rationale: "성과 만족도가 높고 증액 의향을 먼저 밝힌 상태로 전환 적기.",
      expectedImpact: "월 광고비 300만원 증액 → 대행 수익 확대.",
    },
    {
      id: "rec3",
      title: "스마트리스: 폼 이탈률 점검을 운영팀 우선순위로 상향",
      advertiserName: "스마트리스",
      rationale: "유입 대비 전환율 12%로 낮아 리드 품질 불만으로 이어지는 중.",
      expectedImpact: "전환율 개선 시 계약 만족도 회복 및 갱신 가능성 상승.",
    },
    {
      id: "rec4",
      title: "바로서는정형외과: 소재 교체 지연 건 디자인팀 일정 재조정",
      advertiserName: "바로서는정형외과",
      rationale: "소재 교체 업무가 3일 지연되며 성과 하락이 누적되고 있음.",
      expectedImpact: "소재 갱신 시 문의량 회복 및 6/30 계약 갱신 우호 환경 조성.",
    },
  ];
  return items.filter((i) => !i.advertiserName || names.has(i.advertiserName));
}
