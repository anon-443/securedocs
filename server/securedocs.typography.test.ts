import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceStyles = readFileSync(resolve(process.cwd(), "client/src/components/secureDocs.css"), "utf8");
const landingStyles = readFileSync(resolve(process.cwd(), "client/src/pages/landing.css"), "utf8");

describe("SecureDocs workspace typography", () => {
  it("keeps the operational dashboard text at the enlarged readable scale", () => {
    expect(workspaceStyles).toMatch(/\.metric-label\{[^}]*font-size:14px/);
    expect(workspaceStyles).toMatch(/\.document-name strong\{font-size:14px/);
    expect(workspaceStyles).toMatch(/\.activity-list p\{font-size:13px/);
    expect(workspaceStyles).toMatch(/\.table-owner,\.table-muted\{font-size:13px/);
  });

  it("keeps a compact but legible mobile typography fallback", () => {
    expect(workspaceStyles).toContain("@media(max-width:520px){.dashboard-heading p:not(.eyebrow){font-size:14px}");
    expect(workspaceStyles).toContain(".activity-list p{font-size:12px}");
  });
});

describe("SecureDocs landing typography", () => {
  it("keeps header and feature-strip content at the requested larger desktop scale", () => {
    expect(landingStyles).toContain(".sd-brand{gap:13px;font-size:23px}");
    expect(landingStyles).toContain(".sd-landing-nav nav a{font-size:15px;font-weight:600}");
    expect(landingStyles).toContain(".sd-trust-intro{padding-right:42px;font-size:18px;line-height:1.45}");
    expect(landingStyles).toContain(".sd-trust-item strong{font-size:15px");
    expect(landingStyles).toContain(".sd-trust-item small{margin-top:5px;font-size:13px");
  });

  it("keeps the landing text responsive at the small mobile breakpoint", () => {
    expect(landingStyles).toContain("@media(max-width:560px){.sd-brand{font-size:19px}");
    expect(landingStyles).toContain(".sd-trust-intro{font-size:16px;line-height:1.45}");
  });
});
