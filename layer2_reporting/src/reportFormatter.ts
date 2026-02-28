/**
 * reportFormatter.ts — converts agent JSON output into formatted markdown reports.
 */

export function formatAppraiserReport(address: string, data: Record<string, unknown>): string {
  const adjustments = (data.valuation_adjustments as Array<Record<string, unknown>>) ?? [];
  const rows = adjustments
    .map(
      (a) =>
        `| ${a.item} | ${a.direction} | $${Number(a.estimated_impact_usd).toLocaleString()} | ${a.rationale} |`
    )
    .join("\n");

  const permitFlag = data.permit_compliance_flag ? "⚠️ OPEN PERMITS / VIOLATIONS PRESENT" : "✅ No open permit issues";

  return `# Appraiser Report
**Property:** ${address}
**Permit Compliance:** ${permitFlag}
**Confidence:** ${data.confidence ?? "—"}

---

## Valuation Adjustments

| Item | Direction | Est. Impact | Rationale |
|------|-----------|-------------|-----------|
${rows || "| — | — | — | No adjustments identified |"}

---

## Deferred Maintenance

| | Low | High |
|--|-----|------|
| **Estimated Total** | $${Number(data.deferred_maintenance_total_low ?? 0).toLocaleString()} | $${Number(data.deferred_maintenance_total_high ?? 0).toLocaleString()} |

---

## Appraiser Notes

${data.appraiser_notes ?? "—"}
`;
}

export function formatBuyerReport(address: string, data: Record<string, unknown>): string {
  const points = (data.negotiation_points as Array<Record<string, unknown>>) ?? [];
  const redFlags = (data.red_flags as string[]) ?? [];
  const positives = (data.positive_factors as string[]) ?? [];
  const warranties = (data.active_warranty_assets as string[]) ?? [];

  const negotiationRows = points
    .map(
      (p) =>
        `| ${p.issue} | ${p.severity} | $${Number(p.suggested_credit_usd).toLocaleString()} | ${p.rationale} |`
    )
    .join("\n");

  const recEmoji: Record<string, string> = {
    proceed: "✅",
    proceed_with_conditions: "⚠️",
    walk_away: "🚫",
  };
  const rec = String(data.recommendation ?? "");
  const recLabel = rec.replace(/_/g, " ").toUpperCase();

  return `# Buyer's Advisory
**Property:** ${address}

## Recommendation: ${recEmoji[rec] ?? ""} ${recLabel}

${data.recommendation_rationale ?? ""}

---

## Cost to Cure

| | Low | High |
|--|-----|------|
| **Estimated Range** | $${Number(data.cost_to_cure_low ?? 0).toLocaleString()} | $${Number(data.cost_to_cure_high ?? 0).toLocaleString()} |

---

## Negotiation Points

| Issue | Severity | Suggested Credit | Rationale |
|-------|----------|-----------------|-----------|
${negotiationRows || "| — | — | — | None identified |"}

---

## Red Flags

${redFlags.length ? redFlags.map((f) => `- ${f}`).join("\n") : "_None identified._"}

---

## Positive Factors

${positives.length ? positives.map((f) => `- ${f}`).join("\n") : "_None identified._"}

---

## Active Warranties

${warranties.length ? warranties.map((w) => `- ${w}`).join("\n") : "_None on record._"}
`;
}

export function formatInspectorReport(address: string, data: Record<string, unknown>): string {
  const deficiencies = (data.deficiencies as Array<Record<string, unknown>>) ?? [];
  const openPermits = (data.open_permits_requiring_inspection as string[]) ?? [];

  const defRows = deficiencies
    .map(
      (d) =>
        `| ${d.system} | ${d.description} | ${d.severity} | ${d.code_violation ? "⚠️ Yes" : "No"} | P${d.priority} | $${Number(d.estimated_repair_cost_low ?? 0).toLocaleString()}–$${Number(d.estimated_repair_cost_high ?? 0).toLocaleString()} |`
    )
    .join("\n");

  return `# Home Inspection Summary
**Property:** ${address}
**Overall Condition Score:** ${data.overall_condition_score ?? "—"} / 10
**Safety Hazards:** ${data.safety_hazards_count ?? 0} | **Code Violations:** ${data.code_violations_count ?? 0}

---

## Inspector Summary

${data.inspector_summary ?? "—"}

---

## Deficiencies

Priority: **P1** = before closing | **P2** = within 90 days | **P3** = within 1 year

| System | Description | Severity | Code Violation | Priority | Est. Cost |
|--------|-------------|----------|---------------|----------|-----------|
${defRows || "| — | — | — | — | — | — |"}

---

## Open Permits Requiring Inspection

${openPermits.length ? openPermits.map((p) => `- ${p}`).join("\n") : "_None._"}
`;
}

export function formatInsuranceReport(address: string, data: Record<string, unknown>): string {
  const riskSummary = (data.risk_summary as Record<string, Record<string, unknown>>) ?? {};
  const highRisk = (data.high_risk_components as string[]) ?? [];
  const hazards = (data.outstanding_hazards as string[]) ?? [];
  const remediation = (data.recent_remediation as string[]) ?? [];
  const waterRisk = (data.water_damage_risk_factors as string[]) ?? [];
  const fireRisk = (data.fire_risk_factors as string[]) ?? [];
  const conditions = (data.conditions_for_coverage as string[]) ?? [];

  const insEmoji: Record<string, string> = {
    standard: "✅",
    substandard: "⚠️",
    conditional: "🔶",
    declined: "🚫",
  };
  const insurability = String(data.insurability ?? "unknown");

  const riskRows = Object.entries(riskSummary)
    .map(([cat, v]) => `| ${cat} | ${v.risk_level ?? "—"} | ${((v.findings as string[]) ?? []).join("; ") || "—"} | ${v.remediation_status ?? "—"} |`)
    .join("\n");

  return `# Insurance Risk Assessment
**Property:** ${address}
**Insurability:** ${insEmoji[insurability] ?? ""} ${insurability.toUpperCase()}

${conditions.length ? `**Conditions for Coverage:**\n${conditions.map((c) => `- ${c}`).join("\n")}` : ""}

---

## Risk Summary by Category

| Category | Risk Level | Findings | Remediation Status |
|----------|-----------|----------|-------------------|
${riskRows || "| — | — | — | — |"}

---

## High-Risk Components

${highRisk.length ? highRisk.map((c) => `- ${c}`).join("\n") : "_None identified._"}

---

## Outstanding Hazards

${hazards.length ? hazards.map((h) => `- ${h}`).join("\n") : "_None._"}

---

## Recent Remediation (Mitigants)

${remediation.length ? remediation.map((r) => `- ${r}`).join("\n") : "_None on record._"}

---

## Water Damage Risk Factors

${waterRisk.length ? waterRisk.map((r) => `- ${r}`).join("\n") : "_None identified._"}

## Fire Risk Factors

${fireRisk.length ? fireRisk.map((r) => `- ${r}`).join("\n") : "_None identified._"}

---

## Underwriter Notes

${data.underwriter_notes ?? "—"}
`;
}

export function formatContractorReport(address: string, data: Record<string, unknown>): string {
  const workItems = (data.work_items as Record<string, Array<Record<string, unknown>>>) ?? {};
  const completed = (data.completed_work_on_record as Array<Record<string, unknown>>) ?? [];
  const openPermits = (data.open_permits_to_inherit as string[]) ?? [];
  const violations = (data.code_violations_requiring_remediation as string[]) ?? [];
  const seqNotes = (data.sequencing_notes as string[]) ?? [];

  const tradeOrder = ["electrical", "roofing", "plumbing", "hvac", "masonry", "general"];

  const tradeSections = tradeOrder
    .filter((t) => (workItems[t] ?? []).length > 0)
    .map((trade) => {
      const rows = (workItems[trade] ?? [])
        .map(
          (item) =>
            `| ${item.description ?? "—"} | ${item.location ?? "—"} | ${item.priority ?? "—"} | ${item.permit_status ?? "—"} | ${item.estimated_cost_range ?? "—"} | ${item.sequencing_dependency ?? "—"} |`
        )
        .join("\n");
      return `### ${trade.charAt(0).toUpperCase() + trade.slice(1)}\n\n| Description | Location | Priority | Permit Status | Est. Cost | Dependency |\n|-------------|----------|----------|--------------|-----------|------------|\n${rows}`;
    })
    .join("\n\n");

  return `# Contractor Work Scope
**Property:** ${address}
**Total Estimated Cost:** $${Number(data.total_estimated_cost_low ?? 0).toLocaleString()}–$${Number(data.total_estimated_cost_high ?? 0).toLocaleString()}

---

## Work Items by Trade

${tradeSections || "_No work items identified._"}

---

## Sequencing Notes

${seqNotes.length ? seqNotes.map((n) => `- ${n}`).join("\n") : "_No dependencies noted._"}

---

## Completed Work on Record

${completed.length ? completed.map((c) => `- **${c.description}** — ${c.contractor ?? "unknown contractor"} (${c.date ?? "date unknown"})`).join("\n") : "_None on record._"}

---

## Open Permits to Inherit / Reference

${openPermits.length ? openPermits.map((p) => `- ${p}`).join("\n") : "_None._"}

---

## Code Violations Requiring Remediation

${violations.length ? violations.map((v) => `- ${v}`).join("\n") : "_None._"}
`;
}
