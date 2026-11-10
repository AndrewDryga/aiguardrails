---
title: "Memory poisoning in AI agents"
description: "Track untrusted information from memory write to later retrieval, correction and action."
category: "Threats"
primaryKeyword: "memory poisoning"
relatedKeywords: ["ai agent memory poisoning", "llm memory poisoning"]
order: 19
reviewedDate: "2026-11-09"
answer: "Memory poisoning occurs when misleading facts or instructions enter an agent’s persistent context and influence later work. The source may be a document, conversation, tool result or another agent. Defenses need to cover who can write memory, how entries retain provenance, which tasks may retrieve them and how bad entries and their derived copies are removed."
related: ["indirect-prompt-injection", "rag-security", "tool-calling-guardrails"]
sources: [{"title": "AgentPoison: Poisoning Memory or Knowledge Bases", "url": "https://arxiv.org/abs/2407.12784"}, {"title": "OWASP AI agent security", "url": "https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html"}, {"title": "OWASP RAG Security Cheat Sheet", "url": "https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html"}]
---

An agent can reject a suspicious instruction today and still encounter a summary of it tomorrow. Persistent memory introduces a second path: content can survive the conversation in which it first arrived, lose its original context and appear later as a helpful fact.

The [AgentPoison research](https://arxiv.org/abs/2407.12784) studied attacks against agents through poisoned memory or knowledge bases. Its experimental results concern the systems and conditions in that paper; they are not a failure rate for every memory implementation. The practical review starts with your own write and retrieval paths.

## Identify what the application calls memory

Memory may be a conversation summary, a preference store, a vector index, a repository file or a record of previous actions. List each store and its readers. A file that a later agent loads automatically can influence work even if the product calls it documentation.

Separate categories with different authority. A user preference about report format should not share an update path with an administrator-approved output destination. A remembered observation about yesterday's service state should not become a permanent operational rule.

| Memory class | Example | Review concern |
| --- | --- | --- |
| User preference | Use a short report format | Who can change another user's preference? |
| Task summary | A test failed on revision 8 | Does the summary preserve time and scope? |
| Retrieved knowledge | A troubleshooting passage | Can its source be changed or removed? |
| Operational policy | Approved destinations | Is this writable only through the trusted policy process? |

## Follow one poisoned item

Consider a hypothetical diagnostic assistant that summarizes completed incidents. An untrusted ticket claims that all future diagnostic reports should go to a new destination. The summary writer stores that claim as a general lesson. A later task retrieves it.

The failure spans several steps:

1. The ticket supplies a destination claim without authority to change policy.
2. The summarizer removes the warning that the claim came from an external ticket.
3. The memory store makes the summary available outside the original incident.
4. The next task treats it as a standing instruction.
5. A sending tool may receive a proposal based on that instruction.

The [indirect injection guide](/guides/indirect-prompt-injection/) covers the first encounter. Here the additional defect is persistence across tasks.

### Make a write proposal reviewable

A conceptual memory record could retain:

```json
{
  "id": "memory-test-24",
  "kind": "incident_observation",
  "task_id": "incident-test-8",
  "source_id": "external-ticket-test-8",
  "source_trust": "untrusted_content",
  "claim": "Ticket requested a different report destination",
  "scope": "incident-test-8",
  "status": "unverified"
}
```

This is illustrative data. Notice that the record stores what the ticket claimed, not a new approved destination. It does not authorize any future action.

The memory writer should enforce permitted fields and scope. Some entries may require human review, while temporary task observations may be stored automatically within a narrow scope. Decide this by consequence rather than requiring approval for every harmless note.

### Preserve the distinction when reading

Retrieve memory under the current user's and task's permissions. Carry source, age and verification status into the context the model receives. Avoid combining several unverified claims into a summary labeled as a system instruction.

A content signature can help detect changes after storage. It cannot establish that the original claim was true or authorized. Similarly, an expiry limits how long a bad entry remains available; it does not make the entry safe during that time.

## Keep action permission independent

If the next task proposes sending a report to the remembered destination, the [tool service](/guides/tool-calling-guardrails/) should still use the configured destination policy. A memory entry saying "already approved" must not supply approval.

This separation lets the system contain a memory error while an operator investigates it. It also gives the test a precise assertion: the memory may influence a proposal, but no unauthorized delivery should occur. Record whether both conditions held instead of collapsing them into one result.

## Correct the item and its descendants

Removal starts with the source-to-derived-item relationship. Find the original entry, summaries created from it, retrieval caches and open task contexts that already contain it. Decide which tasks must restart with clean context. Deleting one row does not remove copies already loaded into running sessions.

Preserve restricted evidence needed for investigation before changing it. Record why an entry was invalidated and how future retrieval excludes it. If an entry reflects a legitimate policy change, update policy through its trusted owner and then refresh any explanatory memory; do not use memory as a back door into policy.

The [RAG security guide](/guides/rag-security/) covers deletion and access propagation for indexed content. The same questions apply when memory is stored in a vector database.

## Test across more than one session

Create the synthetic ticket, run the summary step and inspect the stored record. Start a new task that would retrieve the entry. Observe the proposal and any receiving-service decision. Correct the entry, invalidate derived copies, and repeat with a fresh task.

Also test tenant isolation, expired entries, an unavailable memory store and a concurrent write during correction. Keep expected states explicit. A task may continue without optional memory, but it should report missing context accurately and retain the same action limits.

[OWASP's agent security guidance](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) includes memory isolation and validation. Apply those ideas to the actual storage lifecycle, then retain the cross-session fixture as a regression. A one-turn prompt test cannot establish that the repair removed persistent influence.
