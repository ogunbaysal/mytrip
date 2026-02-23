import { describe, expect, test } from "bun:test";
import {
  buildIyzicoAuthorizationHeader,
  parseIyzicoPlanReferenceMap,
} from "./payment-provider.ts";

describe("parseIyzicoPlanReferenceMap", () => {
  test("parses JSON mapping", () => {
    const map = parseIyzicoPlanReferenceMap('{"basic":"pp-1","pro":"pp-2"}');

    expect(map.get("basic")).toBe("pp-1");
    expect(map.get("pro")).toBe("pp-2");
  });

  test("parses comma-separated mapping", () => {
    const map = parseIyzicoPlanReferenceMap("basic:pp-1, pro:pp-2");

    expect(map.get("basic")).toBe("pp-1");
    expect(map.get("pro")).toBe("pp-2");
  });
});

describe("buildIyzicoAuthorizationHeader", () => {
  test("builds IYZWSv2 authorization header", () => {
    const header = buildIyzicoAuthorizationHeader({
      apiKey: "api-key",
      secretKey: "secret-key",
      path: "/v2/subscription/initialize",
      randomKey: "rnd-123",
      body: {
        locale: "tr",
      },
    });

    expect(header.startsWith("IYZWSv2 ")).toBe(true);
    expect(header.length).toBeGreaterThan("IYZWSv2 ".length);
  });
});
