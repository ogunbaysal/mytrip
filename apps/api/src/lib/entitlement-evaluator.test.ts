import { describe, expect, test } from "bun:test";
import { evaluateEntitlementLimit } from "./entitlement-evaluator.ts";

describe("evaluateEntitlementLimit", () => {
  test("rejects when entitlement is missing", () => {
    const result = evaluateEntitlementLimit({
      resourceKey: "place.hotel_pension",
      entitlements: [],
      usageByResource: { "place.hotel_pension": 1 },
    });

    expect(result).toEqual({
      allowed: false,
      current: 0,
      max: 0,
      isUnlimited: false,
    });
  });

  test("enforces numeric limit for all categories", () => {
    const allowedResult = evaluateEntitlementLimit({
      resourceKey: "place.hotel_pension",
      entitlements: [
        {
          resourceKey: "place.hotel_pension",
          limitCount: 2,
          isUnlimited: false,
        },
      ],
      usageByResource: { "place.hotel_pension": 1 },
    });

    const blockedResult = evaluateEntitlementLimit({
      resourceKey: "place.hotel_pension",
      entitlements: [
        {
          resourceKey: "place.hotel_pension",
          limitCount: 2,
          isUnlimited: false,
        },
      ],
      usageByResource: { "place.hotel_pension": 2 },
    });

    expect(allowedResult.allowed).toBe(true);
    expect(allowedResult.max).toBe(2);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.current).toBe(2);
  });
});
