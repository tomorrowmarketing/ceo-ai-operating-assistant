/**
 * 일일 운영 보고서 생성 (순수 함수).
 *
 * 현재 연결된 실데이터(업무·담당자·광고주)를 기준으로 대표님이 매일 아침 보는
 * 한 장짜리 보고서를 만든다. 화면 렌더와 '복사용 텍스트' 양쪽에서 쓴다.
 */
import type { DataSource } from "@/lib/data";
import { isOverdue } from "@/lib/briefing/utils";

export interface DailyReport {
  dateLabel: string;
  summary: {
    advertisers: number;
    totalTasks: number;
    inProgress: number;
    waiting: number;
    done: number;
    /** 날짜가 오늘 이전인 미완료 업무 수 */
    stale: number;
  };
  byStaff: {
    name: string;
    inProgress: number;
    waiting: number;
    stale: number;
    topStaleTask?: string;
  }[];
  byAdvertiser: {
    name: string;
    industry: string;
    total: number;
    inProgress: number;
    stale: number;
  }[];
  /** 아직 연동되지 않아 보고서에 빠진 항목 */
  notIncluded: string[];
}

function formatKoreanDate(d: string): string {
  const date = new Date(`${d}T00:00:00`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

export function buildDailyReport(
  ds: DataSource,
  today: string = ds.today
): DailyReport {
  const tasks = ds.tasks;
  const active = tasks.filter((t) => t.status !== "완료");
  const stale = (t: { status: string; dueDate: string }) =>
    t.status !== "완료" && !!t.dueDate && isOverdue(t.dueDate, today);

  // 직원별
  const byStaff = ds.staff
    .map((s) => {
      const own = active.filter((t) => t.assigneeId === s.id);
      const staleTasks = own
        .filter(stale)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      return {
        name: s.name,
        inProgress: own.filter((t) => t.status === "진행중").length,
        waiting: own.filter((t) => t.status === "대기").length,
        stale: staleTasks.length,
        topStaleTask: staleTasks[0]?.title,
      };
    })
    .filter((s) => s.inProgress + s.waiting + s.stale > 0)
    .sort((a, b) => b.stale - a.stale || b.inProgress - a.inProgress);

  // 광고주별
  const byAdvertiser = ds.advertisers
    .map((a) => {
      const own = tasks.filter((t) => t.advertiserId === a.id);
      return {
        name: a.name,
        industry: a.industry,
        total: own.length,
        inProgress: own.filter((t) => t.status === "진행중").length,
        stale: own.filter(stale).length,
      };
    })
    .filter((a) => a.total > 0)
    .sort((a, b) => b.stale - a.stale || b.total - a.total);

  return {
    dateLabel: formatKoreanDate(today),
    summary: {
      advertisers: byAdvertiser.length,
      totalTasks: tasks.length,
      inProgress: tasks.filter((t) => t.status === "진행중").length,
      waiting: tasks.filter((t) => t.status === "대기").length,
      done: tasks.filter((t) => t.status === "완료").length,
      stale: active.filter(stale).length,
    },
    byStaff,
    byAdvertiser,
    notIncluded: ds.calendarEvents.length
      ? []
      : ["일정", "재무·계약", "커뮤니케이션", "광고 성과(리드 수)"],
  };
}

/** 보고서를 카톡/메일에 붙여넣기 좋은 일반 텍스트로 변환 */
export function reportToText(r: DailyReport): string {
  const L: string[] = [];
  L.push(`📋 오늘의 운영 보고서 — ${r.dateLabel}`);
  L.push("");
  L.push("[ 요약 ]");
  L.push(`· 운영 광고주: ${r.summary.advertisers}곳`);
  L.push(
    `· 업무: 총 ${r.summary.totalTasks}건 (진행중 ${r.summary.inProgress} · 대기 ${r.summary.waiting} · 완료 ${r.summary.done})`
  );
  L.push(`· 날짜 지난 미완료: ${r.summary.stale}건`);
  L.push("");
  L.push("[ 직원별 업무 ]");
  if (r.byStaff.length === 0) L.push("· (해당 없음)");
  for (const s of r.byStaff) {
    let line = `· ${s.name}: 진행 ${s.inProgress} · 대기 ${s.waiting}`;
    if (s.stale > 0) line += ` · 지난건 ${s.stale}`;
    L.push(line);
    if (s.topStaleTask) L.push(`   └ 가장 오래된 미완료: ${s.topStaleTask}`);
  }
  L.push("");
  L.push("[ 광고주별 진행 ]");
  if (r.byAdvertiser.length === 0) L.push("· (해당 없음)");
  for (const a of r.byAdvertiser) {
    let line = `· ${a.name} (${a.industry}): 업무 ${a.total}건`;
    if (a.inProgress > 0) line += ` · 진행 ${a.inProgress}`;
    if (a.stale > 0) line += ` · 지난건 ${a.stale}`;
    L.push(line);
  }
  if (r.notIncluded.length > 0) {
    L.push("");
    L.push(`※ 아직 미연동(다음 단계): ${r.notIncluded.join(", ")}`);
  }
  return L.join("\n");
}
