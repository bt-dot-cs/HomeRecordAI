/**
 * AppraiserAgent — analyzes structured property documents through an appraiser's lens.
 *
 * Outputs: valuation adjustments, deferred maintenance impact, comparable notes.
 */

import Anthropic from "@anthropic-ai/sdk";
import { parseAgentJson } from "../parseAgentJson";

const MODEL = process.env.REPORTING_MODEL ?? "claude-opus-4-6";

const SYSTEM_PROMPT = `You are a licensed real estate appraiser with 20 years of experience in residential property valuation.
You are given structured JSON data extracted from property documents (inspection reports, permits, invoices, warranties).

Analyze the data and return ONLY a valid JSON object with the following schema:
{
  "valuation_adjustments": [
    { "item": string, "direction": "positive" | "negative" | "neutral", "estimated_impact_usd": number, "rationale": string }
  ],
  "deferred_maintenance_total_low": number,
  "deferred_maintenance_total_high": number,
  "permit_compliance_flag": boolean,
  "appraiser_notes": string,
  "confidence": "high" | "medium" | "low"
}`;

export class AppraiserAgent {
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
