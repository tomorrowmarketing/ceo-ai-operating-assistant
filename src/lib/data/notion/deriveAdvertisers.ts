/**
 * 업무(Task) 제목에서 광고주를 추출/도출한다.
 *
 * 대표님 Notion은 별도 '광고주 마스터' 표가 없어, 업무 제목에 들어있는 광고주명을
 * 기준으로 광고주를 묶는다. (휴리스틱 — 100% 정확하진 않으며 아래 목록으로 보정)
 */
import type { Advertiser, Industry, Task } from "@/lib/types";

/**
 * 업무 제목에서 인식할 광고주 이름 목록. (편집 지점)
 * 여기 있는 이름이 제목에 포함되면 그 광고주로 분류한다. (긴 이름 우선)
 * 대표님이 이름을 알려주시면 이 목록만 고치면 정확도가 올라갑니다.
 */
export const KNOWN_ADVERTISERS = [
  // 법무
  "법률사무소 도경",
  "법률사무소 블루트",
  "법률사무소 대한",
  "법률사무소 리바이어던",
  "법무법인 이준",
  "법무법인 준",
  "법무법인 초원",
  "법무법인 집현전",
  "법무법인 중정",
  "법무법인 도경",
  // 병의원
  "아이디병원",
  "아이디치과",
  "아이디피부과",
  "포에버의원",
  "모아만의원",
  "미라클 성형외과",
  "JN성형외과",
  // 렌트/리스
  "오토디렉션",
  "장기렌트",
  // 약식 표기(긴 이름 다음에 매칭)
  "미라클",
  "JN",
];

/** 광고주가 아닌 일반 업무 제목 단어 (폴백에서 제외) */
const TASK_STOPWORDS =
  /(소재|제작|캠페인|운영|페이지|목표|보고|세팅|수정|조사|기획|단가|정산|문의|회신|랜딩|카피)/;

/** 광고주명으로 업종 추정 */
export function guessIndustry(name: string): Industry {
  if (/성형외과|의원|병원|치과|클리닉|피부과|한의원/.test(name)) return "병의원";
  if (/법무법인|법률사무소|로펌|변호사/.test(name)) return "법무법인";
  if (/렌트|리스|렌터카|오토/.test(name)) return "장기렌트/리스";
  return "병의원";
}

/** 업무 제목 1건에서 광고주명 추출. 못 찾으면 null. */
export function extractAdvertiserName(rawTitle: string): string | null {
  // [1팀] 태그, 선행 괄호/따옴표 등 잡기호 제거
  const title = rawTitle
    .replace(/^\[[^\]]*\]\s*/, "")
    .replace(/^[[\]"'\s]+/, "")
    .trim();

  // 1) 알려진 광고주 우선 매칭 (긴 이름부터)
  const sorted = [...KNOWN_ADVERTISERS].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    if (title.includes(name)) return name;
  }

  // 2) 폴백: '_'/'('/',' 앞 첫 구간에 업종 키워드가 있고, 업무성 단어가 없을 때만
  const seg = title.split(/[_(,]/)[0].trim();
  const industryKeyword =
    /(성형외과|의원|병원|치과|클리닉|피부과|한의원|법무법인|법률사무소|로펌|렌트|리스|렌터카|오토)/;
  if (seg && seg.length <= 16 && industryKeyword.test(seg) && !TASK_STOPWORDS.test(seg)) {
    return seg;
  }
  return null;
}

function mode(arr: string[]): string {
  const count = new Map<string, number>();
  for (const x of arr) count.set(x, (count.get(x) ?? 0) + 1);
  let best = "";
  let bestN = 0;
  for (const [k, n] of count) if (n > bestN) [best, bestN] = [k, n];
  return best;
}

/**
 * 업무 목록에서 광고주를 도출한다. (각 업무의 advertiserId 도 함께 채운다)
 * 별도 광고주 표가 없을 때 사용.
 */
export function deriveAdvertisersFromTasks(tasks: Task[]): Advertiser[] {
  const groups = new Map<
    string,
    { name: string; dates: string[]; managers: string[] }
  >();

  for (const t of tasks) {
    const name = extractAdvertiserName(t.title);
    if (!name) {
      t.advertiserId = null;
      continue;
    }
    const id = "adv-" + name.replace(/\s/g, "");
    t.advertiserId = id;
    const g = groups.get(id) ?? { name, dates: [], managers: [] };
    if (t.dueDate) g.dates.push(t.dueDate);
    if (t.assigneeId) g.managers.push(t.assigneeId);
    groups.set(id, g);
  }

  return [...groups].map(([id, g]) => ({
    id,
    name: g.name,
    industry: guessIndustry(g.name),
    status: "정상",
    monthlyBudget: 0,
    managerId: mode(g.managers),
    since: "",
    leads30d: 0,
    leadDeltaPct: 0,
    consultRate: 0,
    lastContact: g.dates.sort().at(-1) ?? "",
  }));
}
