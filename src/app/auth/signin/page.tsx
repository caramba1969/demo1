"use client";
import { Suspense, useEffect, useState } from "react";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Github, Loader2, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";
  const verifyError = searchParams.get("error");

  useEffect(() => {
    getProviders().then((p) => {
      if (p) {
        // Exclude credentials from the OAuth buttons list
        const oauthOnly = Object.fromEntries(
          Object.entries(p).filter(([, v]) => v.type !== "credentials")
        ) as Record<string, { id: string; name: string }>;
        setProviders(oauthOnly);
      }
    });
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.push("/");
  }, [status, router]);

  const handleOAuth = async (providerId: string) => {
    setIsLoading(true);
    await signIn(providerId, { callbackUrl: "/", redirect: true });
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed.");
        setIsLoading(false);
        return;
      }
      // Redirect to OTP verification with email encoded in query
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-neutral-400">{status === "authenticated" ? "Redirecting…" : "Loading…"}</p>
        </div>
      </main>
    );
  }

  const providerIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "google":
        return (
          <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        );
      case "github":
        return <Github className="mr-2 w-5 h-5 text-gray-800" />;
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-4">
      <div className="bg-neutral-900/90 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-800 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center tracking-tight">Welcome Back</h1>
          <p className="text-neutral-400 text-center text-sm max-w-xs">
            Sign in to access your Satisfactory factory planning dashboard
          </p>
        </div>

        {justVerified && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Email verified! You can now sign in.
          </div>
        )}
        {verifyError && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Verification link is invalid or expired.
          </div>
        )}

        {/* Email + password form */}
        <form onSubmit={handleCredentials} className="flex flex-col gap-3 mb-4">
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
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Continue with Email"}
          </Button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-neutral-700" />
          <span className="px-3 text-xs text-neutral-500">or</span>
          <div className="flex-1 h-px bg-neutral-700" />
        </div>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3">
          {providers && Object.values(providers).map((provider) => (
            <Button
              key={provider.name}
              onClick={() => handleOAuth(provider.id)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 font-medium disabled:opacity-50 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
              variant="outline"
            >
              {providerIcon(provider.name)}
              <span className="font-semibold text-gray-900">Continue with {provider.name}</span>
            </Button>
          ))}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-neutral-400 mb-3">Don&apos;t have an account?</p>
          <Button
            variant="ghost"
            onClick={() => router.push("/auth/signup")}
            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
          >
            Create a new account
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-neutral-500">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-primary">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-primary">Privacy Policy</a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </main>
    }>
      <SignInContent />
    </Suspense>
  );
}
