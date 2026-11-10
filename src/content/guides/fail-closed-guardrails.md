---
title: "Fail-closed guardrails without accidental bypasses"
description: "Define how protected actions stop when guardrail decisions are missing, stale or unusable, and plan recovery without granting wider permission."
category: "Implementation"
primaryKeyword: "fail closed guardrails"
relatedKeywords:
  - "fail closed AI"
  - "AI guardrail timeout"
  - "deny by default"
order: 11
reviewedDate: "2026-11-09"
related:
  ["ai-agent-guardrails", "tool-calling-guardrails", "ai-guardrails-testing"]
sources:
  - title: "OWASP authorization cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
  - title: "OWASP AI agent security cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html"
  - title: "OWASP logging cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html"
answer: "A fail-closed guardrail prevents a protected operation when it cannot establish permission to proceed. A timeout, malformed policy response or expired approval leaves the operation stopped. The application must distinguish that missing decision from an explicit allow."
---

Apply this rule to the boundary you are protecting. If a service restart requires authorization, an authorization outage should not trigger the restart. The application may still display previously available information or explain that the action is waiting, provided those paths have their own valid access rules.

## Give decisions explicit states

Avoid a Boolean that collapses every unusual result into true or false without preserving the reason. The application needs to know whether a request was denied, requires approval, or could not be evaluated.

| Decision state   | Protected action                      | Useful next step                            |
| ---------------- | ------------------------------------- | ------------------------------------------- |
| Allowed          | May proceed within the approved scope | Record the decision and execute             |
| Denied           | Does not execute                      | Explain the applicable rule                 |
| Pending approval | Does not execute                      | Show the proposal to an authorized reviewer |
| Indeterminate    | Does not execute                      | Report dependency or evaluation failure     |

[OWASP's authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) recommends denying access by default and exiting safely when checks fail. Define your allowed state narrowly enough that an unknown response cannot enter it.

A detector's confidence score also needs an explicit interpretation. Do not let a missing score become zero and then treat zero as proof that the content is safe.

## Inspect common bypass paths

Review exception handlers around the guardrail call. A catch block that logs the error and continues can bypass a policy during an outage. So can a fallback model path that forgets to invoke the same check.

Check queues and caches. A request approved yesterday may be inappropriate today because its target changed or the approver's authority expired. Record what the approval covered and how long it remains usable, following the [tool approval contract](/guides/tool-calling-guardrails/). Recheck the required state before dispatch.

A cached decision needs a defined scope and expiry. Reusing an allow from one resource for a different resource is an authorization defect, even if caching improves response time.

Include administrative and debugging endpoints in the review. A protected operation reachable through a second route is still reachable when the main guardrail blocks it.

## Separate pre-execution failure from unknown execution outcome

If the policy service times out before dispatch, the operation should remain unexecuted. If the action service times out after dispatch, the operation may already have happened. These states require different recovery.

For an unknown execution outcome, inspect the run record or use the operation's supported idempotency mechanism. Do not infer failure from the missing response and immediately repeat a destructive action.

Give the agent a status it can report accurately: waiting for authorization, denied, running, completed or outcome unknown. Avoid replacing all of these with a generic "try again" error that encourages retries.

## Plan a limited degraded mode

Decide which work can continue during a guardrail outage before the outage occurs. You might allow a public documentation search while pausing all private reads and writes. A service-status page may remain available if its independent access policy still works.

Do not introduce a hidden automatic switch to unrestricted tools. If an emergency operating procedure is necessary, define who can invoke it, which actions it permits, how it expires and where the event is recorded.

The [OWASP agent security guidance](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) discusses limiting tool authority and reviewing high-impact actions. Preserve those limits in recovery procedures so an unavailable checker does not broaden the agent's role.

## Test failure with evidence from the protected system

In a test environment, make the policy dependency unavailable and verify that the protected action count stays unchanged. Return an unknown decision value. Include these failures in the [guardrail regression suite](/guides/ai-guardrails-testing/). Expire approval while the request waits in a queue. Restart the application between approval and execution.

Check the resulting event trail. It should identify the request, decision state and relevant policy version without copying credentials or sensitive request bodies. [OWASP's logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) provides useful boundaries for what to record and what to exclude.

Measure recovery as well as stopping. Restore the dependency and confirm that old requests do not execute unexpectedly. Require a fresh evaluation where the original decision or user intent may no longer be valid.
