import { describe, it, expect } from "vitest";
import { RESIDENT_REGISTRY, findResidentByCode, getResidentMetadata } from "../residentBlueprint";

describe("findResidentByCode", () => {
  it("finds D by his access code", () => {
    const d = RESIDENT_REGISTRY.find((r) => r.name === "D");
    expect(findResidentByCode(d.accessCode)).toEqual(d);
  });

  it("finds L by her access code", () => {
    const l = RESIDENT_REGISTRY.find((r) => r.name === "L");
    expect(findResidentByCode(l.accessCode)).toEqual(l);
  });

  it("returns null for an unknown code", () => {
    expect(findResidentByCode("0000")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(findResidentByCode("")).toBeNull();
  });

  it("returns null for undefined or null input", () => {
    expect(findResidentByCode(undefined)).toBeNull();
    expect(findResidentByCode(null)).toBeNull();
  });
});

describe("getResidentMetadata", () => {
  it("returns null for an unknown residentId", () => {
    expect(getResidentMetadata(999)).toBeNull();
  });

  it("flags an existing resident as isMaster (residentId <= 10), never isResident/isGuest", () => {
    const meta = getResidentMetadata(1);
    expect(meta.isMaster).toBe(true);
    expect(meta.isResident).toBe(false);
    expect(meta.isGuest).toBe(false);
  });

  it("preserves all original registry fields alongside the derived flags", () => {
    const original = RESIDENT_REGISTRY.find((r) => r.residentId === 1);
    const meta = getResidentMetadata(1);
    expect(meta).toMatchObject(original);
  });

  it("both current residents (D, L) are classified as Masters under the current registry", () => {
    for (const r of RESIDENT_REGISTRY) {
      expect(getResidentMetadata(r.residentId).isMaster).toBe(true);
    }
  });
});

describe("RESIDENT_REGISTRY shape", () => {
  it("every entry has a unique residentId and a unique accessCode", () => {
    const ids = RESIDENT_REGISTRY.map((r) => r.residentId);
    const codes = RESIDENT_REGISTRY.map((r) => r.accessCode);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every entry has a non-empty palette with primary and accent colors", () => {
    for (const r of RESIDENT_REGISTRY) {
      expect(r.palette?.primary).toBeTruthy();
      expect(r.palette?.accent).toBeTruthy();
    }
  });
});
