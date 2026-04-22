"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-4">
        <div className="bg-neutral-900/90 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-800 backdrop-blur-sm text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-white">Invalid link</h1>
          <p className="text-neutral-400 text-sm mb-6">This password reset link is missing or invalid.</p>
          <Button onClick={() => router.push("/auth/forgot-password")} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold">
            Request a new link
          </Button>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }
      setSuccess(true);
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
          <Lock className="w-7 h-7 text-orange-400" />
        </div>

        {success ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-white">Password updated</h1>
            <p className="text-neutral-400 text-sm mb-6">Your password has been reset successfully. You can now sign in with your new password.</p>
            <Button
              onClick={() => router.push("/auth/signin")}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            >
              Sign in
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2 text-white">Set a new password</h1>
            <p className="text-neutral-400 text-sm mb-8">Choose a strong password of at least 8 characters.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
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
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Reset password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
