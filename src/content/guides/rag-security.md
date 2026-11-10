---
title: "RAG security from ingestion to answers"
description: "Preserve document permissions through chunks, retrieval, caches and deletion, with a worked two-tenant example."
category: "Implementation"
primaryKeyword: "rag security"
relatedKeywords: ["retrieval augmented generation security", "vector database security"]
order: 15
reviewedDate: "2026-11-09"
answer: "RAG security protects the data pipeline that supplies retrieved information to a language model. It includes source integrity, document and chunk permissions, tenant separation, cache behavior and output handling. A relevant search result must still be authorized for the current user before its content reaches the model or another destination."
related: ["llm-guardrails", "indirect-prompt-injection", "pii-redaction"]
sources: [{"title": "OWASP RAG Security Cheat Sheet", "url": "https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html"}, {"title": "OWASP Vector and Embedding Weaknesses", "url": "https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/"}, {"title": "OWASP Authorization Cheat Sheet", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"}]
---

A search engine can retrieve the most relevant document and still return the wrong customer's information. Relevance ranking answers which passage is similar to the question. Access control answers whether this requester may receive it.

[OWASP's vector and embedding guidance](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/) identifies unauthorized retrieval and cross-context leakage as risks. Review the complete data path, including copies that no longer look like the original document.

## Keep access metadata with every derived item

Use this hypothetical corpus: Tenant Cedar owns a private maintenance plan; Tenant Birch owns a different plan. Both discuss the same equipment, so a query can match either one.

When the ingestion service splits Cedar's document into passages, each passage needs a stable relationship to the source and its access policy. A conceptual record is:

```json
{
  "chunk_id": "cedar-plan-7:p3",
  "source_id": "cedar-plan-7",
  "source_revision": 2,
  "tenant_id": "cedar",
  "access_policy_ref": "cedar-maintenance-readers",
  "text": "Synthetic maintenance passage"
}
```

This is illustrative data, not a database-specific schema. The ingestion service should assign trusted metadata from the source system. Document text saying `tenant_id: birch` must not change ownership.

Preserve these relationships when re-chunking, embedding, summarizing and indexing. If derived summaries combine sources with different restrictions, determine an access rule that protects all included content. Do not label the result public merely because one input was public.

## Retrieve under the caller's current permissions

Authenticate the caller before selecting the search scope. Use trusted account and group membership rather than a tenant identifier chosen by the model. The search implementation may enforce an access filter inside the query or use a separate secure retrieval step; either way, unauthorized content must not enter the model context or response.

### Test the two-tenant boundary

Seed Cedar's plan with a unique synthetic marker. Ask the Birch user a question that makes Cedar's passage highly relevant. Inspect the retrieved context, generated response and visible citation list. Neither should contain Cedar's private marker.

Then reverse the test and run the legitimate within-tenant requests. Add direct chunk lookup and document-preview paths, because those may use different handlers than semantic search. The [LLM guardrail guide](/guides/llm-guardrails/) explains how source membership and answer support are separate checks after authorized retrieval.

### Handle missing permission state

If the access-policy service is unavailable, choose a defined behavior for protected sources. Do not silently run an unfiltered query. The application might return separately authorized public documentation, or explain that private search is unavailable. Keep that fallback explicit and test it.

## Scope caches to the information they contain

A shared answer cache keyed only by question text can return Cedar's answer to Birch. A retrieval cache can leak the same information earlier. Record which identity and permission context each cached artifact is valid for.

A conceptual key might include tenant, permission-context version, query and corpus revision. Those fields are examples, not a complete universal key: users within one tenant can have different rights, and permission changes may need immediate invalidation rather than waiting for a version refresh.

Test this sequence: Cedar warms the cache, Birch asks the same question, then Cedar loses access and asks again. Verify every response against current authority. Include session history: removing a document from the index does not remove text already copied into a conversation.

## Treat deletion as a propagation problem

Document removal may need to affect chunks, embeddings, summaries, caches and source previews. Keep a source-to-derived-item relationship that lets the system find these copies. Define how quickly the application stops serving removed content and what happens during that interval.

In the synthetic test, delete Cedar's source and search for its marker through each supported route. If a historical audit record must retain evidence, protect that retained copy under its own access and retention rules. Do not claim that index deletion erased every copy the system has ever made.

[OWASP's RAG security guidance](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html) addresses access inheritance, caches and deletion across this pipeline. The exact invalidation mechanism depends on your storage and authorization systems.

## Preserve source content as evidence

A passage can be authorized to read and still contain an [indirect instruction attack](/guides/indirect-prompt-injection/). Preserve its provenance, separate it from application instructions and restrict what the model can do with it.

An equipment manual may explain a reset procedure. Reading the procedure does not grant permission to reset a real device. A tool request derived from the answer still needs [action authorization](/guides/tool-calling-guardrails/), including the correct target and any required approval.

Likewise, an answer can cite a real authorized passage while making a claim the passage does not support. Review grounding independently. Source links help a reader inspect the claim; their presence is not proof of accuracy.

## Review the copies outside the search index

Inspect traces, reranking inputs, debug dumps and analytics. A model provider or evaluation service may receive passages even when the user never sees them. Minimize fields before those transfers and use [PII handling](/guides/pii-redaction/) where the data policy calls for it.

A useful acceptance packet includes the two-tenant tests, a revoked-access test, a warmed-cache test, deletion propagation evidence and an injected-document case. Save the corpus and permission revisions with those results so a later indexing change can be compared with the same conditions.
