import { getOneTimeToken } from "@/lib/authLink";
import { secureDocsApiBase } from "@/lib/securedocsApi";
import { ArrowLeft, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";

export default function PasswordReset() {
  const token = getOneTimeToken(window.location.search);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError(""); setMessage("");
    try {
      if (token) {
        if (password !== confirmation) throw new Error("Passwords do not match");
        const response = await fetch(`${secureDocsApiBase}/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ token, new_password: password }) });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.detail || "Password reset could not be completed");
        setMessage(body?.message || "Your password has been updated");
      } else {
        const response = await fetch(`${secureDocsApiBase}/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email }) });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.detail || "Password reset could not be requested");
        setMessage(body?.message || "Check your email for password-reset instructions");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The request could not be completed");
    } finally { setSubmitting(false); }
  }

  const complete = Boolean(message && token);
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_85%_0%,rgba(52,172,159,.16),transparent_25%),#071d2b] p-5 font-[Manrope] text-[#e9f7f8] sm:p-10">
      <section className="mx-auto grid max-w-4xl overflow-hidden rounded-[28px] border border-[#315b67] bg-[#0d2a3a] shadow-[0_24px_70px_rgba(0,0,0,0.32)] md:grid-cols-[.94fr_1.06fr]">
        <div className="bg-[radial-gradient(circle_at_25%_5%,rgba(104,210,197,.26),transparent_33%),#103d51] p-8 text-white sm:p-12"><Link href="/" className="inline-flex items-center gap-2 text-lg font-extrabold tracking-[-.05em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dff4ed] text-[#23786e]"><ShieldCheck size={20} /></span>securedocs</Link><div className="mt-20 max-w-sm"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9bc9d2]">Account recovery</p><h1 className="mt-3 text-4xl font-extrabold leading-[1.04] tracking-[-.06em]">Restore access safely</h1><p className="mt-5 text-sm leading-7 text-[#bdd3df]">One-time recovery links expire quickly and reset all existing sessions after your password changes</p></div></div>
        <div className="bg-[#0d2a3a] p-8 sm:p-12"><Link href="/sign-in" className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-[#9bb9c1]"><ArrowLeft size={15} /> Return to secure access</Link><div className="mb-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#164859] text-[#8ce1d2]"><KeyRound size={23} /></span><p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8cddcb]">Secure recovery</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.055em] text-[#effafa]">{token ? "Choose a new password" : "Reset your password"}</h2><p className="mt-3 text-sm leading-6 text-[#a7c0c6]">{token ? "Use a strong password that you have not used elsewhere" : "Enter your address and we will send a one-time recovery link"}</p></div>{complete ? <div className="rounded-xl bg-[#e9f8f2] px-4 py-3 text-sm font-semibold text-[#277862]"><span className="flex items-center gap-2"><CheckCircle2 size={16} /> {message}</span><Link href="/sign-in" className="mt-3 inline-block font-extrabold underline">Sign in securely</Link></div> : <form onSubmit={submit} className="grid gap-4">{token ? <><label className="grid gap-2 text-xs font-bold text-[#b4d1d3]">New password<input required type="password" minLength={12} value={password} onChange={event => setPassword(event.target.value)} className="h-11 rounded-xl border border-[#315b67] bg-[#082331] px-3 text-sm text-[#eefafa] outline-none transition focus:border-[#6fcfbd] focus:ring-4 focus:ring-[#1b5856]" /></label><label className="grid gap-2 text-xs font-bold text-[#b4d1d3]">Confirm new password<input required type="password" minLength={12} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="h-11 rounded-xl border border-[#315b67] bg-[#082331] px-3 text-sm text-[#eefafa] outline-none transition focus:border-[#6fcfbd] focus:ring-4 focus:ring-[#1b5856]" /></label><p className="text-[11px] leading-5 text-[#91adb6]">Use 12+ characters with upper/lowercase letters, a number, and a symbol</p></> : <label className="grid gap-2 text-xs font-bold text-[#b4d1d3]">Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="h-11 rounded-xl border border-[#315b67] bg-[#082331] px-3 text-sm text-[#eefafa] outline-none transition focus:border-[#6fcfbd] focus:ring-4 focus:ring-[#1b5856]" /></label>}{error && <p role="alert" className="rounded-xl bg-[#fceceb] px-3 py-2 text-xs font-semibold text-[#a74747]">{error}</p>}{message && <p className="rounded-xl bg-[#e9f8f2] px-3 py-2 text-xs font-semibold text-[#277862]">{message}</p>}<button disabled={submitting} className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[#d8f7ed] px-5 text-sm font-extrabold text-[#123d4b] shadow-lg shadow-[#0a1f2c]/25 disabled:opacity-60">{submitting ? "Securing request" : token ? "Update secure password" : "Send recovery link"}</button></form>}</div>
      </section>
    </main>
  );
}
