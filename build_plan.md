# MUSA Hackathon — Build Plan

---

## PHASE 1 — Project Setup (0:00–0:15)
**Goal: Skeleton running, dependencies installed**

- [ ] Initialize project structure in Claude Code
- [ ] Create `requirements.txt` for Python layer
- [ ] Create `package.json` for TypeScript layer
- [ ] Create `.env` with `ANTHROPIC_API_KEY`
- [ ] Verify both layers can import their dependencies
- [ ] Copy `synthetic_data/` and `audience_schemas.md` into project

**Checkpoint:** Both environments install without errors.

---

## PHASE 2 — Layer 1: Ingestion Agent (0:15–0:45)
**Goal: Python agent reads 4 synthetic docs, outputs structured JSON home record**

- [ ] `structuring_agent.py` — LangGraph agent that:
  - Reads all `.md` files from `synthetic_data/`
  - Extracts structured fields per document type
  - Merges into single `home_record.json`
  - Flags any PII-adjacent fields (policy numbers, check numbers, owner name)
- [ ] `server.py` — FastAPI endpoint: `POST /structure` returns `home_record.json`
- [ ] Test: run agent, verify JSON output is clean and complete

**Checkpoint:** `home_record.json` exists and contains populated fields from all 4 docs.

---

## PHASE 3 — Layer 2: Reporting Agents (0:45–1:15)
**Goal: TypeScript orchestrator routes home record to specialist agents, generates reports**

- [ ] `orchestrator.ts` — accepts audience parameter, routes to correct agent
- [ ] `appraiserAgent.ts` — formats home record into appraiser report
- [ ] `buyerAgent.ts` — formats into plain-language buyer report
- [ ] `inspectorAgent.ts` — formats into risk-focused insurance report
- [ ] `contractorAgent.ts` — formats into trade-organized work order
- [ ] Each agent applies exclusion rules from `audience_schemas.md`
- [ ] Output: one `.md` report file per audience

**Checkpoint:** Running `ts-node src/index.ts --audience buyer` produces a readable report.

---

## PHASE 4 — Demo Polish (1:15–1:30)
**Goal: Make the demo legible and stable for presentation**

- [ ] Wire Layer 1 → Layer 2 end-to-end (Python API → TypeScript consumer)
- [ ] Simple CLI runner: `run_demo.sh` that executes full pipeline and outputs all 4 reports
- [ ] Verify all 4 audience reports generate without errors
- [ ] Add console output that narrates what's happening (for live demo visibility)

**Checkpoint:** Single command runs full pipeline, 4 reports appear.

---

## CUSHION (1:30–1:50)
Priority order if time allows:

1. PII flagging — scan docs, print warnings before structuring
2. A simple HTML output for one report (more visual for demo)
3. Add a 5th synthetic document (e.g. HOA letter or insurance claim)
4. Refine report quality with better prompting

---

## PRESENTATION SKELETON (parallel — build as you go)
Keep `presentation/outline.md` open and drop bullet points in as you build:

1. Enterprise Problem (30 sec)
2. How the Agent Works (60 sec) — show architecture diagram
3. Azure Services (30 sec) — name them even in Track B framing
4. Responsible AI (45 sec) — PII flagging + exclusion rules + HIL
5. Enterprise Impact (30 sec) — who pays for this and why

---

## BIGGEST RISKS TO TIMELINE

- **LangGraph setup slow** → fallback to simple Python script with Claude API calls directly
- **TypeScript/Mastra config issues** → fallback to plain `ts-node` with Anthropic SDK
- **Layer 1→2 API wiring** → mock the bridge with a static `home_record.json` and demo layers independently
