"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import AuthHero from "@/components/auth/AuthHero";
import SocialButtons from "@/components/auth/SocialButtons";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const redirectFrom = searchParams.get("redirectFrom");
  const { signInWithEmail } = useAuth();

  function validate() {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const { error } = await signInWithEmail(email, password, redirectFrom);

    if (error) {
      setErrors({ form: error });
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Log in
        </h1>
        <p className="text-sm text-[#9892ab]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#9e8cfc] hover:text-[#b6a7fc] font-medium underline underline-offset-4 decoration-1 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Error banner */}
      {errors.form && (
        <div className="flex items-start gap-2.5 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-300 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Email Input */}
        <div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3.5 py-2.5 rounded-md bg-[#353046] border border-white/5 text-white placeholder-[#7e7895] text-sm focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Password Input with Visibility Toggle */}
        <div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-md bg-[#353046] border border-white/5 text-white placeholder-[#7e7895] text-sm focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f7899] hover:text-white/80 transition cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">{errors.password}</p>
          )}
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-4 h-4 rounded-xs flex items-center justify-center transition border ${
                rememberMe
                  ? "bg-white border-white text-[#2b2738]"
                  : "bg-[#353046] border-white/20 group-hover:border-white/40"
              }`}
            >
              {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span className="text-[#9f99b2]">Remember me</span>
          </label>

          <a
            href="#forgot"
            onClick={(e) => {
              e.preventDefault();
              setErrors({
                form: "Password reset link will be sent to your registered email.",
              });
            }}
            className="text-[#9e8cfc] hover:text-[#b6a7fc] transition"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 rounded-md font-medium text-sm text-white bg-[#6c5dd3] hover:bg-[#5e4fc7] active:scale-[0.99] transition duration-150 shadow-sm shadow-[#6c5dd3]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing in...</span>
            </span>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      {/* Social Auth */}
      <SocialButtons
        mode="login"
        onError={(err) => setErrors({ form: err })}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-[#2b2738] flex flex-col lg:flex-row p-3 sm:p-4 lg:p-5">
      {/* Left Hero Visual Card */}
      <div className="w-full lg:w-1/2 min-h-[480px] lg:min-h-[calc(100vh-2.5rem)] flex">
        <AuthHero />
      </div>

      {/* Right Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-14 py-8 lg:py-12">
        <Suspense
          fallback={
            <div className="w-full max-w-[420px] py-12 flex justify-center">
              <span className="w-5 h-5 border-2 border-[#6c5dd3] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
