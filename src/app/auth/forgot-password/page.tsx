"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-4">
      <div className="bg-neutral-900/90 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-800 backdrop-blur-sm text-center">
        <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-orange-400" />
        </div>

        {sent ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-white">Check your inbox</h1>
            <p className="text-neutral-400 text-sm mb-6">
              If an account exists for <span className="text-orange-400 font-medium">{email}</span>, a password reset link has been sent. The link expires in 1 hour.
            </p>
            <Button
              onClick={() => router.push("/auth/signin")}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            >
              Back to sign in
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2 text-white">Forgot your password?</h1>
            <p className="text-neutral-400 text-sm mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send reset link"}
              </Button>
            </form>

            <button
              onClick={() => router.push("/auth/signin")}
              className="mt-6 flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </button>
          </>
        )}
      </div>
    </main>
  );
}
