"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Check, AlertCircle, MailCheck } from "lucide-react";
import AuthHero from "@/components/auth/AuthHero";
import SocialButtons from "@/components/auth/SocialButtons";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const [errors, setErrors] = useState<{
    firstName?: string;
    email?: string;
    password?: string;
    terms?: string;
    form?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailConfirmationSent, setIsEmailConfirmationSent] = useState(false);

  const { signUpWithEmail } = useAuth();

  function validate() {
    const newErrors: typeof errors = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the Terms & Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const { error, confirmationSent } = await signUpWithEmail(email, password, {
      firstName,
      lastName,
    });

    if (error) {
      setErrors({ form: error });
      setIsLoading(false);
      return;
    }

    if (confirmationSent) {
      setIsEmailConfirmationSent(true);
    }
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen w-full bg-[#2b2738] flex flex-col lg:flex-row p-3 sm:p-4 lg:p-5">
      {/* Left Hero Visual Card */}
      <div className="w-full lg:w-1/2 min-h-[480px] lg:min-h-[calc(100vh-2.5rem)] flex">
        <AuthHero />
      </div>

      {/* Right Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-14 py-8 lg:py-12">
        {isEmailConfirmationSent ? (
          <div className="w-full max-w-[420px] space-y-6 text-center py-8">
            <div className="mx-auto w-14 h-14 rounded-md bg-[#7052ff]/10 border border-[#7052ff]/30 flex items-center justify-center text-[#9e8cfc]">
              <MailCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Check your email
              </h2>
              <p className="text-sm text-[#9f98b8] max-w-sm mx-auto">
                We&apos;ve sent a verification link to{" "}
                <span className="text-white font-medium">{email}</span>. Click the
                link to activate your SmartDesk account.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => setIsEmailConfirmationSent(false)}
                className="text-xs text-[#9e8cfc] hover:text-[#b4a5fc] underline underline-offset-4 cursor-pointer"
              >
                Didn&apos;t receive the email? Try again
              </button>
              <div>
                <Link
                  href="/login"
                  className="inline-block text-sm font-medium text-white/80 hover:text-white"
                >
                  Back to log in &rarr;
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[420px] space-y-6">
            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Create an account
              </h1>
              <p className="text-sm text-[#9892ab]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#9e8cfc] hover:text-[#b6a7fc] font-medium underline underline-offset-4 decoration-1 transition-colors"
                >
                  Log in
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Fletcher"
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#353046] border border-white/5 text-white placeholder-[#7e7895] text-sm focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#353046] border border-white/5 text-white placeholder-[#7e7895] text-sm focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition"
                  />
                </div>
              </div>

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

              {/* Terms Checkbox */}
              <div className="space-y-1 pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    className={`w-4 h-4 rounded-xs flex items-center justify-center transition border ${
                      agreedToTerms
                        ? "bg-white border-white text-[#2b2738]"
                        : "bg-[#353046] border-white/20 group-hover:border-white/40"
                    }`}
                  >
                    {agreedToTerms && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs text-[#9f99b2]">
                    I agree to the{" "}
                    <span className="underline underline-offset-2 hover:text-white transition">
                      Terms & Conditions
                    </span>
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-xs text-red-400">{errors.terms}</p>
                )}
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
                    <span>Creating account...</span>
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            {/* Social Auth */}
            <SocialButtons
              mode="signup"
              onError={(err) => setErrors({ form: err })}
            />
          </div>
        )}
      </div>
    </main>
  );
}
