import { z } from "zod";

export const GEMINI_RESEARCH_MODEL = "gemini-3.1-pro-preview";

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_RESEARCH_MODEL}:generateContent`;

const premiumYieldItemSchema = z.object({
  asset: z.string().trim().min(1),
  protocol: z.string().trim().min(1),
  apy: z.string().trim().min(1),
  liquidity: z.string().trim().min(1),
  riskScore: z.coerce.number().finite(),
  trustScore: z.coerce.number().finite(),
  rationale: z.string().trim().min(1),
});

const premiumYieldResponseSchema = z.object({
  summary: z.string().trim().min(1),
  items: z.array(premiumYieldItemSchema).min(1).max(5),
});

export interface ResearchSource {
  title: string;
  url: string;
}

export interface PremiumYieldResearchItem {
  asset: string;
  protocol: string;
  apy: string;
  liquidity: string;
  riskScore: number;
  trustScore: number;
  rationale: string;
  sourceUrls: string[];
}

export interface PremiumYieldResearchResult {
  model: string;
  modelVersion?: string;
  grounded: boolean;
  generatedAt: string;
  query: string;
  summary: string;
  searchQueries: string[];
  sources: ResearchSource[];
  data: PremiumYieldResearchItem[];
}

function getGeminiApiKey(): string {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing GOOGLE_API_KEY or GEMINI_API_KEY for grounded Gemini research.",
    );
  }

  return apiKey;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonObject(text: string): string {
  const cleaned = stripCodeFences(text);
  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");

  if (objectStart >= 0 && objectEnd > objectStart) {
    return cleaned.slice(objectStart, objectEnd + 1);
  }

  return cleaned;
}

function extractResponseText(payload: unknown): string {
  const parts =
    (payload as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    })?.candidates?.[0]?.content?.parts ?? [];

  return parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function extractSources(payload: unknown): {
  sources: ResearchSource[];
  searchQueries: string[];
  modelVersion?: string;
} {
  const candidate = (payload as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{
          web?: {
            title?: string;
            uri?: string;
          };
        }>;
        webSearchQueries?: string[];
      };
    }>;
    modelVersion?: string;
  })?.candidates?.[0];

  const chunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const sources: ResearchSource[] = [];

  for (const chunk of chunks) {
    const title = chunk.web?.title?.trim();
    const url = chunk.web?.uri?.trim();

    if (!title || !url || seen.has(url)) {
      continue;
    }

    seen.add(url);
    sources.push({ title, url });
  }

  return {
    sources,
    searchQueries: candidate?.groundingMetadata?.webSearchQueries ?? [],
    modelVersion:
      (payload as { modelVersion?: string } | undefined)?.modelVersion,
  };
}

function buildResearchPrompt({
  objective,
  query,
}: {
  objective?: string;
  query?: string;
}): string {
  const userIntent = query?.trim() || objective?.trim();
  const today = new Date().toISOString().slice(0, 10);

  return [
    `Today's date is ${today}.`,
    "Research current stablecoin yield opportunities suitable for bounded treasury deployment.",
    userIntent ? `Mission objective: ${userIntent}` : null,
    "Use grounded web information and recent public sources, then return ONLY valid JSON.",
    'Expected JSON shape: {"summary":"string","items":[{"asset":"string","protocol":"string","apy":"string","liquidity":"string","riskScore":0.0,"trustScore":0.0,"rationale":"string"}]}',
    "Rules:",
    "- Return 3 to 5 items.",
    "- Focus on broadly used protocols and routes with meaningful liquidity and credible current reporting.",
    "- Prefer stablecoin opportunities a treasury operator could realistically consider today.",
    '- `apy` should be the currently reported yield as a short string. Use a range like "4.8%-5.3%" if sources disagree.',
    '- `liquidity` should be a short string like "$4.2B".',
    "- `riskScore` must be a number from 0.0 to 1.5 where <=0.80 is low, <=0.95 is caution, and >0.95 is high risk.",
    "- `trustScore` must be a number from 0 to 100 based on protocol maturity, liquidity depth, and source consistency.",
    "- `rationale` must be one concise sentence.",
    "- Do not include markdown fences or explanatory prose outside the JSON object.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function callGeminiGenerateContent(
  prompt: string,
  apiKey: string,
): Promise<unknown> {
  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        role: "system",
        parts: [
          {
            text:
              "You are a cautious DeFi research analyst. Ground your answer with Google Search, prefer current factual reporting over speculation, and obey the required JSON output shape exactly.",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 2048,
      },
    }),
  });

  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      typeof payload.error === "object" &&
      payload.error &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `Gemini research request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return payload;
}

function normalizeResearchResult(
  parsed: z.infer<typeof premiumYieldResponseSchema>,
  sources: ResearchSource[],
): PremiumYieldResearchItem[] {
  const topSourceUrls = sources.slice(0, 4).map((source) => source.url);

  return parsed.items.map((item) => ({
    asset: item.asset,
    protocol: item.protocol,
    apy: item.apy,
    liquidity: item.liquidity,
    riskScore: Number(Math.max(0, Math.min(1.5, item.riskScore)).toFixed(2)),
    trustScore: Number(Math.max(0, Math.min(100, item.trustScore)).toFixed(1)),
    rationale: item.rationale,
    sourceUrls: topSourceUrls,
  }));
}

export async function runPremiumYieldResearch(input: {
  objective?: string;
  query?: string;
}): Promise<PremiumYieldResearchResult> {
  const apiKey = getGeminiApiKey();
  const prompt = buildResearchPrompt(input);
  const payload = await callGeminiGenerateContent(prompt, apiKey);
  const responseText = extractResponseText(payload);

  if (!responseText) {
    throw new Error("Gemini research returned an empty response.");
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(extractJsonObject(responseText));
  } catch (error) {
    throw new Error(
      `Gemini research returned non-JSON output: ${
        error instanceof Error ? error.message : "Unknown parse error"
      }`,
    );
  }

  const parsed = premiumYieldResponseSchema.parse(parsedJson);
  const metadata = extractSources(payload);

  return {
    model: GEMINI_RESEARCH_MODEL,
    modelVersion: metadata.modelVersion,
    grounded: metadata.sources.length > 0,
    generatedAt: new Date().toISOString(),
    query: input.query?.trim() || input.objective?.trim() || "stablecoin yield research",
    summary: parsed.summary,
    searchQueries: metadata.searchQueries,
    sources: metadata.sources,
    data: normalizeResearchResult(parsed, metadata.sources),
  };
}
