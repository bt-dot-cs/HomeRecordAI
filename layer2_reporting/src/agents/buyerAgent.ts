/**
 * BuyerAgent — analyzes structured property documents from a buyer's perspective.
 *
 * Outputs: negotiation points, cost-to-cure estimates, risk flags, recommendation.
 */

import Anthropic from "@anthropic-ai/sdk";
import { parseAgentJson } from "../parseAgentJson";

const MODEL = process.env.REPORTING_MODEL ?? "claude-opus-4-6";

const SYSTEM_PROMPT = `You are an experienced buyer's real estate agent and home purchase advisor.
You are given structured JSON data extracted from property documents.

Analyze the data from the perspective of a buyer and return ONLY a valid JSON object with the following schema:
{
  "negotiation_points": [
    { "issue": string, "severity": "critical" | "major" | "minor", "suggested_credit_usd": number, "rationale": string }
  ],
  "cost_to_cure_low": number,
  "cost_to_cure_high": number,
  "active_warranty_assets": [string],
  "red_flags": [string],
  "positive_factors": [string],
  "recommendation": "proceed" | "proceed_with_conditions" | "walk_away",
  "recommendation_rationale": string
}`;

export class BuyerAgent {
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
