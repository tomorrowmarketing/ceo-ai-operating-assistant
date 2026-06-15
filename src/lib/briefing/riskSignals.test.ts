import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRiskSignals } from "./riskSignals";
import { mockSource } from "@/lib/data";
import { TODAY } from "@/lib/mock";

test("한결법률사무소(a4): 긴급 리스크로 분류", () => {
  const signals = buildRiskSignals(mockSource, TODAY);
  const a4 = signals.find((s) => s.advertiserId === "a4");
  assert.ok(a4, "a4 리스크 신호가 있어야 한다");
  assert.equal(a4!.severity, "긴급");
  // 리드 급감 + 불만 + 미수금 신호 포함
  assert.ok(a4!.signals.some((s) => s.includes("급감")));
  assert.ok(a4!.signals.some((s) => s.includes("불만")));
  assert.ok(a4!.signals.some((s) => s.includes("미수금")));
});

test("강남미소치과(a1): 리스크 신호 없음 (목록에서 제외)", () => {
  const signals = buildRiskSignals(mockSource, TODAY);
  assert.equal(
    signals.find((s) => s.advertiserId === "a1"),
    undefined
  );
});

test("온보딩 광고주(a7): 접점 공백 신호로 잡히지 않음", () => {
  const signals = buildRiskSignals(mockSource, TODAY);
  const a7 = signals.find((s) => s.advertiserId === "a7");
  // 온보딩은 접점 공백/전환율 저조에서 제외되므로 신호가 없어야 한다
  assert.equal(a7, undefined);
});

test("결과는 severity 오름차순(긴급 먼저)으로 정렬", () => {
  const signals = buildRiskSignals(mockSource, TODAY);
  const ranks = signals.map((s) => (s.severity === "긴급" ? 0 : 1));
  const sorted = [...ranks].sort((a, b) => a - b);
  assert.deepEqual(ranks, sorted);
});
