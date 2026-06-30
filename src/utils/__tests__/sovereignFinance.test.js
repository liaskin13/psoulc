import { describe, it, expect } from "vitest";
import {
  RESIDENCY_TIERS,
  PRICING,
  MAINTENANCE_FEE,
  RECIPROCITY_THRESHOLD,
  WAIVER_THRESHOLD,
  getResidencySplit,
  isMaintenanceDue,
  calculateArtistPayout,
  validateShadowDownload,
} from "../sovereignFinance";

describe("getResidencySplit — tier boundaries", () => {
  it("resident 1 (well inside TIER_I) gets the 87/13 split", () => {
    expect(getResidencySplit(1)).toBe(RESIDENCY_TIERS.TIER_I);
  });

  it("resident 10 (TIER_I upper boundary, inclusive) gets TIER_I", () => {
    expect(getResidencySplit(10)).toBe(RESIDENCY_TIERS.TIER_I);
  });

  it("resident 11 (one past TIER_I boundary) gets TIER_II", () => {
    expect(getResidencySplit(11)).toBe(RESIDENCY_TIERS.TIER_II);
  });

  it("resident 43 (TIER_II upper boundary, inclusive) gets TIER_II", () => {
    expect(getResidencySplit(43)).toBe(RESIDENCY_TIERS.TIER_II);
  });

  it("resident 44 (one past TIER_II boundary) gets TIER_III", () => {
    expect(getResidencySplit(44)).toBe(RESIDENCY_TIERS.TIER_III);
  });

  it("resident 100 and far beyond all fall into TIER_III (no upper ceiling enforced)", () => {
    expect(getResidencySplit(100)).toBe(RESIDENCY_TIERS.TIER_III);
    expect(getResidencySplit(99999)).toBe(RESIDENCY_TIERS.TIER_III);
  });

  it("resident 0 or negative falls into TIER_I (no floor guard — current behavior)", () => {
    expect(getResidencySplit(0)).toBe(RESIDENCY_TIERS.TIER_I);
    expect(getResidencySplit(-5)).toBe(RESIDENCY_TIERS.TIER_I);
  });
});

describe("isMaintenanceDue", () => {
  it("is false just under the $5000 reciprocity threshold", () => {
    expect(isMaintenanceDue(4999.99)).toBe(false);
  });

  it("is true exactly at the $5000 threshold (inclusive)", () => {
    expect(isMaintenanceDue(RECIPROCITY_THRESHOLD)).toBe(true);
  });

  it("is true above the threshold", () => {
    expect(isMaintenanceDue(10000)).toBe(true);
  });

  it("is false for zero or negative gross", () => {
    expect(isMaintenanceDue(0)).toBe(false);
    expect(isMaintenanceDue(-100)).toBe(false);
  });
});

describe("calculateArtistPayout", () => {
  it("pays TIER_I residents 87% of gross", () => {
    expect(calculateArtistPayout(1, 1000)).toBeCloseTo(870, 5);
  });

  it("pays TIER_II residents 79% of gross", () => {
    expect(calculateArtistPayout(20, 1000)).toBeCloseTo(790, 5);
  });

  it("pays TIER_III residents 71% of gross", () => {
    expect(calculateArtistPayout(50, 1000)).toBeCloseTo(710, 5);
  });

  it("the artist split and PSC split always sum to the full gross amount", () => {
    for (const residentId of [1, 10, 11, 43, 44, 100]) {
      const tier = getResidencySplit(residentId);
      expect(tier.artistSplit + tier.pscSplit).toBeCloseTo(1, 10);
    }
  });

  it("returns 0 payout for 0 gross regardless of tier", () => {
    expect(calculateArtistPayout(1, 0)).toBe(0);
    expect(calculateArtistPayout(50, 0)).toBe(0);
  });
});

describe("validateShadowDownload", () => {
  it("rejects an amount below the $1.00 minimum", () => {
    expect(validateShadowDownload(0.99)).toBe(false);
  });

  it("accepts exactly the $1.00 minimum (inclusive)", () => {
    expect(validateShadowDownload(PRICING.SHADOW_DOWNLOAD_MIN)).toBe(true);
  });

  it("accepts amounts above the minimum", () => {
    expect(validateShadowDownload(50)).toBe(true);
  });

  it("rejects zero and negative amounts", () => {
    expect(validateShadowDownload(0)).toBe(false);
    expect(validateShadowDownload(-5)).toBe(false);
  });
});

describe("pricing and fee constants — pinned values (guards against accidental edits)", () => {
  it("monthly/yearly/investor pricing matches the published rate card", () => {
    expect(PRICING.MONTHLY).toBe(9.0);
    expect(PRICING.YEARLY).toBe(99.0);
    expect(PRICING.INVESTOR).toBe(999.0);
  });

  it("maintenance fee and thresholds match the documented Alliance Registry terms", () => {
    expect(MAINTENANCE_FEE).toBe(100.0);
    expect(RECIPROCITY_THRESHOLD).toBe(5000.0);
    expect(WAIVER_THRESHOLD).toBe(50);
  });

  it("the three residency tiers form a contiguous, non-overlapping ladder", () => {
    expect(RESIDENCY_TIERS.TIER_I.maxId).toBe(10);
    expect(RESIDENCY_TIERS.TIER_II.maxId).toBe(43);
    expect(RESIDENCY_TIERS.TIER_III.maxId).toBe(100);
  });
});
