# MUSA Hackathon — Presentation Outline

**Project:** Property Intelligence Agent System
**Team:** [Team Name]
**Date:** 2026-02-27

---

## 1. Problem Statement (2 min)

- Real estate transactions generate a flood of unstructured documents: inspections, invoices, permits, warranties
- Stakeholders (buyers, appraisers, insurers, contractors) each need tailored analysis from the same raw data
- Manual review is slow, error-prone, and siloed — each party re-reads the same documents independently

**Key question:** Can AI agents transform raw property documents into actionable, role-specific intelligence in seconds?

---

## 2. Solution Overview (2 min)

A two-layer multi-agent pipeline with responsible data filtering:

```
Raw Documents → [Layer 1: Structuring Agent] → Structured JSON
                        ↓ PII scan & warning
                [Context Filter] — applies audience exclusion rules
                        ↓
              ┌─────────────────────────────────────────┐
              │         Layer 2: Orchestrator            │
              ├──────────┬──────────┬────────────────────┤
         Appraiser    Buyer    Inspector  InsuranceInspector  Contractor
              └──────────┴──────────┴────────────────────┘
                               ↓
                   5 Audience-Specific Markdown Reports
```

- **Layer 1 (Python/FastAPI):** Claude extracts and normalizes data from markdown documents into typed JSON schemas. PII-adjacent fields flagged before processing.
- **Context Filter:** Each agent receives only the fields it's authorized to see, per `audience_schemas.md` exclusion rules.
- **Layer 2 (TypeScript):** Five specialized Claude agents analyze the filtered data from distinct professional perspectives, running in parallel.

---

## 3. Technical Architecture (3 min)

### Layer 1 — Document Ingestion
- `StructuringAgent`: zero-shot extraction with document-type-specific JSON schemas
- PII scanner: flags policy numbers, check numbers, SSN patterns before Claude sees the document
- FastAPI REST API: `POST /ingest`, `GET /documents/{id}`, `GET /documents`
- Handles 4 document types: inspection report, contractor invoice, appliance warranty, permit

### Context Filter (`contextFilter.ts`)
Implements the full exclusion table from `audience_schemas.md`:

| Field | Appraiser | Ins. Inspector | Buyer | Contractor |
|---|---|---|---|---|
| Owner full name | ✓ | ✓ | ✗ | ✗ |
| Insurance policy/premium | ✗ | ✓ | ✗ | ✗ |
| Appliance serial numbers | ✗ | ✗ | ✗ | ✓ |
| Payment amounts / check refs | ✗ | ✗ | ✗ | ✗ |
| Permit numbers | ✓ | ✓ | ✗ | ✓ |
| Inspector license | ✓ | ✓ | ✗ | ✗ |

### Layer 2 — Role-Based Reporting
- **Orchestrator**: ingests documents, applies context filter per audience, fans out to 5 agents in parallel (`Promise.all`)
- **AppraiserAgent**: valuation adjustments, deferred maintenance totals, permit compliance flag
- **BuyerAgent**: negotiation points with credit suggestions, cost-to-cure range, buy/walk recommendation
- **InspectorAgent**: severity-ranked deficiency list, code violations, priority repair schedule (P1/P2/P3)
- **InsuranceInspectorAgent**: risk summary by category, high-risk components, insurability rating
- **ContractorAgent**: trade-organized work scope, sequencing dependencies, open permits to inherit

### Design Decisions
- Python for ingestion: simpler API server, direct Claude SDK integration
- TypeScript for reporting: strong typing on agent outputs, modern async patterns
- Agents run in parallel to minimize total latency
- In-memory store in Layer 1 (swap for Postgres/Redis in production)
- Responsible AI: data filtered before any agent receives it — not redacted after the fact

---

## 4. Live Demo (4 min)

1. Run `./run_demo.sh` — single command starts full pipeline
2. Watch console:
   - Layer 1 PII scan warnings appear per document
   - 4 documents ingested and structured
   - Context filter applied (5 audience-scoped contexts)
   - 5 agents dispatched in parallel, completion time logged
3. Show output reports in `reports/`:
   - `appraiser_report.md` — valuation adjustments, deferred maintenance
   - `buyer_report.md` — recommendation, negotiation playbook
   - `inspector_report.md` — severity-ranked deficiency list
   - `insurance_report.md` — risk summary, insurability status
   - `contractor_report.md` — trade-organized work scope

---

## 5. Results & Key Findings (2 min)

| Document | Key Structured Fields |
|---|---|
| Inspection Report | 6 systems assessed, immediate electrical + roof repairs flagged |
| Contractor Invoice | Completed work on record (waterproofing, kitchen, paint) |
| Appliance Warranty | Active coverage tracked per appliance |
| Permit | Open/closed permit status, violations |

**Agent outputs (example):**
- Appraiser flags Stab-Lok panel and open permit as negative value adjustments
- Buyer agent recommends "proceed with conditions" — request credit for panel + roof
- Inspector identifies safety hazards (panel, open permit), maintenance items with P1/P2/P3 prioritization
- Insurance inspector flags high electrical risk, conditional insurability pending panel replacement
- Contractor scopes electrical and roofing work by trade with sequencing dependency noted

---

## 6. Responsible AI Angle (1 min)

- **PII detection** at ingestion: flags sensitive fields before Claude processes the document
- **Audience-scoped filtering**: agents never receive data they shouldn't see — enforced structurally, not by prompt
- **No cross-contamination**: buyer doesn't see permit numbers or owner name; contractor doesn't see payment history
- This is a data governance pattern, not just a prompt engineering choice

---

## 7. Extensions & Future Work (1 min)

- [ ] Add MLS comps lookup tool to AppraiserAgent
- [ ] Persistent database for document storage and versioning
- [ ] PDF/image ingestion via Claude's vision capabilities
- [ ] Streaming API responses for real-time UI updates
- [ ] Multi-property portfolio analysis
- [ ] Human-in-the-loop review step before report delivery

---

## 8. Q&A
