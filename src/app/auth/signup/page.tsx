"use client";
import { useEffect, useState } from "react";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [providers, setProviders] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    getProviders().then((providers) => setProviders(providers));
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleSignUp = async (providerId: string) => {
    setIsLoading(true);
    try {
      await signIn(providerId, { 
        callbackUrl: "/",
        redirect: true 
      });
    } catch (error) {
      console.error("Sign up error:", error);
      setIsLoading(false);
    }
  };

  // Show loading if checking session or already authenticated
  if (status === "loading" || status === "authenticated") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-neutral-400">
            {status === "authenticated" ? "Redirecting to planner..." : "Loading..."}
          </p>
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
          <h1 className="text-3xl font-bold mb-2 text-center tracking-tight">Create Account</h1>
          <p className="text-neutral-400 text-center text-sm max-w-xs">
            Join thousands of engineers optimizing their Satisfactory factories
          </p>
        </div>        <div className="flex flex-col gap-3">
          {providers &&
            Object.values(providers).map((provider: any) => (
              <Button
                key={provider.name}
                onClick={() => handleSignUp(provider.id)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 font-medium disabled:opacity-50 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 w-5 h-5 animate-spin text-gray-600" />
                ) : (
                  providerIcon(provider.name)
                )}
                <span className="font-semibold text-gray-900">
                  {isLoading ? "Creating account..." : `Sign up with ${provider.name}`}
                </span>
              </Button>
            ))}
        </div>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-neutral-700"></div>
          <span className="px-3 text-xs text-neutral-500">or</span>
          <div className="flex-1 h-px bg-neutral-700"></div>
        </div>

        <div className="text-center">
          <p className="text-sm text-neutral-400 mb-4">
            Already have an account?
          </p>
          <Button
            variant="ghost"
            onClick={() => window.location.href = "/auth/signin"}
            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
          >
            Sign in instead
          </Button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500">
            By creating an account, you agree to our{" "}
            <a href="#" className="underline hover:text-primary">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-primary">Privacy Policy</a>
          </p>
        </div>
      </div>
    </main>
  );
}
