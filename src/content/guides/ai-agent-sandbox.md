---
title: "AI agent sandboxes"
description: "Review filesystem, network, identity and secret boundaries before giving a coding agent an execution environment."
category: "Implementation"
primaryKeyword: "ai agent sandbox"
relatedKeywords: ["ai agent sandboxing", "coding agent sandbox"]
order: 16
reviewedDate: "2026-11-09"
answer: "An AI agent sandbox restricts the environment in which an agent runs code or commands. Its protections depend on the runtime, filesystem mounts, network rules, credentials and resource limits. A sandbox can limit local damage while still permitting powerful remote actions, so remote access needs its own authorization controls."
related: ["ai-agent-guardrails", "tool-calling-guardrails", "fail-closed-guardrails"]
sources: [{"title": "Docker Engine security", "url": "https://docs.docker.com/engine/security/"}, {"title": "gVisor architecture and isolation", "url": "https://gvisor.dev/docs/"}, {"title": "OWASP Excessive Agency", "url": "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/"}]
---

A coding agent may need to run tests, install dependencies and rewrite files. Those useful capabilities also let it damage anything the process can reach. Start the sandbox review with the resources the task actually needs, then inspect how they enter the environment.

The word sandbox does not identify one security mechanism. A directory convention, a container and an isolated kernel expose different boundaries. Read the runtime's design and test the configuration you deploy.

## Draw the environment around one task

For a hypothetical repository task, allow writes to a disposable checkout and a task-local build directory. Keep personal files and production credentials outside the environment. If the task needs a database, provide a disposable test instance with synthetic data.

```text
Human-approved task
  -> agent process inside restricted runtime
     -> disposable checkout and test data
     -> controlled dependency access
     -> separate remote action interface, if explicitly allowed
Outside the task: personal files, production tokens, unrelated projects
```

This map describes intended boundaries. It is not proof that a particular runtime enforces them.

[co:op](https://coop.dryga.com/) is one implementation of a project workspace for coding agents. Its sandbox controls files, credentials and network access according to the selected mode and configuration. Use its [documentation](https://coop.dryga.com/docs.html) to identify those settings, then apply the boundary checks below to the environment you run. co:op shares ownership with this publication.

| Boundary | Useful question | Evidence to collect |
| --- | --- | --- |
| Filesystem | Which directories and sockets are mounted? | Attempted access to a synthetic outside marker |
| Network | Which destinations and routes are reachable? | Allowed and denied connections in the deployed network mode |
| Secrets | Which files, variables and agents carry authority? | Sanitized environment and mount inventory |
| Process identity | What can the user and its capabilities do? | Runtime configuration and focused privilege tests |
| Resources | What stops runaway subprocesses or output? | Time, process, storage and memory limit behavior |
| Lifetime | What survives the task? | Inspection of caches, artifacts and cleanup |

## Choose isolation based on the code that may run

[Docker's security documentation](https://docs.docker.com/engine/security/) describes namespaces, resource controls, daemon exposure and configuration as separate considerations. A container with broad host mounts or access to the container daemon can have far more authority than the label suggests.

[gVisor](https://gvisor.dev/docs/) uses an application kernel to place another boundary between the application and host operating system. That changes compatibility and performance considerations as well as isolation. It does not decide which credentials you put inside the sandbox or which remote APIs those credentials permit.

A virtual machine is another possible boundary. Review the chosen platform's filesystem sharing, network connectivity and management interfaces. No runtime name is a substitute for checking the actual deployment.

## Inspect the less obvious paths to authority

A mounted Unix socket may expose a privileged service even when no secret file is visible. An SSH agent, cloud credential helper or inherited environment variable can also carry authority. Package installation scripts run code within the permissions of the environment; their effects belong in the same review as the agent's commands.

Look at caches too. A shared cache writable by one task can influence a later task. Decide which artifacts may be reused, who can modify them and whether the next task verifies them. Treat untrusted repository instructions as input rather than permission to change the sandbox.

A read-only mount prevents edits through that mount; it still permits reading its contents. Do not mount a private home directory read-only if the requirement is to keep the agent from seeing its files.

## Run boundary tests without valuable data

Use synthetic markers and test services you control. A practical review can include these cases:

1. Place a marker outside the allowed checkout. Verify that the sandbox cannot read it through normal paths or alternate mounted locations.
2. Write within the checkout and verify that an unrelated directory stays unchanged.
3. Connect to an approved test dependency, then an unapproved test destination. Inspect the network enforcement result.
4. Run a bounded resource-exhaustion fixture and verify the configured limit without affecting unrelated work.
5. End the task and check what remains in shared storage, background processes and exported artifacts.

Run the tests for each supported network and mount configuration. Passing on a development laptop does not establish the same boundary in CI or on a remote host. Keep unsupported configurations visible instead of treating them as implicitly tested.

## Separate local execution from remote permission

Suppose the sandbox can call a service-status API. The local runtime decides whether the network connection is possible. The receiving service decides whether this identity may inspect that target. Both decisions matter.

If a production administrator token is available inside the sandbox, local filesystem isolation does not reduce the token's remote permissions. Prefer a narrow remote operation with [execution-time checks](/guides/tool-calling-guardrails/). Inspect alternate routes that bypass that operation.

## Define completion, cancellation and recovery

Cancellation should state whether it stops future dispatches, terminates current processes or both. A remote operation already accepted by another service may continue after the local sandbox exits. Preserve the operation reference so an operator can resolve an unknown result.

Review exported artifacts before using them in a more privileged environment. A patch, archive or test report produced inside the sandbox remains untrusted input to the next step. The [agent guardrails guide](/guides/ai-agent-guardrails/) covers authority across that broader workflow.

Finish with a boundary record: permitted resources, runtime configuration, test evidence and remaining limitations. Repeat the relevant tests when mounts, network mode, credentials or the runtime change.
