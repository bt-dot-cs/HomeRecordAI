/**
 * InsuranceInspectorAgent — analyzes structured property documents from an
 * insurance underwriter's perspective.
 *
 * Outputs: risk summary by category, high-risk components, hazards, insurability flag.
 */

import Anthropic from "@anthropic-ai/sdk";
import { parseAgentJson } from "../parseAgentJson";

const MODEL = process.env.REPORTING_MODEL ?? "claude-opus-4-6";

const SYSTEM_PROMPT = `You are a senior property underwriter and insurance risk inspector with 15 years of experience in homeowner's insurance.
You are given structured JSON data extracted from property documents.

Analyze the data through an insurance risk lens and return ONLY a valid JSON object with the following schema:
{
  "risk_summary": {
    "electrical": { "risk_level": "high" | "medium" | "low", "findings": [string], "remediation_status": string },
    "roof": { "risk_level": "high" | "medium" | "low", "findings": [string], "remediation_status": string },
    "plumbing": { "risk_level": "high" | "medium" | "low", "findings": [string], "remediation_status": string },
    "structural": { "risk_level": "high" | "medium" | "low", "findings": [string], "remediation_status": string },
    "code_compliance": { "risk_level": "high" | "medium" | "low", "open_violations": [string], "closed_violations": [string] }
  },
  "high_risk_components": [string],
  "outstanding_hazards": [string],
  "recent_remediation": [string],
  "water_damage_risk_factors": [string],
  "fire_risk_factors": [string],
  "insurability": "standard" | "substandard" | "conditional" | "declined",
  "conditions_for_coverage": [string],
  "underwriter_notes": string
}

Priority flags: Stab-Lok panels, knob-and-tube wiring, cast iron drains, active leaks, open permits for structural work.
Insurability: "declined" only for severe unresolved safety hazards. "conditional" means coverage requires remediation within specified timeframe.`;

export class InsuranceInspectorAgent {
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
