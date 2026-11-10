---
title: "Guardrails vs fine-tuning: which problem are you solving?"
description: "Choose between runtime checks and model training by separating task-quality problems from permissions and application rules."
category: Choose
primaryKeyword: "guardrails vs fine tuning"
relatedKeywords:
  - "AI guardrails vs fine tuning"
  - "LLM fine tuning"
  - "runtime AI guardrails"
order: 7
reviewedDate: "2026-11-09"
related:
  ["llm-guardrails", "structured-output-validation", "ai-guardrails-testing"]
sources:
  - title: "Google Cloud introduction to model tuning"
    url: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning"
  - title: "Google Cloud safety and content filters"
    url: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/configure-safety-filters"
  - title: "OWASP authorization cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
---

Guardrails check a request, result or action while an application runs. Fine-tuning changes a model using training examples. You can use both, but they solve different parts of an application problem.

If a model repeatedly assigns the wrong support category, better instructions or fine-tuning may improve its classification. If a user must never read another customer's ticket, the application needs an access check against current permissions. Training examples cannot tell the model which account owns a ticket at the moment of the request.

## Identify the failure before choosing a method

Collect examples of the problem and inspect where it happens. The generated text might be wrong, the retrieved information might be wrong, or an otherwise valid action might lack permission.

| Observed failure                                | First thing to investigate                          |
| ----------------------------------------------- | --------------------------------------------------- |
| The model misunderstands a specialized category | Instructions, examples and task-specific training   |
| The answer lacks a required field               | Output schema and validation                        |
| A user receives another account's data          | Retrieval authorization and account isolation       |
| The agent executes a change without approval    | Execution policy and approval handling              |
| The answer includes unsuitable content          | Content policy, model behavior and output filtering |
| The answer uses an outdated company rule        | Source freshness and retrieval                      |

Several rows can apply at once. A support assistant might need more consistent categorization and a stricter rule for which records it can retrieve. Fixing one does not provide evidence that the other is resolved.

## What fine-tuning can change

Google's [model tuning documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning) describes supervised fine-tuning with labeled examples that demonstrate the desired behavior. It also recommends evaluating recurring mistakes and starting with prompting before deciding that tuning is necessary.

For a classification task, prepare examples that resemble real inputs and have reviewed labels. Keep a separate evaluation set. If near-duplicate examples appear in training and evaluation, the result may overstate how well the model handles unfamiliar cases.

Decide what success means before running the job. You might care about confusion between two categories more than overall accuracy. Examine errors by category and input type, and check that improved performance on the target task has not damaged other tasks you still use.

Fine-tuning adds operational work: data preparation, version selection, evaluation and deployment. A small prompt or retrieval change may be easier to maintain when the underlying issue is missing context.

## What must remain a runtime decision

Permissions, account membership and approval state can change while a model stays the same. Check them when the application performs the operation.

[OWASP's authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) recommends validating permissions for every request. That applies whether the request came from a base model, a tuned model or ordinary application code.

Other requirements can also be enforced directly. If a field accepts only five values, validate that set. If a payment requires an authorized approver, inspect the approval record. Asking the model to remember these rules can improve its proposals, but the service still needs to enforce them.

Google's [content filter documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/configure-safety-filters) distinguishes filtering outputs from changing model behavior. This is useful when diagnosing a refusal: the model and the surrounding filter can each affect what the user receives.

## Compare candidates using the same workflow

Evaluate four configurations if the decision justifies the work: the base model, the tuned model, and each with the intended runtime checks. Keep the task inputs and policy requirements consistent.

Record task quality, incorrect blocking, guardrail misses and latency separately. A tuned model that makes fewer malformed proposals may reduce validation failures. That improvement should not persuade you to remove validation for the cases it still gets wrong.

Use an isolated environment for action tests. If a model proposes an unauthorized write, record the proposal and confirm the execution service rejects it. This lets you examine model quality without granting the model extra authority during evaluation.

## Choose the smaller change that fixes the observed failure

For inconsistent formatting, try schema-constrained output and validation before preparing a training program. For poor domain judgments that persist after instruction and context improvements, investigate tuning with reviewed examples. For access, approval and resource limits, implement runtime controls.

Keep the resulting decisions separate in the release record. Name the model version and the policy version. A later model upgrade should trigger quality and safety tests, while a permission change should be reviewable without retraining the model.
