import { secureDocsApiBase } from "@/lib/securedocsApi";
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

type AuthMode = "sign-in" | "register";

export default function SignIn() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError(""); setMessage("");
    try {
      const endpoint = mode === "sign-in" ? "/auth/login" : "/auth/register";
      const payload = mode === "sign-in" ? { email, password } : { email, full_name: fullName, password };
      const response = await fetch(`${secureDocsApiBase}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.detail || "The authentication request could not be completed");
      if (mode === "register") {
        setMessage("Account created  Check your email to verify your address before signing in");
      } else {
        navigate("/workspace");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The authentication request failed");
    } finally { setSubmitting(false); }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(52,172,159,.18),transparent_27%),#071d2b] p-5 font-[Manrope] text-[#e9f7f8] sm:p-10">
      <section className="mx-auto grid max-w-5xl overflow-hidden rounded-[28px] border border-[#315b67] bg-[#0d2a3a] shadow-[0_24px_70px_rgba(0,0,0,0.32)] md:grid-cols-[1.08fr_.92fr]">
        <div className="bg-[radial-gradient(circle_at_25%_5%,rgba(104,210,197,.26),transparent_33%),#103d51] p-8 text-white sm:p-12">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-extrabold tracking-[-.05em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dff4ed] text-[#23786e]"><ShieldCheck size={20} /></span>securedocs</Link>
          <div className="mt-20 max-w-sm"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9bc9d2]">Protected document operations</p><h1 className="mt-3 text-4xl font-extrabold leading-[1.04] tracking-[-.06em]">Evidence you can trust</h1><p className="mt-5 text-sm leading-7 text-[#bdd3df]">SecureDocs separates document storage, review, public verification, and audit evidence so the browser never decides who can access sensitive information</p></div>
          <div className="mt-14 grid gap-4 text-xs text-[#d6edf0]"><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#8ce1d2]" /> Short-lived JWT access sessions</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#8ce1d2]" /> Role-aware authorization at the API</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#8ce1d2]" /> Immutable audit evidence</span></div>
        </div>
        <div className="bg-[#0d2a3a] p-8 sm:p-12">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-[#9bb9c1]"><ArrowLeft size={15} /> Return to landing</Link>
          <div className="mb-8"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8cddcb]">Secure access</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.055em] text-[#effafa]">{mode === "sign-in" ? "Welcome back" : "Create your account"}</h2><p className="mt-3 text-sm leading-6 text-[#a7c0c6]">{mode === "sign-in" ? "Use your verified SecureDocs email address" : "Your address must be verified before you can open a secure session"}</p></div>
          <div className="mb-7 flex rounded-xl bg-[#082230] p-1"><button onClick={() => setMode("sign-in")} className={`flex-1 rounded-lg py-2 text-xs font-extrabold ${mode === "sign-in" ? "bg-[#194657] text-[#eaf8f7] shadow-sm" : "text-[#88a9b3]"}`}>Sign in</button><button onClick={() => setMode("register")} className={`flex-1 rounded-lg py-2 text-xs font-extrabold ${mode === "register" ? "bg-[#194657] text-[#eaf8f7] shadow-sm" : "text-[#88a9b3]"}`}>Register</button></div>
          <form onSubmit={submit} className="grid gap-4">
            {mode === "register" && <label className="grid gap-2 text-xs font-bold text-[#b4d1d3]">Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11 rounded-xl border border-[#315b67] bg-[#082331] px-3 text-sm text-[#eefafa] outline-none transition focus:border-[#6fcfbd] focus:ring-4 focus:ring-[#1b5856]" /></label>}
            <label className="grid gap-2 text-xs font-bold text-[#b4d1d3]">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl border border-[#315b67] bg-[#082331] px-3 text-sm text-[#eefafa] outline-none transition focus:border-[#6fcfbd] focus:ring-4 focus:ring-[#1b5856]" /></label>
            <label className="grid gap-2 text-xs font-bold text-[#b4d1d3]">Password<input required type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border border-[#315b67] bg-[#082331] px-3 text-sm text-[#eefafa] outline-none transition focus:border-[#6fcfbd] focus:ring-4 focus:ring-[#1b5856]" /></label>
            {mode === "register" && <p className="text-[11px] leading-5 text-[#91adb6]">Use 12+ characters with upper/lowercase letters, a number, and a symbol</p>}
            {error && <p role="alert" className="rounded-xl bg-[#fceceb] px-3 py-2 text-xs font-semibold text-[#a74747]">{error}</p>}
            {message && <p className="rounded-xl bg-[#e9f8f2] px-3 py-2 text-xs font-semibold text-[#277862]">{message}</p>}
            <button disabled={submitting} className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#d8f7ed] text-sm font-extrabold text-[#123d4b] shadow-lg shadow-[#0a1f2c]/25 disabled:opacity-60"><LockKeyhole size={16} />{submitting ? "Securing request" : mode === "sign-in" ? "Sign in securely" : "Create secure account"}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
