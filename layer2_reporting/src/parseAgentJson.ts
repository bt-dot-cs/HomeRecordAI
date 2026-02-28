/**
 * parseAgentJson.ts — robust JSON extraction from Claude agent responses.
 *
 * Handles: markdown code fences, preamble text, trailing commentary.
 * Extracts the first complete {...} block regardless of surrounding content.
 */

export function parseAgentJson(raw: string): Record<string, unknown> {
  let text = raw.trim();

  // Strip markdown code fences
  if (text.startsWith("```")) {
    text = text
      .split("\n")
      .filter((l) => !l.startsWith("```"))
      .join("\n")
      .trim();
  }

  // Find the outermost {...} block to discard any preamble or trailing commentary
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  return JSON.parse(text) as Record<string, unknown>;
}
