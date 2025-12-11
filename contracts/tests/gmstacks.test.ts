import { Cl, ClarityType } from "@stacks/transactions";
import { describe, it, expect } from "vitest";

const accounts = simnet.getAccounts();
const user1 = accounts.get("wallet_1")!;

describe("gmstacks contract (streak)", () => {
  it("allows first-time checkin and stores full stats", () => {
    const result = simnet.callPublicFn(
      "gmstacks",
      "checkin",
      [],
      user1
    );

    expect(result.result).toHaveClarityType(ClarityType.ResponseOk);
    const okVal = (result.result as any).value;
    expect(okVal.type).toBe(ClarityType.Tuple);

    const resTuple = okVal.value as Record<string, any>;
    expect(resTuple["total"]).toEqual(Cl.uint(1));
    expect(resTuple["streak"]).toEqual(Cl.uint(1));
    expect(resTuple["last-time"].type).toBe(ClarityType.UInt);
    expect(resTuple["last-day"].type).toBe(ClarityType.UInt);

    const stored = simnet.callReadOnlyFn(
      "gmstacks",
      "get-user-checkin",
      [Cl.standardPrincipal(user1)],
      user1
    );

    expect(stored.result).toHaveClarityType(ClarityType.OptionalSome);
    const someVal = (stored.result as any).value;
    expect(someVal.type).toBe(ClarityType.Tuple);

    const tuple = someVal.value as Record<string, any>;
    expect(tuple["total"]).toEqual(Cl.uint(1));
    expect(tuple["streak"]).toEqual(Cl.uint(1));
    expect(tuple["last-time"].type).toBe(ClarityType.UInt);
    expect(tuple["last-day"].type).toBe(ClarityType.UInt);
  });

  it("rejects second checkin within 24h window", () => {
    const first = simnet.callPublicFn(
      "gmstacks",
      "checkin",
      [],
      user1
    );
    expect(first.result).toHaveClarityType(ClarityType.ResponseOk);

    const second = simnet.callPublicFn(
      "gmstacks",
      "checkin",
      [],
      user1
    );

    expect(second.result).toHaveClarityType(ClarityType.ResponseErr);
    expect(second.result).toBeErr(Cl.uint(1000));
  });

  it("increases total and streak after 24h (no skip)", () => {
    const first = simnet.callPublicFn(
      "gmstacks",
      "checkin",
      [],
      user1
    );
    expect(first.result).toHaveClarityType(ClarityType.ResponseOk);

    // Naikkan waktu secukupnya: lebih besar dari 1 hari, tapi tidak terlalu jauh
    // Angka 150 burn blocks diasumsikan cukup untuk > 86400 detik di simnet ini.
    simnet.mineEmptyBurnBlocks(150);

    const second = simnet.callPublicFn(
      "gmstacks",
      "checkin",
      [],
      user1
    );

    expect(second.result).toHaveClarityType(ClarityType.ResponseOk);
    const okVal = (second.result as any).value;
    expect(okVal.type).toBe(ClarityType.Tuple);

    const resTuple = okVal.value as Record<string, any>;
    expect(resTuple["total"]).toEqual(Cl.uint(2));
    expect(resTuple["streak"]).toEqual(Cl.uint(2));

    const stored = simnet.callReadOnlyFn(
      "gmstacks",
      "get-user-checkin",
      [Cl.standardPrincipal(user1)],
      user1
    );

    expect(stored.result).toHaveClarityType(ClarityType.OptionalSome);
    const someVal = (stored.result as any).value;
    const tuple = someVal.value as Record<string, any>;

    expect(tuple["total"]).toEqual(Cl.uint(2));
    expect(tuple["streak"]).toEqual(Cl.uint(2));
  });

  it("resets streak if user skips more than one day", () => {
    simnet.callPublicFn("gmstacks", "checkin", [], user1);

    // Jauh lebih lama dari satu hari → seharusnya dianggap skip dan streak reset
    simnet.mineEmptyBurnBlocks(4000);

    const second = simnet.callPublicFn(
      "gmstacks",
      "checkin",
      [],
      user1
    );

    expect(second.result).toHaveClarityType(ClarityType.ResponseOk);
    const okVal = (second.result as any).value;
    const resTuple = okVal.value as Record<string, any>;

    expect(resTuple["total"]).toEqual(Cl.uint(2));
    expect(resTuple["streak"]).toEqual(Cl.uint(1));
  });
});
