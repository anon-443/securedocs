import { describe, expect, it } from "vitest";

import { isFastApiRoute } from "./fastapi";

describe("FastAPI proxy route selection", () => {
  it("routes the versioned API, docs, and health probes to the internal FastAPI service", () => {
    expect(isFastApiRoute("/api/v1/auth/login")).toBe(true);
    expect(isFastApiRoute("/docs")).toBe(true);
    expect(isFastApiRoute("/health/database")).toBe(true);
  });

  it("does not proxy React pages or the existing Node application API", () => {
    expect(isFastApiRoute("/workspace")).toBe(false);
    expect(isFastApiRoute("/api/trpc/auth.me")).toBe(false);
  });
});
