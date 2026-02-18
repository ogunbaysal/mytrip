import { describe, expect, test } from "bun:test";
import { evaluateEntitlementLimit } from "./entitlement-evaluator.ts";

describe("plan-entitlements integration helpers", () => {
  test("blocks kind change when target kind quota is full", () => {
    const result = evaluateEntitlementLimit({
      resourceKey: "place.hotel",
      entitlements: [
        {
          resourceKey: "place.hotel",
          limitCount: 1,
          isUnlimited: false,
        },
        {
          resourceKey: "place.villa",
          limitCount: 5,
          isUnlimited: false,
        },
      ],
      usageByResource: {
        "place.hotel": 1,
        "place.villa": 0,
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.current).toBe(1);
    expect(result.max).toBe(1);
  });
});
