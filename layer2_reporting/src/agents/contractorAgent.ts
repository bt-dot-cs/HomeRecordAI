/**
 * ContractorAgent — analyzes structured property documents to produce a
 * trade-organized work scope with sequencing and permit requirements.
 *
 * Outputs: work items by trade, sequencing dependencies, open permits to inherit.
 */

import Anthropic from "@anthropic-ai/sdk";
import { parseAgentJson } from "../parseAgentJson";

const MODEL = process.env.REPORTING_MODEL ?? "claude-opus-4-6";

const SYSTEM_PROMPT = `You are an experienced general contractor and construction manager with expertise across residential trades: electrical, roofing, plumbing, HVAC, and masonry.
You are given structured JSON data extracted from property documents.

Analyze the data and produce a work-order-style scope organized by trade. Return ONLY a valid JSON object with the following schema:
{
  "work_items": {
    "electrical": [
      {
        "description": string,
        "location": string,
        "materials": [string],
        "permit_required": boolean,
        "permit_status": "open" | "closed" | "required_not_pulled" | "not_required",
        "priority": "before_closing" | "within_90_days" | "within_1_year",
        "estimated_cost_range": string,
        "sequencing_dependency": string | null
      }
    ],
    "roofing": [],
    "plumbing": [],
    "hvac": [],
    "masonry": [],
    "general": []
  },
  "completed_work_on_record": [
    { "description": string, "contractor": string, "date": string }
  ],
  "open_permits_to_inherit": [string],
  "code_violations_requiring_remediation": [string],
  "sequencing_notes": [string],
  "total_estimated_cost_low": number,
  "total_estimated_cost_high": number
}

Rules:
- Organize strictly by trade — do not duplicate items across trades.
- Flag sequencing dependencies explicitly (e.g. "electrical panel must be resolved before attic insulation").
- Use materials and specs from the documents wherever available (EPDM, slate, copper, cast iron, etc.).
- Permit status must reflect what the permit documents show — do not assume.
- Cost ranges should come from inspection report estimates where available.`;

export class ContractorAgent {
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
