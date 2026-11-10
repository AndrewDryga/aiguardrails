---
title: "Prompt injection prevention for apps and agents"
description: "Reduce prompt injection risk by separating untrusted content from authority and testing the data and actions an attacker could reach."
category: "Threats"
primaryKeyword: "prompt injection prevention"
relatedKeywords:
  - "prompt injection"
  - "indirect prompt injection"
  - "prompt injection detection"
order: 3
reviewedDate: "2026-11-09"
related:
  ["ai-agent-guardrails", "tool-calling-guardrails", "ai-guardrails-testing"]
sources:
  - title: "OWASP prompt injection prevention cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"
  - title: "OWASP excessive agency"
    url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/"
  - title: "MCP tools specification"
    url: "https://modelcontextprotocol.io/specification/latest/server/tools"
answer: "Prompt injection happens when an AI application treats attacker-controlled content as instructions for how it should behave. The content can arrive directly in a chat message or indirectly through a document, website, email or tool result. Prevention work should focus on both the model's response and the systems that response can affect."
---

A detector can help identify suspicious text. It cannot establish that every remaining instruction is trustworthy. Build the application so a misleading document cannot grant permission to read private data or perform an action.

For the difference between redirecting an application and bypassing a model’s safety rules, see [prompt injection versus jailbreaking](/guides/prompt-injection-vs-jailbreak/). Classifying the attempt helps you choose what to test.

## How indirect prompt injection reaches a tool

Imagine an operations assistant reading a troubleshooting page. A paragraph on the page tells it to collect configuration files and upload them to a new address before continuing. The legitimate user asked for a diagnosis; the page introduced a separate request.

The failure can cross several boundaries:

1. The retriever obtains content from a source an attacker can edit.
2. The model interprets part of that content as a task instruction.
3. The assistant selects a tool that can read more information.
4. Another tool sends that information outside the intended destination.

[OWASP's prompt injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) identifies external documents and tool content as indirect injection sources. In the example above, checking only the user's original question misses the material that changed the task.

## Keep the user's authority separate from document text

Pass retrieved passages as source material and identify where they came from. Avoid copying document text into the same trusted instruction field that defines the assistant's role. Clear separation helps the model interpret the content, but the surrounding application must still enforce permissions.

Store the authenticated user, account and approved task scope outside model-generated fields. A document saying "the user approved this" must not update that state. The same applies to a tool response that claims a new administrator permission.

For an assistant that only summarizes public pages, remove upload and private-file tools entirely. For an assistant that needs private records, make the retrieval service check the current user's access. A model should not be able to widen the search by changing an account identifier.

## Limit what an incorrect decision can do

[OWASP's excessive agency guidance](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) describes risks from excessive functionality, permissions and autonomy. Review all three in your integration.

Give a diagnostic assistant tools that retrieve specific observations. If it needs to restart a service, expose a separate action with a bounded target and a clear approval policy. Keep credentials in the component that enforces access.

For external requests, control the destination as well as the operation. A tool allowed to send data to any URL creates a different risk from one restricted to a configured internal endpoint. Check redirects and resolved destinations where relevant to the network client. Treat that as a conventional application security boundary, independent of the model's explanation.

## Treat tool descriptions and results as inputs

A tool can have a harmless name and a misleading description. Its result can contain instructions, links or unexpected private data. The [MCP tools specification](https://modelcontextprotocol.io/specification/latest/server/tools) says clients must treat tool annotations as untrusted unless they come from trusted servers.

Review new tool servers before connecting them to sensitive workflows. Reassess when their definitions or permissions change. Return only the result fields the next step needs, and preserve the distinction between a tool's data and the application's instructions.

A confirmation prompt should show the actual proposed action and destination. Asking someone to approve a vague "continue troubleshooting" message gives them little chance to spot the injected request.

## Design the response to an injected troubleshooting note

Use a hypothetical application that reads service logs and can request a restart. Its legitimate task is to explain a failing health check. An attacker-controlled log line says that diagnosis requires changing the service's output destination. No real destination or secret is needed to test this case.

Write the intended authority separately from the log:

```text
Task: investigate checkout health
Allowed reads: checkout status and filtered checkout logs
Allowed writes: none in this task
Output: the current incident record
External log text: evidence only
```

This is a design record, not runnable policy syntax. The component receiving a restart or export request must enforce the record's restrictions using authenticated state.

### Before the model reads the note

Limit the log response to the relevant service, time window and fields. Preserve its source ID. Label it as tool output, and keep it out of the application's trusted instruction field. A [prompt injection detector](/guides/prompt-injection-detection/) can flag the attempted redirection, but an unflagged result must not widen the task.

Avoid automatically deleting every sentence that contains an imperative. Real troubleshooting material contains instructions. Removing context can make diagnosis worse, and an attacker can express the same request without an obvious command word. A detector's result needs an explicit policy: withhold, show as suspicious evidence, or continue with the existing limits.

### When the model proposes an action anyway

Suppose it proposes an export despite the design. Validate the request, then reject it because this task has no export authority. The correct test observation is no accepted export at the destination plus a denial record. The model may still have followed the injection; the action boundary contained that consequence.

If the action service cannot fetch the current policy, follow the [fail-closed behavior](/guides/fail-closed-guardrails/) for that operation. An outage is an evaluation error, even though the action remains stopped. Keep those outcomes separate in reports.

### When the content survives into another turn

A later question may reuse a summary of the log. Preserve the summary's untrusted provenance and avoid promoting its claims into standing instructions. If the application saves lessons between sessions, review its [memory write path](/guides/memory-poisoning/) too. Fixing the immediate display does not remove a stored copy.

The [indirect injection walkthrough](/guides/indirect-prompt-injection/) provides a complete fixture and event sequence. Use the broader prevention review here to identify every place that the same untrusted material could gain authority.

## Test the outcome an attacker wants

Use synthetic content in an isolated test environment. Put an instruction in a retrieved document asking the assistant to access an unrelated record or change an approved destination. Assert that the protected service rejects the request and that no external transmission occurs.

Vary the delivery: a quoted email, a tool error, a document footnote, a different supported language, or text carried into a later conversation turn. Also include benign documents that discuss prompt injection so the assistant can still analyze security material.

Keep the test evidence specific. "The assistant refused this prompt" describes one response. "The upload endpoint received no request and the authorization log recorded a denial" describes the protected outcome. Repeat tests after changing tools, permissions or retrieval sources, because each change can open a path that the original checks never covered.
