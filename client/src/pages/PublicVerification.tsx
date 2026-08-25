import { secureDocsApiBase } from "@/lib/securedocsApi";
import { CheckCircle2, Printer, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import "./publicVerification.css";

type VerificationResult = {
  verified: boolean;
  reference_code: string;
  title: string | null;
  status: string;
  approved_at: string | null;
  message: string;
};

export default function PublicVerification() {
  const [, params] = useRoute("/verify/:reference");
  const reference = params?.reference || "";
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function verify() {
      try {
        const response = await fetch(`${secureDocsApiBase}/verify/${encodeURIComponent(reference)}`);
        const body = await response.json();
        if (!response.ok) throw new Error(body?.detail || "Verification record was not found");
        if (active) setResult(body);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to verify this document");
      }
    }
    if (reference) void verify();
    return () => { active = false; };
  }, [reference]);

  const isValid = result?.verified === true;
  return (
    <main className="public-verification-page">
      <section className="public-verification-card">
        <div className="public-verification-header">
          <Link href="/" className="public-brand"><span className="public-brand-mark"><ShieldCheck size={20} /></span>securedocs</Link>
          <span className="public-chip">Public verifier</span>
        </div>

        {!result && !error && <div className="public-loading"><div className="public-spinner" /><p>Checking the secure verification record…</p></div>}

        {(result || error) && <>
          <div className={`public-status-icon ${isValid ? "public-status-icon--valid" : "public-status-icon--invalid"}`}>
            {isValid ? <CheckCircle2 size={33} /> : <XCircle size={33} />}
          </div>
          <p className="public-eyebrow">Document authenticity result</p>
          <h1>{isValid ? "Reference verified" : "Verification unavailable"}</h1>
          <p className="public-message">{result?.message || `${error} — Connect the FastAPI verifier to retrieve audit-grade authenticity evidence`}</p>
          <div className="public-details">
            <div className="public-detail-row"><span>Reference code</span><strong className="public-code">{result?.reference_code || reference}</strong></div>
            {isValid && <><div className="public-detail-row"><span>Document title</span><strong>{result?.title}</strong></div><div className="public-detail-row"><span>Approval status</span><strong className="public-approved">{result?.status}</strong></div><div className="public-detail-row"><span>Approved date</span><strong>{result?.approved_at ? new Date(result.approved_at).toLocaleDateString() : "—"}</strong></div></>}
          </div>
          <p className="public-privacy">No private document data is exposed here
          The public verifier returns only the minimum evidence needed to validate an approved reference</p>
          {isValid && <button onClick={() => window.print()} className="public-print-button"><Printer size={16} /> Print verification result</button>}
        </>}
      </section>
    </main>
  );
}
