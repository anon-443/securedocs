import { getOneTimeToken } from "@/lib/authLink";
import { secureDocsApiBase } from "@/lib/securedocsApi";
import { ArrowLeft, BadgeCheck, CircleAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type VerificationState = "ready" | "submitting" | "success" | "error";

export default function EmailVerification() {
  const token = getOneTimeToken(window.location.search);
  const [state, setState] = useState<VerificationState>(token ? "ready" : "error");
  const [message, setMessage] = useState(token ? "Your account is ready to verify" : "This verification link is incomplete or expired");

  async function verifyEmail() {
    if (!token) return;
    setState("submitting");
    try {
      const response = await fetch(`${secureDocsApiBase}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.detail || "Verification could not be completed");
      setState("success");
      setMessage(body?.message || "Your email has been verified");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Verification could not be completed");
    }
  }

  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(52,172,159,.18),transparent_27%),#071d2b] p-5 font-[Manrope] text-[#e9f7f8] sm:p-10">
      <section className="mx-auto grid max-w-4xl overflow-hidden rounded-[28px] border border-[#315b67] bg-[#0d2a3a] shadow-[0_24px_70px_rgba(0,0,0,0.32)] md:grid-cols-[.94fr_1.06fr]">
        <div className="bg-[radial-gradient(circle_at_25%_5%,rgba(104,210,197,.26),transparent_33%),#103d51] p-8 text-white sm:p-12">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-extrabold tracking-[-.05em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dff4ed] text-[#23786e]"><ShieldCheck size={20} /></span>securedocs</Link>
          <div className="mt-20 max-w-sm"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9bc9d2]">Identity confirmation</p><h1 className="mt-3 text-4xl font-extrabold leading-[1.04] tracking-[-.06em]">Confirm your secure access</h1><p className="mt-5 text-sm leading-7 text-[#bdd3df]">Email confirmation binds this account to its verified address before sensitive document actions are allowed</p></div>
        </div>
        <div className="flex flex-col justify-center bg-[#0d2a3a] p-8 sm:p-12">
          <Link href="/sign-in" className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-[#9bb9c1]"><ArrowLeft size={15} /> Return to secure access</Link>
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${isSuccess ? "bg-[#d8f7ed] text-[#23786e]" : isError ? "bg-[#fceceb] text-[#b34f4f]" : "bg-[#164859] text-[#8ce1d2]"}`}>{isSuccess ? <BadgeCheck size={25} /> : isError ? <CircleAlert size={24} /> : <ShieldCheck size={24} />}</div>
          <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8cddcb]">SecureDocs account</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.055em] text-[#effafa]">{isSuccess ? "Email verified" : isError ? "Link needs attention" : "Verify your email"}</h2><p role={isError ? "alert" : undefined} className="mt-3 text-sm leading-6 text-[#a7c0c6]">{message}</p>
          {state === "ready" && <button onClick={verifyEmail} className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#d8f7ed] px-5 text-sm font-extrabold text-[#123d4b] shadow-lg shadow-[#0a1f2c]/25 transition active:scale-[.98]">Verify email address</button>}
          {state === "submitting" && <div className="mt-8 h-11 rounded-xl bg-[#194657] px-5 text-center text-sm font-extrabold leading-[2.75rem] text-[#dff4ed]">Verifying account</div>}
          {(isSuccess || isError) && <Link href="/sign-in" className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#d8f7ed] px-5 text-sm font-extrabold text-[#123d4b] shadow-lg shadow-[#0a1f2c]/25">Open secure sign in</Link>}
        </div>
      </section>
    </main>
  );
}
