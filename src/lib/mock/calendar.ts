import type { CalendarEvent } from "@/lib/types";

/**
 * 캘린더 일정 (가상 데이터) - 기준일 2026-06-12
 * 개인 일정은 isPrivate=true 로, 세부내용을 노출하지 않는다.
 */
export const calendarEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "주간 운영 점검 (내부)",
    date: "2026-06-12",
    start: "09:00",
    end: "09:30",
    type: "내부회의",
    advertiserId: null,
    isPrivate: false,
  },
  {
    id: "e2",
    title: "강남미소치과 7월 예산 미팅",
    date: "2026-06-12",
    start: "10:30",
    end: "11:30",
    type: "광고주미팅",
    advertiserId: "a1",
    isPrivate: false,
  },
  {
    id: "e3",
    title: "한결법률사무소 긴급 상담콜",
    date: "2026-06-12",
    start: "14:00",
    end: "14:40",
    type: "상담콜",
    advertiserId: "a4",
    isPrivate: false,
  },
  {
    id: "e4",
    title: "드라이브원 하반기 확대 사전미팅",
    date: "2026-06-12",
    start: "16:00",
    end: "17:00",
    type: "광고주미팅",
    advertiserId: "a5",
    isPrivate: false,
  },
  {
    id: "e5",
    title: "개인 일정",
    date: "2026-06-12",
    start: "19:00",
    end: "20:00",
    type: "개인",
    advertiserId: null,
    isPrivate: true,
  },
];
