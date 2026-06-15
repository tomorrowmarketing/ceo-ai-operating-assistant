import type { ApprovalItem } from "@/lib/types";
import type { DataSource } from "@/lib/data";

/**
 * 승인 필요 항목.
 *
 * AI는 초안만 준비하고, 대표의 명시적 승인 전까지 외부 행동을 실행하지 않는다.
 * (docs/06-agent-rules.md) 현재 MVP에서는 어떤 외부 행동도 실제로 실행하지 않으며,
 * 아래 항목은 "승인 시 실행될 행동"을 설명만 한다.
 */
export function buildApprovals(ds: DataSource): ApprovalItem[] {
  // 예시 항목은 해당 광고주가 현재 데이터에 존재할 때만 노출 (실데이터에선 자동 숨김)
  const names = new Set(ds.advertisers.map((a) => a.name));
  const items: ApprovalItem[] = [
    {
      id: "ap1",
      title: "한결법률사무소 대표 사과 및 개선안 메일 초안",
      actionType: "메일발송",
      advertiserName: "한결법률사무소",
      draftSummary:
        "리드 급감에 대한 사과, 원인(소재 노후화·경쟁 심화) 진단, 1주 회복 플랜과 미팅 제안을 담은 초안 준비 완료.",
      ifApproved: "승인 시 대표 명의로 메일 발송 (현재 미연동, 실행 안 함)",
    },
    {
      id: "ap2",
      title: "강남미소치과 7월 예산 증액 제안서 발송",
      actionType: "메일발송",
      advertiserName: "강남미소치과",
      draftSummary:
        "6월 성과 요약과 7월 예산 800만→1,100만원 증액 시 예상 리드 증가 시나리오 제안서 초안.",
      ifApproved: "승인 시 제안서 첨부 메일 발송 (현재 미연동, 실행 안 함)",
    },
    {
      id: "ap3",
      title: "바로서는정형외과 계약 갱신 미팅 일정 제안",
      actionType: "일정조정",
      advertiserName: "바로서는정형외과",
      draftSummary:
        "6/30 계약 만료 전 갱신 논의를 위해 6/18 또는 6/19 미팅 후보 시간 제안 초안.",
      ifApproved: "승인 시 캘린더 일정 추가 및 안내 발송 (현재 미연동, 실행 안 함)",
    },
  ];
  return items.filter((i) => !i.advertiserName || names.has(i.advertiserName));
}
