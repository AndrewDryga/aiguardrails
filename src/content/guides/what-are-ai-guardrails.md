---
title: "What are AI guardrails?"
description: "Learn where AI guardrails check content, data and actions, and how to choose controls for a real application."
category: Basics
primaryKeyword: "what are ai guardrails"
relatedKeywords:
  - "ai guardrails"
  - "ai guardrails examples"
  - "guardrails in AI"
order: 1
reviewedDate: "2026-11-09"
related: ["llm-guardrails", "ai-agent-guardrails", "ai-guardrails-checklist"]
sources:
  - title: "Amazon Bedrock Guardrails overview"
    url: "https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html"
  - title: "NVIDIA NeMo Guardrails overview"
    url: "https://docs.nvidia.com/nemo/guardrails/about-nemo-guardrails-library/overview"
  - title: "OWASP authorization cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
---

AI guardrails are checks and restrictions around an AI application. They can reject an unsuitable request, remove sensitive text, validate an answer or prevent an unauthorized action. A useful guardrail has a specific rule, a place where that rule runs, and a defined result when the check fails.

Consider a support assistant that reads help articles and drafts replies. You might require it to cite an article, hide customer email addresses from a shared transcript, and leave refunds to a separate approval process. Each requirement needs its own check. A single "safe" score would tell you little about whether those requirements were met.

## What a guardrail can check

Different tools use the word guardrail for different jobs. [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html) documents filters for harmful content, denied topics, sensitive information and other content concerns. [NVIDIA NeMo Guardrails](https://docs.nvidia.com/nemo/guardrails/about-nemo-guardrails-library/overview) describes checks at several stages, including retrieved content and tool execution.

| Concern       | Example rule                                          | Place to enforce it                         |
| ------------- | ----------------------------------------------------- | ------------------------------------------- |
| Content       | A public assistant should not produce abusive replies | Before a reply reaches the reader           |
| Personal data | A shared summary must omit customer email addresses   | Before sharing or storing the summary       |
| Output shape  | A classification must contain a known category        | In the application receiving the result     |
| Access        | A user may read only their own support tickets        | In the service returning the tickets        |
| Actions       | A refund above the team's limit needs approval        | Before the payment service changes anything |

The rules differ in how they work. A classifier estimates whether text falls into a category. A schema validator checks the structure of data. An authorization service checks whether a caller has permission. Their outputs should remain distinguishable so you can explain a refusal and investigate a mistake.

## Start with the unwanted outcome

Write down something you need to prevent in observable terms. "Keep the assistant safe" leaves too much open. "Do not send a customer's private attachment to another customer" identifies a concrete failure.

Then follow the data. Where does the attachment enter? Which component selects it? Does the model see the whole file? Can a tool send it somewhere? Does a debugging trace keep another copy? Place the control before the relevant disclosure, including paths that bypass the chat interface.

For the support assistant, enforce ticket ownership when retrieving records. Removing a name from the final answer would be too late if the application had already shown another customer's attachment to the model. Output checks still help with text the model produces, but access decisions belong at the data boundary.

## Decide what happens after a failed check

A guardrail needs an application response. Blocking the whole request is one option. Others include asking for missing information, returning a redacted result, or holding an action for an authorized reviewer.

Keep failures understandable without revealing protected records. "This ticket is unavailable; check the selection or contact your administrator" gives the user a next step without confirming that another account owns it. A detector outage needs a different message because retrying later may help.

For actions with real effects, require an explicit permission decision. [OWASP's authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) recommends denying access by default and checking permissions on every request. A timeout or an unrecognized decision should not silently grant access.

## Check useful behavior as well as refusals

Build a small set of normal tasks before adding more filters. Include ordinary wording, spelling mistakes and supported languages. A support assistant should still explain a cancellation policy when a customer is angry.

Alongside those examples, add specific prohibited outcomes. Try accessing another account, supplying an unknown category, and asking the application to skip an approval. Record what the application actually did. A polite refusal is insufficient evidence if a background tool still performed the action.

Measure each rule separately. A content filter that works well on abusive language says nothing about whether ticket ownership is enforced. When a rule blocks valid work, inspect the example before lowering its threshold across the application.

## A small first implementation

Choose one workflow and map its inputs, data sources, outputs and possible actions. For every boundary, name the owner and the expected failure response. Add controls for the outcomes that would cause harm or break the product's promise, then test both allowed and denied paths.

Keep the initial policy short enough that someone can review it. Store its version with test results. When the assistant gains a new data source or tool, repeat the boundary review: its old checks may cover only the original workflow.
