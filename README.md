# MUSA Hackathon — Property Intelligence Agent System

A hybrid Python/TypeScript multi-agent pipeline that ingests unstructured property documents, structures them with Claude, and produces stakeholder-specific reports.

## Architecture

```
synthetic_data/          → Raw markdown documents (inspection, invoice, warranty, permit)
layer1_ingestion/        → Python: document parsing + structuring agents → REST API
layer2_reporting/        → TypeScript: orchestrator + role-based reporting agents
```

### Layer 1 — Ingestion (Python)
- Reads raw property documents from `synthetic_data/`
- A Claude-powered `structuring_agent` extracts and normalizes key fields into JSON
- FastAPI server exposes the structured data at `POST /ingest` and `GET /documents/{id}`

### Layer 2 — Reporting (TypeScript)
- Orchestrator calls the Layer 1 API to retrieve structured documents
- Three specialized agents generate role-specific analyses:
  - **AppraiserAgent** — valuation impact, comparable adjustments
  - **BuyerAgent** — negotiation leverage, cost-to-cure estimates
  - **InspectorAgent** — deficiency severity ratings, code compliance flags

## Quickstart

### Prerequisites
- Python 3.11+
- Node.js 20+
- An `ANTHROPIC_API_KEY`

### Layer 1
```bash
cd layer1_ingestion
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # add your API key
uvicorn api.server:app --reload --port 8000
```

### Layer 2
```bash
cd layer2_reporting
npm install
npm run dev
```

## Environment Variables
See `.env.example` for all required variables.
