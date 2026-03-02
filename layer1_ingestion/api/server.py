"""
Layer 1 FastAPI server.

Endpoints:
  POST /ingest          — accept a document, return structured JSON
  POST /scan-pii        — scan raw text for PII using Claude (key stays server-side)
  GET  /documents/{id}  — retrieve a previously ingested document
  GET  /health          — liveness check
"""

import os
import json
import uuid
from pathlib import Path
from typing import Any

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(Path(__file__).parent.parent.parent / ".env")

from agents.structuring_agent import StructuringAgent  # noqa: E402

app = FastAPI(title="MUSA Layer 1 — Document Ingestion API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store (replace with a database for production)
_store: dict[str, dict[str, Any]] = {}

agent = StructuringAgent()


class IngestRequest(BaseModel):
    document_type: str  # inspection_report | contractor_invoice | appliance_warranty | permit
    raw_text: str


class IngestResponse(BaseModel):
    id: str
    document_type: str
    structured: dict[str, Any]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest", response_model=IngestResponse)
def ingest(req: IngestRequest):
    try:
        structured = agent.run(document_type=req.document_type, raw_text=req.raw_text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    doc_id = str(uuid.uuid4())
    _store[doc_id] = {"document_type": req.document_type, "structured": structured}

    return IngestResponse(id=doc_id, document_type=req.document_type, structured=structured)


@app.get("/documents/{doc_id}", response_model=IngestResponse)
def get_document(doc_id: str):
    record = _store.get(doc_id)
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")
    return IngestResponse(id=doc_id, **record)


@app.get("/documents")
def list_documents():
    return [{"id": k, "document_type": v["document_type"]} for k, v in _store.items()]


# ── PII Scan endpoint ──

_PII_SYSTEM = (
    "You are a PII detection agent. Scan the provided document text for personally identifiable "
    "information including: Social Security Numbers, bank account numbers, routing numbers, "
    "credit card numbers or authorization codes, passport numbers, driver's license numbers, "
    "personal email addresses, personal phone numbers, and payment references like check numbers. "
    "Return ONLY a JSON array of findings, each with fields: field (what was found), "
    "value (the actual value or masked version), severity (critical/high/medium), and document (filename). "
    "If no PII is found return an empty array []."
)


class PiiScanRequest(BaseModel):
    filename: str
    text: str


@app.post("/scan-pii")
def scan_pii(req: PiiScanRequest):
    try:
        client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=_PII_SYSTEM,
            messages=[{"role": "user", "content": f"Document filename: {req.filename}\n\n{req.text}"}],
        )
        raw = response.content[0].text.strip()
        start, end = raw.find("["), raw.rfind("]")
        findings = json.loads(raw[start:end + 1]) if start != -1 else []
        return {"filename": req.filename, "findings": findings}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
