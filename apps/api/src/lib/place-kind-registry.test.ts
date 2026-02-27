import { describe, expect, test } from "bun:test";
import {
  isPlaceKind,
  supportsMenuForKind,
  supportsPackagesForKind,
  supportsRoomsForKind,
} from "./place-kind-registry.ts";

describe("place-kind-registry", () => {
  test("validates known place kinds", () => {
    expect(isPlaceKind("villa")).toBe(true);
    expect(isPlaceKind("balloon_tour")).toBe(true);
    expect(isPlaceKind("unknown_kind")).toBe(false);
  });

  test("enforces room capability only for hotel_pension", () => {
    expect(supportsRoomsForKind("hotel_pension")).toBe(true);
    expect(supportsRoomsForKind("villa")).toBe(false);
    expect(supportsRoomsForKind("transfer")).toBe(false);
  });

  test("enforces menu capability for no category", () => {
    expect(supportsMenuForKind("villa")).toBe(false);
    expect(supportsMenuForKind("hotel_pension")).toBe(false);
    expect(supportsMenuForKind("transfer")).toBe(false);
  });

  test("enforces package capability only for activity categories", () => {
    expect(supportsPackagesForKind("transfer")).toBe(true);
    expect(supportsPackagesForKind("boat_tour")).toBe(true);
    expect(supportsPackagesForKind("paragliding_microlight_skydiving")).toBe(true);
    expect(supportsPackagesForKind("safari")).toBe(true);
    expect(supportsPackagesForKind("water_sports")).toBe(true);
    expect(supportsPackagesForKind("ski")).toBe(true);
    expect(supportsPackagesForKind("balloon_tour")).toBe(true);
    expect(supportsPackagesForKind("hotel_pension")).toBe(false);
  });
});
