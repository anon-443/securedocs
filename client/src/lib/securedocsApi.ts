export type SecureDocsRole = "admin" | "manager" | "employee";

export type SecureDocsUser = {
  id: string;
  email: string;
  full_name: string;
  role: SecureDocsRole;
  is_active: boolean;
  email_verified_at: string | null;
};

export type SecureDocsOverview = {
  total_documents: number;
  approved_documents: number;
  pending_review_documents: number;
  total_users: number | null;
  failed_login_attempts: number | null;
  unresolved_alerts: number | null;
};

export type SecureDocsDocument = {
  id: string;
  title: string;
  original_filename: string;
  owner_user_id: string;
  content_type: string;
  category_id?: string | null;
  status: "draft" | "pending_review" | "approved" | "rejected" | "archived" | "deleted";
  updated_at: string;
};

export type SecureDocsActivity = {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  outcome: string;
  actor_user_id: string | null;
  created_at: string;
};

export type SecureDocsAlert = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  is_resolved: boolean;
  created_at: string;
};

export type SecureDocsCategory = {
  id: string;
  name: string;
  description: string | null;
};

const defaultApiBase = "http://localhost:8000/api/v1";
export const secureDocsApiBase = (import.meta.env.VITE_SECUREDOCS_API_URL || defaultApiBase).replace(/\/$/, "");

export class SecureDocsApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${secureDocsApiBase}${path}`, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new SecureDocsApiError(response.status, body?.detail || "The SecureDocs API request failed.");
  }
  return response.json() as Promise<T>;
}

function csrfToken(): string | null {
  const match = document.cookie.match(/(?:^|; )sd_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function uploadSecureDocument(input: {
  file: File;
  title: string;
  description?: string;
  categoryId?: string;
}): Promise<SecureDocsDocument> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("title", input.title);
  if (input.description) form.append("description", input.description);
  if (input.categoryId) form.append("category_id", input.categoryId);
  const csrf = csrfToken();
  return apiRequest<SecureDocsDocument>("/documents", {
    method: "POST",
    body: form,
    headers: csrf ? { "X-CSRF-Token": csrf } : {},
  });
}

async function csrfMutation<T>(path: string, method: "PATCH" | "POST" | "DELETE", body?: unknown): Promise<T> {
  const csrf = csrfToken();
  return apiRequest<T>(path, {
    method,
    headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Token": csrf } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const documentActions = {
  update: (id: string, changes: { title?: string; description?: string; category_id?: string | null }) =>
    csrfMutation<SecureDocsDocument>(`/documents/${id}`, "PATCH", changes),
  remove: (id: string) => csrfMutation<void>(`/documents/${id}`, "DELETE"),
  review: (id: string, decision: "approved" | "rejected", note?: string) =>
    csrfMutation<SecureDocsDocument>(`/documents/${id}/review`, "POST", { decision, note }),
  previewUrl: (id: string) => `${secureDocsApiBase}/documents/${id}/preview`,
  downloadUrl: (id: string) => `${secureDocsApiBase}/documents/${id}/download`,
};

export const userActions = {
  updateProfile: (changes: { full_name?: string }) => csrfMutation<SecureDocsUser>("/users/me", "PATCH", changes),
  changeRole: (id: string, role: SecureDocsRole) => csrfMutation<SecureDocsUser>(`/users/${id}/role`, "PATCH", { role }),
  changePassword: (currentPassword: string, newPassword: string) => csrfMutation<void>("/auth/change-password", "POST", { current_password: currentPassword, new_password: newPassword }),
  uploadAvatar: async (file: File): Promise<SecureDocsUser> => {
    const csrf = csrfToken();
    const form = new FormData();
    form.append("file", file);
    return apiRequest<SecureDocsUser>("/users/me/avatar", { method: "POST", body: form, headers: csrf ? { "X-CSRF-Token": csrf } : {} });
  },
};

export const secureDocsApi = {
  currentUser: () => apiRequest<SecureDocsUser>("/auth/me"),
  overview: () => apiRequest<SecureDocsOverview>("/dashboard/overview"),
  documents: () => apiRequest<SecureDocsDocument[]>("/documents"),
  activity: () => apiRequest<SecureDocsActivity[]>("/dashboard/activity"),
  alerts: () => apiRequest<SecureDocsAlert[]>("/dashboard/security-alerts"),
  categories: () => apiRequest<SecureDocsCategory[]>("/documents/categories"),
  myActivity: () => apiRequest<SecureDocsActivity[]>("/users/me/activity"),
  users: () => apiRequest<SecureDocsUser[]>("/users"),
};
