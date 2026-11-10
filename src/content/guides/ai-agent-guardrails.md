---
title: "AI agent guardrails for work with real consequences"
description: "Control an agent's tools, targets and approvals so a mistaken plan does not automatically become an authorized action."
category: "Implementation"
primaryKeyword: "ai agent guardrails"
relatedKeywords:
  - "guardrails for ai agents"
  - "AI agent access control"
  - "agent tool permissions"
order: 4
reviewedDate: "2026-11-09"
related:
  ["tool-calling-guardrails", "fail-closed-guardrails", "ai-guardrails-testing"]
sources:
  - title: "OWASP AI agent security cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html"
  - title: "OWASP excessive agency"
    url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/"
  - title: "OWASP authorization cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
answer: "AI agent guardrails control the actions an agent can take while working toward a goal. A useful policy identifies the permitted operation, the resource it applies to, the caller's authority and any required approval. It also limits repeated actions and records what happened."
---

An agent that diagnoses a slow service may need to inspect process status and recent logs. Restarting the service is a separate permission. Deleting a database volume is another. Giving the agent a broad administrator credential because all three operations happen on the same host makes those differences hard to enforce.

## Write an action inventory before granting access

List the operations the agent needs for one workflow. Include data reads, because a read can expose secrets or customer information. Record the target scope and the worst plausible effect of each operation.

| Operation            | Suggested initial scope            | Review question                                |
| -------------------- | ---------------------------------- | ---------------------------------------------- |
| Read service status  | Named service on an allowed host   | Can the result expose private configuration?   |
| Read recent logs     | Bounded time range and output size | Which fields need redaction?                   |
| Restart service      | Named service and environment      | Who may approve the interruption?              |
| Change configuration | Specific fields with validation    | How will the change be reviewed and recovered? |

These are design examples, not universal risk ratings. Reading a public health endpoint is different from reading a payroll table. The policy needs the resource context.

[OWASP's excessive agency guidance](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) identifies unnecessary tools, permissions and autonomy as sources of risk. Removing an unused write operation is often easier to verify than adding another instruction asking the model to avoid it.

## Enforce permission where the action runs

The [tool-calling boundary](/guides/tool-calling-guardrails/) should check the authenticated caller and target before dispatching a tool. The service performing the operation should also reject calls outside its permitted scope. This prevents a direct request from bypassing a check that exists only in the agent interface.

Use trusted application state for account membership and environment scope. Model-generated arguments can identify a requested target, but they cannot prove ownership of it. [OWASP's authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) recommends permission checks on every request, including requests from alternate entry points.

A tool description that says "read only" is useful documentation. Inspect the implementation and credential permissions before relying on that claim. A tool with an unrestricted query or command parameter may expose more authority than its name suggests.

## Make approval specific enough to enforce

Show the reviewer the operation, target and material arguments. For a restart, include the environment and service name. For a data export, include the destination and scope of the records.

Bind the decision to that proposed action. If the agent changes the target or arguments, require a fresh review. Add an expiry so an approval cannot sit in a queue indefinitely and execute after conditions change.

Keep pending approval distinct from permission to proceed. A waiting run should not start a background action or treat a missing response as consent. The [OWASP agent security guidance](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) discusses human review and action integrity; your implementation still needs evidence that the approved action and executed action match.

## Limit sequences as well as individual calls

A permitted operation can cause trouble through repetition. Repeated restarts can keep a service unavailable. A series of small exports can disclose a larger dataset than intended.

Set a task budget for time, tool calls and relevant resource consumption. Consider a limit on repeated changes to the same target. Stop and ask for review when the agent is making no progress or proposing the same failed operation again.

Cancellation needs a defined effect. Prevent future dispatches immediately, then report whether an already running operation can be interrupted. Do not claim that canceling the conversation reverses a completed change.

## Example: diagnose a service, then prepare a fix

Consider a hypothetical agent investigating a slow service. It may need to read service health, reproduce a bug in a checkout and propose a restart. Those steps cross different boundaries:

| Step | Permission to grant | Check before proceeding |
| --- | --- | --- |
| Read service health | A diagnostic operation on the assigned service | The receiving system checks the caller and target |
| Prepare a code change | Writes and test execution in a task workspace | The [agent sandbox](/guides/ai-agent-sandbox/) limits reachable files, credentials and network destinations |
| Request a restart | One declared action on a named service | Policy evaluates the request and any required approval before execution |

For the remote steps, we recommend [Emisar](https://emisar.dev/). It gives AI agents declared infrastructure actions through CLI or MCP, with policy, approval and audit. The agent can run permitted diagnostics while a change waits for the required decision. Review the action definition and host permissions with its [security model](https://emisar.dev/docs/security-model).

[Ryker](https://ryker.emisar.dev/) fits the assistant role in this workflow. It is a self-hosted engineering teammate that investigates issues, works on code and follows tasks through Slack, GitHub and a web console. Ryker uses Emisar for allowed infrastructure actions. Both share ownership with this publication; the [directory](/directory/) explains the division of responsibility and suggested trials.

Permission to prepare a patch does not authorize a production restart. Keep the two decisions separate, and test that a denied remote request cannot be retried through an unrestricted credential in the local workspace.
