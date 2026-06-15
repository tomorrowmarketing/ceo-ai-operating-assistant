/**
 * AI 일일 보고서 요약 (Anthropic Claude).
 *
 * 업무의 글(제목·본문)과 이미지를 파악해 전체 핵심 + 담당자별 요약을 생성한다.
 * ANTHROPIC_API_KEY 미설정 시 null 반환 → 호출부는 집계 보고서로 폴백한다.
 *
 * 모델: 기본 claude-opus-4-8 (ANTHROPIC_MODEL 로 변경 가능, 예: 비용 절감 시 claude-haiku-4-5)
 */
import Anthropic from "@anthropic-ai/sdk";
import type { DataSource } from "@/lib/data";
import type { AiSummary, DailyReport } from "@/lib/report";
import { reportToText } from "@/lib/report";
import { readNotionEnv } from "@/lib/data/notion/env";
import { fetchTaskContent } from "@/lib/data/notion/content";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
/** 본문/이미지를 가져올 업무 수 상한 (비용·속도 제어) */
const CONTENT_TASK_LIMIT = 12;
/** 요청에 포함할 이미지 총 상한 */
const IMAGE_LIMIT = 10;

export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    overall: {
      type: "string",
      description: "대표가 오늘 알아야 할 핵심 3~5줄 (줄바꿈 포함, 한국어)",
    },
    perStaff: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          summary: {
            type: "string",
            description: "그 담당자가 무엇에 집중 중이고 무엇이 막혔는지 2~3문장",
          },
        },
        required: ["name", "summary"],
        additionalProperties: false,
      },
    },
  },
  required: ["overall", "perStaff"],
  additionalProperties: false,
} as const;

/**
 * 일일 보고서에 대한 AI 요약을 생성한다. 실패/미설정 시 null.
 */
export async function buildAiSummary(
  report: DailyReport,
  ds: DataSource
): Promise<AiSummary | null> {
  if (!aiConfigured()) return null;

  try {
    const token = readNotionEnv()?.token;

    // 본문·이미지를 가져올 업무 선정: 미완료 중 일부 (지연 우선 정렬은 byStaff가 이미 반영)
    const activeTaskIds = ds.tasks
      .filter((t) => t.status !== "완료")
      .slice(0, CONTENT_TASK_LIMIT);

    const detailTexts: string[] = [];
    const imageUrls: string[] = [];

    if (token) {
      for (const t of activeTaskIds) {
        try {
          const c = await fetchTaskContent(token, t.id);
          const adv = ds.advertiserName(t.advertiserId);
          const who = ds.staffById(t.assigneeId)?.name;
          if (c.text) {
            detailTexts.push(
              `· ${t.title}${adv ? ` (${adv})` : ""}${who ? ` / ${who}` : ""}\n  ${c.text.slice(0, 500)}`
            );
          }
          for (const url of c.imageUrls) {
            if (imageUrls.length >= IMAGE_LIMIT) break;
            if (!imageUrls.includes(url)) imageUrls.push(url);
          }
        } catch {
          /* 개별 업무 본문 실패는 무시 */
        }
      }
    }

    const content: Anthropic.ContentBlockParam[] = [];
    content.push({
      type: "text",
      text:
        "아래는 오늘의 운영 보고서 원자료입니다. 이 내용을 파악해 요약하세요.\n\n" +
        reportToText(report),
    });
    if (detailTexts.length > 0) {
      content.push({
        type: "text",
        text: "\n[ 주요 업무 본문 ]\n" + detailTexts.join("\n"),
      });
    }
    for (const url of imageUrls) {
      content.push({ type: "text", text: "[첨부 이미지]" });
      content.push({ type: "image", source: { type: "url", url } });
    }
    content.push({
      type: "text",
      text:
        "위 글과 이미지를 모두 파악해, 지정한 JSON 스키마로만 답하세요. " +
        "overall은 대표가 가장 먼저 알아야 할 핵심(이탈 위험·지연·기회)을 3~5줄로, " +
        "perStaff는 담당자별로 무엇에 집중하고 무엇이 막혀 있는지 2~3문장으로.",
    });

    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      system:
        "당신은 대한민국 리드수집 광고대행사 대표의 운영 비서입니다. " +
        "사실에 근거해 간결한 한국어로 요약하고, 추측은 피하며, 대표가 바로 판단할 수 있게 우선순위를 분명히 합니다.",
      messages: [{ role: "user", content }],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const parsed = JSON.parse(textBlock.text) as {
      overall: string;
      perStaff: { name: string; summary: string }[];
    };
    const perStaff: Record<string, string> = {};
    for (const p of parsed.perStaff ?? []) perStaff[p.name] = p.summary;
    return { overall: parsed.overall ?? "", perStaff };
  } catch (e) {
    console.warn("[ai] 요약 생성 실패 → 집계 보고서로 폴백:", (e as Error).message);
    return null;
  }
}
