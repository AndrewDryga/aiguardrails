# AI guardrail review worksheet

Record one workflow per copy. A checked box should point to evidence.

Workflow:
Owner:
Review date:
Agent and model version:
Tool and policy versions:

## Boundary

- [ ] Identify untrusted input: prompts, retrieved pages, files, tool results.
- [ ] List every tool and the identity it uses.
- [ ] Define exact targets, allowed arguments and output destinations.
- [ ] Locate the server-side check that runs before each side effect.
- [ ] Prevent alternate paths from bypassing that check.

## Tests

- [ ] Ordinary permitted request succeeds.
- [ ] Missing or expired access is refused.
- [ ] A forbidden action stays forbidden after an approval is supplied.
- [ ] A changed target or arguments invalidate the earlier approval.
- [ ] A policy timeout follows the chosen failure behavior.
- [ ] Untrusted text cannot widen tool authority.
- [ ] Malformed and unexpected output is handled explicitly.
- [ ] Sensitive fields are kept out of model context and logs where required.
- [ ] Retries do not repeat a completed side effect.

## Evidence and recovery

- [ ] Keep request, policy version, decision and execution result linked.
- [ ] Record denied attempts without storing unnecessary sensitive payloads.
- [ ] Test revocation and stopping new work.
- [ ] Assign a person to review false blocks and missed violations.

Evidence links:
Known gaps:
Decision and owner:
Next review trigger:

This is an engineering worksheet, not a certification.
Source guide: https://aiguardrails.dev/guides/ai-guardrails-checklist/
