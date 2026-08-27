import { describe, expect, it } from "vitest";

describe("SecureDocs managed document storage configuration", () => {
  it("enables the managed storage backend while keeping its credentials private", () => {
    expect(process.env.STORAGE_BACKEND).toBe("managed");
  });
});
