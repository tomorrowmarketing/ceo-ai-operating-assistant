import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFinanceAlerts } from "./financeAlerts";
import { mockSource } from "@/lib/data";
import { TODAY } from "@/lib/mock";

test("연체 미수금(f1)은 긴급으로 분류되고 연체 일수를 표기", () => {
  const alerts = buildFinanceAlerts(mockSource, TODAY);
  const f1 = alerts.find((a) => a.id === "f1");
  assert.ok(f1);
  assert.equal(f1!.severity, "긴급");
  assert.equal(f1!.category, "미수금");
  assert.ok(f1!.title.includes("연체"));
});

test("기한 임박(±3일) 입금예정은 알림에 포함", () => {
  const alerts = buildFinanceAlerts(mockSource, TODAY);
  // f4: 2026-06-13 (D-1) 입금예정
  assert.ok(alerts.some((a) => a.id === "f4"));
  // f7: 2026-06-18 (D-6) → 임박 아님, 제외
  assert.equal(
    alerts.find((a) => a.id === "f7"),
    undefined
  );
});

test("만료 임박 계약은 contract- 접두 알림으로 포함", () => {
  const alerts = buildFinanceAlerts(mockSource, TODAY);
  const contractAlerts = alerts.filter((a) => a.category === "계약");
  assert.ok(contractAlerts.length > 0);
  // a4 계약(만료임박, 자동갱신 아님)은 주의
  const ct4 = contractAlerts.find((a) => a.id === "contract-ct4");
  assert.ok(ct4);
  assert.equal(ct4!.severity, "주의");
});

test("정렬: 긴급 알림이 맨 앞", () => {
  const alerts = buildFinanceAlerts(mockSource, TODAY);
  assert.equal(alerts[0]?.severity, "긴급");
});
