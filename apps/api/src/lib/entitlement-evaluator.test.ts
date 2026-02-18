import { describe, expect, test } from "bun:test";
import { evaluateEntitlementLimit } from "./entitlement-evaluator.ts";

describe("evaluateEntitlementLimit", () => {
  test("rejects when entitlement is missing", () => {
    const result = evaluateEntitlementLimit({
      resourceKey: "place.hotel",
      entitlements: [],
      usageByResource: { "place.hotel": 1 },
    });

    expect(result).toEqual({
      allowed: false,
      current: 0,
      max: 0,
      isUnlimited: false,
    });
  });

  test("allows when entitlement is unlimited", () => {
    const result = evaluateEntitlementLimit({
      resourceKey: "place.visit_location",
      entitlements: [
        {
          resourceKey: "place.visit_location",
          limitCount: null,
          isUnlimited: true,
        },
      ],
      usageByResource: { "place.visit_location": 999 },
    });

    expect(result).toEqual({
      allowed: true,
      current: 999,
      max: null,
      isUnlimited: true,
    });
  });

  test("enforces numeric limit", () => {
    const allowedResult = evaluateEntitlementLimit({
      resourceKey: "place.hotel",
      entitlements: [
        {
          resourceKey: "place.hotel",
          limitCount: 2,
          isUnlimited: false,
        },
      ],
      usageByResource: { "place.hotel": 1 },
    });

    const blockedResult = evaluateEntitlementLimit({
      resourceKey: "place.hotel",
      entitlements: [
        {
          resourceKey: "place.hotel",
          limitCount: 2,
          isUnlimited: false,
        },
      ],
      usageByResource: { "place.hotel": 2 },
    });

    expect(allowedResult.allowed).toBe(true);
    expect(allowedResult.max).toBe(2);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.current).toBe(2);
  });
});
