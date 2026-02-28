/**
 * Orchestrator — coordinates Layer 1 ingestion and Layer 2 agent execution.
 *
 * Flow:
 *   1. POST each raw document to Layer 1 /ingest
 *   2. Collect structured JSON payloads
 *   3. Filter context per audience (exclusion rules from audience_schemas.md)
 *   4. Run all 5 specialist agents in parallel
 *   5. Merge and return combined report
 */

import fetch from "node-fetch";
import { AppraiserAgent } from "./agents/appraiserAgent";
import { BuyerAgent } from "./agents/buyerAgent";
import { InspectorAgent } from "./agents/inspectorAgent";
import { InsuranceInspectorAgent } from "./agents/insuranceInspectorAgent";
import { ContractorAgent } from "./agents/contractorAgent";
import { filterContextForAudience } from "./contextFilter";

const LAYER1_BASE =
  `${process.env.LAYER1_HOST ?? "http://localhost"}:${process.env.LAYER1_PORT ?? "8000"}`;

interface RawDocument {
  type: string;
  text: string;
}

interface StructuredDocument {
  id: string;
  document_type: string;
  structured: Record<string, unknown>;
}

export interface PropertyReport {
  property_address: string | null;
  appraisal: Record<string, unknown>;
  buyer_analysis: Record<string, unknown>;
  inspection_summary: Record<string, unknown>;
  insurance_assessment: Record<string, unknown>;
  contractor_scope: Record<string, unknown>;
  generated_at: string;
}

export class Orchestrator {
  private appraiser = new AppraiserAgent();
  private buyer = new BuyerAgent();
  private inspector = new InspectorAgent();
  private insuranceInspector = new InsuranceInspectorAgent();
  private contractor = new ContractorAgent();

  async run(documents: RawDocument[]): Promise<PropertyReport> {
    // Step 1: Ingest all documents via Layer 1
    const structured = await this.ingestAll(documents);
    console.log(`Ingested ${structured.length} documents from Layer 1`);

    // Step 2: Build merged context object
    const fullContext = this.buildContext(structured);

    // Step 3: Filter context per audience before passing to agents
    console.log("  [FILTER] Applying audience exclusion rules to context...");
    const appraiserCtx = filterContextForAudience(fullContext, "appraiser");
    const buyerCtx = filterContextForAudience(fullContext, "buyer");
    const inspectorCtx = filterContextForAudience(fullContext, "insurance_inspector");
    const insuranceCtx = filterContextForAudience(fullContext, "insurance_inspector");
    const contractorCtx = filterContextForAudience(fullContext, "contractor");
    console.log("  [FILTER] Done — 5 audience-scoped contexts ready.\n");

    // Step 4: Run all agents in parallel
    console.log("  [AGENTS] Dispatching 5 specialist agents in parallel...");
    console.log("           → AppraiserAgent");
    console.log("           → BuyerAgent");
    console.log("           → InspectorAgent");
    console.log("           → InsuranceInspectorAgent");
    console.log("           → ContractorAgent\n");

    const startTime = Date.now();
    const [appraisal, buyerAnalysis, inspectionSummary, insuranceAssessment, contractorScope] =
      await Promise.all([
        this.appraiser.run(appraiserCtx),
        this.buyer.run(buyerCtx),
        this.inspector.run(inspectorCtx),
        this.insuranceInspector.run(insuranceCtx),
        this.contractor.run(contractorCtx),
      ]);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  [AGENTS] All 5 agents completed in ${elapsed}s.\n`);

    const address =
      (fullContext["inspection_report"] as Record<string, unknown> | undefined)
        ?.property_address as string | null ?? null;

    return {
      property_address: address,
      appraisal,
      buyer_analysis: buyerAnalysis,
      inspection_summary: inspectionSummary,
      insurance_assessment: insuranceAssessment,
      contractor_scope: contractorScope,
      generated_at: new Date().toISOString(),
    };
  }

  private async ingestAll(documents: RawDocument[]): Promise<StructuredDocument[]> {
    const results: StructuredDocument[] = [];

    for (const doc of documents) {
      const response = await fetch(`${LAYER1_BASE}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_type: doc.type, raw_text: doc.text }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Layer 1 ingestion failed for ${doc.type}: ${body}`);
      }

      const result = (await response.json()) as StructuredDocument;
      results.push(result);
      console.log(`  [INGEST] ${doc.type} → structured (id: ${result.id.slice(0, 8)}...)`);
    }

    return results;
  }

  private buildContext(
    structured: StructuredDocument[]
  ): Record<string, Record<string, unknown>> {
    const context: Record<string, Record<string, unknown>> = {};
    for (const doc of structured) {
      context[doc.document_type] = doc.structured;
    }
    return context;
  }
}
