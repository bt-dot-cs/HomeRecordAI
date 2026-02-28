"""
StructuringAgent — uses Claude to parse raw property documents into structured JSON.

Supports document types:
  - inspection_report
  - contractor_invoice
  - appliance_warranty
  - permit
"""

import json
import os
import re
from typing import Any

import anthropic

# PII-adjacent patterns to flag before structuring
_PII_PATTERNS: list[tuple[str, str]] = [
    # Financial
    (r"\bcheck\s*(?:number|#|no\.?)\s*[:\-]?\s*\d{3,}", "check number"),
    (r"\bcheck\s+number\b", "check number"),
    (r"\bpayment\s+ref(?:erence)?\s*[:\-]?\s*\w+", "payment reference"),
    (r"\bauthoriz(?:ation|ed)\s+code\b", "authorization code"),
    (r"\brouting\s+number\b", "bank routing number"),
    (r"\baccount\s+number\b", "bank account number"),
    (r"\bcard\s*(?:number|ending)\b", "payment card number"),
    (r"\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b", "credit card number"),
    # Identity
    (r"\bSSN\b|\bsocial\s+security\s+number\b", "SSN label"),
    (r"\b\d{3}[-.\s]\d{2}[-.\s]\d{4}\b", "SSN pattern"),
    (r"\bDOB\b|\bdate\s+of\s+birth\b", "date of birth"),
    (r"\bdriver(?:'s)?\s+licen[sc]e\b", "driver's license"),
    # Insurance / loan
    (r"\bpolicy\s*(?:number|#)\s*[:\-]?\s*[A-Z0-9\-]{4,}", "insurance policy number"),
    (r"\bloan\s*(?:number|#)\s*[:\-]?\s*[A-Z0-9\-]{4,}", "loan number"),
    (r"\bmortgage(?:e)?\s+(?:balance|payment|account)\b", "mortgage financial detail"),
    # Contact
    (r"\b(?:\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4})\b", "phone number"),
    (r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b", "email address"),
]


def _scan_for_pii(document_type: str, raw_text: str) -> None:
    """Print warnings for any PII-adjacent fields detected in raw_text."""
    flags: list[str] = []
    for pattern, label in _PII_PATTERNS:
        if re.search(pattern, raw_text, re.IGNORECASE):
            flags.append(label)

    if flags:
        print(
            f"  [PII WARNING] {document_type}: detected potential PII-adjacent "
            f"field(s): {', '.join(flags)}. "
            f"These will be filtered by contextFilter before agent delivery."
        )

MODEL = os.getenv("STRUCTURING_MODEL", "claude-opus-4-6")

SYSTEM_PROMPT = """You are a property document analyst. Your job is to extract structured data from raw property-related documents.

Given a document type and raw text, return ONLY a valid JSON object with no additional commentary.
The JSON must be well-formed and complete.

Extraction rules by document type:

inspection_report → {
  "property_address": str,
  "inspection_date": str (ISO 8601),
  "inspector": { "name": str, "certification": str },
  "systems": [{ "name": str, "condition": str, "findings": [str], "recommendations": [str] }],
  "cost_estimates": { "immediate_low": int, "immediate_high": int, "items": [{"item": str, "low": int, "high": int}] }
}

contractor_invoice → {
  "invoice_number": str,
  "date": str (ISO 8601),
  "contractor": { "name": str, "license": str },
  "property_address": str,
  "line_items": [{ "description": str, "labor": float, "materials": float, "subtotal": float }],
  "subtotal": float,
  "tax": float,
  "total": float
}

appliance_warranty → {
  "property_address": str,
  "appliances": [{
    "name": str,
    "make_model": str,
    "serial_number": str,
    "purchase_date": str,
    "purchase_price": float,
    "warranties": [{ "coverage": str, "expires": str, "status": str }]
  }],
  "extended_warranty": { "provider": str, "plan_number": str, "expires": str, "deductible": float } | null
}

permit → {
  "property_address": str,
  "jurisdiction": str,
  "permits": [{
    "permit_number": str,
    "type": str,
    "scope": str,
    "contractor": str,
    "issued": str,
    "final_inspection": str | null,
    "status": str
  }],
  "open_violations": [{ "violation_number": str, "description": str, "status": str }],
  "notes": [str]
}

electrical_work_order → {
  "work_order_number": str,
  "date": str (ISO 8601),
  "contractor": { "name": str, "license": str | null },
  "property_address": str,
  "permit_number": str | null,
  "scope_of_work": [str],
  "line_items": [{ "description": str, "cost": float }],
  "total": float,
  "inspection_result": { "date": str, "result": str, "certificate_issued": bool },
  "warranty": { "workmanship_years": int | null, "expires": str | null },
  "contractor_notes": [str]
}
IMPORTANT: Do NOT extract payment card numbers, check numbers, bank account numbers, routing numbers, authorization codes, or any payment credentials. Omit those fields entirely.

insurance_intake_form → {
  "property_address": str,
  "date_submitted": str (ISO 8601),
  "policy_type": str,
  "insurer": str,
  "property_details": {
    "year_built": int,
    "square_footage": int,
    "construction_type": str,
    "roof_type": str,
    "heating": str,
    "electrical": str,
    "security_system": str
  },
  "lender": str | null,
  "loan_number": str | null,
  "prior_claims": [{ "date": str, "type": str, "payout": float, "claim_number": str }],
  "surcharges_noted": [str]
}
IMPORTANT: Do NOT extract SSNs, dates of birth, driver's license numbers, bank routing numbers, bank account numbers, credit card numbers, mortgage payment amounts, or any financial account credentials. Omit those fields entirely. These are legally protected PII."""


class StructuringAgent:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    def run(self, document_type: str, raw_text: str) -> dict[str, Any]:
        """
        Send raw document text to Claude and return structured JSON.
        Scans for PII-adjacent fields and logs warnings before processing.
        """
        _scan_for_pii(document_type, raw_text)

        user_message = (
            f"Document type: {document_type}\n\n"
            f"Raw document:\n{raw_text}"
        )

        response = self.client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        raw_output = response.content[0].text.strip()

        # Strip markdown code fences if the model wraps the JSON
        if raw_output.startswith("```"):
            lines = raw_output.splitlines()
            raw_output = "\n".join(
                line for line in lines if not line.startswith("```")
            ).strip()

        return json.loads(raw_output)
