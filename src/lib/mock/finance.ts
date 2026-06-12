import type { FinanceTransaction } from "@/lib/types";

/**
 * 재무 거래 (가상 데이터)
 * 금액/상태/기한만 저장한다. 계좌번호·카드번호·세금계산서 원본은 저장하지 않는다.
 * 기준일 2026-06-12. dueDate가 지난 '예정'은 연체로 다뤄질 수 있다.
 */
export const financeTransactions: FinanceTransaction[] = [
  {
    id: "f1",
    advertiserId: "a4",
    type: "미수금",
    amount: 9_000_000,
    dueDate: "2026-05-31",
    status: "연체",
    memo: "5월 광고비 미수 (연체 12일)",
  },
  {
    id: "f2",
    advertiserId: "a6",
    type: "미수금",
    amount: 5_500_000,
    dueDate: "2026-06-10",
    status: "연체",
    memo: "6월 1차 집행분 미입금",
  },
  {
    id: "f3",
    advertiserId: "a1",
    type: "입금예정",
    amount: 8_000_000,
    dueDate: "2026-06-15",
    status: "예정",
    memo: "6월 광고비 정기 입금",
  },
  {
    id: "f4",
    advertiserId: "a5",
    type: "입금예정",
    amount: 15_000_000,
    dueDate: "2026-06-13",
    status: "예정",
    memo: "6월 광고비 정기 입금",
  },
  {
    id: "f5",
    advertiserId: null,
    type: "지출",
    amount: 22_000_000,
    dueDate: "2026-06-14",
    status: "예정",
    memo: "매체사 6월 광고비 선결제",
  },
  {
    id: "f6",
    advertiserId: "a3",
    type: "세금계산서",
    amount: 12_000_000,
    dueDate: "2026-06-12",
    status: "예정",
    memo: "6월 세금계산서 발행 예정 (발행 확인 필요)",
  },
  {
    id: "f7",
    advertiserId: "a8",
    type: "입금예정",
    amount: 10_000_000,
    dueDate: "2026-06-18",
    status: "예정",
    memo: "6월 광고비 정기 입금",
  },
  {
    id: "f8",
    advertiserId: "a1",
    type: "세금계산서",
    amount: 8_000_000,
    dueDate: "2026-06-30",
    status: "예정",
    memo: "6월분 세금계산서",
  },
];
