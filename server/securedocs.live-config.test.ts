import { describe, expect, it } from "vitest";

const liveOrigin = "https://securedocs-nl6ubzst.manus.space";

describe("SecureDocs live configuration", () => {
  it("uses HTTPS-only cookies and the published public-link destinations", async () => {
    expect(process.env.APP_ENV).toBe("production");
    expect(process.env.COOKIE_SECURE).toBe("true");
    expect(process.env.FRONTEND_ORIGINS).toBe(liveOrigin);
    expect(process.env.PUBLIC_VERIFICATION_BASE_URL).toBe(`${liveOrigin}/verify`);
    expect(process.env.EMAIL_VERIFICATION_FRONTEND_URL).toBe(`${liveOrigin}/verify-email`);
    expect(process.env.PASSWORD_RESET_FRONTEND_URL).toBe(`${liveOrigin}/reset-password`);

    const response = await fetch(`${liveOrigin}/health`);
    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toMatchObject({ status: "ok", service: "securedocs-api" });
  });
});
