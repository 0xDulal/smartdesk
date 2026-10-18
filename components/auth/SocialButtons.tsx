"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface SocialButtonsProps {
  mode?: "signup" | "login";
  onError?: (msg: string) => void;
}

export default function SocialButtons({
  mode = "signup",
  onError,
}: SocialButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  async function handleGoogleSignIn() {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      onError?.(error);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-[#2b2738] px-3 text-xs text-[#8f88a8] font-normal tracking-wide uppercase shrink-0">
          {mode === "signup" ? "Or register with" : "Or login with"}
        </span>
        <div className="border-t border-white/10 w-full" />
      </div>

      {/* Google Provider Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-md border border-white/10 bg-[#353046]/70 hover:bg-[#3d3850] text-white text-sm font-medium transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-1 focus:ring-[#7c5cfc]"
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
            />
          </svg>
        )}
        <span>Google</span>
      </button>
    </div>
  );
}
