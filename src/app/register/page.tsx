"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomer } from "@/lib/customer-auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useCustomer();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [waLink, setWaLink] = useState("");

  function validate() {
    const e: Record<string, string> = {};
    const words = form.name.trim().split(/\s+/);
    if (words.length < 3) e.name = "Enter your full name (First, Middle, Last)";
    if (!/^(010|011|012|015)\d{8}$/.test(form.phone.trim())) e.phone = "Enter a valid Egyptian phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email address";
    if (form.password.length < 8 || !/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      e.password = "Min 8 characters with letters and numbers";
    }
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const err = await register(form.name, form.phone, form.email, form.password);
    setSubmitting(false);
    if (err) {
      setErrors({ form: err });
      return;
    }
    const numOnly = form.phone.replace(/[^0-9]/g, "");
    const msg = "Welcome to TRIO FASHION! 🔥 Your account is ready. You now get exclusive deals, early drops and special offers. Stay tuned!";
    setWaLink(`https://wa.me/${numOnly}?text=${encodeURIComponent(msg)}`);
  }

  if (waLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-black tracking-[0.15em] uppercase mb-4">TRIO FASHION</h1>
          <p className="text-sm mb-6">Account created successfully! 🎉</p>
          <p className="text-xs opacity-50 mb-8">Open WhatsApp to receive your welcome message and start shopping.</p>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="block w-full bg-green-600 text-white py-3 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity mb-3">
            Open WhatsApp Welcome
          </a>
          <button onClick={() => router.push("/account")}
            className="w-full bg-black text-white py-3 text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">
            Go to My Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 pt-20">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-[0.15em] uppercase mb-2">TRIO FASHION</h1>
          <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Create Your Account</p>
          <p className="text-sm opacity-60 max-w-sm mx-auto">
            Create your account and get exclusive deals, early access to drops, and special discounts just for you 🎁
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && <p className="text-xs text-red-500 text-center">{errors.form}</p>}

          <div>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full Name (First, Middle, Last)"
              className={`w-full border px-4 py-3 text-sm outline-none ${errors.name ? "border-red-400" : "border-black/20 focus:border-black/60"}`} />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone Number (010, 011, 012, 015)" type="tel"
              className={`w-full border px-4 py-3 text-sm outline-none ${errors.phone ? "border-red-400" : "border-black/20 focus:border-black/60"}`} />
            {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email Address" type="email"
              className={`w-full border px-4 py-3 text-sm outline-none ${errors.email ? "border-red-400" : "border-black/20 focus:border-black/60"}`} />
            {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Password (min 8 chars, letters + numbers)" type="password"
              className={`w-full border px-4 py-3 text-sm outline-none ${errors.password ? "border-red-400" : "border-black/20 focus:border-black/60"}`} />
            {errors.password && <p className="text-[10px] text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div>
            <input value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Confirm Password" type="password"
              className={`w-full border px-4 py-3 text-sm outline-none ${errors.confirm ? "border-red-400" : "border-black/20 focus:border-black/60"}`} />
            {errors.confirm && <p className="text-[10px] text-red-500 mt-1">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-black text-white py-3 text-sm tracking-widest uppercase hover:opacity-80 transition-opacity disabled:opacity-30">
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-xs text-center mt-6 opacity-50">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:opacity-100">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
