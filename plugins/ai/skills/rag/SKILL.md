---
name: rag
description: Retrieval-augmented generation — ingestion, structural chunking, embeddings, hybrid search, reranking, context assembly, citations, and RAG evaluation. Use when building or debugging search-over-documents and knowledge-base Q&A.
---

# RAG

## First decision

Before building a retrieval pipeline, test whether the corpus fits in the model context window at acceptable cost and latency. A simpler full-context or curated-context design may be better.

## Pipeline

```
ingest → parse/clean → chunk → metadata + ACL → embed + lexical index
query → (rewrite/decompose) → retrieve → fuse → rerank → assemble context → generate with citations
```

## Design choices

| Stage | Options to evaluate | Important considerations |
|---|---|---|
| Parsing | Native text, structural parsers, OCR, table extraction | Preserve headings, page numbers, tables, code, and source offsets |
| Chunking | Structure-aware, semantic, fixed token windows, parent-child | Chunk size/overlap depend on corpus, query type, embedding model, and context budget |
| Contextualization | Parent metadata, section summaries, contextual prefixes | Measure whether extra tokens improve retrieval enough to justify cost |
| Retrieval | Vector, BM25, metadata filters, hybrid | Lexical search helps exact IDs, names, codes, and rare terms |
| Fusion | RRF or calibrated score fusion | Avoid assuming scores from different systems are comparable |
| Reranking | Cross-encoder or provider rerank API | Measure precision gain against added latency/cost |
| Assembly | Deduplication, diversity, parent expansion, token budget | Preserve source IDs and provenance |
| Generation | Grounded answer, abstention, citations | Require citations for claims supported by retrieved evidence |

Do not treat fixed values such as chunk size, overlap, or top-k as universal defaults. Start with a documented baseline and tune them using a representative evaluation set.

## Security and lifecycle

- Apply tenant and document ACL filters before retrieval; verify authorization again before exposing content.
- Retrieved content is evidence, not instructions. Defend against indirect prompt injection.
- Store source, version, timestamps, page/section, tenant, and ACL metadata as appropriate.
- Handle document update, deletion, permission changes, deduplication, and index rebuilds.
- Prevent stale embeddings or deleted documents from remaining retrievable.
- Keep retrieval caches tenant- and permission-aware.

## Evaluation

Evaluate retrieval and generation separately.

| Layer | Metrics / checks |
|---|---|
| Retrieval | recall@k, precision@k, MRR, nDCG, relevant-document coverage |
| Reranking | ranking quality and marginal gain over initial retrieval |
| Generation | faithfulness, answer relevance, citation correctness, abstention quality |
| System | latency, cost, token usage, freshness, ACL correctness |

Use labeled query → relevant source/chunk sets. Debug in order: parsing/index freshness → retrieval recall → fusion/reranking → context assembly → generation.

For chunking choices and evaluation-driven tuning, see [chunking strategies](references/chunking-strategies.md).

## Common failures

- Chunk boundaries destroy the context needed to answer.
- Embedding model changed but vectors were not rebuilt.
- Duplicate chunks dominate top-k.
- ACL filters are applied after content has already leaked into context.
- Stale/deleted documents remain searchable.
- The generator cites a document that does not support the claim.
