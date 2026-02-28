"""
Layer 1 FastAPI server.

Endpoints:
  POST /ingest          — accept a document, return structured JSON
  GET  /documents/{id}  — retrieve a previously ingested document
  GET  /health          — liveness check
"""

import uuid
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv(Path(__file__).parent.parent.parent / ".env")

from agents.structuring_agent import StructuringAgent  # noqa: E402

app = FastAPI(title="MUSA Layer 1 — Document Ingestion API", version="1.0.0")

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
