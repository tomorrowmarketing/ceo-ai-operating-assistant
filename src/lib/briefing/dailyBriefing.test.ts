import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDailyBriefing } from "./index";
import { buildScheduleSummary } from "./schedule";
import { mockSource } from "@/lib/data";
import { TODAY } from "@/lib/mock";

test("일일 브리핑: 핵심 지표가 일관되게 채워진다", () => {
  const b = buildDailyBriefing(mockSource);
  assert.equal(b.date, TODAY);
  assert.ok(b.metrics.activeAdvertisers >= 1);
  assert.ok(b.metrics.atRiskAdvertisers >= 1); // 한결법률 등
  assert.ok(b.metrics.overdueTasks >= 1);
  assert.equal(b.metrics.pendingApprovals, b.approvals.length);
});

test("대표 액션 아이템은 최대 5개, 긴급이 앞에 온다", () => {
  const b = buildDailyBriefing(mockSource);
  assert.ok(b.actionItems.length <= 5);
  if (b.actionItems.length > 1) {
    assert.equal(b.actionItems[0].severity, "긴급");
  }
});

test("이탈 위험이 있으면 헤드라인이 직접 대응을 강조", () => {
  const b = buildDailyBriefing(mockSource);
  if (b.metrics.atRiskAdvertisers > 0) {
    assert.ok(b.headline.includes("직접 대응"));
  }
});

test("오늘 일정 요약: 개인 일정은 제목이 마스킹된다", () => {
  const s = buildScheduleSummary(mockSource, TODAY);
  assert.equal(s.totalCount, 5);
  assert.equal(s.advertiserMeetingCount, 3); // 광고주미팅 2 + 상담콜 1
  const personal = s.events.find((e) => e.type === "개인");
  assert.ok(personal);
  assert.equal(personal!.title, "개인 일정");
  assert.equal(personal!.advertiserName, undefined);
});
