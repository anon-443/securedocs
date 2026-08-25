import { afterEach, describe, expect, it, vi } from "vitest";
import { secureDocsApi, secureDocsApiBase } from "./securedocsApi";

describe("SecureDocs API client", () => {
  it("uses a versioned API base path", () => {
    expect(secureDocsApiBase).toContain("/api/v1");
  });

  it("requests the protected administration user list from the versioned endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await secureDocsApi.users();

    expect(fetchMock).toHaveBeenCalledWith(`${secureDocsApiBase}/users`, expect.objectContaining({ credentials: "include" }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
