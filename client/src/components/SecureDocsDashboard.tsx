import { Button } from "@/components/ui/button";
import { useSecureDocsData } from "@/hooks/useSecureDocsData";
import { documentActions, uploadSecureDocument } from "@/lib/securedocsApi";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
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
import { useMemo, useState } from "react";
import "./secureDocs.css";

type Role = "Admin" | "Manager" | "Employee";

const roleLabels: Record<"admin" | "manager" | "employee", Role> = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};

const documents = [
  {
    id: "DOC-2091",
    name: "Certificate of Incorporation",
    type: "PDF",
    owner: "Corporate Affairs",
    updated: "12 minutes ago",
    status: "Approved",
    statusTone: "approved",
  },
  {
    id: "DOC-2088",
    name: "Vendor Compliance Agreement",
    type: "DOCX",
    owner: "Procurement",
    updated: "48 minutes ago",
    status: "Pending review",
    statusTone: "pending",
  },
  {
    id: "DOC-2084",
    name: "Quarterly Operations Report",
    type: "PDF",
    owner: "Operations",
    updated: "Yesterday",
    status: "Needs revision",
    statusTone: "revision",
  },
  {
    id: "DOC-2078",
    name: "Identity Verification Record",
    type: "PNG",
    owner: "Human Resources",
    updated: "18 Aug 2026",
    status: "Approved",
    statusTone: "approved",
  },
] as const;

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
  const { activity: apiActivity, alerts, categories, connected, documents: apiDocuments, loading, overview, user } = useSecureDocsData();
  const [previewRole, setPreviewRole] = useState<Role>("Admin");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeNav, setActiveNav] = useState("Overview");
  const [notice, setNotice] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [actingOnDocument, setActingOnDocument] = useState<string | null>(null);

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
  const visibleDocuments = liveDocuments.length > 0 ? liveDocuments : documents;

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

  const metricsByRole: Record<Role, { label: string; value: string; trend: string; icon: typeof FileText; accent: "blue" | "mint" | "amber" | "violet" }[]> = {
    Admin: [
      { label: "Total documents", value: "1,248", trend: "+8.4% this month", icon: FileText, accent: "blue" },
      { label: "Approved records", value: "1,032", trend: "82.7% verified", icon: CheckCircle2, accent: "mint" },
      { label: "Awaiting review", value: "36", trend: "9 assigned today", icon: Clock3, accent: "amber" },
      { label: "Security alerts", value: "04", trend: "2 require review", icon: AlertTriangle, accent: "violet" },
    ],
    Manager: [
      { label: "Review queue", value: "36", trend: "9 assigned today", icon: FileCheck2, accent: "blue" },
      { label: "Approved today", value: "18", trend: "Average 4m 12s", icon: CheckCircle2, accent: "mint" },
      { label: "Needs revision", value: "07", trend: "2 due today", icon: AlertTriangle, accent: "amber" },
      { label: "Verified records", value: "308", trend: "+12 this week", icon: QrCode, accent: "violet" },
    ],
    Employee: [
      { label: "My documents", value: "18", trend: "3 updated this month", icon: FileText, accent: "blue" },
      { label: "Approved", value: "14", trend: "Ready to verify", icon: CheckCircle2, accent: "mint" },
      { label: "Pending review", value: "03", trend: "Next update in 1 day", icon: Clock3, accent: "amber" },
      { label: "Reports", value: "11", trend: "Available securely", icon: Archive, accent: "violet" },
    ],
  };

  const setRoleContext = (nextRole: Role) => {
    if (user) {
      setNotice("Your live dashboard role is assigned by the SecureDocs API and cannot be changed in the browser");
      return;
    }
    setPreviewRole(nextRole);
    setActiveNav(nextRole === "Employee" ? "My workspace" : "Overview");
    setNotice(`${nextRole} permissions preview enabled.`);
  };

  async function submitUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFile) { setUploadError("Choose a PDF, DOCX, JPG, PNG, or WEBP file first"); return; }
    setUploading(true); setUploadError("");
    try {
      await uploadSecureDocument({ file: uploadFile, title: uploadTitle, description: uploadDescription });
      setUploadOpen(false); setUploadFile(null); setUploadTitle(""); setUploadDescription("");
      setNotice("Document submitted securely for manager review  Refresh the workspace to show the new record");
    } catch (requestError) {
      setUploadError(requestError instanceof Error ? requestError.message : "The document could not be uploaded");
    } finally { setUploading(false); }
  }

  async function handleDocumentAction(id: string, action: "preview" | "download" | "edit" | "delete" | "approve" | "reject", currentTitle?: string) {
    if (!user) { setNotice("Sign in with a verified SecureDocs account to perform document actions"); return; }
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
      setNotice(action === "delete" ? "Document deleted and audit event recorded" : `Document ${action === "approve" ? "approved" : "rejected"}  Refresh to load the latest registry`);
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "The document action could not be completed");
    } finally { setActingOnDocument(null); }
  }

  const liveMetrics = overview ? [
    { label: "Total documents", value: String(overview.total_documents), trend: "Live API total", icon: FileText, accent: "blue" as const },
    { label: "Approved records", value: String(overview.approved_documents), trend: "Verified status", icon: CheckCircle2, accent: "mint" as const },
    { label: "Awaiting review", value: String(overview.pending_review_documents), trend: "Current queue", icon: Clock3, accent: "amber" as const },
    { label: user?.role === "admin" ? "Security alerts" : "Workspace state", value: String(overview.unresolved_alerts ?? 0), trend: "Live API signal", icon: AlertTriangle, accent: "violet" as const },
  ] : metricsByRole[role];

  return (
    <div className="securedocs-shell">
      <aside className="securedocs-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><ShieldCheck size={23} strokeWidth={2.3} /></div>
          <div><span className="brand-word">secure</span><span className="brand-word brand-word--light">docs</span></div>
        </div>

        <div className="workspace-chip">
          <div className="workspace-orb">A</div>
          <div className="min-w-0"><p>Acme Holdings</p><span>Enterprise workspace</span></div>
          <ChevronDown size={15} />
        </div>

        <nav aria-label="Workspace navigation" className="nav-stack">
          <p className="sidebar-label">Workspace</p>
          {navigationByRole[role].map(({ label, icon: Icon }) => (
            <button
              className={`nav-item ${activeNav === label ? "nav-item--active" : ""}`}
              key={label}
              onClick={() => { setActiveNav(label); setNotice(`${label} view is ready to connect to the API.`); }}
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
          <button className="profile-card" onClick={() => setNotice("Profile controls will use the secure FastAPI session") }>
            <div className="avatar-ring">AS</div>
            <div className="min-w-0 text-left"><strong>Adeen Shahzad</strong><span>{role}</span></div>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      <main className="securedocs-main">
        <header className="topbar">
          <div className="crumb"><span>SecureDocs</span><span className="crumb-divider">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <div className="role-switcher" aria-label="Role preview">
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
              <h1>{role === "Employee" ? "Good morning, Adeen" : "Document intelligence, protected"}</h1>
              <p>{roleDescriptions[role]}</p>
            </div>
            <Button className="upload-button" onClick={() => user ? setUploadOpen(true) : setNotice("Sign in with a verified SecureDocs account before uploading a document") }>
              <Plus size={17} /> Upload document
            </Button>
          </section>

          {(notice || loading) && <div className="notice-bar"><CheckCircle2 size={16} /><span>{notice || "Checking the SecureDocs API session…"}</span><button onClick={() => setNotice("")}>{notice ? "Dismiss" : "Working"}</button></div>}

          {!loading && !user && <div className="preview-banner"><ShieldCheck size={16} /><span>{connected ? "The API is reachable  Sign in through the FastAPI auth flow to load your assigned permissions" : "Local visual preview  Connect the FastAPI service and sign in to load live role permissions and documents"}</span><a href="/sign-in">Sign in</a></div>}

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
                      </> : <button aria-label={`Preview ${document.name}`} onClick={() => setNotice(`${document.name} will open with authorization-aware preview and download controls after you sign in.`)}><MoreHorizontal size={18} /></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="side-panels">
              <section className="verification-card">
                <div className="verification-top"><div><p className="panel-kicker">Authenticity verification</p><h2>Verify with confidence</h2></div><div className="verified-orb"><ShieldCheck size={20} /></div></div>
                <p>Every approved document receives an immutable reference code and a QR-linked public verification record</p>
                <div className="verification-code"><div className="qr-grid"><QrCode size={46} strokeWidth={1.7} /></div><div><span>REFERENCE CODE</span><strong>SD-2026-8F3C72A19B</strong><em>Approved · 25 Aug 2026</em></div></div>
                <a className="verify-link" href="/verify/SD-2026-8F3C72A19B">Open verification record <ArrowUpRight size={15} /></a>
              </section>

              <section className="security-card">
                <div className="panel-heading"><div><p className="panel-kicker">Security signal</p><h2>Control center</h2></div><LockKeyhole size={19} /></div>
                <div className="security-score"><div><strong>{user ? Math.max(0, 100 - alerts.length * 8) : 94}</strong><span>/100</span></div><p>{user ? `${alerts.length} unresolved alerts` : "Security posture is strong"}</p></div>
                <div className="security-progress"><span style={{ width: `${user ? Math.max(0, 100 - alerts.length * 8) : 94}%` }} /></div>
                <div className="security-points"><span><CheckCircle2 size={15} /> JWT rotation enabled</span><span><CheckCircle2 size={15} /> {user ? `${alerts.filter((alert) => alert.severity === "critical").length} critical alerts` : "0 critical alerts"}</span></div>
              </section>
            </div>
          </section>

          <section className="panel activity-panel">
            <div className="panel-heading"><div><p className="panel-kicker">Immutable audit trail</p><h2>Recent activity</h2></div><button className="text-button" onClick={() => setNotice("Audit events are append-only and include a tamper-evident hash chain") }>Audit log <ArrowUpRight size={15} /></button></div>
            <div className="activity-list">
              {liveActivity.length > 0 ? liveActivity.slice(0, 5).map((event) => <div key={event.id}><div className={`activity-icon activity-icon--${event.tone}`}><Activity size={16} /></div><p><strong>{event.title}</strong><span>{event.detail}</span></p><StatusPill tone={event.tone === "security" ? "revision" : "approved"}>{event.outcome}</StatusPill></div>) : <>
              <div><div className="activity-icon activity-icon--upload"><Upload size={16} /></div><p><strong>Vendor Compliance Agreement</strong> was submitted for review<span>Procurement · 48 minutes ago</span></p><StatusPill tone="pending">Pending</StatusPill></div>
              <div><div className="activity-icon activity-icon--verified"><FileCheck2 size={16} /></div><p><strong>Certificate of Incorporation</strong> passed authenticity verification<span>Public verification · 1 hour ago</span></p><StatusPill tone="approved">Verified</StatusPill></div>
              <div><div className="activity-icon activity-icon--security"><KeyRound size={16} /></div><p>Role-sensitive access was reviewed by an administrator<span>Security center · 3 hours ago</span></p><StatusPill tone="neutral">Logged</StatusPill></div>
              </>}
            </div>
          </section>

          {uploadOpen && <div className="upload-overlay" role="presentation"><form onSubmit={submitUpload} className="upload-modal" aria-labelledby="upload-title"><div className="panel-heading"><div><p className="panel-kicker">Secure document intake</p><h2 id="upload-title">Upload for review</h2></div><button type="button" className="text-button" onClick={() => setUploadOpen(false)}>Close</button></div><p>Files are validated by FastAPI before private storage and audit logging<br />Accepted types: PDF, DOCX, JPG, PNG, and WEBP</p><label>Document title<input required minLength={2} value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} /></label><label>Document description <span>optional</span><textarea value={uploadDescription} onChange={(event) => setUploadDescription(event.target.value)} /></label><label>Choose file<input required type="file" accept=".pdf,.docx,image/jpeg,image/png,image/webp" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} /></label>{uploadError && <div className="upload-error" role="alert">{uploadError}</div>}<div className="upload-actions"><button type="button" onClick={() => setUploadOpen(false)}>Cancel</button><Button disabled={uploading}>{uploading ? "Validating & uploading" : "Submit for review"}</Button></div></form></div>}
        </div>
      </main>
    </div>
  );
}
