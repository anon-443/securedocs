import { describe, expect, it } from "vitest";

describe("SecureDocs PostgreSQL configuration", () => {
  it("has a private PostgreSQL connection string for the FastAPI service", () => {
    const databaseUrl = process.env.SECUREDOCS_DATABASE_URL;

    expect(databaseUrl).toMatch(/^postgres(?:ql)?:\/\//);
    expect(databaseUrl).toContain("@");
  });
});
