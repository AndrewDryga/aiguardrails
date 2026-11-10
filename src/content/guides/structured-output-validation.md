---
title: "Structured output validation for AI applications"
description: "Validate generated JSON before using it, then check the business rules and permissions a schema cannot decide."
category: "Implementation"
primaryKeyword: "structured output validation"
relatedKeywords:
  - "LLM JSON validation"
  - "JSON Schema for AI"
  - "AI output validation"
order: 10
reviewedDate: "2026-11-09"
related: ["tool-calling-guardrails", "llm-guardrails", "ai-guardrails-testing"]
sources:
  - title: "JSON Schema object validation"
    url: "https://json-schema.org/understanding-json-schema/reference/object"
  - title: "JSON Schema types and format validation"
    url: "https://json-schema.org/understanding-json-schema/reference/type"
  - title: "MCP tools specification"
    url: "https://modelcontextprotocol.io/specification/latest/server/tools"
answer: "Structured output validation checks whether a model's response follows a data contract before your application uses it. Valid JSON is only the first check. You also need the expected fields, allowed values and application rules."
---

For example, a model may return a syntactically valid object requesting a restart of the wrong service. A schema can reject an unknown operation or missing service name. Permission to restart that service requires a separate decision against trusted application state.

## Define the smallest useful contract

Give each field a clear purpose. Avoid accepting a general command string when the application expects a known action. Make required fields explicit and decide whether extra fields are allowed.

This illustrative JSON Schema describes a request to inspect one of two services. It is not executable code, and it does not grant access to either service.

    {
      "type": "object",
      "properties": {
        "operation": {
          "type": "string",
          "enum": ["inspect"]
        },
        "service": {
          "type": "string",
          "enum": ["billing-api", "worker"]
        },
        "reason": {
          "type": "string",
          "minLength": 1,
          "maxLength": 300
        }
      },
      "required": ["operation", "service", "reason"],
      "additionalProperties": false
    }

In [JSON Schema](https://json-schema.org/understanding-json-schema/reference/object), listing a property does not make it required, and extra properties need an explicit policy. Those details matter when your application relies on a field being present or assumes that no other instruction has been supplied.

The reason field is explanatory text. Do not interpret it as a second command channel.

## Validate in stages

First, parse the response using a JSON parser with appropriate input-size limits. Reject malformed or oversized input. Then validate against the schema version your application expects.

Next, apply semantic rules. Is the service available in this environment? Is the requested time range meaningful? Does a selected record belong to the current account? Finally, [check permission at the tool boundary](/guides/tool-calling-guardrails/) for any read or write the application will perform.

| Response                    | Schema result                      | Remaining question                      |
| --------------------------- | ---------------------------------- | --------------------------------------- |
| Missing service field       | Reject                             | None; request is incomplete             |
| Unknown operation value     | Reject                             | None; operation is unsupported          |
| Valid service and operation | Accept structure                   | May this caller inspect that target?    |
| Valid date string           | Depends on validator configuration | Is the date within the permitted range? |

The [JSON Schema format documentation](https://json-schema.org/understanding-json-schema/reference/type) explains that format is an annotation by default; implementations may support assertion behavior. Verify your validator's settings before assuming that an email or date format is enforced.

## Keep provider constraints and server checks together

A provider's structured generation feature can reduce malformed responses. Your application should still validate data at its own boundary, including data from retries, stored responses and alternate clients.

The [MCP tools specification](https://modelcontextprotocol.io/specification/latest/server/tools) uses JSON Schema for tool inputs and supports an output schema. Tool definitions and runtime validation need to agree. If you advertise one contract but execute another, the model and the service can make different assumptions.

When changing a schema, consider queued requests and stored results. An older request may no longer contain a newly required field. Decide whether to migrate it, reject it with a clear error, or process it under an explicitly supported older contract.

## Recover without inventing authority

A validation failure can be sent back to the model as a bounded correction request. For example, explain that the operation must be one of the supported values and ask for a replacement object. Validate the replacement from the start.

Limit retries as part of the [LLM guardrail recovery path](/guides/llm-guardrails/). If the model keeps producing an invalid request, return an error or ask the user for clarification. Do not silently change an unknown service name to the nearest known service and then execute against it.

Automatic repair is particularly risky for actions. Adding a missing environment or changing a destination may turn an incomplete request into a different request. Require a fresh policy decision and, when applicable, approval for the final values.

## Test the consumer as well as the schema

Send unexpected fields, null values, wrong types and very large strings. Include valid objects that are forbidden by business rules. Confirm that rejected data never reaches the action handler.

Check what the interface does with text fields. A string that passes schema validation may still contain markup, a URL or instructions. Render it according to your application's output-handling rules and avoid treating it as trusted code.

Keep a compact set of examples with the schema: one valid request, several structural failures and a valid request that the caller is not authorized to make. Assert that the last case passes schema validation and is then denied before execution.
