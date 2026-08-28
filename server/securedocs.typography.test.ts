import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceStyles = readFileSync(resolve(process.cwd(), "client/src/components/secureDocs.css"), "utf8");

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
