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
  status: "draft" | "pending_review" | "approved" | "rejected" | "archived" | "deleted";
  updated_at: string;
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

export const secureDocsApi = {
  currentUser: () => apiRequest<SecureDocsUser>("/auth/me"),
  overview: () => apiRequest<SecureDocsOverview>("/dashboard/overview"),
  documents: () => apiRequest<SecureDocsDocument[]>("/documents"),
};
