import { test } from "node:test";
import assert from "node:assert/strict";
import { buildStaffBottlenecks } from "./staffBottlenecks";
import { TODAY } from "@/lib/mock";

test("이지은(s2): 지연 2건 → 주의, 가장 오래된 지연을 topOverdueTask로", () => {
  const items = buildStaffBottlenecks(TODAY);
  const s2 = items.find((i) => i.staffId === "s2");
  assert.ok(s2);
  assert.equal(s2!.overdueCount, 2); // t3, t9
  assert.equal(s2!.severity, "주의");
  assert.ok(s2!.topOverdueTask?.includes("응대 스크립트")); // t9 (2026-06-07, 가장 오래됨)
});

test("지연 0 + 진행중만 있는 담당자(s1)는 정상", () => {
  const items = buildStaffBottlenecks(TODAY);
  const s1 = items.find((i) => i.staffId === "s1");
  assert.ok(s1);
  assert.equal(s1!.overdueCount, 0);
  assert.equal(s1!.severity, "정상");
});

test("완료 업무는 병목 집계에서 제외", () => {
  const items = buildStaffBottlenecks(TODAY);
  // s1의 t13(완료)은 overdue/inProgress 어디에도 잡히지 않아야 한다
  const s1 = items.find((i) => i.staffId === "s1");
  assert.ok(s1);
  assert.equal(s1!.inProgressCount, 1); // t5만
});

test("정렬: 주의가 정상보다 앞", () => {
  const items = buildStaffBottlenecks(TODAY);
  const firstNormalIdx = items.findIndex((i) => i.severity === "정상");
  const lastWarnIdx = items.map((i) => i.severity).lastIndexOf("주의");
  if (firstNormalIdx !== -1 && lastWarnIdx !== -1) {
    assert.ok(lastWarnIdx < firstNormalIdx);
  }
});
