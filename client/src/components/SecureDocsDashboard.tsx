import { Button } from "@/components/ui/button";
import { useSecureDocsData } from "@/hooks/useSecureDocsData";
import { documentActions, uploadSecureDocument, userActions, type SecureDocsActivity, type SecureDocsUser } from "@/lib/securedocsApi";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import "./secureDocs.css";

type Role = "Admin" | "Manager" | "Employee";

const roleLabels: Record<"admin" | "manager" | "employee", Role> = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};

const navigationByRole: Record<Role, { label: string; icon: typeof LayoutDashboard; active?: boolean }[]> = {
  Admin: [
    { label: "Overview", icon: LayoutDashboard, active: true },
    { label: "Documents", icon: FolderOpen },
    { label: "Verification", icon: FileCheck2 },
    { label: "Users & roles", icon: UsersRound },
    { label: "Audit activity", icon: Activity },
    { label: "Security center", icon: ShieldCheck },
  ],
  Manager: [
    { label: "Overview", icon: LayoutDashboard, active: true },
    { label: "Review queue", icon: FileCheck2 },
    { label: "Documents", icon: FolderOpen },
    { label: "Verification", icon: QrCode },
    { label: "Activity", icon: Activity },
  ],
  Employee: [
    { label: "My workspace", icon: LayoutDashboard, active: true },
    { label: "My documents", icon: FolderOpen },
    { label: "Upload document", icon: Upload },
    { label: "Verification reports", icon: FileCheck2 },
    { label: "Security settings", icon: KeyRound },
  ],
};

const roleDescriptions: Record<Role, string> = {
  Admin: "Organization-wide visibility, user governance, audit evidence, and security alerts",
  Manager: "Review and decide pending documents, then issue authentic verification records",
  Employee: "Upload and track documents you own, with secure access to approved verification reports",
};

function StatusPill({ tone, children }: { tone: string; children: string }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}

function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  trend: string;
  icon: typeof FileText;
  accent: "blue" | "mint" | "amber" | "violet";
}) {
  return (
    <section className="metric-card">
      <div className={`metric-icon metric-icon--${accent}`}><Icon size={18} strokeWidth={2.25} /></div>
      <p className="metric-label">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <strong className="metric-value">{value}</strong>
        <span className="metric-trend">{trend}</span>
      </div>
    </section>
  );
}

export default function SecureDocsDashboard() {
  const { activity: apiActivity, alerts, categories, connected, documents: apiDocuments, error: apiError, loading, myActivity, overview, user, users } = useSecureDocsData();
  const [previewRole, setPreviewRole] = useState<Role>("Admin");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeNav, setActiveNav] = useState(() => new URLSearchParams(window.location.search).get("panel") || "Overview");
  const [notice, setNotice] = useState("");
  const [forbidden, setForbidden] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [actingOnDocument, setActingOnDocument] = useState<string | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!uploadOpen) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setUploadOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("keydown", closeOnEscape); returnFocusRef.current?.focus(); };
  }, [uploadOpen]);

  const role: Role = user ? roleLabels[user.role] : previewRole;
  const liveDocuments = useMemo(
    () => apiDocuments.map((document) => ({
      id: document.id.slice(0, 8).toUpperCase(),
      name: document.title,
      type: document.content_type.split("/").at(-1)?.toUpperCase() || "FILE",
      owner: document.owner_user_id === user?.id ? "You" : "Authorized owner",
      updated: new Date(document.updated_at).toLocaleDateString(),
      status: document.status === "pending_review" ? "Pending review" : document.status[0].toUpperCase() + document.status.slice(1),
      statusTone: document.status === "approved" ? "approved" : document.status === "pending_review" ? "pending" : "revision",
      apiId: document.id,
      categoryId: document.category_id,
    })),
    [apiDocuments, user?.id],
  );
  const visibleDocuments = liveDocuments;

  const liveActivity = apiActivity.map((event) => ({
    id: event.id,
    title: event.event_type.replaceAll(".", " "),
    detail: `${event.outcome} · ${new Date(event.created_at).toLocaleString()}`,
    outcome: event.outcome,
    tone: event.outcome === "failure" ? "security" : "verified",
  }));

  const filteredDocuments = useMemo(
    () => visibleDocuments.filter((document) => document.name.toLowerCase().includes(search.toLowerCase()) && (categoryFilter === "all" || ("categoryId" in document && document.categoryId === categoryFilter))),
    [categoryFilter, search, visibleDocuments],
  );
  const isOverview = activeNav === "Overview" || activeNav === "My workspace";
  const pendingReviewItems = visibleDocuments.filter((document) => document.status === "Pending review").map((document) => ({ id: "apiId" in document ? document.apiId : null, label: document.name, owner: document.owner, type: document.type }));
  const verifiedItems = visibleDocuments.filter((document) => document.status === "Approved").map((document) => ({ id: document.id, label: document.name, reference: `SD-${document.apiId.slice(0, 8).toUpperCase()}` }));

  const setRoleContext = (nextRole: Role) => {
    if (user) {
      setNotice("Your live dashboard role is assigned by the SecureDocs API and cannot be changed in the browser");
      return;
    }
    setPreviewRole(nextRole);
    setActiveNav(nextRole === "Employee" ? "My workspace" : "Overview");
    setNotice(`${nextRole} permissions preview enabled`);
  };

  async function submitUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFile) { setUploadError("Choose a PDF, DOCX, JPG, PNG, or WEBP file first"); return; }
    setUploading(true); setUploadError("");
    try {
      await uploadSecureDocument({ file: uploadFile, title: uploadTitle, description: uploadDescription });
      setUploadOpen(false); setUploadFile(null); setUploadTitle(""); setUploadDescription("");
      setNotice("Document submitted securely for manager review — Refresh the workspace to show the new record");
    } catch (requestError) {
      setUploadError(requestError instanceof Error ? requestError.message : "The document could not be uploaded");
    } finally { setUploading(false); }
  }

  async function handleDocumentAction(id: string, action: "preview" | "download" | "edit" | "delete" | "approve" | "reject", currentTitle?: string) {
    if (!user) { setForbidden("Sign in with a verified SecureDocs account to perform document actions"); return; }
    if (action === "preview") { window.open(documentActions.previewUrl(id), "_blank", "noopener,noreferrer"); return; }
    if (action === "download") { window.open(documentActions.downloadUrl(id), "_blank", "noopener,noreferrer"); return; }
    if (action === "edit") {
      const title = window.prompt("Update document title", currentTitle);
      if (!title || title.trim() === currentTitle) return;
      setActingOnDocument(id);
      try { await documentActions.update(id, { title: title.trim() }); setNotice("Document title updated and audit event recorded"); }
      catch (requestError) { setNotice(requestError instanceof Error ? requestError.message : "The document could not be updated"); }
      finally { setActingOnDocument(null); }
      return;
    }
    if (action === "delete" && !window.confirm("Delete this document? The record will be soft-deleted and the action audited")) return;
    setActingOnDocument(id);
    try {
      if (action === "delete") await documentActions.remove(id);
      else await documentActions.review(id, action === "approve" ? "approved" : "rejected");
      setNotice(action === "delete" ? "Document deleted and audit event recorded" : `Document ${action === "approve" ? "approved" : "rejected"} — Refresh to load the latest registry`);
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "The document action could not be completed");
    } finally { setActingOnDocument(null); }
  }

  async function handleRoleChange(userId: string, nextRole: "admin" | "manager" | "employee") {
    try {
      await userActions.changeRole(userId, nextRole);
      setNotice("Role assignment recorded in the access audit");
    } catch (requestError) {
      setForbidden(requestError instanceof Error ? requestError.message : "You do not have permission to change this role");
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!user) { setForbidden("Sign in with a verified SecureDocs account to update your profile image"); return; }
    try {
      await userActions.uploadAvatar(file);
      setNotice("Profile image uploaded with validated file handling");
    } catch (requestError) {
      setForbidden(requestError instanceof Error ? requestError.message : "Profile image could not be uploaded");
    }
  }

  async function handlePasswordChange() {
    if (!user) { setForbidden("Sign in with a verified SecureDocs account to change your password"); return; }
    const currentPassword = window.prompt("Enter your current password");
    if (!currentPassword) return;
    const newPassword = window.prompt("Enter a new password with 12 or more characters");
    if (!newPassword) return;
    try {
      await userActions.changePassword(currentPassword, newPassword);
      setNotice("Password changed and the security event was recorded");
    } catch (requestError) {
      setForbidden(requestError instanceof Error ? requestError.message : "Password could not be changed");
    }
  }

  const liveMetrics = overview ? [
    { label: "Total documents", value: String(overview.total_documents), trend: "Live API total", icon: FileText, accent: "blue" as const },
    { label: "Approved records", value: String(overview.approved_documents), trend: "Verified status", icon: CheckCircle2, accent: "mint" as const },
    { label: "Awaiting review", value: String(overview.pending_review_documents), trend: "Current queue", icon: Clock3, accent: "amber" as const },
    { label: user?.role === "admin" ? "Security alerts" : "Workspace state", value: String(overview.unresolved_alerts ?? 0), trend: "Live API signal", icon: AlertTriangle, accent: "violet" as const },
  ] : [];

  return (
    <div className="securedocs-shell">
      <aside className="securedocs-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><ShieldCheck size={23} strokeWidth={2.3} /></div>
          <div><span className="brand-word">secure</span><span className="brand-word brand-word--light">docs</span></div>
        </div>

        <div className="workspace-chip" aria-label="SecureDocs workspace identity">
          <div className="workspace-orb">A</div>
          <div className="min-w-0"><p>{user ? "SecureDocs workspace" : "Workspace preview"}</p><span>Document custody environment</span></div>
        </div>

        <nav aria-label="Workspace navigation" className="nav-stack">
          <p className="sidebar-label">Workspace</p>
          {navigationByRole[role].map(({ label, icon: Icon }) => (
            <button
              className={`nav-item ${activeNav === label ? "nav-item--active" : ""}`}
              key={label}
              onClick={() => { setActiveNav(label); setNotice(""); }}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="support-card" onClick={() => setNotice("Security help center is available in the production application") }>
            <CircleHelp size={17} />
            <div><strong>Need assistance?</strong><span>View security guidance</span></div>
          </button>
          <button className="profile-card" onClick={() => { setActiveNav("Profile"); setNotice(""); }}>
            <div className="avatar-ring">{(user?.full_name || "?").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0 text-left"><strong>{user?.full_name || "Not signed in"}</strong><span>{user ? `${role} account` : "Sign in to continue"}</span></div>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      <main className="securedocs-main">
        <header className="topbar">
          <div className="crumb"><span>SecureDocs</span><span className="crumb-divider">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <div className="role-switcher" aria-label="Role preview controls">
              <span className="role-switcher-label">View as</span>
              {(["Admin", "Manager", "Employee"] as Role[]).map((roleOption) => (
                <button key={roleOption} onClick={() => setRoleContext(roleOption)} className={role === roleOption ? "role-active" : ""}>{roleOption}</button>
              ))}
            </div>
            <button className="icon-button" aria-label="Notifications" onClick={() => setNotice("No new security notifications") }><Bell size={18} /></button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-heading">
            <div>
              <p className="eyebrow">{user ? `${role} · live API session` : `${role} workspace · local preview`}</p>
              <h1>{user && role === "Employee" ? `Welcome, ${user.full_name}` : "Document intelligence, protected"}</h1>
              <p>{roleDescriptions[role]}</p>
            </div>
            <Button className="upload-button" onClick={() => user ? setUploadOpen(true) : setForbidden("Sign in with a verified SecureDocs account before uploading a document") }>
              <Plus size={17} /> Upload document
            </Button>
          </section>

          {(notice || loading) && <div className="notice-bar" role="status"><CheckCircle2 size={16} /><span>{notice || "Checking the SecureDocs API session"}</span><button onClick={() => setNotice("")}>{notice ? "Dismiss" : "Working"}</button></div>}
          {forbidden && <div className="forbidden-banner" role="alert"><LockKeyhole size={16} /><span>{forbidden}</span><button onClick={() => setForbidden("")}>Dismiss</button></div>}

          {!loading && !user && <div className="preview-banner"><ShieldCheck size={16} /><span>{connected && !apiError ? "The API is reachable — Sign in through the FastAPI auth flow to load your assigned permissions" : "Preview mode — Start the FastAPI service and sign in to load live role permissions and documents"}</span><a href="/sign-in">Sign in</a></div>}

          {isOverview ? <>
          <section className="metrics-grid" aria-label="Workspace summary">
            {liveMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
          </section>

          <section className="work-grid">
            <div className="panel panel--documents">
              <div className="panel-heading">
                <div><p className="panel-kicker">Document registry</p><h2>Recent documents</h2></div>
                <button className="text-button" onClick={() => setNotice("The documents index uses category, status, and full-text filters")}>View all <ArrowUpRight size={15} /></button>
              </div>
              <div className="document-toolbar">
                <label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" aria-label="Search documents" /></label>
                <label className="filter-button"><SlidersHorizontal size={16} /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              </div>
              <div className="documents-table" role="table" aria-label="Recent documents">
                <div className="table-row table-head" role="row"><span>Document</span><span>Owner</span><span>Updated</span><span>Status</span><span></span></div>
                {filteredDocuments.map((document) => (
                  <div className="table-row" role="row" key={document.id}>
                    <div className="document-name"><div className="file-badge"><FileText size={16} /></div><div><strong>{document.name}</strong><span>{document.id} · {document.type}</span></div></div>
                    <span className="table-owner">{document.owner}</span><span className="table-muted">{document.updated}</span><StatusPill tone={document.statusTone}>{document.status}</StatusPill>
                    <div className="row-actions">
                      {"apiId" in document ? <>
                        <button disabled={actingOnDocument === document.apiId} title="Preview" aria-label={`Preview ${document.name}`} onClick={() => handleDocumentAction(document.apiId, "preview")}><Eye size={15} /></button>
                        <button disabled={actingOnDocument === document.apiId} title="Download" aria-label={`Download ${document.name}`} onClick={() => handleDocumentAction(document.apiId, "download")}><Download size={15} /></button>
                        {(user?.role === "admin" || document.owner === "You") && <button disabled={actingOnDocument === document.apiId} title="Edit title" aria-label={`Edit ${document.name}`} onClick={() => handleDocumentAction(document.apiId, "edit", document.name)}><Pencil size={14} /></button>}
                        {(user?.role === "admin" || user?.role === "manager") && document.status === "Pending review" && <><button disabled={actingOnDocument === document.apiId} title="Approve" aria-label={`Approve ${document.name}`} onClick={() => handleDocumentAction(document.apiId, "approve")}><CheckCircle2 size={15} /></button><button disabled={actingOnDocument === document.apiId} title="Reject" aria-label={`Reject ${document.name}`} onClick={() => handleDocumentAction(document.apiId, "reject")}><Archive size={15} /></button></>}
                        {(user?.role === "admin" || document.owner === "You") && <button disabled={actingOnDocument === document.apiId} title="Delete" aria-label={`Delete ${document.name}`} onClick={() => handleDocumentAction(document.apiId, "delete")}><Trash2 size={15} /></button>}
                      </> : null}
                    </div>
                  </div>
                ))}
                {!loading && filteredDocuments.length === 0 && <div className="empty-documents" role="status"><FileText size={18} /><p><strong>No matching documents</strong><span>Adjust your search or category filter</span></p></div>}
              </div>
            </div>

            <div className="side-panels">
              <section className="verification-card">
                <div className="verification-top"><div><p className="panel-kicker">Authenticity verification</p><h2>Verify with confidence</h2></div><div className="verified-orb"><ShieldCheck size={20} /></div></div>
                <p>Every approved document receives an immutable reference code and a QR-linked public verification record</p>
                {verifiedItems[0] ? <><div className="verification-code"><div className="qr-grid"><QrCode size={46} strokeWidth={1.7} /></div><div><span>REFERENCE CODE</span><strong>{verifiedItems[0].reference}</strong><em>Approved · from your records</em></div></div><a className="verify-link" href={`/verify/${verifiedItems[0].reference}`}>Open verification record <ArrowUpRight size={15} /></a></> : <div className="empty-documents" role="status"><QrCode size={18} /><p><strong>No approved documents yet</strong><span>Approved records will appear here with their verification code</span></p></div>}
              </section>

              <section className="security-card">
                <div className="panel-heading"><div><p className="panel-kicker">Security signal</p><h2>Control center</h2></div><LockKeyhole size={19} /></div>
                {user ? <><div className="security-score"><div><strong>{Math.max(0, 100 - alerts.length * 8)}</strong><span>/100</span></div><p>{alerts.length} unresolved alerts</p></div><div className="security-progress"><span style={{ width: `${Math.max(0, 100 - alerts.length * 8)}%` }} /></div><div className="security-points"><span><CheckCircle2 size={15} /> JWT rotation enabled</span><span><CheckCircle2 size={15} /> {alerts.filter((alert) => alert.severity === "critical").length} critical alerts</span></div></> : <div className="empty-documents" role="status"><LockKeyhole size={18} /><p><strong>Sign in to view security posture</strong><span>Security signals are only loaded from your authenticated account</span></p></div>}
              </section>
            </div>
          </section>

          <section className="panel activity-panel">
            <div className="panel-heading"><div><p className="panel-kicker">Immutable audit trail</p><h2>Recent activity</h2></div><button className="text-button" onClick={() => setNotice("Audit events are append-only and include a tamper-evident hash chain") }>Audit log <ArrowUpRight size={15} /></button></div>
            <div className="activity-list">
              {liveActivity.length > 0 ? liveActivity.slice(0, 5).map((event) => <div key={event.id}><div className={`activity-icon activity-icon--${event.tone}`}><Activity size={16} /></div><p><strong>{event.title}</strong><span>{event.detail}</span></p><StatusPill tone={event.tone === "security" ? "revision" : "approved"}>{event.outcome}</StatusPill></div>) : <div className="empty-documents" role="status"><Activity size={18} /><p><strong>No recent activity</strong><span>Audit events will appear here after activity is recorded</span></p></div>}
            </div>
          </section>
          </> : activeNav === "Review queue" ? <ReviewQueuePanel items={pendingReviewItems} onReview={(id, action) => id ? handleDocumentAction(id, action) : setNotice("Sign in to review live pending records")} /> : activeNav === "Profile" ? <ProfilePanel user={user} activity={myActivity} onAvatarUpload={handleAvatarUpload} onChangePassword={handlePasswordChange} /> : activeNav === "Users & roles" ? <AdministrationPanel users={users} onRoleChange={handleRoleChange} /> : activeNav === "Verification" || activeNav === "Verification reports" ? <VerificationPanel items={verifiedItems} /> : activeNav === "Audit activity" || activeNav === "Activity" ? <AuditPanel activity={apiActivity} /> : activeNav === "Security center" || activeNav === "Security settings" ? <SecurityPanel alerts={alerts} /> : <FocusedWorkspacePanel view={activeNav} role={role} documentCount={visibleDocuments.length} pendingCount={pendingReviewItems.length} alertCount={alerts.length} userName={user?.full_name || "Not signed in"} />}

          {uploadOpen && <div className="upload-overlay" role="presentation"><form onSubmit={submitUpload} className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" aria-describedby="upload-description"><div className="panel-heading"><div><p className="panel-kicker">Secure document intake</p><h2 id="upload-title">Upload for review</h2></div><button type="button" className="text-button" onClick={() => setUploadOpen(false)} autoFocus>Close</button></div><p id="upload-description">Files are validated by FastAPI before private storage and audit logging<br />Accepted types: PDF, DOCX, JPG, PNG, and WEBP</p><label>Document title<input required minLength={2} value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} /></label><label>Document description <span>optional</span><textarea value={uploadDescription} onChange={(event) => setUploadDescription(event.target.value)} /></label><label>Choose file<input required type="file" accept=".pdf,.docx,image/jpeg,image/png,image/webp" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} /></label>{uploadError && <div className="upload-error" role="alert">{uploadError}</div>}<div className="upload-actions"><button type="button" onClick={() => setUploadOpen(false)}>Cancel</button><Button disabled={uploading}>{uploading ? "Validating & uploading" : "Submit for review"}</Button></div></form></div>}
        </div>
      </main>
    </div>
  );
}

function FocusedWorkspacePanel({ view, role, documentCount, pendingCount, alertCount, userName }: { view: string; role: Role; documentCount: number; pendingCount: number; alertCount: number; userName: string }) {
  const panel = (() => {
    if (view === "Review queue") return { eyebrow: "Review protocol", title: "Decide with context", copy: "Open every pending record with its custody details, source context, and prior decision history", metric: `${pendingCount}`, metricLabel: "Awaiting your review", steps: ["Check file and metadata", "Record an approval or revision decision", "Issue a verifiable reference after approval"] };
    if (view === "Verification" || view === "Verification reports") return { eyebrow: "Proof registry", title: "Evidence ready to be checked", copy: "Approved documents receive a minimal public authenticity record without exposing private source material", metric: "82.7%", metricLabel: "Approved records verified", steps: ["Find an approved reference", "Open its verification history", "Share only the public proof link"] };
    if (view === "Users & roles") return { eyebrow: "Access governance", title: "Roles define the limits", copy: "Use explicit Admin, Manager, and Employee responsibilities to keep sensitive operations accountable", metric: "03", metricLabel: "Controlled role groups", steps: ["Review access assignments", "Set the appropriate operational role", "Record sensitive permission changes"] };
    if (view === "Audit activity" || view === "Activity") return { eyebrow: "Immutable ledger", title: "A history that holds its shape", copy: "Every authentication, document, review, and sensitive access event is captured as evidence", metric: "100%", metricLabel: "Sensitive events logged", steps: ["Inspect the latest event chain", "Trace the actor and object", "Escalate unusual activity"] };
    if (view === "Security center" || view === "Security settings") return { eyebrow: "Security signal", title: "Control the conditions", copy: "Monitor session integrity, failed access attempts, and role-sensitive operations in one place", metric: `${alertCount}`, metricLabel: "Unresolved security signals", steps: ["Review alert severity", "Confirm containment action", "Preserve the audit context"] };
    if (view === "Upload document") return { eyebrow: "Secure intake", title: "Start a controlled record", copy: "Upload a valid PDF, DOCX, or image file and give it clear ownership before review begins", metric: `${documentCount}`, metricLabel: "Records in your workspace", steps: ["Choose a supported file", "Add accurate title and description", "Send to the review queue"] };
    return { eyebrow: "Personal workspace", title: `Work with a clear record, ${userName.split(" ")[0]}`, copy: "Your documents, approval outcomes, and available verification evidence stay connected to your workspace", metric: `${documentCount}`, metricLabel: "Documents in scope", steps: ["Track document outcomes", "Keep your account information current", "Open approved verification reports"] };
  })();
  return <section className="focused-panel"><header><div><p className="panel-kicker">{panel.eyebrow}</p><h2>{panel.title}</h2><p>{panel.copy}</p></div><div className="focused-metric"><strong>{panel.metric}</strong><span>{panel.metricLabel}</span></div></header><div className="focused-steps">{panel.steps.map((step, index) => <div key={step}><span>0{index + 1}</span><p>{step}</p><ArrowUpRight size={16} /></div>)}</div><footer><span>{role} workspace</span><span>Evidence protocol active</span></footer></section>;
}

function ReviewQueuePanel({ items, onReview }: { items: { id: string | null; label: string; owner: string; type: string }[]; onReview: (id: string | null, action: "approve" | "reject") => void }) {
  const [format, setFormat] = useState("all");
  const displayedItems = format === "all" ? items : items.filter((item) => item.type === format);
  return <section className="focused-panel review-panel"><header><div><p className="panel-kicker">Review queue</p><h2>Give every decision a record</h2><p>Approve a complete record or return it for revision with the document context intact</p></div><div className="focused-metric"><strong>{displayedItems.length}</strong><span>Pending decisions</span></div></header><div className="queue-filter"><span>Filter pending format</span><select value={format} onChange={(event) => setFormat(event.target.value)} aria-label="Filter review queue by file format"><option value="all">All formats</option><option value="PDF">PDF</option><option value="DOCX">DOCX</option><option value="PNG">PNG</option></select></div><div className="review-list">{displayedItems.length ? displayedItems.map((item) => <article key={item.label}><div className="file-badge"><FileText size={16} /></div><div><strong>{item.label}</strong><span>{item.owner} · {item.type}</span></div><div className="review-actions"><button onClick={() => onReview(item.id, "reject")}>Request revision</button><button onClick={() => onReview(item.id, "approve")}>Approve record</button></div></article>) : <div className="review-empty"><CheckCircle2 size={20} /> No pending records match this filter</div>}</div></section>;
}

function ProfilePanel({ user, activity, onAvatarUpload, onChangePassword }: { user: SecureDocsUser | null; activity: SecureDocsActivity[]; onAvatarUpload: (file: File) => void; onChangePassword: () => void }) {
  return <section className="focused-panel profile-panel"><header><div><p className="panel-kicker">Profile and account</p><h2>{user ? user.full_name : "Your secure identity"}</h2><p>{user ? `${user.email} · ${user.role} role` : "Sign in to view your profile, account activity, and security controls"}</p></div><div className="focused-metric"><strong>{activity.length}</strong><span>Recent account events</span></div></header><div className="profile-grid"><article><span>Account status</span><strong>{user?.email_verified_at ? "Verified email" : "Verification required"}</strong><p>Profile updates and password changes are protected by your secure session</p><button onClick={onChangePassword}>Change password</button></article><article><span>Activity history</span><strong>{activity.length ? activity[0]?.event_type.replaceAll(".", " ") : "No live activity loaded"}</strong><p>{activity.length ? new Date(activity[0].created_at).toLocaleString() : "Connect the API to view personal security history"}</p></article><article><span>Profile image</span><strong>Secure avatar upload</strong><p>Image validation and generated storage keys protect profile media</p><label className="avatar-upload">Choose image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onAvatarUpload(file); }} /></label></article></div></section>;
}

function AdministrationPanel({ users, onRoleChange }: { users: SecureDocsUser[]; onRoleChange: (id: string, role: "admin" | "manager" | "employee") => void }) {
  return <section className="focused-panel administration-panel"><header><div><p className="panel-kicker">Administration</p><h2>Access is a controlled decision</h2><p>Review active accounts and assign the minimum role needed for the work</p></div><div className="focused-metric"><strong>{users.length}</strong><span>Visible members</span></div></header><div className="admin-list">{users.length ? users.map((member) => <article key={member.id}><div className="avatar-ring">{member.full_name.slice(0, 2).toUpperCase()}</div><div><strong>{member.full_name}</strong><span>{member.email}</span></div><select aria-label={`Change ${member.full_name} role`} value={member.role} onChange={(event) => onRoleChange(member.id, event.target.value as "admin" | "manager" | "employee")}><option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option></select></article>) : <div className="review-empty"><UsersRound size={20} /> Sign in as an Admin to load account management controls</div>}</div></section>;
}

function VerificationPanel({ items }: { items: { id: string; label: string; reference: string }[] }) {
  return <section className="focused-panel verification-panel"><header><div><p className="panel-kicker">Verification registry</p><h2>Public proof without public exposure</h2><p>Each approved record receives a minimal authenticity reference that can be checked without disclosing the source document</p></div><div className="focused-metric"><strong>{items.length}</strong><span>Approved records</span></div></header><div className="proof-list">{items.length ? items.map((item) => <article key={item.id}><div className="verified-orb"><QrCode size={17} /></div><div><strong>{item.label}</strong><span>{item.reference}</span></div><a href={`/verify/${item.reference}`}>Open proof <ArrowUpRight size={15} /></a></article>) : <div className="review-empty"><QrCode size={20} /> No approved records available for verification</div>}</div></section>;
}

function AuditPanel({ activity }: { activity: SecureDocsActivity[] }) {
  return <section className="focused-panel audit-panel"><header><div><p className="panel-kicker">Immutable audit activity</p><h2>Trace every sensitive decision</h2><p>Authentication, document, review, and permission-sensitive events are kept in the evidence ledger</p></div><div className="focused-metric"><strong>{activity.length}</strong><span>Live audit events</span></div></header><div className="proof-list">{activity.length ? activity.slice(0, 8).map((event) => <article key={event.id}><div className="activity-icon activity-icon--verified"><Activity size={15} /></div><div><strong>{event.event_type.replaceAll(".", " ")}</strong><span>{event.outcome} · {new Date(event.created_at).toLocaleString()}</span></div><span className="status-pill status-pill--neutral">Logged</span></article>) : <div className="review-empty"><Activity size={20} /> Sign in to load immutable audit events</div>}</div></section>;
}

function SecurityPanel({ alerts }: { alerts: { id: string; severity: string; title: string; description: string; is_resolved: boolean }[] }) {
  return <section className="focused-panel security-panel"><header><div><p className="panel-kicker">Security signal</p><h2>Prioritise what needs attention</h2><p>Review unresolved access and workflow signals with enough context to preserve an accountable response</p></div><div className="focused-metric"><strong>{alerts.filter((alert) => !alert.is_resolved).length}</strong><span>Unresolved signals</span></div></header><div className="proof-list">{alerts.length ? alerts.map((alert) => <article key={alert.id}><div className="activity-icon activity-icon--security"><AlertTriangle size={15} /></div><div><strong>{alert.title}</strong><span>{alert.description}</span></div><span className={`status-pill status-pill--${alert.severity === "critical" ? "revision" : "pending"}`}>{alert.severity}</span></article>) : <div className="review-empty"><ShieldCheck size={20} /> No live security alerts loaded</div>}</div></section>;
}
