"""
Layer 1 — CLI entry point.

Usage:
    python main.py --doc ../synthetic_data/inspection_report.md
    python main.py --all          # ingest all synthetic_data documents
"""

import argparse
import json
from pathlib import Path

from dotenv import load_dotenv

from agents.structuring_agent import StructuringAgent

load_dotenv(Path(__file__).parent.parent / ".env")

SYNTHETIC_DATA_DIR = Path(__file__).parent.parent / "synthetic_data"


def ingest_file(path: Path) -> dict:
    agent = StructuringAgent()
    raw_text = path.read_text(encoding="utf-8")
    result = agent.run(document_type=path.stem, raw_text=raw_text)
    return result


def main():
    parser = argparse.ArgumentParser(description="Layer 1 document ingestion CLI")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--doc", type=Path, help="Path to a single document")
    group.add_argument("--all", action="store_true", help="Ingest all synthetic data files")
    args = parser.parse_args()

    if args.all:
        docs = list(SYNTHETIC_DATA_DIR.glob("*.md"))
    else:
        docs = [args.doc]

    for doc_path in docs:
        print(f"\n{'='*60}")
        print(f"Ingesting: {doc_path.name}")
        print("="*60)
        structured = ingest_file(doc_path)
        print(json.dumps(structured, indent=2))


if __name__ == "__main__":
    main()
