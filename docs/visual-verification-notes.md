# Visual Verification Notes

**Checked:** 2026-08-25  
**Routes:** Dashboard (`/`) and public verification (`/verify/:reference`)

The desktop dashboard was verified as a responsive enterprise security interface with a dark navy navigation rail, calm white audit-card surfaces, teal authenticity signals, document registry, QR verification panel, security summary, and immutable activity stream. The local preview communicates clearly that live document and role data load only after the FastAPI session is available.

The public verifier was refined to share the same SecureDocs navy-and-teal material system, shield mark, reference-code emphasis, privacy reassurance, and certificate-like spacing. In a preview environment without the FastAPI verifier running, it displays a styled service-unavailable state rather than exposing data. With the FastAPI deployment configured, the same page displays the privacy-minimal verification result and provides a user-triggered printable view.

At a 375 px mobile viewport, the navigation rail collapses cleanly, the role selector remains reachable, the upload action becomes full width, and summary metrics reflow into a single readable column without horizontal overflow.

The redesigned landing page was checked at desktop and 375 px mobile widths. It maintains a strong first-screen hierarchy, keeps primary access actions visible, and uses navy, teal, mint, audit-code, and verification motifs consistently. The mobile sign-in surface now inherits the dark system across the entire viewport without the former white outer margin.

The rebuilt landing page was reviewed at desktop width. The replacement resolves the earlier oversized dead zones and crowded generic card treatment with a compact editorial grid, evidence-ledger hero, technical labels, and structured intake-to-proof narrative. The next interface pass should extend this forensic ledger motif into the operational workspace rather than repeating generic dashboard cards.

The rebuilt landing, workspace, sign-in, and public verification screens were also checked at 375 px. The landing hierarchy and two actions remain visible without horizontal overflow, the workspace summary reflows to one column with a full-width primary action, and dark surfaces remain continuous across the sign-in flow. The public verification fallback remains visually clear while the FastAPI service is unavailable locally; its error copy was adjusted for readable separation without terminal punctuation.

The dedicated Review Queue, Verification, Audit, and Security panels were opened through direct workspace panel links and reviewed at desktop width. Each panel shows its distinct custody-focused hierarchy, role-appropriate metrics, and a truthful empty or preview state when the FastAPI service has not been started locally. The Review Queue additionally displays its pending-format filter and review actions.

The review confirmed that no user reviews, ratings, or testimonials are displayed anywhere in the interface.

The refined landing hero was checked at 1440 px desktop and 390 px mobile widths. The evidence ledger now uses a larger, right-weighted card with aligned label/value rows, readable technical metadata, and a coherent proof-chain footer. The hero headline now has two intentional desktop lines and reflows naturally on mobile without oversized empty zones or awkward word breaks.

After the requested scale adjustment, the desktop evidence card was reduced to a compact, balanced footprint while retaining the aligned record fields, readable values, and proof-chain treatment.

The reduced card was also verified at 390 px mobile width. It remains within the viewport, its title and seal retain clear separation, and the visible proof metadata stays aligned and legible without horizontal overflow.

The workspace refinement was checked at 1440 × 1000. The desktop sidebar uses sticky positioning and remained aligned at the viewport top after the main workspace was scrolled. Navigation labels and icons, the workspace identity card, the assistance card, and the account identity block now carry stronger contrast and more deliberate scale. The top controls also now label the three roles as **View as**, making the control's preview purpose clear.

The same workspace was checked at 390 × 844. The sidebar is intentionally hidden at this breakpoint, while the stronger heading, primary upload action, role controls, metrics, registry, verification panel, and control-center panel remain readable in a one-column layout.

The revised workspace was also checked on the published SecureDocs domain after the latest automatic publication. The live page shows the new workspace identity treatment and role-preview label, and browser inspection confirmed that the published sidebar uses sticky positioning and remains fixed while the workspace scrolls.

The published workspace was additionally captured at a real `390 × 844` mobile browser viewport. The desktop sidebar is absent as intended, and the mobile top controls, heading, upload action, and first workspace metric remain legible with no horizontal overflow.

**Post-publication record — 2026-08-27:** The `390 × 844` capture was made against `https://securedocs-nl6ubzst.manus.space/workspace`, not the local preview. It confirms the deployed mobile workspace preserves the dark evidence-custody style, removes the desktop rail at the correct breakpoint, and keeps the primary upload action visibly prominent.

**Direct mobile inspection — 2026-08-27:** The live `390 × 844` capture was visually inspected. It shows the compact Admin/Manager/Employee control at the top, no desktop sidebar, a readable `Document intelligence, protected` heading, the high-contrast `Upload document` button, a visible preview-mode status strip, and the first metric card without horizontal overflow. The visible metric is still fading in from the intentionally brief page-entry animation; this is not a rendering defect.

**Measured live mobile verification — 2026-08-27:** A Playwright browser opened the published workspace at `390 × 844` after network idle and a 900 ms settle period. The rendered DOM reported a `390 px` document scroll width at a `390 px` viewport, three role-preview buttons, a `50 px`-high `Upload document` control, the expected heading, and `display: none` for the desktop sidebar. The accompanying rendered capture visibly confirms the role control, high-contrast upload action, preview-mode status strip, and first two metrics in the intended mobile layout.

**Top-bar refinement — 2026-08-27:** Desktop and mobile screenshots confirm the breadcrumb, role controls, and notification button are larger and clearer. The main workspace now begins directly beneath the top bar with a compact, intentional margin rather than the previous oversized blank strip. At the mobile breakpoint, the controls reduce in size without clipping or horizontal overflow.

**Published top-bar check — 2026-08-27:** Direct captures of `https://securedocs-nl6ubzst.manus.space/workspace` at `1440 × 820` and `390 × 844` confirm the revised layout is live. Desktop shows the larger breadcrumb, View as role control, notification button, and reduced gap before the heading. Mobile keeps the compact role control and starts the heading immediately beneath the top bar without the oversized empty space.

**Published top-bar measurements — 2026-08-27:** After rollout completion, a real browser measured the public desktop bar at `82 px` high, with a `15 px` breadcrumb, `40 px` role buttons at `13 px` text, and a `44 px` notification control. The heading begins `47 px` below the bar. At `390 × 844`, the bar is `58 px` high, the breadcrumb is intentionally hidden, the compact role buttons are `28 px` high at `9 px` text, and the heading begins `45 px` below the bar. These values confirm stronger desktop prominence without compromising mobile space.

**Workspace readability pass — 2026-08-28:** The workspace typography was increased across metric labels and values, document rows, status pills, search and filter controls, notices, verification details, security copy, audit activity, and profile or review controls. A `1440 × 1024` desktop check confirmed stronger operational hierarchy with the fixed sidebar preserved. A `390 × 844` mobile check confirmed the compact layout remains readable, retains the intentionally hidden desktop rail, and has no horizontal overflow.

**Published typography check — 2026-08-28:** After the production rollout, the live desktop workspace measured `14 px` metric-label text and `13 px` audit-activity text, with the desktop rail still using sticky positioning. The normal health route returned `200`; the temporary configuration diagnostic no longer returned its prior configuration payload. A separate Chromium capture at the published `390 × 844` mobile viewport confirmed the larger heading, supporting copy, full-width upload action, notice, and metric typography remain readable in the sidebar-free mobile layout.

**Landing readability pass — 2026-08-28:** The landing header was increased to a `23 px` desktop wordmark, `15 px` navigation and sign-in text, and a `50 px` primary workspace control. The four-part trust strip now uses an `18 px` introduction, `15 px` item titles, and `13 px` supporting copy. Desktop and `390 × 844` mobile captures confirm the enlarged text remains single-line or naturally wraps without clipping.
