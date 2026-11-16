---
description: 'Design, build or debug a RAG pipeline.'
argument-hint: '<what to search and where the docs live | problem description>'
---

# ai:rag

Task: `$ARGUMENTS`

Use the `rag` and `evals` skills.

1. Inspect what exists: document sources, vector store / search engine, embedding model, chunking code.
2. **Building:** first check whether the corpus fits in context (+ prompt caching). If yes — propose that instead.
   Otherwise propose the pipeline from the skill (chunking, hybrid search, rerank, citations) as a short plan and wait for approval before coding.
3. **Debugging:** take 3–5 failing questions and trace each: retrieved chunks → rank after rerank → final prompt → answer.
   Name which stage fails before changing anything.
4. Measure retrieval (recall@k) and generation (faithfulness) before/after any change.
