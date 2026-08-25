import { useEffect, useState } from "react";
import {
  SecureDocsApiError,
  secureDocsApi,
  type SecureDocsDocument,
  type SecureDocsActivity,
  type SecureDocsAlert,
  type SecureDocsCategory,
  type SecureDocsOverview,
  type SecureDocsUser,
} from "@/lib/securedocsApi";

type SecureDocsDataState = {
  user: SecureDocsUser | null;
  overview: SecureDocsOverview | null;
  documents: SecureDocsDocument[];
  activity: SecureDocsActivity[];
  alerts: SecureDocsAlert[];
  categories: SecureDocsCategory[];
  loading: boolean;
  connected: boolean;
  error: string | null;
};

const emptyState: SecureDocsDataState = {
  user: null,
  overview: null,
  documents: [],
  activity: [],
  alerts: [],
  categories: [],
  loading: true,
  connected: false,
  error: null,
};

export function useSecureDocsData() {
  const [state, setState] = useState<SecureDocsDataState>(emptyState);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const user = await secureDocsApi.currentUser();
        const [overview, documents, activity, alerts, categories] = await Promise.all([
          secureDocsApi.overview(),
          secureDocsApi.documents(),
          secureDocsApi.activity().catch(() => []),
          secureDocsApi.alerts().catch(() => []),
          secureDocsApi.categories().catch(() => []),
        ]);
        if (active) setState({ user, overview, documents, activity, alerts, categories, loading: false, connected: true, error: null });
      } catch (error) {
        if (!active) return;
        const isUnauthenticated = error instanceof SecureDocsApiError && error.status === 401;
        const message = error instanceof Error ? error.message : "Unable to load the SecureDocs workspace";
        setState({ ...emptyState, loading: false, connected: !isUnauthenticated, error: isUnauthenticated ? null : message });
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return state;
}
