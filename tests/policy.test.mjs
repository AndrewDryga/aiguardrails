import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePolicy } from "../src/lib/policy.mjs";
const base = {
  action: "restart_service",
  environment: "production",
  authorized: true,
  approved: false,
  policyAvailable: true,
};
test("production change waits; exact approval permits it", () => {
  assert.equal(evaluatePolicy(base).decision, "hold");
  assert.equal(evaluatePolicy({ ...base, approved: true }).decision, "allow");
});
test("approval cannot bypass target access, forbidden export or unavailable policy", () => {
  for (const change of [
    { authorized: false },
    { action: "export_data" },
    { policyAvailable: false },
  ])
    assert.equal(
      evaluatePolicy({ ...base, approved: true, ...change }).decision,
      "deny",
    );
});
test("unknown requests fail closed", () => {
  for (const change of [{ action: "shell" }, { environment: "unknown" }])
    assert.equal(evaluatePolicy({ ...base, ...change }).decision, "deny");
});
test("declared authorized reads do not need human approval", () => {
  assert.equal(
    evaluatePolicy({ ...base, action: "read_metrics" }).decision,
    "allow",
  );
});
