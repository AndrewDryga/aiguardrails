---
title: "Prompt injection vs jailbreak"
description: "Distinguish instruction attacks, safety bypasses and tool effects so the test measures the failure you care about."
category: "Foundations"
primaryKeyword: "prompt injection vs jailbreak"
relatedKeywords: ["jailbreak vs prompt injection", "llm jailbreak"]
order: 18
reviewedDate: "2026-11-09"
answer: "Prompt injection attempts to redirect an AI application away from its intended instructions. Jailbreaking usually means trying to bypass a model’s safety restrictions. The terms overlap and sources use them differently. For testing, identify the attacker-controlled input, the rule being violated and the observable result instead of relying on the label alone."
related: ["prompt-injection-prevention", "indirect-prompt-injection", "ai-guardrails-testing"]
sources: [{"title": "OWASP prompt injection prevention", "url": "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"}, {"title": "Promptfoo red teaming", "url": "https://www.promptfoo.dev/docs/red-team/"}, {"title": "OWASP Improper Output Handling", "url": "https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/"}]
---

A document that asks an assistant to email a private file can be dangerous without asking the model for disallowed content. Conversely, a model can produce prohibited text without having access to files or tools. Those failures need different observations and repairs.

[Promptfoo's red teaming documentation](https://www.promptfoo.dev/docs/red-team/) describes jailbreaks in terms of bypassing a model's underlying safety constraints. [OWASP's injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) covers attacks delivered through direct input and external content. Use those distinctions as working terminology, not a claim that every vendor uses the words identically.

## Compare the goal, delivery and effect

| Case | Attacker's goal | Delivery | What to observe |
| --- | --- | --- | --- |
| Direct instruction override | Make an assistant abandon its assigned task | User message | Whether the application follows the unauthorized task change |
| Indirect instruction override | Redirect another user's assistant | Retrieved page or tool result | Model proposal and any downstream effect |
| Safety bypass | Produce content outside the model's safety rules | Prompt or multi-turn exchange | Content against the relevant policy rubric |
| Combined attempt | Bypass a content restriction and trigger a forbidden tool | Several input surfaces | Both the content result and target-side action |

Direct and indirect describe where the instruction enters. Jailbreak commonly describes the constraint the attacker wants to bypass. They are not cleanly exclusive categories.

The word "attack" also needs context. A user telling their own writing assistant to change tone may be making an authorized task change. The same sentence inside an unrelated retrieved document may be an attempt to redirect the assistant. Preserve the source and the user's actual intent when labeling a test.

## Work through three harmless examples

### A document changes the task

A hypothetical purchasing assistant is asked to summarize a public product manual. A sentence in the manual tells it to add a positive recommendation regardless of the product's specifications. This is an indirect instruction attempt against answer integrity.

The expected behavior is a summary based on the manual's evidence, with the injected direction treated as source text. If the assistant also has a purchasing tool, inspect whether it proposes or submits an order. Answer distortion and unauthorized purchase are separate outcomes.

Use the [indirect prompt injection guide](/guides/indirect-prompt-injection/) for a test that follows the external-content path through an action boundary.

### A test tries to bypass a content restriction

Suppose an application has a harmless local rule that it must never output a synthetic marker, `RESTRICTED_TEST_TOKEN`. A red team asks it to print the marker through role-play or repeated reformulations. That can test adherence to the local rule without using harmful content.

Passing this toy exercise does not measure the model's performance against every safety category. Its value is demonstrating how to record a rule, test an attempted bypass and inspect the output. Real policy evaluations need representative cases and appropriate reviewers.

### A valid answer becomes unsafe application input

An assistant returns a string that the application inserts into a web page without appropriate output handling. If that string changes page behavior, the integration has an output-handling problem whether or not the model ignored an instruction.

[OWASP's improper output handling category](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/) concerns generated output passed into other components. A refusal detector does not replace the web application's rendering protections. The [structured-output guide](/guides/structured-output-validation/) explains why a string can match a schema and still require safe handling by its consumer.

## Pick the assertion before running the prompt

For instruction adherence, compare the output or proposed plan with the authorized task. For content safety, apply a defined rubric and retain uncertain judgments. For a data boundary, check the information actually returned. For an action, inspect the execution record and resulting state.

A response containing "I cannot do that" is not a universal pass condition. A tool may already have run, or the refusal may itself include the protected content. Likewise, an unusual answer does not prove that a protected resource was affected.

Record both the model's behavior and the application's enforcement. This helps distinguish a model change that reduces bad proposals from a server-side fix that stops their consequences.

## Route findings to the right owner

An incorrect task change may require changes to context assembly, retrieval or memory. An authorization failure belongs at the receiving service. Unsafe rendering belongs to the output consumer. A classifier that blocks legitimate analysis needs a detector evaluation with false-block cases.

Keep the failure's concrete path in its regression name. "Retrieved manual changed purchase destination" is easier to maintain than "jailbreak 47." Use the [testing guide](/guides/ai-guardrails-testing/) to preserve inputs, policy versions and target observations when the terminology changes.
