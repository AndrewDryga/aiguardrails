export function evaluatePolicy(input) {
  if (
    !["read_metrics", "restart_service", "export_data"].includes(
      input.action,
    ) ||
    !["staging", "production"].includes(input.environment)
  )
    return {
      decision: "deny",
      reason: "The request is outside this example policy.",
      rule: "Validate the request",
    };
  if (!input.policyAvailable)
    return {
      decision: "deny",
      reason:
        "The policy check is unavailable. This example stops execution until a current decision is possible.",
      rule: "Fail closed",
    };
  if (!input.authorized)
    return {
      decision: "deny",
      reason:
        "The agent has no grant for this target. Approval cannot widen that grant.",
      rule: "Check target access",
    };
  if (input.action === "export_data")
    return {
      decision: "deny",
      reason:
        "Customer data export is outside the allowed action set, even when approval is selected.",
      rule: "Check the action allowlist",
    };
  if (
    input.action === "restart_service" &&
    input.environment === "production" &&
    !input.approved
  )
    return {
      decision: "hold",
      reason:
        "A production restart needs approval bound to this exact action and target. It has not run.",
      rule: "Require approval before the side effect",
    };
  return {
    decision: "allow",
    reason:
      input.action === "read_metrics"
        ? "This example permits reading service metrics on an authorized target. Returned data still needs appropriate handling."
        : "The declared restart meets this example policy. An allowed restart can still interrupt service.",
    rule: "Permit the declared action",
  };
}
