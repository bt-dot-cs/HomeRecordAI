/**
 * Layer 2 entry point.
 *
 * Reads all synthetic data documents, ingests them via Layer 1 API,
 * runs all specialist reporting agents, and writes one .md report per audience.
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Orchestrator } from "./orchestrator";
import {
  formatAppraiserReport,
  formatBuyerReport,
  formatInspectorReport,
  formatInsuranceReport,
  formatContractorReport,
} from "./reportFormatter";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SYNTHETIC_DATA_DIR = path.resolve(__dirname, "../../synthetic_data");
const REPORTS_DIR = path.resolve(__dirname, "../../reports");

const DOCUMENT_TYPE_MAP: Record<string, string> = {
  inspection_report: "inspection_report",
  contractor_invoice: "contractor_invoice",
  appliance_warranty: "appliance_warranty",
  permit: "permit",
  electrical_work_order: "electrical_work_order",
  insurance_intake_form: "insurance_intake_form",
};

async function main() {
  const orchestrator = new Orchestrator();

  // Load all synthetic documents
  const files = fs.readdirSync(SYNTHETIC_DATA_DIR).filter((f) => f.endsWith(".md"));
  const documents: { type: string; text: string }[] = [];

  for (const file of files) {
    const stem = path.basename(file, ".md");
    const docType = DOCUMENT_TYPE_MAP[stem];
    if (!docType) {
      console.warn(`  [SKIP] Unknown document type: ${file}`);
      continue;
    }
    const text = fs.readFileSync(path.join(SYNTHETIC_DATA_DIR, file), "utf-8");
    documents.push({ type: docType, text });
    console.log(`  [LOAD] ${file}`);
  }

  console.log(`\n  Running orchestrator with ${documents.length} documents...\n`);
  const report = await orchestrator.run(documents);

  const address = report.property_address ?? "Unknown Property";

  // Ensure reports directory exists
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Write one markdown report per audience
  const outputs: Array<{ file: string; content: string }> = [
    {
      file: "appraiser_report.md",
      content: formatAppraiserReport(address, report.appraisal),
    },
    {
      file: "buyer_report.md",
      content: formatBuyerReport(address, report.buyer_analysis),
    },
    {
      file: "inspector_report.md",
      content: formatInspectorReport(address, report.inspection_summary),
    },
    {
      file: "insurance_report.md",
      content: formatInsuranceReport(address, report.insurance_assessment),
    },
    {
      file: "contractor_report.md",
      content: formatContractorReport(address, report.contractor_scope),
    },
  ];

  for (const { file, content } of outputs) {
    const filePath = path.join(REPORTS_DIR, file);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`  [WRITE] reports/${file}`);
  }

  console.log(`\n  All reports written to: ${REPORTS_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
