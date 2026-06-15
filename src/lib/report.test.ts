import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDailyReport, reportToText } from "./report";
import { mockSource } from "@/lib/data";

test("buildDailyReport: 요약/직원/광고주 집계", () => {
  const r = buildDailyReport(mockSource);
  assert.ok(r.summary.totalTasks > 0);
  // 진행중 + 대기 + 완료 합이 전체 이하 (지연 status 도 있을 수 있음)
  assert.ok(
    r.summary.inProgress + r.summary.waiting + r.summary.done <=
      r.summary.totalTasks
  );
  assert.ok(r.byStaff.length > 0);
  assert.ok(r.byAdvertiser.length > 0);
});

test("reportToText: 핵심 머리말 포함", () => {
  const r = buildDailyReport(mockSource);
  const text = reportToText(r);
  assert.ok(text.includes("오늘의 운영 보고서"));
  assert.ok(text.includes("[ 요약 ]"));
  assert.ok(text.includes("담당자별 업무"));
  assert.ok(text.includes("광고주별 진행"));
});
