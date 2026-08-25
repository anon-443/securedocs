import { describe, expect, it } from "vitest";
import { secureDocsApiBase } from "./securedocsApi";

describe("SecureDocs API client", () => {
  it("uses a versioned API base path", () => {
    expect(secureDocsApiBase).toContain("/api/v1");
  });
});
