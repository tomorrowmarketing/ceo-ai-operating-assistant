import type { Staff } from "@/lib/types";

/** 직원 (가상 데이터) */
export const staff: Staff[] = [
  { id: "s1", name: "김선우", role: "AE 팀장", team: "AE" },
  { id: "s2", name: "이지은", role: "AE", team: "AE" },
  { id: "s3", name: "박도현", role: "운영 매니저", team: "운영" },
  { id: "s4", name: "최유라", role: "퍼포먼스 디자이너", team: "디자인" },
  { id: "s5", name: "정민호", role: "미디어 바이어", team: "미디어" },
];

export const staffById = (id: string): Staff | undefined =>
  staff.find((s) => s.id === id);
