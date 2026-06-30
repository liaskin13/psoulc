import { describe, it, expect } from "vitest";
import {
  COLLABORATOR_ROLES,
  VAULT_IDS,
  ROLE_TO_TIER,
  makeCollaborator,
  isCollaboratorActive,
  canCollaboratorAccess,
  canLockboxAccess,
  memberToCollaborator,
  listenerToCollaborator,
  migrateToCollaborators,
} from "../collaborators";

describe("makeCollaborator", () => {
  it("throws for an invalid role", () => {
    expect(() => makeCollaborator({ name: "X", role: "admin" })).toThrow(
      /Invalid collaborator role/,
    );
  });

  it.each(COLLABORATOR_ROLES)("accepts the valid role '%s'", (role) => {
    expect(() => makeCollaborator({ name: "X", role })).not.toThrow();
  });

  it("filters vaultAccess down to known VAULT_IDS, dropping unknown ones", () => {
    const collab = makeCollaborator({
      name: "X",
      role: "editor",
      vaultAccess: ["venus", "not-a-real-vault", "mercury"],
    });
    expect(collab.vaultAccess).toEqual(["venus", "mercury"]);
  });

  it("filters lockboxGrants down to known VAULT_IDS", () => {
    const collab = makeCollaborator({
      name: "X",
      role: "co-owner",
      lockboxGrants: ["lockbox_janet", "fake_lockbox"],
    });
    expect(collab.lockboxGrants).toEqual(["lockbox_janet"]);
  });

  it("defaults vaultAccess and lockboxGrants to empty arrays when omitted", () => {
    const collab = makeCollaborator({ name: "X", role: "listener" });
    expect(collab.vaultAccess).toEqual([]);
    expect(collab.lockboxGrants).toEqual([]);
  });

  it("defaults planet and code to null, and isActive to true", () => {
    const collab = makeCollaborator({ name: "X", role: "listener" });
    expect(collab.planet).toBeNull();
    expect(collab.code).toBeNull();
    expect(collab.isActive).toBe(true);
    expect(collab.expiresAt).toBeNull();
  });

  it("generates a unique id prefixed with 'collab-' and a valid ISO grantedAt", () => {
    const a = makeCollaborator({ name: "A", role: "listener" });
    const b = makeCollaborator({ name: "B", role: "listener" });
    expect(a.id).toMatch(/^collab-/);
    expect(a.id).not.toBe(b.id);
    expect(new Date(a.grantedAt).toISOString()).toBe(a.grantedAt);
  });
});

describe("isCollaboratorActive", () => {
  it("is false when isActive is false, regardless of expiresAt", () => {
    expect(isCollaboratorActive({ isActive: false, expiresAt: null })).toBe(false);
  });

  it("is true when isActive is true and there is no expiresAt", () => {
    expect(isCollaboratorActive({ isActive: true, expiresAt: null })).toBe(true);
  });

  it("is true when expiresAt is in the future", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isCollaboratorActive({ isActive: true, expiresAt: future })).toBe(true);
  });

  it("is false when expiresAt is in the past", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isCollaboratorActive({ isActive: true, expiresAt: past })).toBe(false);
  });
});

describe("canCollaboratorAccess", () => {
  it("co-owner can access any vault, even with an empty vaultAccess list", () => {
    const coOwner = makeCollaborator({ name: "D", role: "co-owner", vaultAccess: [] });
    expect(canCollaboratorAccess(coOwner, "venus")).toBe(true);
    expect(canCollaboratorAccess(coOwner, "lockbox_janet")).toBe(true);
  });

  it("an inactive co-owner is denied — active check happens first", () => {
    const coOwner = makeCollaborator({ name: "D", role: "co-owner" });
    coOwner.isActive = false;
    expect(canCollaboratorAccess(coOwner, "venus")).toBe(false);
  });

  it("editor can access only vaults explicitly listed in vaultAccess", () => {
    const editor = makeCollaborator({ name: "E", role: "editor", vaultAccess: ["venus"] });
    expect(canCollaboratorAccess(editor, "venus")).toBe(true);
    expect(canCollaboratorAccess(editor, "saturn")).toBe(false);
  });

  it("featured-artist with no vaultAccess can access nothing", () => {
    const artist = makeCollaborator({ name: "F", role: "featured-artist" });
    expect(canCollaboratorAccess(artist, "venus")).toBe(false);
  });

  it("an expired collaborator is denied even if the vault is in their list", () => {
    const editor = makeCollaborator({
      name: "E",
      role: "editor",
      vaultAccess: ["venus"],
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(canCollaboratorAccess(editor, "venus")).toBe(false);
  });
});

describe("canLockboxAccess", () => {
  it("co-owner bypasses lockbox grants entirely", () => {
    const coOwner = makeCollaborator({ name: "D", role: "co-owner", lockboxGrants: [] });
    expect(canLockboxAccess(coOwner, "lockbox_janet")).toBe(true);
  });

  it("non-co-owner needs the lockboxId explicitly in lockboxGrants", () => {
    const editor = makeCollaborator({
      name: "E",
      role: "editor",
      lockboxGrants: ["lockbox_janet"],
    });
    expect(canLockboxAccess(editor, "lockbox_janet")).toBe(true);
    expect(canLockboxAccess(editor, "lockbox_erikah")).toBe(false);
  });

  it("handles a missing lockboxGrants field without throwing", () => {
    const editor = { role: "editor", isActive: true };
    expect(canLockboxAccess(editor, "lockbox_janet")).toBe(false);
  });

  it("denies an inactive collaborator regardless of role", () => {
    const coOwner = makeCollaborator({ name: "D", role: "co-owner" });
    coOwner.isActive = false;
    expect(canLockboxAccess(coOwner, "lockbox_janet")).toBe(false);
  });
});

describe("memberToCollaborator", () => {
  it("maps tier A to co-owner", () => {
    expect(memberToCollaborator({ id: 1, name: "D", tier: "A" }).role).toBe("co-owner");
  });

  it("maps tier C to featured-artist", () => {
    expect(memberToCollaborator({ id: 1, name: "F", tier: "C" }).role).toBe("featured-artist");
  });

  it("maps any other tier (including missing) to editor", () => {
    expect(memberToCollaborator({ id: 1, name: "X", tier: "B" }).role).toBe("editor");
    expect(memberToCollaborator({ id: 1, name: "X", tier: "G" }).role).toBe("editor");
    expect(memberToCollaborator({ id: 1, name: "X" }).role).toBe("editor");
  });

  it("includes the member's planet in vaultAccess when present", () => {
    const collab = memberToCollaborator({ id: 1, name: "X", tier: "A", planet: "venus" });
    expect(collab.vaultAccess).toEqual(["venus"]);
    expect(collab.planet).toBe("venus");
  });

  it("vaultAccess is empty when the member has no planet", () => {
    expect(memberToCollaborator({ id: 1, name: "X", tier: "A" }).vaultAccess).toEqual([]);
  });

  it("defaults grantedBy to 'D' when createdBy is absent", () => {
    expect(memberToCollaborator({ id: 1, name: "X", tier: "A" }).grantedBy).toBe("D");
  });

  it("preserves grantedBy when createdBy is present", () => {
    expect(
      memberToCollaborator({ id: 1, name: "X", tier: "A", createdBy: "L" }).grantedBy,
    ).toBe("L");
  });

  it("carries the original member id forward as legacyId", () => {
    expect(memberToCollaborator({ id: 42, name: "X", tier: "A" }).legacyId).toBe(42);
  });
});

describe("listenerToCollaborator", () => {
  it("always assigns the 'listener' role with the universal 0000 code", () => {
    const collab = listenerToCollaborator({ id: 7, name: "Guest" });
    expect(collab.role).toBe("listener");
    expect(collab.code).toBe("0000");
  });

  it("has no per-vault access — listeners get access via the global code, not vaultAccess", () => {
    expect(listenerToCollaborator({ id: 7, name: "Guest" }).vaultAccess).toEqual([]);
  });

  it("carries the original listener id forward as legacyId", () => {
    expect(listenerToCollaborator({ id: 7, name: "Guest" }).legacyId).toBe(7);
  });
});

describe("migrateToCollaborators", () => {
  it("combines members and listeners into a single collaborator list", () => {
    const result = migrateToCollaborators(
      [{ id: 1, name: "D", tier: "A" }],
      [{ id: 2, name: "Guest" }],
    );
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("co-owner");
    expect(result[1].role).toBe("listener");
  });

  it("handles null or undefined members/listeners without throwing", () => {
    expect(migrateToCollaborators(null, undefined)).toEqual([]);
    expect(migrateToCollaborators(undefined, null)).toEqual([]);
  });

  it("returns an empty array when both lists are empty", () => {
    expect(migrateToCollaborators([], [])).toEqual([]);
  });
});

describe("ROLE_TO_TIER mapping", () => {
  it("maps every collaborator role to a tier letter", () => {
    for (const role of COLLABORATOR_ROLES) {
      expect(ROLE_TO_TIER[role]).toBeTruthy();
    }
  });

  it("co-owner maps to tier A (full access)", () => {
    expect(ROLE_TO_TIER["co-owner"]).toBe("A");
  });
});
