import type { ScheduleSummary } from "@/lib/types";
import { data } from "@/lib/data";

const { advertiserName, calendarEvents } = data;

/**
 * 오늘 일정 요약을 생성한다.
 * 개인 일정은 제목/세부내용을 노출하지 않고 "개인 일정"으로만 표기한다.
 */
export function buildScheduleSummary(today: string): ScheduleSummary {
  const todays = calendarEvents
    .filter((e) => e.date === today)
    .sort((a, b) => a.start.localeCompare(b.start));

  const events = todays.map((e) => ({
    id: e.id,
    time: `${e.start}–${e.end}`,
    title: e.isPrivate ? "개인 일정" : e.title,
    type: e.type,
    advertiserName: e.isPrivate ? undefined : advertiserName(e.advertiserId),
  }));

  const advertiserMeetingCount = todays.filter(
    (e) => e.type === "광고주미팅" || e.type === "상담콜"
  ).length;

  return {
    totalCount: todays.length,
    advertiserMeetingCount,
    firstEvent: todays[0]
      ? `${todays[0].start} ${todays[0].isPrivate ? "개인 일정" : todays[0].title}`
      : undefined,
    events,
  };
}
