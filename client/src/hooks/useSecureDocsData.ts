import { useEffect, useState } from "react";
import {
  SecureDocsApiError,
  secureDocsApi,
  type SecureDocsDocument,
  type SecureDocsOverview,
  type SecureDocsUser,
} from "@/lib/securedocsApi";

type SecureDocsDataState = {
  user: SecureDocsUser | null;
  overview: SecureDocsOverview | null;
  documents: SecureDocsDocument[];
  loading: boolean;
  connected: boolean;
};

const emptyState: SecureDocsDataState = {
  user: null,
  overview: null,
  documents: [],
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
        const [overview, documents] = await Promise.all([secureDocsApi.overview(), secureDocsApi.documents()]);
        if (active) setState({ user, overview, documents, loading: false, connected: true });
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
