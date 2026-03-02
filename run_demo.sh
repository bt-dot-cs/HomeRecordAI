#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── 1. Check .env ──────────────────────────────────────────────────────────────
if [ ! -f "$ROOT/.env" ]; then
  echo "ERROR: .env not found. Copy .env.example and add your ANTHROPIC_API_KEY."
  exit 1
fi

if ! grep -q "ANTHROPIC_API_KEY=sk-" "$ROOT/.env" 2>/dev/null; then
  echo "ERROR: ANTHROPIC_API_KEY not set in .env"
  exit 1
fi

# ── 2. Python venv ────────────────────────────────────────────────────────────
VENV="$ROOT/layer1_ingestion/.venv"
if [ ! -d "$VENV" ]; then
  echo "→ Creating Python virtual environment..."
  python3 -m venv "$VENV"
  source "$VENV/bin/activate"
  pip install -q -r "$ROOT/layer1_ingestion/requirements.txt"
else
  source "$VENV/bin/activate"
fi

# ── 3. Start Layer 1 API ──────────────────────────────────────────────────────
echo "→ Starting Layer 1 API on http://localhost:8000 ..."
uvicorn api.server:app --port 8000 --app-dir "$ROOT/layer1_ingestion" &
UVICORN_PID=$!

# Wait for server to be ready
for i in {1..15}; do
  if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo "   Layer 1 ready ✓"
    break
  fi
  sleep 0.5
done

# ── 4. Serve frontend via HTTP (avoids file:// CORS block) ───────────────────
echo "→ Starting frontend server on http://localhost:8080 ..."
python3 -m http.server 8080 --directory "$ROOT" &
HTTP_PID=$!
sleep 0.5

echo "→ Opening demo..."
open "http://localhost:8080/homerecord_demo.html"

echo ""
echo "  HomeRecord AI demo is running."
echo "  Frontend:    http://localhost:8080/homerecord_demo.html"
echo "  Layer 1 API: http://localhost:8000"
echo "  Press Ctrl+C to stop."
echo ""

# ── 5. Cleanup on exit ────────────────────────────────────────────────────────
trap "echo ''; echo 'Shutting down...'; kill $UVICORN_PID $HTTP_PID 2>/dev/null" EXIT
wait $UVICORN_PID
