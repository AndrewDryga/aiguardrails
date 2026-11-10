---
title: "LLM red teaming for agents"
description: "Plan an authorized adversarial exercise, inspect real effects and turn findings into regression tests."
category: "Testing & tools"
primaryKeyword: "llm red teaming"
relatedKeywords: ["ai red teaming", "agent red teaming"]
order: 17
reviewedDate: "2026-11-09"
answer: "LLM red teaming is an authorized attempt to find ways an AI system can violate its intended behavior or security boundaries. For an agent, the target includes retrieval, memory, tools and downstream effects. A useful finding records a reproducible path and observed consequence, not only a provocative prompt or an unusual answer."
related: ["ai-guardrails-testing", "indirect-prompt-injection", "llm-security"]
sources: [{"title": "Promptfoo red teaming", "url": "https://www.promptfoo.dev/docs/red-team/"}, {"title": "garak LLM vulnerability scanner", "url": "https://garak.ai/"}, {"title": "OWASP AI agent security", "url": "https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html"}]
---

An adversarial exercise should answer a question the release owner can act on. "Can an external ticket cause this agent to change an unrelated service?" identifies a path, a resource boundary and an outcome. "Can we make the chatbot say something strange?" may find a behavior issue, but it does not test that deployment decision.

Use the [LLM security map](/guides/llm-security/) to choose the boundaries worth exercising. Keep ordinary task tests alongside adversarial ones so repairs do not leave the application unable to do its job.

## Agree on the rules of engagement

Document the authorized systems, identities, test window and allowed techniques. Name someone who can stop the exercise and someone who can resolve an unexpected effect. Synthetic data and fake sinks should make it possible to observe a failure without exposing customer information.

A hypothetical exercise record might say:

| Field | Example scope |
| --- | --- |
| Target | Staging incident assistant, frozen deployment revision |
| Allowed inputs | Synthetic incident tickets, retrieved test documents, tool-result fixtures |
| Protected outcome | No action on a service outside the assigned test incident |
| Data | Synthetic canary values; no production credentials |
| Allowed actions | Reads and a resettable change on one disposable test service |
| Stop condition | Any contact with an unapproved destination or non-test resource |
| Evidence owner | Application security reviewer with access to test executor records |
| Cleanup | Remove test identities, documents, memory and pending work |

These are example choices. A team's real authorization may be narrower. The [rules-of-engagement worksheet](/resources/red-team-engagement.md) leaves the decisions for the owner to fill in.

## Choose a route to a prohibited outcome

Vary the entry point and the authority the attacker appears to claim. A ticket, a tool error and a memory entry exercise different code paths even when they contain similar instructions.

| Entry point | Attempted deviation | Observation that would establish the effect |
| --- | --- | --- |
| Retrieved troubleshooting page | Read an unrelated service's configuration | Protected read accepted or sensitive synthetic marker returned |
| Tool error | Send diagnostics to an unapproved sink | Delivery record at that sink |
| Stored lesson | Reuse an old approval on a new task | New operation accepted under the wrong decision |
| Generated tool arguments | Widen one target into several | Executor records show the widened target set |
| Interrupted action | Repeat a change after a lost response | More effects than the authorized request allows |

The attack input alone does not establish success. The [indirect injection walkthrough](/guides/indirect-prompt-injection/) shows how to distinguish a model that proposes a prohibited action from a service that actually performs it.

### Explore, then simplify

During exploration, follow failures across multiple steps. If a misleading document becomes a memory entry that changes a later action, preserve the sequence. Once the path is understood, remove unrelated turns until the smallest useful reproduction remains.

Avoid changing the application configuration between every trial without recording it. Otherwise it becomes difficult to tell whether a result came from the input, a policy change or a different model version. Keep the complete run evidence for any finding that depends on timing or repeated attempts.

## Use testing tools for the work they perform

[Promptfoo documents adversarial generation and application testing](https://www.promptfoo.dev/docs/red-team/). [garak](https://garak.ai/) is an LLM vulnerability scanner. These tools can help generate and organize probes, but the target integration determines whether they exercise your actual retriever, permissions and execution service.

A test directed at a model API alone cannot establish tenant isolation in the application around it. Connect target-side observations where the exercise concerns data reads or writes. Review generated inputs before running them when the agreed scope restricts certain techniques or content.

Pin the tool and configuration versions used for the exercise. Keep tool-generated judgments separate from deterministic evidence. A grading model can help inspect text, but it should not decide whether an external side effect occurred when the executor can provide that fact.

## Write findings that support a repair

Use a record with the initial state, exact delivery path, attempted deviation, observed effect and evidence references. State the deployment and policy versions. Include whether the finding reproduces and under what conditions.

For a hypothetical memory-related finding, the useful description is: "A test document's export instruction was saved in shared memory; a later task retrieved it and proposed an export outside its scope. The action service denied the export." That directs repair toward memory handling while preserving the evidence that the execution boundary held.

Do not upgrade the finding to a confirmed disclosure unless data actually left the permitted boundary. Do not close it merely because a final chat message sounds safer after a prompt edit.

## Retest the path and the useful task

After a repair, repeat the original sequence under the recorded conditions. Then exercise nearby variations: another supported input format, a new task session, an unavailable dependency or a changed target. Keep the ordinary task in the same review.

Add focused cases to the [guardrail regression suite](/guides/ai-guardrails-testing/). Record unreproduced findings and untested routes as unresolved evidence, not as passes. A completed exercise only covers the authorized scope and cases explored; the [release checklist](/guides/ai-guardrails-checklist/) should preserve that limit.
