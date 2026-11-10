---
title: "LLM security: map the whole application"
description: "Build a threat model around data, retrieval, tools, credentials and output consumers."
category: "Foundations"
primaryKeyword: "llm security"
relatedKeywords: ["llm application security", "ai agent security"]
order: 20
reviewedDate: "2026-11-09"
answer: "LLM security protects the application around a language model, including its data, credentials, retrieval systems, tools and output consumers. The threat model should identify who controls each input and what effects the application can produce. Model behavior is one part of the review; ordinary access-control and software-security boundaries still apply."
related: ["rag-security", "ai-agent-sandbox", "llm-red-teaming"]
sources: [{"title": "OWASP Improper Output Handling", "url": "https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/"}, {"title": "OWASP Vector and Embedding Weaknesses", "url": "https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/"}, {"title": "OWASP Excessive Agency", "url": "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/"}]
---

A model that only drafts public text and a model that can administer a production service can share the same weights. Their security reviews differ because their reachable resources and possible effects differ.

Begin with one deployed workflow. A list of generic LLM risks helps check coverage, but it cannot tell you which credentials this application has or where its output goes.

## Map an incident assistant

The following hypothetical map has two kinds of input: a human's task and the evidence the assistant retrieves. It also has two output paths: a report and proposed operational actions.

```text
Authenticated operator -> application -> model
                             |           |
                             |           +-> proposed tool arguments
                             |                    |
                             +-> retriever        +-> authorization -> executor
                                   |                                      |
                             logs and documents                      test service

Model answer -> output validation -> incident report
All components -> selected telemetry under a separate access policy
```

Mark the components that an external author, ordinary user or compromised dependency could influence. Identify where a trusted fact is obtained: user identity, assigned service, approved destination and current policy. Keep those facts separate from text the model generates.

## Turn the map into a threat register

| Asset or boundary | Concrete failure scenario | First owner to involve |
| --- | --- | --- |
| Private source data | Retrieval includes another account's logs | Data-service owner |
| Task instructions | A document changes the assistant's goal | Application owner |
| Tool execution | Generated arguments widen the permitted target | Tool-service owner |
| Credentials | A local process reads a token it does not need | Runtime owner |
| Report rendering | Generated text is interpreted as active content | Interface owner |
| Telemetry | Debug output copies a private payload | Observability owner |
| Dependencies | An ingestion plugin changes what content enters context | Integration owner |

These are example scenarios, not severity ratings. Rank them using the actual data and effects. A private-document leak can matter more than an offensive phrase; a wrong production change can matter more than either. Consider how many people or resources are affected and whether the result can be detected or recovered.

[OWASP's improper output handling guidance](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/) covers generated data reaching downstream consumers. [Its vector-store guidance](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/) covers risks in retrieved data. Neither review should stop at the final chat bubble.

## Separate data authority from action authority

The retriever determines what information reaches the model. Apply current user and account permissions there, including caches and previews. The [RAG security guide](/guides/rag-security/) gives a two-tenant test for that boundary.

The execution service determines which proposed effects may occur. It should validate arguments and check the current identity, target scope and approval. [Agent guardrails](/guides/ai-agent-guardrails/) cover that path. If the agent has an alternate administrator credential, inspect it as another route to the same effect.

A content filter cannot establish either permission. It can reduce unwanted text or flag suspicious input, but a low-risk score does not prove that a document belongs to the user or that a restart is authorized.

## Inspect execution and dependency trust

If the agent can run code, review its [sandbox](/guides/ai-agent-sandbox/), mounted files and network access. Include package installation and build hooks. Code from a dependency may run with the same authority as the agent process.

List third-party model endpoints, document connectors, parsers, tool servers and telemetry exporters. For each, record what it receives and what its failure could change. Pin or record versions where the platform supports it, and make updates trigger the relevant tests.

A signed artifact or trusted publisher reduces some supply-chain uncertainty. It does not prove that the component's behavior fits this deployment's permissions. Review configured capability separately from origin.

## Define failure behavior before testing

A security review needs ordinary operational failures too. Consider an unavailable authorization service, a parser that returns partial data, an expired approval and a connection loss after dispatch.

For each, name the state the application should enter and what evidence can establish it. If dispatch did not occur, an action can remain stopped. If the response was lost after dispatch, inspect the operation before retrying. The [fail-closed guide](/guides/fail-closed-guardrails/) explains this distinction.

For answer-only workflows, an acceptable fallback may be a limited answer with accessible source links. For a protected action, a missing permission decision should not silently become permission.

## Choose evidence for the highest-consequence paths

Start with allowed tasks and nearby prohibited cases. Test a correct resource and a different account's resource. Approve one target and submit another. Interrupt a dependency and inspect the target's actual state. Look for synthetic sensitive markers in output and logs.

Use [red teaming](/guides/llm-red-teaming/) to explore paths the initial review missed. Turn reproducible findings into [regression tests](/guides/ai-guardrails-testing/), with configuration and evidence references. Preserve failures and unobserved outcomes in the release record.

The review should end with decisions: which capability can ship, which remains disabled, which uncertainty needs investigation and who owns each item. An unresolved critical path should not be hidden behind an average score for answer quality.
