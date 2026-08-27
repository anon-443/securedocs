import { describe, expect, it } from "vitest";

import { getOneTimeToken } from "./authLink";

describe("one-time authentication links", () => {
  it("reads a supplied token without accepting blank or oversized values", () => {
    expect(getOneTimeToken("?token=verified-token")).toBe("verified-token");
    expect(getOneTimeToken("?token=%20%20")).toBeNull();
    expect(getOneTimeToken(`?token=${"a".repeat(513)}`)).toBeNull();
  });
});
