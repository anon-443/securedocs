import { ArrowRight, CheckCircle2, FileCheck2, Fingerprint, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import "./landing.css";

export default function Home() {
  return <main className="sd-landing">
    <header className="sd-landing-nav">
      <Link href="/" className="sd-brand"><span><ShieldCheck size={19} /></span>securedocs</Link>
      <nav aria-label="Landing navigation"><a href="#method">Method</a><a href="#protocol">Protocol</a><a href="#verification">Verification</a></nav>
      <div className="sd-nav-actions"><Link href="/sign-in">Sign in</Link><Link href="/workspace">Open workspace <ArrowRight size={14} /></Link></div>
    </header>

    <section className="sd-hero">
      <div className="sd-hero-copy"><p className="sd-kicker">Secure evidence operations</p><h1><span>Every record has</span><em>its chain of proof</em></h1><p className="sd-lead">SecureDocs gives teams one precise system to protect document custody, make accountable decisions, and issue public authenticity evidence</p><div className="sd-hero-actions"><Link className="sd-primary" href="/sign-in">Enter secure workspace <ArrowRight size={15} /></Link><a className="sd-secondary" href="#method">See the method</a></div><p className="sd-evidence-note"><span><Fingerprint size={13} /></span> Built for ownership, review, and verification</p></div>
      <div className="sd-evidence-console" aria-label="Authenticity evidence preview"><div className="sd-console-topline"><span>Evidence ledger</span><span className="sd-console-state">Live integrity check</span></div><article className="sd-dossier"><div className="sd-dossier-head"><div><p>Approval dossier</p><strong>Vendor compliance agreement</strong></div><span className="sd-seal"><ShieldCheck size={20} /></span></div><div className="sd-dossier-body"><div className="sd-proof-line"><span>Custody owner</span><strong>Operations / Adeen S</strong></div><div className="sd-proof-line"><span>Review decision</span><strong className="approved">Approved by manager</strong></div><div className="sd-proof-line"><span>Public reference</span><strong>SD-2026-8F3C72A19B</strong></div><div className="sd-chain"><i /> Document hash sealed to audit trail</div></div></article><div className="sd-console-foot"><span>Private source · controlled access</span><span>Verified</span></div></div>
    </section>

    <section className="sd-trust-strip" aria-label="SecureDocs product principles"><p className="sd-trust-intro">A disciplined route from confidential file to independently checkable proof</p><Trust icon={<LockKeyhole size={16} />} title="Protect source" copy="Private storage and role checks" /><Trust icon={<FileCheck2 size={16} />} title="Review with record" copy="Decision history that stays visible" /><Trust icon={<QrCode size={16} />} title="Verify in public" copy="Minimal proof without file exposure" /></section>

    <section id="method" className="sd-method"><div className="sd-section-heading"><h2>Three actions<br />One accountable flow</h2><p>Designed around evidence custody instead of generic document storage so each important transition has context</p></div><div className="sd-method-grid"><Method index="01" title="Intake" copy="Validate every file before it becomes part of the controlled record" icon={<LockKeyhole size={18} />} /><Method index="02" title="Decision" copy="Move reviews through an explicit approval gate with a durable audit entry" icon={<FileCheck2 size={18} />} /><Method index="03" title="Proof" copy="Create a reference that can be checked without exposing private source material" icon={<QrCode size={18} />} /></div></section>

    <section id="protocol" className="sd-protocol"><h2>Your records deserve more than storage<br /><span>They deserve a protocol</span></h2><div className="sd-protocol-copy"><p>Bring role-aware work, audit-ready history, and external verification into one structured workspace made for sensitive document decisions</p><Link href="/workspace">Open the secure workspace <ArrowRight size={15} /></Link></div></section>
  </main>;
}

function Trust({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) { return <div className="sd-trust-item"><span>{icon}</span><div><strong>{title}</strong><small>{copy}</small></div></div>; }
function Method({ index, title, copy, icon }: { index: string; title: string; copy: string; icon: React.ReactNode }) { return <article className="sd-method-card"><span>{index} / FLOW</span><h3>{title}</h3><p>{copy}</p>{icon}</article>; }
