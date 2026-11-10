---
title: "AI guardrails examples"
description: "Work through schema, redaction, permissions, approvals and outage checks with explicit expected outcomes."
category: "Implementation"
primaryKeyword: "ai guardrails examples"
relatedKeywords: ["llm guardrails examples", "guardrails implementation examples"]
order: 21
reviewedDate: "2026-11-09"
answer: "AI guardrails examples are most useful when they show the input, the rule, the enforcement point and the resulting state. A schema check, a redactor and an action-permission check solve different problems. The cases here are hypothetical teaching examples, with expected outcomes rather than product test results."
related: ["structured-output-validation", "pii-redaction", "tool-calling-guardrails"]
sources: [{"title": "JSON Schema object validation", "url": "https://json-schema.org/understanding-json-schema/reference/object"}, {"title": "OWASP Authorization Cheat Sheet", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"}, {"title": "OWASP Transaction Authorization", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html"}]
---

A guardrail's effect depends on where the application uses its result. A validator that returns "invalid" after a tool executes has detected a problem too late. These examples place each check before the effect it controls.

The [guardrail fixtures](/resources/guardrail-cases.json) provide synthetic cases for an application test adapter. They are inert data. The [policy lab](/tools/policy-checker/) is an educational browser demonstration; it does not protect a live service or prove that your integration enforces these rules.

## Example: reject an unsupported structured result

A classifier must choose `billing`, `delivery` or `other`. The model proposes this object:

```json
{"category":"refund_every_order","reason":"The user is upset"}
```

The receiving application validates against a contract whose category is an enum. It rejects the unknown value before routing the case. The explanatory reason does not create a new operation.

A conceptual contract is:

```json
{
  "type": "object",
  "properties": {
    "category": {"enum": ["billing", "delivery", "other"]},
    "reason": {"type": "string", "maxLength": 300}
  },
  "required": ["category"],
  "additionalProperties": false
}
```

This is a schema example, not a runnable application. [JSON Schema's object rules](https://json-schema.org/understanding-json-schema/reference/object) let a contract require fields and control additional properties. The [validation guide](/guides/structured-output-validation/) explains the remaining business and permission checks.

If the model returns `billing`, the structure can pass while the classification is still wrong. Keep a task-quality review alongside schema tests. A schema does not decide whether the explanation is true.

## Example: redact before the relevant disclosure

A support summary is going to a shared analytics report. Its draft contains the fictional address `maya@example.test`, which the report does not need. A redaction step replaces it before the report writer stores the summary.

| Observation point | Expected result |
| --- | --- |
| Input to the redactor | Synthetic address is present |
| Report payload | Address is replaced or omitted |
| Shared analytics storage | No copy of the original address |
| Error and debug logs | No accidental copy of the unredacted payload |

If the requirement also prohibits sending the address to the model provider, this output redactor is too late for that boundary. Remove the field before generation as well. The [PII guide](/guides/pii-redaction/) covers detection limits and how to test meaning after redaction.

An unavailable redactor needs a deliberate response: hold the report, use a separately safe reduced payload or report failure. Silently publishing the raw draft defeats this example's rule.

## Example: deny a valid request for the wrong target

The model proposes a structurally valid `service.health.read` request for `payroll-test`. The authenticated task is assigned to `checkout-test`.

The schema accepts the shape. The authorization service resolves the target and denies it because it is outside the task scope. The expected evidence is no protected read and a denial record identifying the request and applicable rule. The user-facing error should not disclose payroll's private status.

Repeat the same request through a direct client. [OWASP's authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) calls for consistent checks on requests; the chat interface must not be the only place enforcing this restriction.

The ordinary checkout read should still succeed. Without that allowed case, a broken endpoint could appear to pass every denial test.

## Example: stop a change after approval expires

A fictional reviewer approves restarting one test instance. The approval covers that operation and target until a specific expiry. The request reaches the executor after expiry.

The executor must not use the stale approval. It returns an expired or pending-review state, depending on the workflow. A fresh proposal may be reviewed, but the original decision cannot silently authorize it.

Also change a material argument before expiry. The old approval should not cover the modified request. These tests follow the principles of [transaction authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html): the accepted action must match the decision the reviewer made.

Record the proposed values, decision reference and actual dispatch count. A UI badge reading "expired" is insufficient if the action was already queued for unrestricted execution. The [tool-calling guide](/guides/tool-calling-guardrails/) follows the check through dispatch.

## Example: distinguish an outage from an unknown result

In the first case, the permission service times out before execution. The protected action remains unexecuted, and the application records an evaluation error. This is the expected [fail-closed behavior](/guides/fail-closed-guardrails/) for the operation.

In the second case, the action was dispatched and the connection dropped before its result arrived. The outcome is unknown. The application should inspect the existing operation or use its supported idempotency mechanism before requesting another effect.

These cases should not share a generic "retry" response. One can safely retry the permission evaluation subject to current state; the other needs to establish what the target already did.

## Turn the examples into application evidence

Replace the fictional identifiers with isolated test resources and connect the fixtures to the actual entry points. Observe the data service, sender or executor responsible for the effect. Leave missing observations marked incomplete.

Use [guardrail testing](/guides/ai-guardrails-testing/) to record versions, expected assertions and actual results. The definitions in [What are AI guardrails?](/guides/what-are-ai-guardrails/) help choose the right control, but only a test of the deployed path shows whether the application uses it correctly.
