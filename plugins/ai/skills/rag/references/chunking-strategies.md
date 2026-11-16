# RAG Chunking Strategies

Choose chunking from corpus structure and query patterns. There is no universally optimal token count or overlap.

## Strategy selection

| Strategy | Good fit | Main risk |
|---|---|---|
| Structure-aware | HTML, Markdown, docs, policies, manuals | Parser may flatten tables or lose hierarchy |
| Fixed token windows | Plain text with weak structure; baseline experiments | Splits concepts and headings |
| Semantic boundaries | Prose where topic shifts matter | More expensive and boundary quality varies |
| Parent-child | Long documents where small passages need wider context | More complex indexing and parent expansion |
| Code-aware | Source code, API docs, configuration | Text-only splitting loses symbol and dependency context |
| Table-aware | Reports, catalogs, structured data | Flattening destroys row/column relationships |

## Recommended starting process

1. Parse the source while preserving headings, sections, page numbers, tables, code blocks, and source offsets.
2. Establish a simple baseline (often structure-aware chunks, or fixed windows for unstructured text).
3. Attach provenance and security metadata to every chunk: document ID/version, tenant, ACL reference, section/page, and source offsets.
4. Build a labeled query set with relevant source/chunk IDs.
5. Measure retrieval recall and ranking before changing chunk size, overlap, embedding model, or top-k.
6. Inspect misses: parser loss, chunk boundary, metadata filter, embedding mismatch, lexical gap, or ranking issue.
7. Change one major variable at a time and compare on the same dataset.

## Practical details

- Keep headings with the section content they describe; optionally include a short parent path in chunk metadata or a contextual prefix.
- Do not split a table into isolated cells. Preserve headers with each row group or store the table in a structured representation.
- For code, split by symbols or logical blocks where possible and retain file path, symbol name, language, and relevant parent context.
- Overlap can reduce boundary misses but increases duplication and index size. Measure whether it improves recall enough to justify the cost.
- Parent-child retrieval can index small child passages but return a larger authorized parent section to the generator.
- Contextual prefixes and generated summaries add tokens and may introduce errors. Treat them as derived metadata and evaluate them.
- Rebuild or version embeddings when the embedding model or preprocessing changes; do not mix incompatible vector spaces.

## Security constraints

Apply tenant/document filters as part of the retrieval query or use physically isolated indexes where required. Verify authorization again before returning source content. Never retrieve unauthorized content into model context and rely on a later prompt instruction to hide it.

Document updates, permission changes, and deletion must propagate to lexical indexes, vector indexes, caches, parent-child references, and citations.

## Metrics

- Retrieval: recall@k, precision@k, MRR, nDCG.
- Generation: faithfulness, citation correctness, relevance, abstention.
- Operations: indexing freshness, latency, token usage, cost.
- Security: ACL false-allow rate, stale-permission exposure, cross-tenant leakage.

Tune chunking against representative queries and task success, not visual chunk size or one benchmark alone.
