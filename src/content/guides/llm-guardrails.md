---
title: "LLM guardrails for applications that generate answers"
description: "Design LLM guardrails around retrieval, generation, output validation and failure handling without assuming one filter covers every path."
category: "Implementation"
primaryKeyword: "llm guardrails"
relatedKeywords:
  - "guardrails for LLM"
  - "LLM output validation"
  - "AI content filtering"
order: 2
reviewedDate: "2026-11-09"
related:
  [
    "prompt-injection-prevention",
    "structured-output-validation",
    "ai-guardrails-testing",
  ]
sources:
  - title: "NVIDIA NeMo Guardrails overview"
    url: "https://docs.nvidia.com/nemo/guardrails/about-nemo-guardrails-library/overview"
  - title: "Using the ApplyGuardrail API"
    url: "https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-independent-api.html"
  - title: "Google Cloud safety and content filters"
    url: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/configure-safety-filters"
answer: "LLM guardrails check what an application sends to a language model and what it does with the response. For an assistant that answers from company documents, that includes the user's request, retrieved passages, generated text and any data passed to another service. Draw those paths before selecting a filter."
---

Suppose an employee asks a handbook assistant about parental leave. The application retrieves policy documents, asks a model to explain them, and displays an answer with links. A useful design checks document access before retrieval, keeps the answer within the available evidence, and handles missing information without inventing a policy.

## Put each check next to the decision it controls

An input check can reject an unsupported request before spending money on generation. A retrieval check can remove material that the user should not receive. An output check can reject a malformed answer before the interface renders it.

These stages are explicit in [NeMo Guardrails' architecture](https://docs.nvidia.com/nemo/guardrails/about-nemo-guardrails-library/overview), which includes input, retrieval and output rails. Their presence in a framework does not mean every stage is configured in your application. Follow a request through the running integration and identify which checks it actually invokes.

| Stage    | Handbook assistant check                          | Failure behavior                               |
| -------- | ------------------------------------------------- | ---------------------------------------------- |
| Retrieve | User can access the selected policy document      | Omit inaccessible material                     |
| Generate | Provide document text and its source identifiers  | Stop if the required source is unavailable     |
| Validate | Referenced sources exist in this retrieval result | Ask for clarification or show a limited answer |
| Display  | Render text with the application's escaping rules | Reject unsupported markup                      |

Source membership only proves that a reference exists. Checking whether the source supports the sentence is a separate task, and an automated judge can make mistakes.

## Separate exact rules from estimated judgments

Use ordinary application code for facts the application knows. Whether a field is present, an identifier belongs to the current account, or a response exceeds a length limit does not require a second language model.

Judgments about abusive content or whether an answer follows a document can require a classifier or model. Treat their scores as inputs to a policy. Define the categories that matter to your audience and test examples around the chosen threshold.

Google's [safety filter documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/configure-safety-filters) describes configurable blocking thresholds and separates filtering from changes to model behavior. A threshold setting should therefore be tested with your workload. Its name does not establish how it handles your support tickets or internal terminology.

## Watch streaming and intermediate outputs

If you stream every token to the browser and check the completed response afterward, the user has already seen the text. Decide whether your application can buffer the full answer, validate chunks with enough context, or restrict streaming to content that is safe to reveal before final validation.

Also inspect intermediate material. An agent may generate a tool argument without placing it in the visible answer. A retrieval step may return private data that never appears on screen but enters a trace. Checking the final chat message leaves those paths outside the control.

AWS documents an [ApplyGuardrail API](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-use-independent-api.html) that can assess text independently of a model invocation. An independent assessment can help at additional boundaries, but your integration still chooses the content to submit and the action to take afterward.

## Handle rejection without a retry loop

A rejected answer should lead to a bounded recovery path. For the handbook assistant, one retry with a narrower instruction might be reasonable when a source identifier is missing. If the second answer also fails validation, return the source links or ask the employee to narrow the question.

Do not keep asking the model until a detector eventually accepts something. Repeated generation increases cost and creates more chances for an unsuitable answer to pass. Apply the same validation to regenerated text, and keep the original failure in the diagnostic record.

Avoid forwarding sensitive rejected text to another model merely to explain the error. A short internal error code is often enough for the application to choose a useful user message.

## Work through an incomplete handbook answer

This example uses invented policy text to show the decisions. It is not employment advice or a real organization's leave policy.

The employee asks: "How much leave can I carry into next year?" The accessible source `leave-2026`, revision 4, says: "Employees in Region A may carry five days into the next calendar year. Region B uses a separate policy." The employee's region is unavailable to the assistant.

### Preserve the uncertainty in the draft

A draft saying "You can carry five days" is unsupported for this employee. A source ID pointing at `leave-2026` does not fix that problem. A better proposed answer is: "Region A's policy permits five days. I don't have your region, and this document does not state Region B's rule. Which region's policy do you need?"

An illustrative structured result could contain:

```json
{
  "answer": "Region A permits five days. Which region's policy do you need?",
  "sources": [{"id": "leave-2026", "revision": 4}],
  "needs_clarification": true
}
```

The [schema validator](/guides/structured-output-validation/) can check fields and types. Application code can check that `leave-2026` revision 4 was actually retrieved. A reviewer or a tested grounding check still needs to examine whether the wording accurately represents that source. These checks have different failure modes.

### Recheck the retrieved material

If the employee supplies Region B, start a new authorized retrieval. Do not extend the five-day figure to Region B. If its policy is missing, return that limitation and the approved contact route. If access to the document is denied, avoid revealing restricted snippets through citations, previews or error text. The [RAG guide](/guides/rag-security/) covers access changes and cached answers.

A document can also contain instructions unrelated to leave. Keep those passages as untrusted source text. A grounding check that rewards copying a source must not encourage copying an [injected instruction](/guides/indirect-prompt-injection/) into the answer.

### Decide what the reader sees during validation

For this workflow, a reasonable design is to stream a neutral progress message while buffering the draft answer. The user sees the answer only after the required checks finish. This trades some perceived speed for a clear point at which the application can withhold unsupported policy text.

If validation times out, discard the unvalidated draft from the display path. Offer the accessible policy link or an explanation that the answer could not be checked. Do not send the rejected draft to analytics or include it in a public error message.

Record the source revision, validation outcome and fallback taken. Keep the employee's personal details out of this routine record. A later reviewer should be able to tell whether the issue came from a missing policy, a misleading draft or an unavailable validator.

## Review the whole answer path after changes

Keep a set of handbook questions with expected sources, allowed output shapes and known failure cases. Run it when you change the model, retrieval settings, prompts or guardrail configuration. Compare helpfulness as well as blocking behavior.

Record the deployed versions together. If a new document format breaks source extraction, the symptom may look like a model problem. Being able to reproduce the exact retrieval result and policy version will make that distinction easier to find.
