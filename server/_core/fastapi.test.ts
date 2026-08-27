import { describe, expect, it } from "vitest";

import { getFastApiInternalPort, isFastApiRoute, shouldStartFastApiSidecar } from "./fastapi";

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

  it("keeps the development sidecar away from the managed preview port", () => {
    expect(getFastApiInternalPort("development")).toBe(8100);
    expect(getFastApiInternalPort("production")).toBe(8000);
  });

  it("keeps the sidecar out of the managed preview unless local integration testing is requested", () => {
    expect(shouldStartFastApiSidecar("development", undefined)).toBe(false);
    expect(shouldStartFastApiSidecar("development", "true")).toBe(true);
    expect(shouldStartFastApiSidecar("production", undefined)).toBe(true);
  });
});
