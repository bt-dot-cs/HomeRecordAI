/**
 * contextFilter.ts — applies per-audience exclusion rules before agents receive context.
 *
 * Exclusion rules from audience_schemas.md:
 *
 * | Field                     | Appraiser | Ins.Inspector | Buyer | Contractor |
 * |---------------------------|-----------|---------------|-------|------------|
 * | Owner full name           |     ✓     |       ✓       |   ✗   |     ✗      |
 * | Insurance policy/premium  |     ✗     |       ✓       |   ✗   |     ✗      |
 * | Appliance serial numbers  |     ✗     |       ✗       |   ✗   |     ✓      |
 * | Contractor payment amounts|     ✗     |       ✗       |   ✗   |     ✗      |
 * | Check / payment refs      |     ✗     |       ✗       |   ✗   |     ✗      |
 * | Market value estimate     |     ✓     |       ✗       |   ✓   |     ✗      |
 * | Permit numbers            |     ✓     |       ✓       |   ✗   |     ✓      |
 * | Inspector license number  |     ✓     |       ✓       |   ✗   |     ✗      |
 */

export type AudienceType =
  | "appraiser"
  | "insurance_inspector"
  | "buyer"
  | "contractor";

type Context = Record<string, Record<string, unknown>>;

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/** Recursively delete every occurrence of `key` in a nested object/array. */
function stripKey(obj: unknown, key: string): void {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    (obj as unknown[]).forEach((item) => stripKey(item, key));
  } else {
    const rec = obj as Record<string, unknown>;
    delete rec[key];
    Object.values(rec).forEach((v) => stripKey(v, key));
  }
}

function applyStrips(ctx: Context, docType: string, keys: string[]): void {
  if (!ctx[docType]) return;
  keys.forEach((k) => stripKey(ctx[docType], k));
}

export function filterContextForAudience(
  fullContext: Context,
  audience: AudienceType
): Context {
  const ctx = deepClone(fullContext);

  // ── Global strips: nobody receives these ──────────────────────────────────
  // Contractor payment amounts and payment references
  applyStrips(ctx, "contractor_invoice", [
    "labor",
    "materials",
    "subtotal",
    "tax",
    "total",
    "check_number",
    "payment_reference",
  ]);

  // ── Audience-specific strips ──────────────────────────────────────────────
  switch (audience) {
    case "appraiser":
      // Remove: insurance policy/premium, appliance serial numbers
      applyStrips(ctx, "appliance_warranty", ["serial_number", "plan_number"]);
      // Keep: owner name, permit numbers, inspector license
      break;

    case "insurance_inspector":
      // Remove: appliance serial numbers (water heater age kept via age field, not serial)
      applyStrips(ctx, "appliance_warranty", ["serial_number", "plan_number"]);
      // Keep: owner name, insurance details (if present), permit numbers, inspector license
      break;

    case "buyer":
      // Remove: owner name, insurance policy/premium, appliance serial numbers,
      //         permit numbers, inspector license
      applyStrips(ctx, "inspection_report", ["client", "owner", "certification"]);
      applyStrips(ctx, "appliance_warranty", ["serial_number", "plan_number"]);
      applyStrips(ctx, "permit", ["permit_number"]);
      break;

    case "contractor":
      // Remove: owner name, insurance details, inspector license
      // Keep: appliance serial numbers ✓, permit numbers ✓
      applyStrips(ctx, "inspection_report", ["client", "owner", "certification"]);
      break;
  }

  return ctx;
}
