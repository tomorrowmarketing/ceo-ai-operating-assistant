import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROPS,
  maskPhone,
  mapAdvertiser,
  mapCalendarEvent,
  mapCommunication,
  mapFinance,
} from "./map";
import type { NotionPage } from "./client";

// Notion 속성 값 빌더
const title = (s: string) => ({ title: [{ plain_text: s }] });
const text = (s: string) => ({ rich_text: [{ plain_text: s }] });
const select = (name: string) => ({ select: { name } });
const number = (n: number) => ({ number: n });
const date = (start: string, end?: string) => ({ date: { start, end } });
const checkbox = (b: boolean) => ({ checkbox: b });
const relation = (id: string) => ({ relation: [{ id }] });

test("maskPhone: 다양한 형식의 전화번호를 마스킹", () => {
  assert.equal(maskPhone("010-1234-5678"), "010-****-5678");
  assert.equal(maskPhone("01012345678"), "010-****-5678");
  assert.equal(maskPhone("문의 010 9876 5432 입니다"), "문의 010-****-5432 입니다");
});

test("mapAdvertiser: 속성 → 도메인 + id는 페이지 id", () => {
  const k = PROPS.advertiser;
  const page: NotionPage = {
    id: "adv-1",
    properties: {
      [k.name]: title("강남미소치과"),
      [k.industry]: select("병의원"),
      [k.status]: select("정상"),
      [k.monthlyBudget]: number(8_000_000),
      [k.manager]: relation("staff-1"),
      [k.since]: date("2024-03-01"),
      [k.leads30d]: number(142),
      [k.leadDeltaPct]: number(6),
      [k.consultRate]: number(38),
      [k.lastContact]: date("2026-06-11"),
    },
  };
  const a = mapAdvertiser(page);
  assert.equal(a.id, "adv-1");
  assert.equal(a.name, "강남미소치과");
  assert.equal(a.industry, "병의원");
  assert.equal(a.monthlyBudget, 8_000_000);
  assert.equal(a.managerId, "staff-1");
  assert.equal(a.since, "2024-03"); // YYYY-MM
  assert.equal(a.lastContact, "2026-06-11");
});

test("mapCommunication: 발신자 전화번호 마스킹 강제 적용", () => {
  const k = PROPS.communication;
  const page: NotionPage = {
    id: "c-1",
    properties: {
      [k.channel]: select("카카오톡"),
      [k.advertiser]: relation("adv-9"),
      [k.from]: text("한결법률 대표 010-3271-1234"),
      [k.subject]: text("성과 문의"),
      [k.summary]: text("리드가 줄었다는 불만"),
      [k.receivedAt]: date("2026-06-12T07:40:00"),
      [k.requiresReply]: checkbox(true),
      [k.sentiment]: select("부정"),
      [k.important]: checkbox(true),
    },
  };
  const c = mapCommunication(page);
  assert.equal(c.from, "한결법률 대표 010-****-1234"); // 마스킹됨
  assert.equal(c.advertiserId, "adv-9");
  assert.equal(c.requiresReply, true);
  assert.equal(c.receivedAt, "2026-06-12 07:40"); // 'T' → 공백, 분까지
});

test("mapCalendarEvent: 개인 일정은 제목 마스킹 + 광고주 미노출", () => {
  const k = PROPS.calendar;
  const page: NotionPage = {
    id: "e-1",
    properties: {
      [k.title]: title("가족 모임 상세"),
      [k.date]: date("2026-06-12"),
      [k.start]: text("19:00"),
      [k.end]: text("20:00"),
      [k.type]: select("개인"),
      [k.advertiser]: relation("adv-1"),
      [k.isPrivate]: checkbox(true),
    },
  };
  const e = mapCalendarEvent(page);
  assert.equal(e.title, "개인 일정");
  assert.equal(e.isPrivate, true);
  assert.equal(e.advertiserId, null);
});

test("mapFinance: 금액/상태/기한만 매핑 (민감 식별정보 없음)", () => {
  const k = PROPS.finance;
  const page: NotionPage = {
    id: "f-1",
    properties: {
      [k.type]: select("미수금"),
      [k.advertiser]: relation("adv-4"),
      [k.amount]: number(9_000_000),
      [k.dueDate]: date("2026-05-31"),
      [k.status]: select("연체"),
      [k.memo]: text("5월 광고비 미수"),
    },
  };
  const f = mapFinance(page);
  assert.deepEqual(Object.keys(f).sort(), [
    "advertiserId",
    "amount",
    "dueDate",
    "id",
    "memo",
    "status",
    "type",
  ]);
  assert.equal(f.amount, 9_000_000);
  assert.equal(f.status, "연체");
});
