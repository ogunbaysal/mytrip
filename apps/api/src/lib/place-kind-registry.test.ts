import { describe, expect, test } from "bun:test";
import {
  isPlaceKind,
  supportsMenuForKind,
  supportsPackagesForKind,
  supportsRoomsForKind,
} from "./place-kind-registry.ts";

describe("place-kind-registry", () => {
  test("validates known place kinds", () => {
    expect(isPlaceKind("hotel")).toBe(true);
    expect(isPlaceKind("visit_location")).toBe(true);
    expect(isPlaceKind("unknown_kind")).toBe(false);
  });

  test("enforces room capability only for hotel", () => {
    expect(supportsRoomsForKind("hotel")).toBe(true);
    expect(supportsRoomsForKind("villa")).toBe(false);
    expect(supportsRoomsForKind("restaurant")).toBe(false);
  });

  test("enforces menu capability only for dining kinds", () => {
    expect(supportsMenuForKind("restaurant")).toBe(true);
    expect(supportsMenuForKind("cafe")).toBe(true);
    expect(supportsMenuForKind("bar_club")).toBe(true);
    expect(supportsMenuForKind("hotel")).toBe(false);
  });

  test("enforces package capability only for activity locations", () => {
    expect(supportsPackagesForKind("activity_location")).toBe(true);
    expect(supportsPackagesForKind("visit_location")).toBe(false);
    expect(supportsPackagesForKind("hotel")).toBe(false);
  });
});
