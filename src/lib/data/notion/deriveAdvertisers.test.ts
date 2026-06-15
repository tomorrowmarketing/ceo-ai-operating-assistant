import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveAdvertisersFromTasks,
  extractAdvertiserName,
  guessIndustry,
} from "./deriveAdvertisers";
import type { Task } from "@/lib/types";

test("extractAdvertiserName: 알려진 광고주 우선 매칭", () => {
  assert.equal(
    extractAdvertiserName("법률사무소 도경 5차 소재 매체 세팅"),
    "법률사무소 도경"
  );
  assert.equal(
    extractAdvertiserName("법률사무소 도경_새 카피 잡아보기"),
    "법률사무소 도경"
  );
  assert.equal(extractAdvertiserName("미라클_소재 제작_진행 중"), "미라클");
});

test("extractAdvertiserName: 별칭 → 정식명, 일반 아이디 버킷", () => {
  // 리바이어던 별칭 → 정식명으로 합침
  assert.equal(
    extractAdvertiserName("리바이어던_개인회생: 빚 걱정 없는"),
    "법률사무소 리바이어던"
  );
  // 세부 미표기 아이디 → 일반 버킷, 단 아이디치과는 구분 유지
  assert.equal(extractAdvertiserName("아이디_처진눈 효율 개선"), "아이디");
  assert.equal(extractAdvertiserName("아이디치과_라미네이트"), "아이디치과");
});

test("extractAdvertiserName: [팀] 태그 제거 + 내부업무 제외", () => {
  assert.equal(extractAdvertiserName("[1팀] 6월 2주차 목표"), null);
  assert.equal(extractAdvertiserName("영업 랜딩 페이지 수정"), null);
});

test("guessIndustry: 이름으로 업종 추정", () => {
  assert.equal(guessIndustry("JN성형외과"), "병의원");
  assert.equal(guessIndustry("법률사무소 도경"), "법무법인");
  assert.equal(guessIndustry("오토디렉션 렌트카"), "장기렌트/리스");
});

test("deriveAdvertisersFromTasks: 광고주 묶기 + advertiserId 채움", () => {
  const tasks: Task[] = [
    {
      id: "t1",
      title: "법률사무소 도경 5차 소재",
      advertiserId: null,
      assigneeId: "u1",
      status: "진행중",
      priority: "보통",
      dueDate: "2026-06-11",
    },
    {
      id: "t2",
      title: "법률사무소 도경_카피",
      advertiserId: null,
      assigneeId: "u1",
      status: "대기",
      priority: "보통",
      dueDate: "2026-06-05",
    },
    {
      id: "t3",
      title: "[1팀] 주간 목표",
      advertiserId: null,
      assigneeId: "u2",
      status: "대기",
      priority: "보통",
      dueDate: "2026-06-10",
    },
  ];
  const advs = deriveAdvertisersFromTasks(tasks);
  // 도경 1곳으로 묶이고, 내부업무(t3)는 광고주 없음
  assert.equal(advs.length, 1);
  assert.equal(advs[0].name, "법률사무소 도경");
  assert.equal(advs[0].industry, "법무법인");
  assert.equal(advs[0].managerId, "u1");
  assert.equal(tasks[0].advertiserId, advs[0].id);
  assert.equal(tasks[1].advertiserId, advs[0].id);
  assert.equal(tasks[2].advertiserId, null);
  // 최신 접점일 = 가장 늦은 dueDate
  assert.equal(advs[0].lastContact, "2026-06-11");
});
