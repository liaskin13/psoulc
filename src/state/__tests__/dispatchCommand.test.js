// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../lib/tracks", () => ({
  fetchVaultTracks: vi.fn().mockResolvedValue([]),
  fetchAllTracks: vi.fn().mockResolvedValue([]),
}));

import { SystemProvider, useSystem, CMD } from "../SystemContext";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderSystem() {
  return renderHook(() => useSystem(), { wrapper: SystemProvider });
}

// Setting consoleOwner triggers a fetchAllTracks() effect — flush the
// resulting microtask so it doesn't leak an unhandled act() warning
// into the next test.
async function setOwner(result, owner) {
  await act(async () => {
    result.current.setConsoleOwner(owner);
    await Promise.resolve();
  });
}

const D_AND_L_ONLY_CMDS = [
  CMD.VOID_ITEM,
  CMD.TUNE_VAULT,
  CMD.CLAIM_NODE,
  CMD.INTAKE_ASSET,
  CMD.BROADCAST,
  CMD.UPLOAD_TRACK,
];

describe("dispatchCommand authorization", () => {
  it("EXPLORE_VAULT is allowed for any authenticated owner", async () => {
    const { result } = renderSystem();
    await setOwner(result, "L");

    let res;
    act(() => {
      res = result.current.dispatchCommand(CMD.EXPLORE_VAULT, {});
    });
    expect(res.success).toBe(true);
  });

  it("EXPLORE_VAULT is denied when no owner is set", () => {
    const { result } = renderSystem();

    let res;
    act(() => {
      res = result.current.dispatchCommand(CMD.EXPLORE_VAULT, {});
    });
    expect(res).toEqual({ success: false, error: "UNAUTHORIZED" });
  });

  it("RESTORE_ITEM is allowed for L (Architect only)", async () => {
    const { result } = renderSystem();
    await setOwner(result, "L");

    let res;
    act(() => {
      res = result.current.dispatchCommand(CMD.RESTORE_ITEM, { id: "x" });
    });
    expect(res.success).toBe(true);
  });

  it("RESTORE_ITEM is denied for D", async () => {
    const { result } = renderSystem();
    await setOwner(result, "D");

    let res;
    act(() => {
      res = result.current.dispatchCommand(CMD.RESTORE_ITEM, { id: "x" });
    });
    expect(res).toEqual({ success: false, error: "UNAUTHORIZED" });
  });

  it.each(D_AND_L_ONLY_CMDS)("%s is allowed for D", async (cmd) => {
    const { result } = renderSystem();
    await setOwner(result, "D");

    let res;
    act(() => {
      res = result.current.dispatchCommand(cmd, {});
    });
    expect(res.success).toBe(true);
  });

  it.each(D_AND_L_ONLY_CMDS)("%s is allowed for L", async (cmd) => {
    const { result } = renderSystem();
    await setOwner(result, "L");

    let res;
    act(() => {
      res = result.current.dispatchCommand(cmd, {});
    });
    expect(res.success).toBe(true);
  });

  it.each(D_AND_L_ONLY_CMDS)("%s is denied when no owner is set", (cmd) => {
    const { result } = renderSystem();

    let res;
    act(() => {
      res = result.current.dispatchCommand(cmd, {});
    });
    expect(res).toEqual({ success: false, error: "UNAUTHORIZED" });
  });

  it("an unrecognized command falls through the default case to denied", async () => {
    const { result } = renderSystem();
    await setOwner(result, "D");

    let res;
    act(() => {
      res = result.current.dispatchCommand("NOT_A_REAL_CMD", {});
    });
    expect(res).toEqual({ success: false, error: "UNAUTHORIZED" });
  });
});

describe("dispatchCommand side effects", () => {
  it("a successful dispatch appends an entry to commandLog with the acting owner", async () => {
    const { result } = renderSystem();
    await setOwner(result, "D");

    act(() => {
      result.current.dispatchCommand(CMD.BROADCAST, { msg: "hi" });
    });

    expect(result.current.commandLog).toHaveLength(1);
    expect(result.current.commandLog[0]).toMatchObject({
      cmd: CMD.BROADCAST,
      by: "D",
      payload: { msg: "hi" },
    });
  });

  it("a denied dispatch never reaches the command log", () => {
    const { result } = renderSystem();

    act(() => {
      result.current.dispatchCommand(CMD.BROADCAST, {});
    });

    expect(result.current.commandLog).toHaveLength(0);
  });

  it("VOID_ITEM moves the item into voidedItems and architectArchive", async () => {
    const { result } = renderSystem();
    await setOwner(result, "D");

    act(() => {
      result.current.dispatchCommand(CMD.VOID_ITEM, {
        item: { id: "track-1" },
        vaultId: "venus",
      });
    });

    expect(result.current.voidedItems).toHaveLength(1);
    expect(result.current.voidedItems[0].id).toBe("track-1");
    expect(
      result.current.architectArchive.some((r) => r.id === "track-1"),
    ).toBe(true);
  });

  it("RESTORE_ITEM removes the item from voidedItems", async () => {
    const { result } = renderSystem();
    await setOwner(result, "L");

    act(() => {
      result.current.dispatchCommand(CMD.VOID_ITEM, {
        item: { id: "track-1" },
        vaultId: "venus",
      });
    });
    expect(result.current.voidedItems).toHaveLength(1);

    act(() => {
      result.current.dispatchCommand(CMD.RESTORE_ITEM, { id: "track-1" });
    });
    expect(result.current.voidedItems).toHaveLength(0);
  });

  it("VOID_ITEM with no item/vaultId in payload is a no-op success (handler guard)", async () => {
    const { result } = renderSystem();
    await setOwner(result, "D");

    let res;
    act(() => {
      res = result.current.dispatchCommand(CMD.VOID_ITEM, {});
    });
    expect(res.success).toBe(true);
    expect(result.current.voidedItems).toHaveLength(0);
  });
});

// GAP (acknowledged, not tested): the collaborator vault-access cross-check
// (dispatchCommand step 2 — VAULT_ACCESS_DENIED) requires seeding a
// collaborator derived from members/listeners state plus a matching
// sessionMeta. Covering it needs collaborators.js fixtures and is deeper
// than the tier-based authorization this file targets; left for a
// dedicated collaborators.js test pass.
