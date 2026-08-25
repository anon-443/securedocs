import { useEffect, useState } from "react";
import {
  SecureDocsApiError,
  secureDocsApi,
  type SecureDocsDocument,
  type SecureDocsActivity,
  type SecureDocsAlert,
  type SecureDocsOverview,
  type SecureDocsUser,
} from "@/lib/securedocsApi";

type SecureDocsDataState = {
  user: SecureDocsUser | null;
  overview: SecureDocsOverview | null;
  documents: SecureDocsDocument[];
  activity: SecureDocsActivity[];
  alerts: SecureDocsAlert[];
  loading: boolean;
  connected: boolean;
};

const emptyState: SecureDocsDataState = {
  user: null,
  overview: null,
  documents: [],
  activity: [],
  alerts: [],
  loading: true,
  connected: false,
};

export function useSecureDocsData() {
  const [state, setState] = useState<SecureDocsDataState>(emptyState);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const user = await secureDocsApi.currentUser();
        const [overview, documents, activity, alerts] = await Promise.all([
          secureDocsApi.overview(),
          secureDocsApi.documents(),
          secureDocsApi.activity().catch(() => []),
          secureDocsApi.alerts().catch(() => []),
        ]);
        if (active) setState({ user, overview, documents, activity, alerts, loading: false, connected: true });
      } catch (error) {
        if (!active) return;
        const isUnauthenticated = error instanceof SecureDocsApiError && error.status === 401;
        setState({ ...emptyState, loading: false, connected: !isUnauthenticated });
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return state;
}
