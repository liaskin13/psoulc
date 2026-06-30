import { describe, it, expect } from "vitest";
import { canVoid, canEdit, canComment } from "../permissions";

describe("canVoid", () => {
  it("tier A can void on any planet", () => {
    expect(canVoid({ tier: "A", planet: "venus" }, "saturn")).toBe(true);
    expect(canVoid({ tier: "A", planet: null }, "saturn")).toBe(true);
  });

  it("tier B can void only on their own planet", () => {
    expect(canVoid({ tier: "B", planet: "saturn" }, "saturn")).toBe(true);
    expect(canVoid({ tier: "B", planet: "venus" }, "saturn")).toBe(false);
  });

  it("tier B with no assigned planet can void nowhere", () => {
    expect(canVoid({ tier: "B", planet: null }, "saturn")).toBe(false);
  });

  it("tier C and G can never void", () => {
    expect(canVoid({ tier: "C", planet: "saturn" }, "saturn")).toBe(false);
    expect(canVoid({ tier: "G", planet: "saturn" }, "saturn")).toBe(false);
  });

  it("returns false for a missing or empty sessionMeta", () => {
    expect(canVoid(null, "saturn")).toBe(false);
    expect(canVoid(undefined, "saturn")).toBe(false);
    expect(canVoid({}, "saturn")).toBe(false);
  });
});

describe("canEdit", () => {
  it("mirrors canVoid's tier rules exactly", () => {
    expect(canEdit({ tier: "A" }, "saturn")).toBe(true);
    expect(canEdit({ tier: "B", planet: "saturn" }, "saturn")).toBe(true);
    expect(canEdit({ tier: "B", planet: "venus" }, "saturn")).toBe(false);
    expect(canEdit({ tier: "C", planet: "saturn" }, "saturn")).toBe(false);
  });
});

describe("canComment", () => {
  it("allows tiers A, B, and C", () => {
    expect(canComment({ tier: "A" })).toBe(true);
    expect(canComment({ tier: "B" })).toBe(true);
    expect(canComment({ tier: "C" })).toBe(true);
  });

  it("denies tier G (generic listeners)", () => {
    expect(canComment({ tier: "G" })).toBe(false);
  });

  it("denies a missing or empty sessionMeta", () => {
    expect(canComment(null)).toBe(false);
    expect(canComment({})).toBe(false);
  });
});
