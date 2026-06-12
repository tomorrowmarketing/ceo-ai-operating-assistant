import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bySeverity,
  daysBetween,
  formatKRW,
  isOverdue,
  severityRank,
} from "./utils";

test("formatKRW: 만원/억원/원 단위 변환", () => {
  assert.equal(formatKRW(9_000_000), "900만원");
  assert.equal(formatKRW(5_500_000), "550만원");
  assert.equal(formatKRW(100_000_000), "1억원");
  assert.equal(formatKRW(150_000_000), "1.5억원");
  assert.equal(formatKRW(5_000), "5,000원");
});

test("daysBetween: 부호와 일수", () => {
  assert.equal(daysBetween("2026-06-15", "2026-06-12"), 3);
  assert.equal(daysBetween("2026-06-10", "2026-06-12"), -2);
  assert.equal(daysBetween("2026-06-12", "2026-06-12"), 0);
});

test("isOverdue: 기준일 이전이면 지연", () => {
  assert.equal(isOverdue("2026-06-09", "2026-06-12"), true);
  assert.equal(isOverdue("2026-06-12", "2026-06-12"), false);
  assert.equal(isOverdue("2026-06-13", "2026-06-12"), false);
});

test("severityRank: 긴급이 가장 위, 정상이 가장 아래", () => {
  assert.equal(severityRank["긴급"], 0);
  assert.ok(severityRank["긴급"] < severityRank["주의"]);
  assert.ok(severityRank["주의"] < severityRank["정상"]);
});

test("bySeverity: 정렬 비교자", () => {
  const arr = [
    { severity: "정상" as const },
    { severity: "긴급" as const },
    { severity: "주의" as const },
  ];
  arr.sort(bySeverity);
  assert.deepEqual(
    arr.map((x) => x.severity),
    ["긴급", "주의", "정상"]
  );
});
