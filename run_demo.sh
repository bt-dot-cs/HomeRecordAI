#!/usr/bin/env bash
# run_demo.sh — MUSA Hackathon full pipeline demo runner
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
LAYER1_PID=""

cleanup() {
  if [ -n "$LAYER1_PID" ]; then
    echo ""
    echo ">> Shutting down Layer 1 API (PID $LAYER1_PID)..."
    kill "$LAYER1_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  MUSA Property Intelligence — Full Pipeline Demo"
echo "  Property: 2847 Fernwood Drive, Philadelphia PA 19103"
echo "============================================================"
echo ""

# ── Check .env ────────────────────────────────────────────────────────────────
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo "ERROR: .env file not found. Copy .env.example and add your ANTHROPIC_API_KEY."
  exit 1
fi

# ── Layer 1: Start FastAPI ─────────────────────────────────────────────────────
echo ">> [1/4] Starting Layer 1 document ingestion API (Python/FastAPI)..."
cd "$PROJECT_ROOT/layer1_ingestion"
python3 -m uvicorn api.server:app --port 8000 --log-level warning &
LAYER1_PID=$!

# Wait for health check (up to 15s)
echo ">> [2/4] Waiting for Layer 1 to be ready..."
READY=0
for i in $(seq 1 15); do
  if curl -s http://localhost:8000/health | grep -q '"ok"'; then
    echo "         Layer 1 is up (http://localhost:8000)"
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -eq 0 ]; then
  echo "ERROR: Layer 1 did not start within 15 seconds."
  exit 1
fi

echo ""

# ── Layer 2: Run Reporting Agents ────────────────────────────────────────────
echo ">> [3/4] Running Layer 2 specialist agents (TypeScript/Node)..."
echo "         Ingesting 4 documents → structuring → filtering → 5 agents in parallel"
echo ""
cd "$PROJECT_ROOT/layer2_reporting"
npm run dev --silent

echo ""

# ── Done ─────────────────────────────────────────────────────────────────────
echo ">> [4/4] Done. Reports written to:"
echo "         $PROJECT_ROOT/reports/"
echo ""
ls "$PROJECT_ROOT/reports/" 2>/dev/null | sed 's/^/         /'
echo ""
echo "============================================================"
echo "  Pipeline complete."
echo "============================================================"
echo ""
