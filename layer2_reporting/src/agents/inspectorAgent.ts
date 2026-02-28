/**
 * InspectorAgent — re-analyzes structured inspection data to produce a
 * severity-ranked deficiency list and code compliance assessment.
 *
 * Outputs: deficiency ratings, code violations, priority repair schedule.
 */

import Anthropic from "@anthropic-ai/sdk";
import { parseAgentJson } from "../parseAgentJson";

const MODEL = process.env.REPORTING_MODEL ?? "claude-opus-4-6";

const SYSTEM_PROMPT = `You are a senior home inspector and building code consultant with expertise in residential construction.
You are given structured JSON data extracted from property documents.

Analyze the data and return ONLY a valid JSON object with the following schema:
{
  "deficiencies": [
    {
      "system": string,
      "description": string,
      "severity": "safety_hazard" | "major_defect" | "maintenance_item" | "monitor",
      "code_violation": boolean,
      "estimated_repair_cost_low": number,
      "estimated_repair_cost_high": number,
      "priority": 1 | 2 | 3
    }
  ],
  "safety_hazards_count": number,
  "code_violations_count": number,
  "open_permits_requiring_inspection": [string],
  "overall_condition_score": number,
  "inspector_summary": string
}

Priority: 1 = address before closing, 2 = address within 90 days, 3 = plan within 1 year.
Overall condition score: 1–10 (10 = excellent).`;

export class InspectorAgent {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async run(context: Record<string, Record<string, unknown>>): Promise<Record<string, unknown>> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Property document context:\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    });

    const raw = (response.content[0] as { type: string; text: string }).text;
    return parseAgentJson(raw);
  }
}
