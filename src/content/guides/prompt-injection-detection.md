---
title: "Prompt injection detection"
description: "Evaluate detector coverage, score thresholds, false blocks and outages against the inputs your application actually processes."
category: "Testing & tools"
primaryKeyword: "prompt injection detection"
relatedKeywords: ["prompt injection detector", "prompt injection filtering"]
order: 14
reviewedDate: "2026-11-09"
answer: "Prompt injection detection classifies content that may be trying to override an AI application’s instructions. Detectors can use rules, classifiers or language models. Their results are fallible signals for an application policy; they do not establish a caller’s permission to read data or execute tools."
related: ["prompt-injection-prevention", "ai-guardrails-testing", "indirect-prompt-injection"]
sources: [{"title": "Cloudflare prompt injection detection", "url": "https://developers.cloudflare.com/waf/detections/ai-security-for-apps/prompt-injection/"}, {"title": "OWASP prompt injection prevention", "url": "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"}, {"title": "OWASP Logging Cheat Sheet", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html"}]
---

A detector that blocks a security training document and misses a request hidden in tool output may be operating exactly as configured. Before changing a threshold, inspect what text reaches it and how the application interprets the result.

Start with a specific requirement: "Flag attempts in retrieved support articles to change the assistant's task." That gives the evaluation a surface and a desired behavior. The [prevention architecture](/guides/prompt-injection-prevention/) still needs independent data and action controls.

## Choose the inspection point

List the actual fields a detector receives. User messages, retrieved passages, tool descriptions and tool results are different inputs. A network gateway that sees the user's request may never see a later database result assembled inside the application.

| Surface | Representative case | Integration question |
| --- | --- | --- |
| User message | A direct request to override the assigned task | Is this field inspected before generation? |
| Retrieved passage | A document introduces a new output destination | Is each passage or the combined context inspected? |
| Tool result | An error asks the agent to read unrelated files | Does the check run on error responses too? |
| Stored memory | An old instruction reappears on a new task | Is reused content inspected or trusted automatically? |
| Tool description | A definition requests unrelated context in arguments | When are definition changes reviewed? |

For each input, record size limits and truncation. If only the first part of a document is inspected, the result cannot describe the omitted part. Chunking also changes context: a suspicious instruction split across chunks may receive a different decision than the complete passage.

## Build a labeled evaluation set

Use ordinary allowed material from the intended workflow, with sensitive information replaced by synthetic values. Include documentation that discusses attacks, quoted instructions in a support ticket and legitimate task changes made by an authorized user. Otherwise a detector can appear useful simply by rejecting every imperative sentence.

Keep a separate adversarial set: direct overrides, instructions embedded in retrieved material, task changes spread across turns, and delivery formats the product supports. The [indirect injection fixture](/guides/indirect-prompt-injection/) provides one complete case.

Each record needs a human-reviewed label with a reason. "Contains the word ignore" is a lexical feature; it is not a reliable ground-truth label. Record disputed examples as ambiguous and decide how the application should handle that uncertainty.

The [detector evaluation worksheet](/resources/detector-evaluation.csv) leaves observed fields blank. Fill them with actual results. Do not treat its expected decisions as measurements.

## Understand the score before selecting a threshold

Score direction is not universal. [Cloudflare's prompt injection detector](https://developers.cloudflare.com/waf/detections/ai-security-for-apps/prompt-injection/) documents a 1 to 99 scale where lower values indicate greater risk, and the score can drive custom rules. A different product may use the opposite direction or expose only a category.

Write down the documented meaning, version, threshold comparison and missing-value behavior. Do not convert a raw score to a probability unless the provider supports that interpretation and you have verified it for the use case.

For a trial, evaluate several candidate thresholds on the same frozen set. Inspect the examples whose decisions change. A threshold that improves rejection of attack fixtures may also stop employees from analyzing an incident report that quotes the attack.

### Keep the measures separate

For completed decisions, report missed attacks among labeled attack cases and false blocks among labeled allowed cases. Report timeouts, malformed responses and unavailable cases separately, with the total attempted. Include latency measurements for the actual integration path.

Also report coverage by input surface. A strong result on user prompts does not measure tool-result coverage. Keep near-duplicate variants together when comparing candidates, so one large family does not dominate the conclusion.

## Connect the signal to a clear action

A flagged public-document passage might be withheld while the application returns other usable sources. A flagged tool result might require a reviewer to inspect it. A detector error before a protected action may require the action to stop under the application's [failure policy](/guides/fail-closed-guardrails/).

These are workflow choices. Make them explicit instead of letting exception handling decide. Test the user message and the target-side effect for each state.

Do not let a low-risk detector result grant wider tool access. The [execution boundary](/guides/tool-calling-guardrails/) still checks identity, resource scope and approval even when every text check passes.

## Trial the detector without creating a new data leak

The detector may receive sensitive source text. Review where that text is processed, stored and exposed to operators. Test redaction in debug and error paths. A full rejected prompt often contains more information than the routine decision log needs.

Retain the policy version, case ID, detector outcome and processing state. Store the synthetic fixture separately. [OWASP's logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) describes information to exclude from routine logs; apply those limits to detector telemetry too.

Begin with observation on permitted test traffic if that helps characterize behavior, then exercise the blocking path deliberately. Observation mode cannot prove that enforcement works. Finish the trial with the uncovered surfaces, false-block examples and outage behavior still visible in the decision record. Use the broader [guardrail tools guide](/guides/ai-guardrails-tools/) when the missing control belongs to another category entirely.
