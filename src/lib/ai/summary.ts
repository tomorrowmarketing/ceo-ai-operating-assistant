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
import { fetchImageBase64, fetchTaskContent } from "@/lib/data/notion/content";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
/** 본문/이미지를 가져올 업무 수 상한 (비용·속도 제어) */
const CONTENT_TASK_LIMIT = 16;
/** 요청에 포함할 이미지 총 상한 */
const IMAGE_LIMIT = 5;

export function aiConfigured(): boolean {
  if (process.env.ENABLE_AI_SUMMARY !== "true") return false;
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
    const images: { media_type: string; data: string }[] = [];

    if (token) {
      for (const t of activeTaskIds) {
        try {
          const c = await fetchTaskContent(token, t.id);
          const adv = ds.advertiserName(t.advertiserId);
          const who = ds.staffById(t.assigneeId)?.name;
          // 본문이 있으면 본문을, 없으면 제목만이라도 담당자·광고주와 함께 제공
          const head = `· [${who ?? "?"} / ${adv ?? "광고주미상"}] ${t.title} (상태: ${t.status})`;
          detailTexts.push(
            c.text ? `${head}\n  ${c.text.slice(0, 800)}` : head
          );
          for (const url of c.imageUrls) {
            if (images.length >= IMAGE_LIMIT) break;
            const img = await fetchImageBase64(url); // 5MB 초과/미지원 타입은 null
            if (img) images.push(img);
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
        "다음은 광고대행사의 오늘 운영 현황입니다.\n\n" +
        "[ 담당자별 전체 업무(제목·상태) ]\n" +
        reportToText(report),
    });
    if (detailTexts.length > 0) {
      content.push({
        type: "text",
        text:
          "\n[ 주요 미완료 업무의 실제 내용(담당자/광고주/제목 + 본문) ]\n" +
          detailTexts.join("\n"),
      });
    }
    for (const img of images) {
      content.push({ type: "text", text: "[업무 첨부 이미지 — 내용을 읽고 요약에 반영]" });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.media_type as "image/png",
          data: img.data,
        },
      });
    }
    content.push({
      type: "text",
      text:
        "위 실제 업무 내용(제목·본문·이미지)만 근거로 JSON으로 답하세요. 규칙:\n" +
        "1) 반드시 구체적인 업무명·광고주명·마감일을 인용할 것. 예: '법무법인 도경 5차 소재 매체 세팅(메타/구글) 진행, 6/10 마감 지남'.\n" +
        "2) '안정적입니다', '집중하고 있습니다', '원활합니다', '다양한 업무' 같은 일반론·미사여구·당연한 말은 절대 쓰지 말 것.\n" +
        "3) 자료에 없는 내용은 추측하지 말 것.\n" +
        "- perStaff[].summary: 그 담당자가 맡은 구체적 광고주·작업과 지연/막힌 건을 업무명을 들어 2~3문장.\n" +
        "- overall: 대표가 먼저 봐야 할 가장 시급한 구체 사안 3~5개를 각각 업무명·광고주와 함께 한 줄씩.",
    });

    const client = new Anthropic();

    async function run(
      blocks: Anthropic.ContentBlockParam[]
    ): Promise<AiSummary> {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        thinking: { type: "adaptive" },
        output_config: {
          effort: "medium",
          format: { type: "json_schema", schema: OUTPUT_SCHEMA },
        },
        system:
          "당신은 광고대행사 대표의 운영 비서입니다. 주어진 실제 업무 내용(제목·본문·이미지)을 근거로 " +
          "무엇을 하고 있고 무엇이 지연·막혀 있는지를 구체적으로 요약합니다. 반드시 실제 업무명·광고주명·마감일을 인용하고, " +
          "'안정적', '집중하고 있다', '원활하다' 같은 일반론·미사여구는 절대 쓰지 않습니다. 자료에 없는 것은 추측하지 않습니다.",
        messages: [{ role: "user", content: blocks }],
      } as Anthropic.MessageCreateParamsNonStreaming);

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("응답에 텍스트 블록 없음");
      }
      const parsed = JSON.parse(textBlock.text) as {
        overall: string;
        perStaff: { name: string; summary: string }[];
      };
      const perStaff: Record<string, string> = {};
      for (const p of parsed.perStaff ?? []) perStaff[p.name] = p.summary;
      return { overall: parsed.overall ?? "", perStaff };
    }

    try {
      return await run(content);
    } catch (e) {
      // 이미지 크기 초과 등으로 실패하면 글(텍스트)만으로 재시도
      console.warn(
        "[ai] 이미지 포함 요약 실패 → 텍스트만으로 재시도:",
        (e as Error).message
      );
      const textOnly = content.filter((b) => b.type === "text");
      return await run(textOnly);
    }
  } catch (e) {
    console.warn("[ai] 요약 생성 실패 → 집계 보고서로 폴백:", (e as Error).message);
    return null;
  }
}
