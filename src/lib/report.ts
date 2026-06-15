/**
 * 일일 운영 보고서 생성 (순수 함수).
 *
 * 현재 연결된 실데이터(업무·담당자·광고주)를 기준으로, 대표님이 매일 아침 보는
 * 보고서를 만든다. 담당자별로 각자 맡은 업무를 상세히 나열한다.
 * 화면 렌더와 '복사용 텍스트' 양쪽에서 쓴다.
 */
import type { DataSource } from "@/lib/data";
import { isOverdue } from "@/lib/briefing/utils";

export interface ReportTaskLine {
  title: string;
  status: string;
  advertiserName?: string;
  date?: string;
  /** 날짜가 오늘 이전인 미완료 */
  stale: boolean;
}

export interface StaffReport {
  name: string;
  inProgress: number;
  waiting: number;
  stale: number;
  /** 그 담당자의 미완료 업무 상세 (지연→진행중→대기 순) */
  tasks: ReportTaskLine[];
}

export interface DailyReport {
  dateLabel: string;
  summary: {
    advertisers: number;
    totalTasks: number;
    inProgress: number;
    waiting: number;
    done: number;
    stale: number;
  };
  byStaff: StaffReport[];
  byAdvertiser: {
    name: string;
    industry: string;
    total: number;
    inProgress: number;
    stale: number;
  }[];
  notIncluded: string[];
}

function formatKoreanDate(d: string): string {
  const date = new Date(`${d}T00:00:00`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

/** YYYY-MM-DD → "6/12" */
function shortDate(d: string): string {
  if (!d) return "";
  const [, m, day] = d.slice(0, 10).split("-");
  return m && day ? `${Number(m)}/${Number(day)}` : "";
}

/** 정렬 가중치: 지연 먼저, 그다음 진행중, 대기 */
const statusWeight: Record<string, number> = {
  지연: 0,
  진행중: 1,
  대기: 2,
  완료: 9,
};

export function buildDailyReport(
  ds: DataSource,
  today: string = ds.today
): DailyReport {
  const tasks = ds.tasks;
  const isStale = (t: { status: string; dueDate: string }) =>
    t.status !== "완료" && !!t.dueDate && isOverdue(t.dueDate, today);

  // 담당자별 상세
  const byStaff: StaffReport[] = ds.staff
    .map((s) => {
      const own = tasks.filter(
        (t) => t.assigneeId === s.id && t.status !== "완료"
      );
      const lines: ReportTaskLine[] = own
        .map((t) => ({
          title: t.title,
          status: t.status,
          advertiserName: ds.advertiserName(t.advertiserId),
          date: shortDate(t.dueDate),
          stale: isStale(t),
        }))
        .sort((a, b) => {
          // 지연 먼저
          const sa = a.stale ? -1 : 0;
          const sb = b.stale ? -1 : 0;
          if (sa !== sb) return sa - sb;
          return (statusWeight[a.status] ?? 5) - (statusWeight[b.status] ?? 5);
        });

      return {
        name: s.name,
        inProgress: own.filter((t) => t.status === "진행중").length,
        waiting: own.filter((t) => t.status === "대기").length,
        stale: own.filter(isStale).length,
        tasks: lines,
      };
    })
    .filter((s) => s.tasks.length > 0)
    .sort((a, b) => b.stale - a.stale || b.tasks.length - a.tasks.length);

  // 광고주별 요약
  const byAdvertiser = ds.advertisers
    .map((a) => {
      const own = tasks.filter((t) => t.advertiserId === a.id);
      return {
        name: a.name,
        industry: a.industry,
        total: own.length,
        inProgress: own.filter((t) => t.status === "진행중").length,
        stale: own.filter(isStale).length,
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
      stale: tasks.filter(isStale).length,
    },
    byStaff,
    byAdvertiser,
    notIncluded: ds.calendarEvents.length
      ? []
      : ["일정", "재무·계약", "커뮤니케이션", "광고 성과(리드 수)"],
  };
}

function taskLineText(t: ReportTaskLine): string {
  const tag = t.stale ? "지연" : t.status;
  const parts = [`   • [${tag}] ${t.title}`];
  const meta: string[] = [];
  if (t.advertiserName) meta.push(t.advertiserName);
  if (t.date) meta.push(t.date);
  return meta.length ? `${parts[0]} — ${meta.join(" · ")}` : parts[0];
}

/** 보고서를 카톡·메일·텔레그램에 붙여넣기 좋은 일반 텍스트로 변환 */
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
  L.push("━━━ 담당자별 업무 ━━━");
  if (r.byStaff.length === 0) L.push("· (해당 없음)");
  for (const s of r.byStaff) {
    L.push("");
    L.push(
      `■ ${s.name} — 진행 ${s.inProgress} · 대기 ${s.waiting}${s.stale > 0 ? ` · 지연 ${s.stale}` : ""}`
    );
    for (const t of s.tasks) L.push(taskLineText(t));
  }
  L.push("");
  L.push("━━━ 광고주별 진행 ━━━");
  if (r.byAdvertiser.length === 0) L.push("· (해당 없음)");
  for (const a of r.byAdvertiser) {
    let line = `· ${a.name} (${a.industry}): 업무 ${a.total}건`;
    if (a.inProgress > 0) line += ` · 진행 ${a.inProgress}`;
    if (a.stale > 0) line += ` · 지연 ${a.stale}`;
    L.push(line);
  }
  if (r.notIncluded.length > 0) {
    L.push("");
    L.push(`※ 아직 미연동(다음 단계): ${r.notIncluded.join(", ")}`);
  }
  return L.join("\n");
}
