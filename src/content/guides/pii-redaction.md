---
title: "PII redaction in AI applications"
description: "Place personal-data redaction before disclosure, test the entities your application handles and inspect tool and logging paths separately."
category: "Implementation"
primaryKeyword: "pii redaction"
relatedKeywords:
  - "PII redaction LLM"
  - "AI data redaction"
  - "sensitive information filtering"
order: 9
reviewedDate: "2026-11-09"
related: ["llm-guardrails", "ai-guardrails-tools", "ai-guardrails-testing"]
sources:
  - title: "Presidio overview and detection limitations"
    url: "https://presidio.dataprivacystack.org/"
  - title: "PII entities supported by Presidio"
    url: "https://presidio.dataprivacystack.org/supported_entities/"
  - title: "Bedrock sensitive information filters and tool-use limitations"
    url: "https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-sensitive-filters.html"
  - title: "OWASP logging cheat sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html"
answer: "PII redaction removes or replaces personally identifiable information in data an application processes. In an AI workflow, that might mean masking email addresses before sending a support transcript to a model, or removing personal details before publishing a generated summary."
---

Choose the boundary first. If the requirement is that a model provider must not receive an email address, redacting the final answer is too late. If the model is permitted to process the address but a shared report is not, place a separate check before that report is stored or sent.

## Decide which information the task needs

Start with the fields your application already knows. A structured customer record may contain a name, email address and order status. If the model needs only the order status, omit the other fields before composing the prompt. Detection is unnecessary for information you can exclude directly. For retrieved documents, [RAG access controls](/guides/rag-security/) decide which content should reach the model at all.

Free text needs more care. A support message may contain a phone number, an address or a personal detail that no predefined detector recognizes. Define the entities you want to detect and the contexts where they occur.

[Presidio's supported-entity documentation](https://presidio.dataprivacystack.org/supported_entities/) lists recognizers with different detection methods and regional coverage. Use that list to select and test recognizers relevant to your data. A large entity catalog does not establish coverage for every language or identifier your customers use.

## Keep enough context for the task

For a summary, replacing an address with a label may preserve the useful meaning. For a conversation involving several people, consistent temporary labels can help the model distinguish speakers.

This fictional example illustrates the transformation:

| Before                                            | After                                         |
| ------------------------------------------------- | --------------------------------------------- |
| Email Maya at maya@example.test about order A-417 | Email PERSON_1 at EMAIL_1 about order A-417   |
| Maya says the replacement has not arrived         | PERSON_1 says the replacement has not arrived |

Use temporary mappings scoped to the task when you need consistent labels. Protect the mapping and expire it when it is no longer needed. If another part of the system can reverse the labels, treat the transformed data accordingly.

Redaction can also remove useful information. If location determines delivery eligibility, replacing every place name may make the answer unusable. Consider providing an approved region code instead of the full address.

## Cover tools and logs explicitly

Chat text is only one path through an agent. Tool arguments may contain contact details. Tool results may include full records. Errors and traces may copy the original request before redaction.

AWS documents a concrete limitation: its [Bedrock sensitive-information filter](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-sensitive-filters.html) evaluates text content but does not evaluate tool-call inputs, tool results or tool definitions in the described tool-use fields. An integration using those paths needs separate handling.

Inspect your application's actual payloads and middleware order. A request logger placed before the redactor can preserve the content you meant to remove. [OWASP's logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) recommends excluding or appropriately transforming sensitive data and credentials in logs.

Do not assume a PII detector is also a secret detector. An access token may not resemble a person's identifying information. Apply the relevant checks for each data type.

## Test missed detections and damaged meaning

Create a labeled set of synthetic messages with known sensitive spans. Include varied punctuation, supported languages, copied signatures, tables and OCR errors if those inputs are part of the product.

Also include ordinary text that can resemble PII. A product code might look like an identification number. A place name might be part of a company name. Record both missed spans and unnecessary redactions.

[Presidio warns that automated detection cannot guarantee finding all sensitive information](https://presidio.dataprivacystack.org/). Keep data minimization and access control alongside redaction. For a high-impact disclosure path, consider whether uncertain results should be held for review.

Test the downstream task too, alongside the [miss and false-block measures](/guides/ai-guardrails-testing/). A redactor can pass its detection tests while making the generated summary confusing or factually incomplete. Review whether temporary labels remain consistent and whether the model invents replacements for removed information.

## Retain useful evidence without retaining the secret

Record the redaction policy version, entity types detected, counts and the processing outcome. Keep raw examples only where you have an explicit purpose, access policy and retention decision.

For debugging, synthetic fixtures are easier to share than production transcripts. When a real failure needs investigation, limit the copied material and the people who can access it. A redaction workflow should not create an unrestricted archive of everything it removed.
