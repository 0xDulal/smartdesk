"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Slide {
  title: string;
}

const slides: Slide[] = [
  {
    title: "Capturing Moments, Creating Memories",
  },
  {
    title: "Effortless Collaboration, Real-Time Sync",
  },
  {
    title: "Empowering Teams, Delighting Customers",
  },
];

export default function AuthHero() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] lg:min-h-[640px] rounded-lg overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-10 select-none shadow-2xl">
      {/* Background Image & Ambient Deep Purple Dunes Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth-bg.jpg"
          alt="Desert dunes twilight"
          fill
          priority
          className="object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {/* Purple/Indigo atmospheric tint matching Mojave night aesthetics */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#171324] via-[#2d224d]/75 to-[#4a3480]/50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b172a] via-[#1b172a]/20 to-black/35" />
      </div>

      {/* Top Header Bar inside the card */}
      <div className="relative z-10 flex items-center justify-between">
        {/* Modern Geometric Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center tracking-widest text-white font-extrabold text-xl lg:text-2xl font-[family-name:var(--font-space-grotesk)] uppercase">
            <span className="font-black tracking-tighter text-2xl bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              SMARTDESK
            </span>
          </div>
        </Link>

        {/* Back to website button */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-normal text-white/90 bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          <span>Back to website</span>
          <span className="text-white/70 group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </Link>
      </div>

      {/* Bottom Hero Carousel Content */}
      <div className="relative z-10 space-y-5 pb-2">
        <div className="min-h-[72px] flex flex-col justify-end">
          <h2
            key={`title-${activeSlide}`}
            className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-white tracking-tight leading-snug transition-all duration-500 max-w-sm"
          >
            {slides[activeSlide].title}
          </h2>
        </div>

        {/* Slider Indicator Bars */}
        <div className="flex items-center gap-2 pt-1">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1 rounded-sm transition-all duration-500 cursor-pointer ${
                activeSlide === index
                  ? "w-8 bg-white"
                  : "w-3.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
