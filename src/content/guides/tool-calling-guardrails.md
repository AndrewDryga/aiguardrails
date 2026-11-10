---
title: "Tool calling guardrails that hold at execution time"
description: "Validate tool arguments, check trusted permissions and bind approvals before executing an AI agent's proposed operation."
category: "Implementation"
primaryKeyword: "tool calling guardrails"
relatedKeywords:
  - "AI tool calling security"
  - "MCP tool permissions"
  - "function calling validation"
order: 5
reviewedDate: "2026-11-09"
related:
  [
    "structured-output-validation",
    "ai-agent-guardrails",
    "fail-closed-guardrails",
  ]
sources:
  - title: "MCP tools specification"
    url: "https://modelcontextprotocol.io/specification/latest/server/tools"
  - title: "JSON Schema object validation"
    url: "https://json-schema.org/understanding-json-schema/reference/object"
  - title: "OWASP authorization cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
answer: "A tool call is a request to run application code. Before executing it, check that the tool exists, the arguments are valid, the caller has permission and any required approval covers this exact request. A model's confidence or explanation does not establish any of those facts."
---

These checks belong in the tool service or execution path. Hiding a tool from the model's menu can reduce mistakes, but an attacker or buggy client may still call the endpoint directly.

## Give the tool a narrow contract

Prefer a tool with a specific operation over a tool that accepts arbitrary commands. For example, a service-status tool can accept a service identifier from a known set. It does not need to accept a shell command, a script or an arbitrary file path.

The following is an illustrative JSON Schema for a small status tool. It is a schema example, not a runnable service or an authorization policy.

    {
      "type": "object",
      "properties": {
        "service": {
          "type": "string",
          "enum": ["billing-api", "worker"]
        }
      },
      "required": ["service"],
      "additionalProperties": false
    }

[JSON Schema's object rules](https://json-schema.org/understanding-json-schema/reference/object) distinguish declaring properties from requiring them, and allow you to reject additional properties. Validate requests on the server even if the model provider also constrains generation. The [structured output guide](/guides/structured-output-validation/) covers structural and semantic checks separately.

The schema says which service names are structurally acceptable. It does not decide whether this caller may inspect the billing service on this host. That check needs trusted identity and resource information.

## Authorize the requested resource

Associate the call with an authenticated principal and its account or project. Resolve the target within that scope. If the requested identifier belongs elsewhere, reject the call without returning the protected resource.

Keep administrative fields out of model control. A parameter such as "approved: true" or "role: administrator" should not grant authority. Derive those facts from authenticated state and stored policy.

[OWASP recommends validating permissions on every request](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). Include retries, background jobs and direct API requests in that rule. A permission check during the initial chat session can become stale before a queued tool call runs.

## Review the proposed effect before committing it

For actions that need human review, prepare a stable representation of the proposed operation. Show its target, relevant arguments and expected effect. Store approval against that representation, along with the approver and expiry.

Revalidate before execution. If the target changed, the action definition changed materially, or the approval expired, pause the request. Do not let the agent edit the proposal after someone has approved it.

The [MCP tools specification](https://modelcontextprotocol.io/specification/latest/server/tools) recommends a human ability to deny tool invocations and clear visibility into tools and their use. The interface is only part of that design. The execution service must honor the decision.

## Avoid accidental duplicate actions

A network timeout after dispatch does not tell the client whether the operation happened. A second request may repeat the effect.

Where the underlying operation supports it, use an idempotency mechanism that binds one request identifier to one authorized action. Reusing that identifier with different arguments should be rejected. Otherwise, inspect the recorded run state before deciding whether another execution is safe.

For example, a ticket-creation tool can return the existing ticket for a retried request. A service restart may require checking the original run's result. Give the agent an explicit unknown-outcome state instead of encouraging it to retry until it sees success. The [fail-closed guide](/guides/fail-closed-guardrails/) explains why a pre-dispatch failure and a lost execution result need different recovery.

## Check the result before using it again

Tool results can contain private fields, malformed data or instructions copied from an external source. Select the fields the next model step needs, redact sensitive output where appropriate, and preserve source information.

Also bound the result size. An unexpectedly large response can exhaust the context window or hide relevant evidence. Return a clear truncation marker when you shorten content so the agent does not mistake a partial result for the full record.

Test the tool boundary directly with an unknown action, an extra field, another account's identifier, an expired approval and a repeated request. Record the execution count as well as the response. A denial that arrives after the side effect has occurred is a failed control.
