// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../config", () => ({
  UPLOAD_WORKER_URL: "https://psc-worker.example.com",
  UPLOAD_SECRET: "test-secret",
  VAULT_DISPLAY_NAMES: { saturn: "ORIGINAL MUSIC", venus: "MIXES", mercury: "LIVE SETS", earth: "SONIC ARCH" },
  VAULT_ACCENT_COLORS: { saturn: "#fff", venus: "#fff", mercury: "#fff", earth: "#fff" },
  LOCKBOX_PREFIX: "lockbox_",
  R2_PUBLIC_URL: "https://r2.example.com",
}));

import { moveTrackToVault } from "../ArchitectConsole";

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("moveTrackToVault", () => {
  it("PATCHes the track's vault field with the correct auth header", async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    await moveTrackToVault(42, "saturn");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://psc-worker.example.com/tracks/42",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "PSC-Secret": "test-secret",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ vault: "saturn" }),
      }),
    );
  });

  it("throws when the worker responds with a non-2xx status — this is the exact bug class fixed in publish/retract this session", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401 });

    await expect(moveTrackToVault(42, "saturn")).rejects.toThrow(/401/);
  });

  it("does not throw on a successful response", async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    await expect(moveTrackToVault(42, "saturn")).resolves.toBeUndefined();
  });
});
