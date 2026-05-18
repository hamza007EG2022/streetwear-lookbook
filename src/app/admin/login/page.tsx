"use client";

import { useState, FormEvent } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = "/admin/dashboard";
      } else {
        const body = await res.json();
        if (res.status === 401) {
          setError("Incorrect password");
        } else {
          setError(body.error || "Login failed");
        }
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-[0.15em] uppercase">Admin</h1>
          <p className="text-xs tracking-widest uppercase opacity-40 mt-2">
            {isSetup ? "Create Password" : "Enter Password"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/40 transition-colors"
            autoFocus
          />

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-black text-white py-3 text-sm tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-30"
          >
            {loading ? "..." : isSetup ? "Create & Login" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
