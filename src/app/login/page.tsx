"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomer } from "@/lib/customer-auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, customer } = useCustomer();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Forgot password flow
  const [showForgot, setShowForgot] = useState(false);
  const [fpIdentifier, setFpIdentifier] = useState("");
  const [fpCode, setFpCode] = useState("");
  const [fpNewPass, setFpNewPass] = useState("");
  const [fpStep, setFpStep] = useState<"send" | "reset" | "done">("send");
  const [fpWaLink, setFpWaLink] = useState("");
  const [fpError, setFpError] = useState("");
  const [fpSubmitting, setFpSubmitting] = useState(false);

  if (customer) {
    router.push("/account");
    return null;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) { setError("All fields required"); return; }
    setSubmitting(true);
    setError("");
    const err = await login(identifier, password, remember);
    setSubmitting(false);
    if (err) { setError(err); return; }
    router.push("/account");
  }

  async function handleSendCode() {
    if (!fpIdentifier) { setFpError("Enter your email or phone"); return; }
    setFpSubmitting(true);
    setFpError("");
    try {
      const res = await fetch("/api/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: fpIdentifier }),
      });
      const data = await res.json();
      if (!res.ok) { setFpError(data.error || "Error"); setFpSubmitting(false); return; }
      setFpWaLink(data.waLink);
      setFpStep("reset");
    } catch { setFpError("Network error"); }
    setFpSubmitting(false);
  }

  async function handleReset() {
    if (!fpCode || !fpNewPass) { setFpError("All fields required"); return; }
    if (fpNewPass.length < 8 || !/[a-zA-Z]/.test(fpNewPass) || !/[0-9]/.test(fpNewPass)) {
      setFpError("Password must be at least 8 characters with letters and numbers"); return;
    }
    setFpSubmitting(true);
    setFpError("");
    try {
      const res = await fetch("/api/customer/forgot-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: fpIdentifier, code: fpCode, newPassword: fpNewPass }),
      });
      const data = await res.json();
      if (!res.ok) { setFpError(data.error || "Error"); setFpSubmitting(false); return; }
      setFpStep("done");
    } catch { setFpError("Network error"); }
    setFpSubmitting(false);
  }

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 pt-20">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black tracking-[0.15em] uppercase mb-2">TRIO FASHION</h1>
            <p className="text-xs tracking-widest uppercase opacity-40">Reset Password</p>
          </div>

          {fpStep === "send" && (
            <div className="space-y-4">
              <input value={fpIdentifier} onChange={(e) => setFpIdentifier(e.target.value)}
                placeholder="Email or Phone Number"
                className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-black/60" />
              {fpError && <p className="text-[10px] text-red-500">{fpError}</p>}
              <button onClick={handleSendCode} disabled={fpSubmitting}
                className="w-full bg-black text-white py-3 text-xs tracking-widest uppercase hover:opacity-80 disabled:opacity-30">
                {fpSubmitting ? "Sending..." : "Send Reset Code"}
              </button>
              <button onClick={() => { setShowForgot(false); setFpError(""); }}
                className="w-full text-xs opacity-40 hover:opacity-100 py-2">
                Back to Login
              </button>
            </div>
          )}

          {fpStep === "reset" && (
            <div className="space-y-4">
              <p className="text-xs opacity-50 text-center">
                A reset code has been sent via WhatsApp. Check your phone.{fpWaLink && (
                  <a href={fpWaLink} target="_blank" rel="noopener noreferrer"
                    className="block mt-2 text-green-600 underline">Open WhatsApp</a>
                )}
              </p>
              <input value={fpCode} onChange={(e) => setFpCode(e.target.value)}
                placeholder="Reset Code (6 digits)"
                className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-black/60" />
              <input value={fpNewPass} onChange={(e) => setFpNewPass(e.target.value)}
                placeholder="New Password" type="password"
                className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-black/60" />
              {fpError && <p className="text-[10px] text-red-500">{fpError}</p>}
              <button onClick={handleReset} disabled={fpSubmitting}
                className="w-full bg-black text-white py-3 text-xs tracking-widest uppercase hover:opacity-80 disabled:opacity-30">
                {fpSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          )}

          {fpStep === "done" && (
            <div className="text-center space-y-4">
              <p className="text-sm">Password reset successfully! 🎉</p>
              <button onClick={() => { setShowForgot(false); setFpStep("send"); setFpError(""); }}
                className="bg-black text-white px-8 py-2 text-xs tracking-widest uppercase hover:opacity-80">
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 pt-20">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-[0.15em] uppercase mb-2">TRIO FASHION</h1>
          <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Sign In</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email or Phone Number"
            className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-black/60" />

          <input value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" type="password"
            className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-black/60" />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs opacity-50 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                className="accent-black" />
              Remember me
            </label>
            <button type="button" onClick={() => setShowForgot(true)}
              className="text-[10px] underline opacity-40 hover:opacity-100">
              Forgot Password?
            </button>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-black text-white py-3 text-sm tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-30">
            {submitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-center mt-6 opacity-50">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline hover:opacity-100">Create One</Link>
        </p>
      </div>
    </div>
  );
}
