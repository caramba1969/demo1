"use client";
import { Suspense, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Mail } from "lucide-react";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const router = useRouter();

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 digits are filled
    if (value && next.every(d => d !== "")) {
      handleSubmit(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setDigits(next);
      inputRefs.current[5]?.focus();
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (code: string) => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code.");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setIsLoading(false);
        return;
      }
      // Complete sign-in with the verified token
      const result = await signIn("credentials", {
        email,
        verifiedToken: data.verifiedToken,
        redirect: false,
      });
      if (result?.ok) {
        router.push("/");
      } else {
        setError("Sign-in failed. Please try again.");
        setIsLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    setError("");
    // We can't resend without the password — redirect back to sign-in
    router.push("/auth/signin");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-4">
      <div className="bg-neutral-900/90 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-800 backdrop-blur-sm text-center">
        <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-orange-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-white">Check your email</h1>
        <p className="text-neutral-400 text-sm mb-2">
          We sent a 6-digit code to
        </p>
        <p className="text-orange-400 font-medium text-sm mb-8 truncate">{email}</p>

        {/* 6-digit input */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={isLoading}
              className="w-12 h-14 text-center text-2xl font-bold bg-neutral-800 border-2 border-neutral-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-orange-400 text-sm mb-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
          </div>
        )}

        <p className="text-neutral-500 text-sm">
          Didn&apos;t receive it?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-orange-400 hover:text-orange-300 underline disabled:opacity-50"
          >
            {resent ? "Sent!" : "Go back to resend"}
          </button>
        </p>

        <p className="text-neutral-600 text-xs mt-4">Code expires in 5 minutes.</p>
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </main>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
